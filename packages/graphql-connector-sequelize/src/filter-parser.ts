
import * as Sequelize from 'sequelize'
import {
  FilterMapperMode,
  FilterParser,
} from '@raynode/graphql-connector'

import { Models, SequelizeAssociation, SequelizeModel } from './model-mapper'
import { DataTypes } from './type-guards'

const Op = Sequelize.Op

export interface Includes {
  as: string
  model: Sequelize.Model<any, any>
  where: Where
  include: Include
}
export type Where = Record<symbol, any>
export type Include = Includes[]
export interface ParsedFilter {
  where: Where
  include: Include
}
export type ParserHandler = (value: any, filter: ParsedFilter) => ParsedFilter

const createEmptyFilter = (): ParsedFilter => ({ where: {}, include: [] })

const addInclude = (add: Include, { include, where }: ParsedFilter): ParsedFilter =>
  ({ include: [...include, ...add], where})
const addWhere = (add: Where, { include, where }: ParsedFilter): ParsedFilter =>
  ({ include, where: { ...where, ...add }})
const addParsedFilter = ({ where = {}, include = [] }: Partial<ParsedFilter>, filter: ParsedFilter): ParsedFilter =>
  ({ include: [ ...filter.include, ...include ], where: { ...filter.where, ...where }})

const addIncludeHandler = (valueFn: (value: any) => Include): ParserHandler =>
  (value, filter: ParsedFilter): ParsedFilter => addInclude(valueFn(value), filter)
const addWhereHandler = (valueFn: (value: any) => Where): ParserHandler =>
  (value, filter: ParsedFilter): ParsedFilter => addWhere(valueFn(value), filter)
const addWhereAndIncludeHandler = (whereFn: (value: any) => Where, includeFn: (value: any) => Include): ParserHandler =>
  (value, filter: ParsedFilter): ParsedFilter =>
    addParsedFilter({ where: whereFn(value), include: includeFn(value) }, filter)

// handle operations that sequelize does not support directly or update them to be more useful
const handlers = {
  startsWith: addWhereHandler(value => ({ [Op.like]: `%${value}` })),
  endsWith: addWhereHandler(value => ({ [Op.like]: `${value}%` })),
  like: addWhereHandler(value => ({ [Op.like]: `%${value}%` })),
  NOT: addWhereHandler(value => ({ [Op.not]: value })),
  AND: addWhereHandler(value => ({ [Op.and]: value })),
  OR: addWhereHandler(value => ({ [Op.or]: value })),
}

// conversion function to get the correct operator
const getOperator = (handler: string, value: any): ParsedFilter =>
  handlers.hasOwnProperty(handler)
  ? handlers[handler](value, createEmptyFilter())
  : Op.hasOwnProperty(handler)
    ? addWhere({ [Op[handler]]: value }, createEmptyFilter())
    : createEmptyFilter()

const joinWithOperator = (handler: string, { include, where }: ParsedFilter): ParsedFilter => {
  const operator = getOperator(handler, where)
  return addParsedFilter({ include }, operator)
}

type AssociationHandler = (
  model: SequelizeModel,
  association: SequelizeAssociation,
  value: any,
  filter: ParsedFilter,
) => ParsedFilter
const associationHandlers: Record<string, AssociationHandler> = {
  some: (model, association, value, filter) => addParsedFilter({ include: [{
    as: association.as,
    model: association.target,
    ...applyParser(association.target, value),
  }] }, filter),
}

type ConditionHandler = (model: SequelizeModel, value: any, filter: ParsedFilter) => ParsedFilter
const conditionHandlers: Record<string, ConditionHandler> = {
  NOT: (model, value, filter) => joinWithOperator('NOT', applyParser(model, value)),
  AND: (model, value, filter) => addWhere(getOperator('AND', value.map(entry => applyParser(model, entry))), filter),
  OR: (model, value, filter) => addWhere(getOperator('OR', value.map(entry => applyParser(model, entry))), filter),
}

// people who do not like recursion are people who do not ...
const applyParser = (model: SequelizeModel, data: Record<string, any>) =>
  Object.keys(data).reduce((filters, name) => parser(model, name, data[name], filters), createEmptyFilter())

export const parser = (model: SequelizeModel, name: string, value: any, filter: ParsedFilter): ParsedFilter => {
  if(conditionHandlers.hasOwnProperty(name))
    return conditionHandlers[name](model, value, filter)

  const [attribute, handler = 'eq'] = name.split('_')

  if(associationHandlers.hasOwnProperty(handler))
    return associationHandlers[handler](model, model.associations[attribute], value, filter)

  const { where, include } = getOperator(handler, value)
  const operator = { include, where: { ...filter.where, [attribute]: where }}
  return operator
}

export const filterParser: FilterParser<DataTypes, Models> =
  (mode, model: SequelizeModel, name, value, data) => {
    const filter: ParsedFilter = { where: data.where || {}, include: data.include || [] }
    // convert all where-filters into the correct sequelize groups
    if(mode === 'where') return parser(model, name, value, filter)
    // @TODO create
    // @TODO update
    return filter
  }
