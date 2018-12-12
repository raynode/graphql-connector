import { GraphQLFieldConfigMap, GraphQLList, GraphQLNonNull, Thunk } from 'graphql'
import { GeneratorConfiguration } from './configuration'
import { applyFilterParser } from './filter-field-generator'
import { ExtendedModel } from './model'
import { applyOrderMapper } from './order-mapper'

export type Fields = Thunk<GraphQLFieldConfigMap<any, any>>
export type ModelFetcher<Types, Models> = (modelName: keyof Models) => ExtendedModel<Types, Models>
export type FieldReducer<Types, Models> = (fields: Fields, name: keyof Models) => Fields

export const queryFieldReducer = <Types, Models>(
  getModel: ModelFetcher<Types, Models>,
  configuration: GeneratorConfiguration<Types, Models>,
): FieldReducer<Types, Models> => (queryFields, name) => {
  const model = getModel(name)
  const names = configuration.namingStrategy(name)

  const filterParser = applyFilterParser(configuration.filterParser)(model)
  const orderMapper = applyOrderMapper(configuration.orderMapper)

  queryFields[names.fields.findOne] = {
    args: {
      [names.arguments.where]: { type: model.argsFields.where },
      [names.arguments.order]: { type: model.argsFields.order },
    },
    resolve: (_, { where, order }, context, info) =>
      model.resolvers.findOne(
        _,
        {
          where: filterParser('where', where),
          order: orderMapper(order),
        },
        context,
        info,
      ),
    type: model.types.type,
  }

  queryFields[names.fields.findMany] = {
    args: {
      [names.arguments.where]: { type: model.argsFields.where },
      [names.arguments.order]: { type: model.argsFields.order },
    },
    resolve: (_, { where, order }, context, info) =>
      model.resolvers.findMany(
        _,
        {
          where: filterParser('where', where),
          order: orderMapper(order),
        },
        context,
        info,
      ),
    type: new GraphQLNonNull(model.types.list),
  }

  return queryFields
}

export const mutationFieldReducer = <Types, Models>(
  getModel: ModelFetcher<Types, Models>,
  configuration: GeneratorConfiguration<Types, Models>,
) => (mutationFields, name) => {
  const model = getModel(name)
  const names = configuration.namingStrategy(name)

  const filterParser = applyFilterParser(configuration.filterParser)(model)

  mutationFields[names.fields.create] = {
    args: { [names.arguments.data]: { type: model.argsFields.create } },
    resolve: (_, { data }, context, info) => {
      const node = model.resolvers.create(
        _,
        {
          data: filterParser('create', data),
        },
        context,
        info,
      )
      configuration.pubSub.publish(names.events.create, { node })
      return node
    },
    type: model.types.type,
  }

  mutationFields[names.fields.update] = {
    args: {
      [names.arguments.data]: { type: model.argsFields.data },
      [names.arguments.where]: { type: model.argsFields.where },
    },
    resolve: (_, { data, where }, context, info) => {
      const node = model.resolvers.update(
        _,
        {
          data: filterParser('update', data),
          where: filterParser('where', where),
        },
        context,
        info,
      )
      configuration.pubSub.publish(names.events.update, { node })
      return node
    },
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(model.types.type))),
  }

  mutationFields[names.fields.delete] = {
    args: {
      [names.arguments.where]: { type: model.argsFields.where },
      [names.arguments.order]: { type: model.argsFields.order },
    },
    resolve: (_, { where, order }, context, info) => {
      const nodes = model.resolvers.delete(
        _,
        {
          where: filterParser('where', where),
        },
        context,
        info,
      )
      configuration.pubSub.publish(names.events.delete, { nodes })
      return nodes
    },
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(model.types.type))),
  }

  return mutationFields
}

export const subscriptionFieldReducer = <Types, Models>(
  getModel: ModelFetcher<Types, Models>,
  configuration: GeneratorConfiguration<Types, Models>,
) => (subscriptionFields, name) => {
  const model = getModel(name)
  const names = configuration.namingStrategy(name)

  const filterParser = applyFilterParser(configuration.filterParser)(model)

  subscriptionFields[names.events.create] = {
    subscribe: () => configuration.pubSub.asyncIterator(names.events.create),
    resolve: ({ node }) => node,
    type: GraphQLNonNull(model.types.type),
  }
  subscriptionFields[names.events.delete] = {
    subscribe: () => configuration.pubSub.asyncIterator(names.events.delete),
    resolve: ({ nodes }) => nodes,
    type: GraphQLNonNull(GraphQLList(GraphQLNonNull(model.types.type))),
  }
  subscriptionFields[names.events.update] = {
    subscribe: () => configuration.pubSub.asyncIterator(names.events.update),
    resolve: ({ node }) => node,
    type: model.types.type,
  }
  return subscriptionFields
}
