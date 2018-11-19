
import {
  FilterMapper,
  isGraphQLBoolean,
  isGraphQLFloat,
  isGraphQLID,
  isGraphQLInt,
  isGraphQLString,
} from '@raynode/graphql-connector'
import {
  GraphQLBoolean,
  GraphQLInt,
  isListType,
  isScalarType,
  isEnumType,
} from 'graphql'

export const filterMapper: FilterMapper = (name, type, list, isFilter) => {
  if (isScalarType(type)) {
    if (isGraphQLID(type)) return {
        [`${name}`]: { type },
        [`${name}_in`]: { type: list },
      }
    if(isGraphQLString(type)) return {
        [`${name}`]: { type },
        [`${name}_in`]: { type: list },
        [`${name}_like`]: { type: list },
        [`${name}_startsWith`]: { type: list },
        [`${name}_endsWith`]: { type: list },
      }
    if (isGraphQLBoolean(type)) return { [`${name}`]: { type } }
    if (isGraphQLFloat(type) || isGraphQLInt(type))
      return {
        [`${name}`]: { type },
        [`${name}_gt`]: { type },
        [`${name}_lt`]: { type },
      }
  }
  if(isEnumType(type)) return {
    [`${name}`]: { type },
    [`${name}_in`]: { type: list },
  }
  if (isListType(type))
    return {
      [`${name}_contains`]: { type },
      [`${name}_hasLength`]: { type },
    }
  if (isFilter)
    return {
      [`${name}_empty`]: { type },
      [`${name}_some`]: { type },
    }
  return {}
}
