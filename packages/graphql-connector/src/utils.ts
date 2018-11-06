import { BaseSchema } from './base-schema-generator'
import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql'
import { mapValues } from 'lodash'

export type RecordOf<Keys, Type> = { [key in keyof Keys]: Type }

export const applyToRecordOf = <Keys, Types, Result>(
  record: RecordOf<Keys, Types>,
  method: (type: Types, key: string) => Result,
) => mapValues(record, method) as RecordOf<Keys, Result>

export const createSchema = ({ queryFields, mutationFields }: BaseSchema) =>
  new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryFields,
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: mutationFields,
    }),
  })
