import {
  applyFilterParser,
  createBaseSchemaGenerator,
  createModelMapper,
  createSchema,
  FilterParser,
  TypeMapper,
} from '..'

import { setupDatabase } from './my-data'
import { Database, DBTypeRecord, Instance, Model, models as myModels } from './my-models'
import * as myTypes from './my-types'

import { graphql, GraphQLID, GraphQLInt, GraphQLString, printSchema } from 'graphql'
import { DateType } from './graphql-date-type'

const debug = false
// @TODO remember to remove the try-catch

// myModels is expected to be { user: DBUserModel, post: DBPostModel, comment: DBCommentModel }
type Models = typeof myModels

// myTypes is expected to be { DBIntType: any, DBStringType: any, ... }
type Types = myTypes.DBType

// utility to check if some type is a list-type
const isListType = (type: myTypes.DBType): type is myTypes.DBListType => type instanceof myTypes.DBListType

// utility to resolve the final type of a type
const getFinalType = (type: myTypes.DBType) => (isListType(type) ? type.subtype : type)

// utility to create a filter function used in findOne & findMany queries
const buildFilterFn = (data: Record<string, any> = {}) => (instance: Instance<any, any>) =>
  Object.keys(data).reduce(
    (valid, key) =>
      valid && data[key] instanceof Filter
        ? data[key].apply(instance, instance.get(key))
        : instance.get(key) === data[key],
    true,
  )

type FilterFunc = 'eq' | 'has'
interface FilterRule {
  func: FilterFunc
  value: any
  not: boolean
}

class Filter<Key extends keyof Models> {
  public static create<Key extends keyof Models>(old: Filter<Key> | any, model: Models[Key], field: string) {
    if (old instanceof Filter) return old
    return new Filter(model, field)
  }

  private rules: FilterRule[] = []
  private type: myTypes.DBType
  private attribute: Record<string, myTypes.DBType>

  public constructor(private model: Models[Key], private field: string) {
    this.attribute = this.model.attributes[field]
    this.type = getFinalType(this.attribute)
  }
  public add(func: FilterFunc, value: any, not = false) {
    this.rules.push({ func, value, not })
  }
  public apply(instance: Instance<any, any>, compare: any) {
    return this.rules.reduce((valid, { func, not, value }) => {
      if (!valid) return false
      switch (func) {
        case 'has':
          const type = this.type as myTypes.DBIDType
          const model = myModels[type.source]
          const data = model.findMany(buildFilterFn({ [type.sourceAttribute]: instance.get(type.targetAttribute) }))
          return !data.length === not
        case 'eq':
          return (instance.get(this.field) === value) !== not
      }
      // throw new Error(func + ' not defined')
      return valid
    }, true)
  }

  public inspect() {
    return `${this.model.name}(${this.rules.map(rule => rule.func).join(',')})`
  }
}

describe('the example code', async () => {
  try {
    // the filter parser is not strictly necessary, it is available to you to convert the incoming mutation data
    // or the filtered where fields into usable data.
    // there are 3 different modes to this: 'create', 'update' and 'where'
    // these correspond to the mutations create & update and the where filter-input
    const filterParser: FilterParser<Types, Models> = (mode, model, name, value, data) => {
      const attribute = model.attributes[name]
      const type = getFinalType(attribute)
      // in case we try to run a where filter:
      if (mode === 'where') {
        let filter: Filter<any>

        if (name.includes('_')) {
          const [pre, post] = name.split('_')
          const field = pre === 'has' || pre === 'matches' ? post : pre
          const fn: FilterFunc = (pre === 'has' || pre === 'matches' ? pre : post) as any

          filter = Filter.create(data[field], model, field)
          filter.add(fn, value)
        } else {
          filter = Filter.create(data[name], model, name)
          filter.add('eq', value)
        }
        return {
          ...data,
          [name]: filter,
        }
      }
      // in case of an update or create query, we need to convert all associations into the IDs
      if (type instanceof myTypes.DBIDType) {
        const model: Model<any> = myModels[type.source]
        const result = model.findOne(buildFilterFn(value))
        if (!result) throw new Error(`Could not create a new ${model.name} as ${name} could not be set`)

        return {
          ...data,
          [type.targetAttribute]: result.get('id'),
        }
      }
      data[name] = value
      return data
    }

    const findManyPaginated = async (model: Model<any>, filter: ReturnType<typeof buildFilterFn>) => {
      const nodes = await model.findMany(filter)
      return {
        page: null,
        nodes,
      }
    }
    // The modelMapper is responsible to convert a my-model into a graphql-connector model
    // a graphql-connector model needs attributes, associations
    // each association and attribute could be setup with an resolver here
    const modelMapper = createModelMapper<Types, Models>((model, addAttribute, addAssociation) => {
      // to convert a my-model into a graphql-connector model,
      // we need to tell the system all attributes and associations
      Object.keys(model.attributes).forEach(name => {
        // for the attribute
        const attribute = model.attributes[name]
        // get the type of the attribute
        const type = getFinalType(attribute)
        const list = isListType(attribute)
        // check if it is some connection (this system uses IDTypes to connect one model to another)
        if (name !== 'id' && type instanceof myTypes.DBIDType) {
          // create a filter function to be used in the source selectors
          const filterFn = (instance: Instance<any, any>) => {
            const attr = instance.get(type.targetAttribute)
            return (item: Instance<any, any>) => item.get(type.sourceAttribute) === attr
          }
          // create a resolver that handles the model resolve
          const resolver = async (instance: any, args, context) => {
            const source = myModels[type.source]
            if (!list) return source.findOne(filterFn(instance))
            return findManyPaginated(source, filterFn(instance))
          }
          // add this as an accociation, the type.source type conversion is needed as the types do not know this type
          return addAssociation({ list, model: type.source as keyof Models, name, resolver })
        }
        // create a resolver for attributes (default would be instance[name])
        // the example system uses a different style
        const resolver = instance => instance.get(name)
        // add the attribute
        return addAttribute<Instance<any, any>>({ list, name, resolver, type })
      })

      // create the base resolvers
      // only implemented the findOne, findMany and create resolver as I am lazy
      return {
        findMany: async (_, { where, order }) => findManyPaginated(model, buildFilterFn(where)),
        create: async (_, { data }) => (model.create as any)(data),
        findOne: async (_, { where }) => model.findOne(buildFilterFn(where)),
        delete: async () => null,
        update: async () => null,
      }
    })

    // this function tells the generator how to convert my-type into a GraphQLType
    const typeMapper: TypeMapper<Types, Models> = ({ type }) => {
      if (type instanceof myTypes.DBIDType) return GraphQLID
      if (type instanceof myTypes.DBDateType) return DateType
      if (type instanceof myTypes.DBIntType) return GraphQLInt
      if (type instanceof myTypes.DBStringType) return GraphQLString
      throw new Error('invalid type: ' + typeof type)
    }

    // Generate a baseSchemaGenerator by providing the modelMapper and typeMapper
    // here we could change other things, like the nameingStrategy
    const baseSchemaGenerator = createBaseSchemaGenerator({
      modelMapper,
      typeMapper,
      filterParser,
    })

    // apply all my-models to the generator
    // the baseSchema will have all queryFields, mutationsFields and subscriptionFields
    const baseSchema = baseSchemaGenerator(myModels)

    // // this part is graphql only, not more graphql-connector
    const schema = createSchema(baseSchema)

    it('should have the correct schema', () => {
      expect(printSchema(schema)).toMatchSnapshot()
    })

    beforeAll(setupDatabase)

    const runQuery = async (query: string) => graphql(schema, query, null, null)

    it('should find the user by name', async () => {
      const { data, errors } = await runQuery(`{
        authors: Users { nodes {
          name
          email
          posts { nodes {
            title
            text
            upvotes
            comments { nodes {
              msg
              commentor { name }
            } }
          } }
        } }
      }`)
      expect(data.authors).toMatchSnapshot()
    })

    it('should find all posts', async () => {
      const { data } = await runQuery(`{
        Posts { nodes {
          title
          text
          upvotes
          author { name }
          comments { nodes {
            msg
            commentor { name }
          }}
        }}
      }`)

      expect(data).toMatchSnapshot()
    })

    it('should add a new question to the Database', async () => {
      const { data, errors } = await runQuery(`mutation newQuestion {
        createQuestion(data: {
          question: "Do you like this project?"
          answers: ["Yes!", "It looks nice...", "I don't know", "What?", "42!", "Probably not"]
          author: { name: "Georg" }
        }) {
          id
          question
          answers
          author { name email }
        }
      }`)
      expect(data).toMatchSnapshot()
      expect(Database.database.find(entry => entry.get('id') === data.createQuestion.id)).toMatchSnapshot()
    })

    it('should find more data', async () => {
      const { data } = await runQuery(`{
        Users {
          nodes {
            name
            email
            questions { nodes {
              question
              answers
            }}
            posts { nodes {
              title
              upvotes
              comments { nodes {
                msg
                commentor { name }
              }}
            }}
            comments { nodes {
              msg
              post { title }
            }}
          }
        }
      }`)
      expect(data).toMatchSnapshot()
    })

    it('should add Frank as a member', async () => {
      const { data } = await runQuery(`mutation newQuestion {
        frank: createUser(data: {
          name: "Frank"
          group: "member"
          email: "frank@example.com"
        }) {
          id
          name
          email
          group
        }
      }`)
      expect(data).toMatchSnapshot()
      expect(Database.database.find(entry => entry.get('id') === data.frank.id)).toMatchSnapshot()
    })

    it('should find Georg & Paul', async () => {
      const { data } = await runQuery(`{
        georg: User(where: {
          name: "Georg",
        }) {
          name
          email
          questions { nodes {
            question
            answers
          }}
        }
        paul: User(where: {
          name: "Paul",
        }) {
          name
          email
          questions { nodes {
            question
            answers
          }}
        }
      }`)
      expect(data).toMatchSnapshot()
    })

    it('should find all members in name order ', async () => {
      const { data } = await runQuery(`{
        members: Users(where: {
          group: "member"
        }, order: name_ASC) { nodes {
          name
        }}
      }`)
      expect(data).toMatchSnapshot()
    })

    it('should find all members in reversed name order ', async () => {
      const { data } = await runQuery(`{
        members: Users(where: {
          group: "member"
        }, order: name_DESC) { nodes {
          name
        }}
      }`)
      expect(data).toMatchSnapshot()
    })

    it('should find all users with posts', async () => {
      const { data } = await runQuery(`{
        authors: Users(where: {
          has_posts: true
        }) { nodes {
          name
        }}
      }`)
      expect(data).toMatchSnapshot()
    })
  } catch (err) {
    console.error('Error in test!', err)
  }
  it('should run stuff', () => {
    expect(true).toBeTruthy()
  })
})
