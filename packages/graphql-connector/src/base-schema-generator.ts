import { createArgsFields } from './args-filter-generator'
import {
  applyFilterMapper,
  applyFilterParser,
  createDefaultFilterParser,
  defaultFilterMapper,
  FilterMapper,
  FilterParser,
} from './filter-field-generator'
import { ListType, NodeType, PageInputType, PageType } from './generic-types'
import { AnyModel, Attribute, ExtendedModel, GenericField, Model } from './model'
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

import { applyDefaultConfiguration, GeneratorConfiguration, PartialGeneratorConfiguration } from './configuration'

import { ModelFetcher, mutationFieldReducer, queryFieldReducer } from './field-reducers'

export type ModelList<Types, Models> = Array<AnyModel<Types, Models>>

export interface BaseSchema {
  queryFields: any
  mutationFields?: any
  subscriptionFields?: any
}

export type BaseSchemaGenerator<Types, Models> = (models: Models) => BaseSchema

const extendModelReducer = <Types, Models>(configuration: GeneratorConfiguration<Types, Models>, models: Models) => <
  Key extends keyof Models
>(
  record: Record<keyof Models, ExtendedModel<Types, Models>>,
  name: Key,
) => {
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
}

const genericFieldReducer = <Types, Models>(
  model: ExtendedModel<Types, Models>,
  getModel: ModelFetcher<Types, Models>,
  typeMapper: ReturnType<typeof applyTypeMapper>,
) => (fields, field) => {
  const type = typeMapper(field, model)
  if (!type) return fields
  const association = model.associations[field.name]
  fields.push({
    type,
    list: field.list,
    fieldType: field.fieldType,
    name: field.name,
    nonNull: field.nonNull,
    resolver: field.resolver,
    model: association ? getModel(association.model) : null,
  })
  return fields
}

const dataTypeGenerator = <Types, Models>(
  getModel: ModelFetcher<Types, Models>,
  typeMapper: ReturnType<typeof applyTypeMapper>,
  filterMapper: ReturnType<typeof applyFilterMapper>,
) => <Key extends keyof Models>(name: Key) => {
  const model = getModel(name)

  const fields = model.fields.reduce(genericFieldReducer(model, getModel, typeMapper), [] as GenericField[])

  model.dataTypes = {
    type: fields.reduce((dataFields, { name, nonNull, resolver: resolve, type: fieldType }) => {
      dataFields[name] = { type: nonNull ? new GraphQLNonNull(fieldType) : fieldType, resolve }
      return dataFields
    }, {}),
    create: fields.reduce((create, { name, fieldType, type, model }) => {
      create[name] = fieldType === 'Attribute' ? { type } : { type: model.argsFields.where }
      return create
    }, {}),
    filter: fields.reduce(
      (filter, { name, fieldType, type }) => ({
        ...filter,
        ...(fieldType === 'Association' ? null : filterMapper(name, type, false)),
      }),
      {},
    ),
    data: fields.reduce((data, { name, type, fieldType }) => {
      data[name] = fieldType === 'Attribute' ? { type } : { type: model.argsFields.where }
      return data
    }, {}),
    where: fields.reduce(
      (where, { name, type, fieldType, model }) => ({
        ...where,
        ...(fieldType === 'Association'
          ? filterMapper(name, model.argsFields.filter, true)
          : filterMapper(name, type, false)),
      }),
      {},
    ),
  }
}

const baseSchemaGenerator = <Types, Models>(configuration: GeneratorConfiguration<Types, Models>) => (
  models: Models,
) => {
  const modelNames = Object.keys(models) as Array<keyof Models>
  // 1. initialize all models
  const record: Record<keyof Models, ExtendedModel<Types, Models>> = modelNames.reduce(
    extendModelReducer(configuration, models),
    {} as any,
  )

  const getModel = (modelName: keyof Models): ExtendedModel<Types, Models> => record[modelName]
  const filterMapper = applyFilterMapper(configuration.filterMapper)
  const typeMapper = applyTypeMapper(configuration.typeMapper, getModel)

  // 2. ggenerate datatypes in the models
  modelNames.forEach(dataTypeGenerator(getModel, typeMapper, filterMapper))

  // 3. generator queries, mutations & subscriptions
  return {
    queryFields: modelNames.reduce(queryFieldReducer(getModel, configuration), {}),
    mutationFields: modelNames.reduce(mutationFieldReducer(getModel, configuration), {}),
  }
}

export const createBaseSchemaGenerator = <Types, Models>(
  configuration: PartialGeneratorConfiguration<Types, Models>,
): BaseSchemaGenerator<Types, Models> => baseSchemaGenerator(applyDefaultConfiguration(configuration))
