import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql'

export const PageInputType = new GraphQLInputObjectType({
  name: 'PageInput',
  fields: {
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
  },
})
export const PageType = new GraphQLObjectType({
  name: 'Page',
  fields: {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
  },
})
export const NodeType = new GraphQLInterfaceType({
  name: 'Node',
  fields: {
    id: { type: GraphQLID },
  },
})
export const ListType = new GraphQLInterfaceType({
  name: 'List',
  fields: {
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NodeType))) },
    page: { type: new GraphQLNonNull(PageType) },
  },
})

export interface Node {
  id: string
}
export interface PageInput {
  limit: number
  offset: number
}
export interface Page {
  page: number
  limit: number
  offset: number
}
