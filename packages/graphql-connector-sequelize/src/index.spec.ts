import * as Sequelize from 'sequelize'
import { typeMapper } from './type-mapper'
import { modelMapper } from './model-mapper'
import { graphql, GraphQLSchema, printSchema } from 'graphql'
import { configuration } from './index'
import { createBaseSchemaGenerator, createSchema } from '@raynode/graphql-connector'

import { models, initialize, uuidv4 } from './tests/sample-models'

describe('model-mapper', () => {
  it('should find all attributes from a model', () => {
    const result = modelMapper('User', models.User)
    expect(result.attributes).toHaveProperty('id')
    expect(result.attributes).toHaveProperty('state')
    expect(result.attributes).toHaveProperty('nickname')
    expect(result.attributes).toHaveProperty('name')
    expect(result.attributes).toHaveProperty('email')
    expect(result.attributes).toHaveProperty('createdAt')
    expect(result.attributes).toHaveProperty('updatedAt')
    expect(Object.keys(result.attributes)).toHaveLength(7)
  })

  it('should find the attributes of a Loop', () => {
    const result = modelMapper('Loop', models.Loop)
    expect(result.attributes).toHaveProperty('id')
    expect(result.attributes).toHaveProperty('createdAt')
    expect(result.attributes).toHaveProperty('updatedAt')
  })

  it('should find the association of a Loop', () => {
    const result = modelMapper('Loop', models.Loop)
    expect(result.associations).toHaveProperty('next')
  })
})

describe('schema', () => {
  let schema: GraphQLSchema
  const runQuery = async (query: string) => graphql(schema, query, null, null)

  beforeAll(() => initialize())

  beforeEach(async () => {
    const baseSchemaGenerator = createBaseSchemaGenerator(configuration)
    const baseSchema = baseSchemaGenerator(models)
    schema = createSchema(baseSchema)
  })

  it('should generate a full schema', () => {
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('should correctly load the data', async () => {
    const { data, errors } = await runQuery(`{
      Users { nodes {
        id
        state
        nickname
        name
        email
        createdAt
        updatedAt
      } }
    }`)
    console.log(data, errors)
    expect(data.Users.nodes).toMatchSnapshot()
  })

  it('should create a new user', async () => {
    console.log('Expecting to run the create resolver')
    const { data, errors } = await runQuery(`
      mutation {
        newUser: createUser(data: {
          name: "Jack"
          nickname: "Jacky"
          email: "jack@example.com"
        }) {
          id
          name
          nickname
          email
        }
      }
    `)
    expect(data).toMatchSnapshot()
  })

  it('should now find Georg as well', async () => {
    const { data } = await runQuery(`{
      Users { nodes {
        id
        state
        nickname
        name
        email
      } }
    }`)
    expect(data.Users.nodes).toMatchSnapshot()
  })

  it('should find only Georg', async () => {
    const { data } = await runQuery(`{
      georg: User(where: {
        name: "Jack"
      }) {
        id
        state
        nickname
        name
        email
      }
    }`)
    expect(data.georg).toMatchSnapshot()
  })

  it('should find the users in ascending order of id', async () => {
    const { data } = await runQuery(`{
      Users(order: id_ASC) { nodes { id name } }
    }`)
    console.log(data.Users.nodes)
    expect(data.Users.nodes[0].id).toEqual(uuidv4(1))
    expect(data).toMatchSnapshot()
  })

  it('should find the users in descending order of id', async () => {
    const { data } = await runQuery(`{
      Users(order: id_DESC) { nodes { id name } }
    }`)
    console.log(data.Users.nodes)
    expect(data.Users.nodes[0].id).toEqual(uuidv4(4))
    expect(data).toMatchSnapshot()
  })

  it('should find all posts and their authors', async () => {
    const { data, errors } = await runQuery(`{
      Posts { nodes {
        title
        User {
          name
        }
      }}
    }`)
    expect(data).toMatchSnapshot()
  })

  it('should find all users that have written a post', async () => {
    const { data, errors } = await runQuery(`{
      Users(where: {
        Posts_some: { not: { id: "" }}
      }) { nodes {
        name
        Posts { nodes {
          title
        }}
      }}
    }`)
    console.log(errors)
    // expect(data).toMatchSnapshot()
  })

})
