import { ListType, NodeType, PageInputType, PageType } from 'generic-types'
import { AnyModel, ExtendedModel, Model } from 'model'
import { GeneratedModelMapper } from 'model-mapper'
import { defaultNamingStrategy, NamingStrategy } from 'naming-strategy'
import { applyTypeMapper, TypeMapper } from 'type-converter'
import { RecordOf } from 'utils'

import {
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLType,
} from 'graphql'

export type ModelList<Types, Models> = Array<AnyModel<Types, Models>>

export interface GeneratorConfiguration<Types, Models> extends PartialGeneratorConfiguration<Types, Models> {
  modelMapper: GeneratedModelMapper<Types, Models>
  namingStrategy: NamingStrategy
  typeMapper: TypeMapper<Types, Models>
}
export interface PartialGeneratorConfiguration<Types, Models> {
  modelMapper: GeneratedModelMapper<Types, Models>
  namingStrategy?: NamingStrategy
  typeMapper: TypeMapper<Types, Models>
}

export interface BaseSchema {
  queryFields: any
  mutationFields?: any
  subscriptionFields?: any
}

export type BaseSchemaGenerator<Types, Models> = (models: Models) => BaseSchema

export const createBaseSchemaGenerator = <Types, Models>(
  partialConfiguration: PartialGeneratorConfiguration<Types, Models>,
): BaseSchemaGenerator<Types, Models> => {
  const configuration: GeneratorConfiguration<Types, Models> = {
    namingStrategy: defaultNamingStrategy,
    ...partialConfiguration,
  }
  return models => {
    const modelNames: Array<keyof Models> = Object.keys(models) as any
    // 1. initialize all models
    const record: Record<keyof Models, ExtendedModel<Types, Models>> = modelNames.reduce((record: any, name) => {
      const model: ExtendedModel<Types, Models> = configuration.modelMapper(name, models[name]) as any
      record[name] = model

      const names = configuration.namingStrategy(name)

      const dummyFields = {
        dummy: {
          type: GraphQLInt,
        },
      }

      const type = new GraphQLObjectType({
        name: names.fields.findOne,
        interfaces: [NodeType],
        fields: () => model.dataTypes.type,
      })
      const list = new GraphQLObjectType({
        name: names.fields.findMany,
        interfaces: [ListType],
        fields: () => ({
          nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(type))) },
          page: { type: new GraphQLNonNull(PageType) },
        }),
      })

      model.types = {
        type,
        list,
        create: new GraphQLInputObjectType({
          name: names.fields.create,
          fields: () => dummyFields,
        }),
        update: new GraphQLInputObjectType({
          name: names.fields.update,
          fields: () => dummyFields,
        }),
      }

      return record
    }, {}) as any

    const getModel = (modelName: keyof Models) => record[modelName]
    const typeMapper = applyTypeMapper(configuration.typeMapper, getModel)
    // 2. create field lists
    modelNames.forEach(name => {
      const model = getModel(name)

      model.dataTypes = {
        type: model.fields.reduce((dataFields, field) => {
          const type = typeMapper(field)
          dataFields[field.name] = { type: field.nonNull ? new GraphQLNonNull(type) : type }
          return dataFields
        }, {}),
      }
    })
    // 3. generator queries, mutations & subscriptions
    const queryFields = modelNames.reduce((queryFields, name) => {
      const model = getModel(name)
      const names = configuration.namingStrategy(name)

      queryFields[names.fields.findOne] = {
        type: model.types.type,
        // args: { where: { type: nonNullGraphQL(whereFilter) }, order },
        resolve: () => null,
      }

      queryFields[names.fields.findMany] = {
        type: model.types.list,
        // args: { where: { type: nonNullGraphQL(whereFilter) }, order },
        resolve: () => null,
      }

      return queryFields
    }, {})

    const mutationFields = modelNames.reduce((mutationFields, name) => {
      const model = getModel(name)
      const names = configuration.namingStrategy(name)

      mutationFields[names.fields.create] = {
        type: model.types.type,
        // args: { where: { type: nonNullGraphQL(whereFilter) }, order },
        resolve: () => null,
      }

      mutationFields[names.fields.update] = {
        type: model.types.type,
        // args: { where: { type: nonNullGraphQL(whereFilter) }, order },
        resolve: () => null,
      }

      mutationFields[names.fields.delete] = {
        type: model.types.list,
        // args: { where: { type: nonNullGraphQL(whereFilter) }, order },
        resolve: () => null,
      }

      return mutationFields
    }, {})

    return {
      queryFields,
      mutationFields,
    }
  }
}
