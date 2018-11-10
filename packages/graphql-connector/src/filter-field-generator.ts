import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
  isScalarType,
} from 'graphql'

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
export type FilterMapper = (name: string, type: GraphQLType) => Record<string, FilterMapperResultEntry>

export const defaultFilterMapper: FilterMapper = (name: string, type: GraphQLType) => {
  if (isScalarType(type)) {
    if (isGraphQLID(type) || isGraphQLString(type))
      return {
        [`${name}`]: { type },
        [`${name}_not`]: { type },
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
  return {}
}

export const applyFilterMapper = (filterMapper: FilterMapper): FilterMapper => (name: string, type: GraphQLType) => {
  return filterMapper(name, type)
}
