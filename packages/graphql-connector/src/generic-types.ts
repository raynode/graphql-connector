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
