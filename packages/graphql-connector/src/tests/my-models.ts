// tslint:disable:max-classes-per-file

import * as myTypes from './my-types'

class Model {
  public constructor(public name: string, public attributes: Record<string, myTypes.DBType>) {
    // add the id, createdAt, lastUpdate fields
    this.attributes.id = new myTypes.DBIDType(name)
    this.attributes.createdAt = new myTypes.DBDateType()
    this.attributes.lastUpdate = new myTypes.DBDateType()
  }

  public hasOne(model: Model, as?: string) {
    this.attributes[as ? as : model.name] = new myTypes.DBIDType(model.name)
  }
  public hasMany(model: Model, as?: string) {
    this.attributes[as ? as : model.name] = new myTypes.DBListType(new myTypes.DBIDType(model.name))
  }
}

const DBUserModel = new Model('User', {
  name: new myTypes.DBStringType(),
  email: new myTypes.DBStringType(),
  password: new myTypes.DBStringType(),
})

const DBPostModel = new Model('Post', {
  title: new myTypes.DBStringType(),
  text: new myTypes.DBStringType(),
  upvotes: new myTypes.DBIntType(),
})

// Renamed the Model-Name
const DBCommentModel = new Model('Comment', {
  msg: new myTypes.DBStringType(),
})

DBUserModel.hasMany(DBPostModel)
DBUserModel.hasMany(DBCommentModel)

DBPostModel.hasOne(DBUserModel, 'author')
DBPostModel.hasMany(DBCommentModel)

DBCommentModel.hasOne(DBUserModel, 'commentor')
DBCommentModel.hasOne(DBPostModel)

export const models = {
  User: DBUserModel,
  Post: DBPostModel,
  Comment: DBCommentModel,
}
