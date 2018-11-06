import { TypeMapper } from '@raynode/graphql-connector'

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
} from 'graphql'

import { capitalize } from 'inflection'
import { mapValues, upperFirst } from 'lodash'

import { DateType, JSONType, UploadType } from './types'

import { DataTypeAbstract, DataTypes, guards, RangeSubTypes } from './type-guards'

// Map of special characters
const specialCharsMap = new Map([['¼', 'frac14'], ['½', 'frac12'], ['¾', 'frac34']])

const sanitizeEnumValue = (value: string) => {
  return value
    .trim()
    .replace(/([^_a-zA-Z0-9])/g, (_, p) => specialCharsMap.get(p) || ' ')
    .split(' ')
    .map((v, i) => (i ? upperFirst(v) : v))
    .join('')
    .replace(/(^\d)/, '_$1')
}

export const toGraphQLScalar = (sequelizeType: DataTypeAbstract): GraphQLScalarType => {
  if (guards.isBoolean(sequelizeType)) return GraphQLBoolean

  if (guards.isFloatType(sequelizeType)) return GraphQLFloat

  if (guards.isDateType(sequelizeType)) return DateType

  if (guards.isStringType(sequelizeType)) return GraphQLString

  if (guards.isUUID(sequelizeType)) return GraphQLID

  if (guards.isIntegerType(sequelizeType)) return GraphQLInt

  console.log(sequelizeType)
  throw new Error('Unkown Scalar Type found')
}

export const rangeSubTypeToGraphQL = (subtype: RangeSubTypes) => {
  switch (subtype.toLowerCase()) {
    case 'integer':
      return GraphQLInt
    case 'bigint':
      return GraphQLString
    case 'decimal':
      return GraphQLString
    case 'dateonly':
      return DateType
    case 'date':
      return DateType
    case 'datenotz':
      return DateType
    case 'blob':
      return UploadType
    default:
      throw new Error(`Unkown subtype: ${subtype}`)
  }
}

export const typeMapper: TypeMapper<DataTypes, any> = (attribute, model) => {
  const sequelizeType = attribute.type

  if (!guards.isAbstract(sequelizeType)) {
    console.error(sequelizeType)
    throw new Error('Input is not of type abstract-sequelize-type')
  }

  if (guards.isScalarType(sequelizeType)) return toGraphQLScalar(sequelizeType)

  if (guards.isArray(sequelizeType)) return new GraphQLList(toGraphQLScalar(sequelizeType.type))

  if (guards.isEnum(sequelizeType)) {
    const values = mapValues(sequelizeType.values.map(sanitizeEnumValue), value => ({ value }))
    return new GraphQLEnumType({ name: `${model.name.toString()}${capitalize(attribute.name)}EnumType`, values })
  }

  if (guards.isVirtual(sequelizeType))
    return sequelizeType.returnType ? toGraphQLScalar(sequelizeType.returnType) : GraphQLString

  if (guards.isJson(sequelizeType)) return JSONType

  if (guards.isBlob(sequelizeType)) return UploadType

  if (guards.isRange(sequelizeType)) {
    const type = rangeSubTypeToGraphQL(sequelizeType._subtype)
    const name = `${capitalize(sequelizeType._subtype)}RangeType`
    return new GraphQLObjectType({
      name,
      fields: {
        includeLowerBound: { type: GraphQLBoolean },
        includeUpperBound: { type: GraphQLBoolean },
        lowerBound: { type },
        upperBound: { type },
      },
    })
  }

  console.error(sequelizeType)
  throw new Error(`Unable to convert ${sequelizeType.key}::${sequelizeType.toSql()} to a GraphQL type`)
}
