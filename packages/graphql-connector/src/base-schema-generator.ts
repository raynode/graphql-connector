import { createArgsFields } from './args-filter-generator'
import { applyFilterMapper, defaultFilterMapper, FilterMapper } from './filter-field-generator'
import { ListType, NodeType, PageInputType, PageType } from './generic-types'
import { AnyModel, ExtendedModel, GenericField, Model } from './model'
import { GeneratedModelMapper } from './model-mapper'
import { defaultNamingStrategy, Names, NamingStrategy } from './naming-strategy'
import { applyTypeMapper, TypeMapper } from './type-converter'
import { RecordOf } from './utils'

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
  filterMapper?: FilterMapper
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
    filterMapper: defaultFilterMapper,
    namingStrategy: defaultNamingStrategy,
    ...partialConfiguration,
  }
  // this is independet of the models and can be defined outside
  const filterMapper = applyFilterMapper(configuration.filterMapper)

  return models => {
    const modelNames: Array<keyof Models> = Object.keys(models) as any
    // 1. initialize all models
    const record: Record<keyof Models, ExtendedModel<Types, Models>> = modelNames.reduce((record: any, name) => {
      const model: ExtendedModel<Types, Models> = configuration.modelMapper(name, models[name]) as any
      record[name] = model

      const names = configuration.namingStrategy(name)
      model.names = names
      model.argsFields = createArgsFields(model, names)

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
          fields: () => model.dataTypes.type,
        }),
        update: new GraphQLInputObjectType({
          name: names.fields.update,
          fields: () => model.dataTypes.type,
        }),
      }

      return record
    }, {}) as any

    const getModel = (modelName: keyof Models): ExtendedModel<Types, Models> => record[modelName]
    const typeMapper = applyTypeMapper(configuration.typeMapper, getModel)

    // 2. create field lists
    modelNames.forEach(name => {
      const model = getModel(name)

      const fields = model.fields.reduce(
        (fields, field) => {
          const type = typeMapper(field, model)
          if (!type) return fields
          const association = model.associations[field.name]
          fields.push({
            type,
            fieldType: field.fieldType,
            name: field.name,
            nonNull: field.nonNull,
            resolver: field.resolver,
            model: association ? getModel(association.model) : null,
          })
          return fields
        },
        [] as GenericField[],
      )

      model.dataTypes = {
        type: fields.reduce((dataFields, { name, nonNull, resolver: resolve, type: fieldType }) => {
          dataFields[name] = { type: nonNull ? new GraphQLNonNull(fieldType) : fieldType, resolve }
          return dataFields
        }, {}),
        create: fields.reduce((create, { name, fieldType, type, model }) => {
          create[name] = fieldType === 'Attribute' ? { type } : { type: model.argsFields.where }
          return create
        }, {}),
        data: fields.reduce((data, { name, type, fieldType }) => {
          data[name] = fieldType === 'Attribute' ? { type } : { type: model.argsFields.where }
          return data
        }, {}),
        where: fields.reduce(
          (where, { name, fieldType, type }) => ({
            ...where,
            ...(fieldType === 'Association' ? null : filterMapper(name, type)),
          }),
          {},
        ),
      }
    })

    // 3. generator queries, mutations & subscriptions
    const queryFields = modelNames.reduce((queryFields, name) => {
      const model = getModel(name)
      const names = configuration.namingStrategy(name)

      queryFields[names.fields.findOne] = {
        args: {
          [names.arguments.where]: { type: model.argsFields.where },
          [names.arguments.order]: { type: model.argsFields.order },
        },
        resolve: model.resolvers.findOne,
        type: model.types.type,
      }

      queryFields[names.fields.findMany] = {
        args: {
          [names.arguments.where]: { type: model.argsFields.where },
          [names.arguments.order]: { type: model.argsFields.order },
        },
        resolve: model.resolvers.findMany,
        type: new GraphQLNonNull(model.types.list),
      }

      return queryFields
    }, {})

    const mutationFields = modelNames.reduce((mutationFields, name) => {
      const model = getModel(name)
      const names = configuration.namingStrategy(name)

      mutationFields[names.fields.create] = {
        args: { [names.arguments.data]: { type: model.argsFields.create } },
        resolve: model.resolvers.create,
        type: model.types.type,
      }

      mutationFields[names.fields.update] = {
        args: {
          [names.arguments.data]: { type: model.argsFields.data },
          [names.arguments.where]: { type: model.argsFields.where },
        },
        resolve: model.resolvers.update,
        type: model.types.type,
      }

      mutationFields[names.fields.delete] = {
        args: {
          [names.arguments.where]: { type: model.argsFields.where },
          [names.arguments.order]: { type: model.argsFields.order },
        },
        resolve: model.resolvers.delete,
        type: new GraphQLNonNull(model.types.list),
      }

      return mutationFields
    }, {})

    return {
      queryFields,
      mutationFields,
    }
  }
}
