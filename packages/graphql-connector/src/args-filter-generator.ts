import { GraphQLEnumType, GraphQLInputObjectType } from 'graphql'
import { flatten, keyBy, map, mapKeys, upperFirst } from 'lodash'
import { ExtendedModel } from './model'
import { Names } from './naming-strategy'

export type ArgsFields = ReturnType<typeof createArgsFields>

const specialCharsMap = new Map([['¼', 'frac14'], ['½', 'frac12'], ['¾', 'frac34']])

const sanitizeEnumValue = (value: string) =>
  value
    .trim()
    .replace(/([^_a-zA-Z0-9])/g, (_, p) => specialCharsMap.get(p) || ' ')
    .split(' ')
    .map((v, i) => (i ? upperFirst(v) : v))
    .join('')
    .replace(/(^\d)/, '_$1')

const buildOrderEnumValues = (model: ExtendedModel<any, any>) =>
  mapKeys(
    flatten(model.fields.map(field => sanitizeEnumValue(field.name)).map(name => [`${name}_ASC`, `${name}_DESC`])).map(
      value => ({ value }),
    ),
    'value',
  )

export const createArgsFields = <Types, Models>(model: ExtendedModel<Types, Models>, names: Names) => ({
  create: new GraphQLInputObjectType({
    name: names.types.createType,
    fields: () => model.dataTypes.create,
  }),
  data: new GraphQLInputObjectType({
    name: names.types.dataType,
    fields: () => model.dataTypes.data,
  }),
  where: new GraphQLInputObjectType({
    name: names.types.whereType,
    fields: () => model.dataTypes.where,
  }),
  order: new GraphQLEnumType({
    name: names.types.orderType,
    values: buildOrderEnumValues(model),
  }),
})
