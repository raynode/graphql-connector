import * as Sequelize from 'sequelize'
import { typeMapper } from './type-mapper'
import { modelMapper } from './model-mapper'
import { graphql, GraphQLSchema, printSchema } from 'graphql'
import { createBaseSchemaGenerator, createSchema } from '@raynode/graphql-connector'

const sequelize = new Sequelize({
  dialect: 'sqlite',
})

let seed = 1
const random = () => ++seed
// tslint:disable:no-bitwise
const uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = random() * 16 | 0
  const v = c === 'x' ? r : (r & 0x3 | 0x8)
  return v.toString(16)
})
// tslint:enable:no-bitwise

export const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    comment: 'Id of the user',
    defaultValue: () => uuidv4(),
  },
  state: {
    type: Sequelize.ENUM('admin', 'member', 'guest'),
    defaultValue: 'guest',
  },
  nickname: { type: Sequelize.STRING, allowNull: true },
  name: { type: Sequelize.STRING, allowNull: false },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
})

export const Loop = sequelize.define('Loop', {
  id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    comment: 'Id of the user',
    defaultValue: Sequelize.fn('gen_random_uuid'),
  },
})
Loop.hasOne(Loop, {
  as: 'next',
})

const initialize = async () => { try {
  // tslint:disable:max-line-length
  await sequelize.query(`DROP TABLE IF EXISTS Users;`)

  await sequelize.query(`
    CREATE TABLE Users (
      id STRING PRIMARY KEY,
      nickname TEXT,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      email TEXT NOT NULL,
      "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)

  await sequelize.query(`
    INSERT INTO Users (id,state,nickname,name,email,createdAt,updatedAt) VALUES ('1','admin','Admin','Admin','admin@example.com','2018-11-09 16:35:47.055 +00:00','2018-11-09 16:35:47.055 +00:00');
  `)

  const db = await sequelize.query(`
    SELECT * FROM Users
  `)

  console.log(db)
  // tslint:enable:max-line-length
} catch(err) { console.error(err) } }
const initialized = initialize()

describe('model-mapper', () => {
  it('should find all attributes from a model', () => {
    const result = modelMapper('User', User)
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
    const result = modelMapper('Loop', Loop)
    expect(result.attributes).toHaveProperty('id')
    expect(result.attributes).toHaveProperty('createdAt')
    expect(result.attributes).toHaveProperty('updatedAt')
  })

  it('should find the association of a Loop', () => {
    const result = modelMapper('Loop', Loop)
    expect(result.associations).toHaveProperty('next')
  })
})

describe('schema', () => {
  let schema: GraphQLSchema
  const runQuery = async (query: string) => graphql(schema, query, null, null)

  beforeAll(() => initialized)

  beforeEach(async () => {
    const baseSchemaGenerator = createBaseSchemaGenerator({ typeMapper, modelMapper })
    const baseSchema = baseSchemaGenerator({ Loop, User })
    schema = createSchema(baseSchema)
  })

  it('should generate a full schema', () => {
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('should correctly load the data', async () => {
    const { data } = await runQuery(`{
      Users {
        nodes {
          id
          state
          nickname
          name
          email
          createdAt
          updatedAt
        }
      }
    }`)
    expect(data.Users.nodes).toMatchSnapshot()
  })

  it('should create a new user', async () => {
    console.log('Expecting to run the create resolver')
    const { data, errors } = await runQuery(`
      mutation {
        newUser: createUser(data: {
          name: "George"
          email: "george@example.com"

        }) {
          id
          name
          email
        }
      }
    `)
    expect(data).toMatchSnapshot()
  })

  it('should now find Georg as well', async () => {
    const { data } = await runQuery(`{
      Users {
        nodes {
          id
          state
          nickname
          name
          email
        }
      }
    }`)
    expect(data.Users.nodes).toMatchSnapshot()
  })

  it('should find only Georg', async () => {
    const { data } = await runQuery(`{
      georg: User(where: {
        name: "Georg"
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
})
