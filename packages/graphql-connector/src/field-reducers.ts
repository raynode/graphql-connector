import { GraphQLNonNull } from 'graphql'
import { GeneratorConfiguration } from './configuration'
import { applyFilterParser } from './filter-field-generator'
import { ExtendedModel } from './model'
import { applyOrderMapper } from './order-mapper'

export type ModelFetcher<Types, Models> = (modelName: keyof Models) => ExtendedModel<Types, Models>

export const queryFieldReducer = <Types, Models>(
  getModel: ModelFetcher<Types, Models>,
  configuration: GeneratorConfiguration<Types, Models>,
) => (queryFields, name) => {
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
    resolve: (_, { data }, context, info) =>
      model.resolvers.create(
        _,
        {
          data: filterParser('create', data),
        },
        context,
        info,
      ),
    type: model.types.type,
  }

  mutationFields[names.fields.update] = {
    args: {
      [names.arguments.data]: { type: model.argsFields.data },
      [names.arguments.where]: { type: model.argsFields.where },
    },
    resolve: (_, { data, where }, context, info) =>
      model.resolvers.update(
        _,
        {
          data: filterParser('update', data),
          where: filterParser('where', where),
        },
        context,
        info,
      ),
    type: new GraphQLNonNull(model.types.list),
  }

  mutationFields[names.fields.delete] = {
    args: {
      [names.arguments.where]: { type: model.argsFields.where },
      [names.arguments.order]: { type: model.argsFields.order },
    },
    resolve: (_, { where, order }, context, info) =>
      model.resolvers.delete(
        _,
        {
          where: filterParser('where', where),
        },
        context,
        info,
      ),
    type: new GraphQLNonNull(model.types.list),
  }

  return mutationFields
}
