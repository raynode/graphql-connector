// tslint:disable:max-classes-per-file

import * as myTypes from './my-types'

let lastId = 1
const idGenerator = (type: string) => `${type}:${lastId++}`

export type DBTypeRecord<Attrs extends string = string> = Record<Attrs, myTypes.DBType>

export const Database = {
  database: [] as Array<Instance<any, any>>,
  reset: () => {
    Database.database = []
  },
  findById: <Attrs, M extends Model<DBTypeRecord>>(id: string) =>
    Database.findOne(instance => instance.get('id') === id, () => 1),
  findOne: <Attrs, M extends Model<DBTypeRecord>>(
    filterFn: (instance: Instance<Attrs, M>) => boolean,
    orderFn: (a: Instance<any, any>, b: Instance<any, any>) => number,
  ): Instance<Attrs, M> => Database.database.sort(orderFn).find(filterFn),
  findAll: <Attrs, M extends Model<DBTypeRecord>>(
    filterFn: (instance: Instance<Attrs, M>) => boolean,
    orderFn: (a: Instance<any, any>, b: Instance<any, any>) => number,
  ): Array<Instance<Attrs, M>> => Database.database.sort(orderFn).filter(filterFn),
  push: <Attrs, M extends Model<DBTypeRecord>>(instance: Instance<Attrs, M>) => {
    Database.database.push(instance)
    return instance
  },
  remove: (id: string) => {
    const index = Database.database.findIndex(model => model.get('id') === id)
    if (index === -1) return
    Database.database = [...Database.database.slice(0, index), ...Database.database.slice(index)]
  },
}

type DBRecord<K extends string, T extends myTypes.DBType> = { [P in K]: T }

type DBType<Type extends myTypes.DBType> = Type extends myTypes.DBIDType
  ? string
  : Type extends myTypes.DBIntType
  ? number
  : Type extends myTypes.DBStringType
  ? string
  : Type extends myTypes.DBDateType
  ? Date
  : Type extends myTypes.DBListType
  ? any[]
  : any

type DeType<Type> = { [Key in keyof Type]: DBType<Type[Key]> }

type ExtractAttrs<M extends Model<DBTypeRecord>> = M['attributes']

interface BasicAttrs {
  createdAt: myTypes.DBDateType
  id: myTypes.DBIDType
  lastUpdate: myTypes.DBDateType
}

type Attributes<Attrs extends Record<string, myTypes.DBType>> = Attrs & BasicAttrs

export class Instance<Attrs, M extends Model<DBTypeRecord>> {
  public attributes: DeType<BasicAttrs> & DeType<ExtractAttrs<M>>

  public constructor(public model: M, attributes: Partial<DeType<ExtractAttrs<M>>>) {
    this.attributes = {
      ...(attributes as any),
      id: idGenerator(model.name),
      createdAt: new Date(2018, 9, 1),
      lastUpdate: new Date(2018, 9, 1),
    }
  }

  public get<Key extends (keyof ExtractAttrs<M>) | (keyof BasicAttrs)>(attr: Key) {
    return this.attributes[attr]
  }

  // add an inspect method to your instances or models to make it nicer to debug the data inside
  public inspect() {
    return `${this.model.name} (${JSON.stringify(this.attributes, null, 2)})`
  }
}

export class Model<Attrs extends DBTypeRecord> {
  public attributes: Attributes<Attrs> = {} as any

  public constructor(public name: string, attributes: Attrs) {
    // add the id, createdAt, lastUpdate fields
    this.attributes.id = new myTypes.DBIDType(name)
    this.attributes.createdAt = new myTypes.DBDateType()
    this.attributes.lastUpdate = new myTypes.DBDateType()
    Object.keys(attributes).forEach(attr => (this.attributes[attr] = attributes[attr]))
  }

  public hasOne(model: Model<any>, as: string, sourceAttribute: string = as) {
    this.attributes[as] = new myTypes.DBIDType(model.name, 'id', this.name, sourceAttribute)
  }

  public belongsTo(model: Model<any>, as: string, sourceAttribute: string) {
    this.attributes[as] = new myTypes.DBIDType(model.name, 'id', this.name, sourceAttribute)
  }

  public hasMany(model: Model<any>, as: string, sourceAttribute: string) {
    this.attributes[as] = new myTypes.DBListType(new myTypes.DBIDType(model.name, sourceAttribute, this.name))
  }

  // this is not implemented for the example
  // public belongsMany(model: Model<any>, as: string) {
  // }

  public create(data: Partial<DeType<Attrs>>) {
    // tslint:disable-next-line:no-this-assignment
    const model: Model<Attrs> = this
    const instance = new Instance(model, data)
    return Database.push(instance)
  }
  // : (instance: Instance<Attrs, this>) => boolean
  public findMany(filterFn: (instance: Instance<Attrs, Model<any>>) => boolean, orderField = null, order = null) {
    return Database.findAll(
      instance => instance.model.name === this.name && filterFn(instance),
      this.toOrderFn(orderField, order),
    )
  }

  public findOne(filterFn: (instance: Instance<Attrs, Model<any>>) => boolean, orderField = null, order = null) {
    return Database.findOne(
      instance => instance.model.name === this.name && filterFn(instance),
      this.toOrderFn(orderField, order),
    )
  }

  // add an inspect method to your instances or models to make it nicer to debug the data inside
  public inspect() {
    return `${this.name} (${Object.keys(this.attributes)})`
  }

  private toOrderFn(orderField: string = null, order: 'ASC' | 'DESC' = 'ASC') {
    return orderField
      ? (a, b) => {
          return (order === 'ASC' ? 1 : -1) * (a[orderField] > b[orderField] ? 1 : -1)
        }
      : () => 1
  }
}

const DBUserModel = new Model('User', {
  name: new myTypes.DBStringType(),
  email: new myTypes.DBStringType(),
  password: new myTypes.DBStringType(),
  group: new myTypes.DBStringType(),
  num: new myTypes.DBIntType(),
})

const DBPostModel = new Model('Post', {
  title: new myTypes.DBStringType(),
  text: new myTypes.DBStringType(),
  upvotes: new myTypes.DBIntType(),
  userId: null,
})

const DBQuestionModel = new Model('Question', {
  answers: new myTypes.DBListType(new myTypes.DBStringType()),
  question: new myTypes.DBStringType(),
  userId: null,
})

const DBCommentModel = new Model('Comment', {
  msg: new myTypes.DBStringType(),
  commentor: null,
  post: null,
})

// The user is the main model, every other model connects to the user by the user.id field
DBUserModel.hasMany(DBPostModel, 'posts', 'userId') // a post has a userId field
DBUserModel.hasMany(DBCommentModel, 'comments', 'commentor') // a comment has a commentor field
DBUserModel.hasMany(DBQuestionModel, 'questions', 'userId')

// A Post is a 2nd class model, it belongs to a specific user by userId and has many comments
DBPostModel.belongsTo(DBUserModel, 'author', 'userId')
DBPostModel.hasMany(DBCommentModel, 'comments', 'post')

// A Comment is a 3rd class model, it belongs to a user as commentor and a post
DBCommentModel.hasOne(DBUserModel, 'commentor')
DBCommentModel.hasOne(DBPostModel, 'post')

// A Question is a 2nd Class model, it belongs to a specific user and has a list of possible answers
DBQuestionModel.belongsTo(DBUserModel, 'author', 'userId')

export const models = {
  User: DBUserModel,
  Post: DBPostModel,
  Comment: DBCommentModel,
  Question: DBQuestionModel,
}
