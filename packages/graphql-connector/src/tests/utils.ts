import { BaseSchema } from 'base-schema-generator'
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  isType,
  printSchema,
} from 'graphql'
import { TypeMapper } from 'type-converter'
import { createSchema } from 'utils'

export { printSchema }

export type Types = 'int' | 'string'
export type Models = 'Sample' | 'Other'

export const basicTypeMapper: TypeMapper<Types, Models> = attribute =>
  ({
    int: GraphQLInt,
    string: GraphQLString,
  }[attribute.type])

export const createSDL = (schema: BaseSchema) => printSchema(createSchema(schema))
