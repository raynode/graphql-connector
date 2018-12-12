import { GraphQLObjectType, GraphQLSchema, printSchema } from 'graphql'
import { mapValues } from 'lodash'
import { BaseSchema } from './base-schema-generator'

export type RecordOf<Keys, Type> = { [key in keyof Keys]: Type }

export const applyToRecordOf = <Keys, Types, Result>(
  record: RecordOf<Keys, Types>,
  method: (type: Types, key: string) => Result,
) => mapValues(record, method) as RecordOf<Keys, Result>

export const createSchema = <Models>({ queryFields, mutationFields, subscriptionFields }: BaseSchema<Models>) => {
  const query = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields,
  })
  const mutation = mutationFields
    ? new GraphQLObjectType({
        name: 'Mutation',
        fields: mutationFields,
      })
    : null
  const subscription = subscriptionFields
    ? new GraphQLObjectType({
        name: 'Subscription',
        fields: subscriptionFields,
      })
    : null
  return new GraphQLSchema({ query, mutation, subscription })
}
