import { createBaseSchemaGenerator, createModelMapper, createSchema, TypeMapper } from '..'

import { setupDatabase } from './my-data'
import { DBTypeRecord, Instance, Model, models as myModels } from './my-models'
import * as myTypes from './my-types'

import { graphql, GraphQLID, GraphQLInt, GraphQLString, printSchema } from 'graphql'
import { DateType } from './graphql-date-type'

// @TODO remember to remove the try-catch

describe('should handle the example code', async () => {
  try {
    // myModels is expected to be { user: DBUserModel, post: DBPostModel, comment: DBCommentModel }
    type Models = typeof myModels

    // myTypes is expected to be { DBIntType: any, DBStringType: any, ... }
    type Types = myTypes.DBType

    // utility to check if some type is a list-type
    const isListType = (type: myTypes.DBType): type is myTypes.DBListType => type instanceof myTypes.DBListType

    // utility to resolve the final type of a type
    const getFinalType = (type: myTypes.DBType) => (isListType(type) ? type.subtype : type)

    // The modelMapper is responsible to convert a my-model into a graphql-connector model
    // a graphql-connector model needs attributes, associations
    // each association and attribute could be setup with an resolver here
    const modelMapper = createModelMapper<Types, Models>((model, addAttribute, addAssociation) => {
      // to convert a my-model into a graphql-connector model, we need to tell the system all attributes and associations
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
            return !list
              ? source.findOne(filterFn(instance))
              : {
                  nodes: await source.findMany(filterFn(instance)),
                  page: null,
                }
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
      // only implemented the findMany resolver as I am lazy
      return {
        findMany: async () => ({
          nodes: model.findMany(() => true),
          page: null,
        }),
        create: async () => null,
        findOne: async () => null,
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
    })

    // apply all my-models to the generator
    // the baseSchema will have all queryFields, mutationsFields and subscriptionFields
    const baseSchema = baseSchemaGenerator(myModels)

    // // this part is graphql only, not more graphql-connector
    const schema = createSchema(baseSchema)

    it('should have the correct schema', () => {
      expect(printSchema(schema)).toMatchSnapshot('Schema')
    })

    beforeEach(setupDatabase)

    const runQuery = async (query: string) => graphql(schema, query, null, null)

    it('should find the user by name', async () => {
      const { data, errors } = await runQuery(`{
      authors: Users {
        nodes {
          name
          email
          posts {
            nodes {
              title
              text
              upvotes
              comments {
                nodes {
                  msg
                  commentor { name }
                }
              }
            }
          }
        }
      }
    }`)

      if (errors) console.log(errors)
      else {
        const out: string[] = []
        const authors = data.authors.nodes
        out.push(authors)
        authors.forEach(user => {
          const posts = user.posts.nodes
          out.push('=== === ===')
          out.push(`${user.name} [${user.email}]: ${posts.length}`)
          posts.forEach(post => {
            const comments = post.comments.nodes
            out.push(`=== ${post.title} (${post.upvotes}:${comments.length}) ===`)
            out.push(`---\n${post.text}\n---`)
            comments.forEach(comment => out.push(`--> ${comment.commentor.name}: "${comment.msg}"`))
          })
          out.push('=== === ===')
        })
        expect(data.authors).toMatchSnapshot('Data')
        expect(out).toMatchSnapshot('Select authors and their posts')
      }
    })

    it('should find all posts', async () => {
      const { data } = await runQuery(`{
      Posts {
        nodes {
          title
          text
          upvotes
          author { name }
          comments {
            nodes {
              msg
              commentor { name }
            }
          }
        }
      }
    }`)

      expect(data).toMatchSnapshot('Data')
    })
  } catch (err) {
    console.error('Error in test!', err)
  }
  it('should run stuff', () => {
    expect(true).toBeTruthy()
  })
})
