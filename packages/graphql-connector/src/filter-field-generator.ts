import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  isInputType,
  isListType,
  isObjectType,
  isScalarType,
  isUnionType,
  isWrappingType,
} from 'graphql'

import { ExtendedModel } from './model'

export type FilterMapperMode = 'create' | 'update' | 'where'

// sadly no correct typescript-guards, as the GraphQL basic types are not real "Types"
export interface GraphQLScalarTypeInstance<T extends string> extends GraphQLScalarType {
  name: T
}
export const isGraphQLString = (type: GraphQLScalarType): type is GraphQLScalarTypeInstance<'String'> =>
  type.name === 'String'
export const isGraphQLBoolean = (type: GraphQLScalarType): type is GraphQLScalarTypeInstance<'Boolean'> =>
  type.name === 'Boolean'
export const isGraphQLFloat = (type: GraphQLScalarType): type is GraphQLScalarTypeInstance<'Float'> =>
  type.name === 'Float'
export const isGraphQLInt = (type: GraphQLScalarType): type is GraphQLScalarTypeInstance<'Int'> => type.name === 'Int'
export const isGraphQLID = (type: GraphQLScalarType): type is GraphQLScalarTypeInstance<'ID'> => type.name === 'ID'

export interface FilterMapperResultEntry {
  type: GraphQLType
  description?: string
}

export type FilterMapper = <Type extends GraphQLType>(
  name: string,
  type: Type,
  list: GraphQLList<Type>,
  isFilter: boolean,
) => Record<string, FilterMapperResultEntry>

export type FilterParser<Types, Models> = <Key extends keyof Models, Type extends GraphQLType>(
  mode: FilterMapperMode,
  model: Models[Key],
  name: string,
  value: any,
  data: Record<string, any>,
) => Record<string, any>

export const defaultFilterMapper: FilterMapper = (name, type, list, isFilter) => {
  if (isScalarType(type)) {
    if (isGraphQLID(type) || isGraphQLString(type))
      return {
        [`${name}`]: { type },
        [`${name}_not`]: { type },
        [`${name}_in`]: { type: list },
        [`${name}_not_in`]: { type: list },
      }
    if (isGraphQLBoolean(type)) return { [`${name}`]: { type } }
    if (isGraphQLFloat(type) || isGraphQLInt(type))
      return {
        [`${name}`]: { type },
        [`${name}_not`]: { type },
        [`${name}_gt`]: { type },
        [`${name}_lt`]: { type },
      }
  }
  if (isListType(type))
    return {
      [`${name}_contains`]: { type },
      [`${name}_not_contains`]: { type },
    }
  if (isFilter)
    return {
      [`has_${name}`]: { type: GraphQLBoolean },
      [`matches_${name}`]: { type },
    }
  return {}
}

export const applyFilterMapper = (filterMapper: FilterMapper) => (name: string, type: GraphQLType, isFilter: boolean) =>
  filterMapper(name, type, new GraphQLList(new GraphQLNonNull(type)), isFilter)

export const createDefaultFilterParser = <Types, Models>(): FilterParser<Types, Models> => (
  mode,
  model,
  name,
  value,
  data,
) => data

export const applyFilterParser = <Types, Models>(filterParser: FilterParser<Types, Models>) => <Inst>(
  model: ExtendedModel<Types, Models>,
) => (mode: FilterMapperMode, data: Record<string, any>) =>
  data
    ? Object.keys(data).reduce((filters, name) => filterParser(mode, model.source, name, data[name], filters), {})
    : data
