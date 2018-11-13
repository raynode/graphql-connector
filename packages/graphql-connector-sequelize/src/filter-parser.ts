
import {
  FilterMapperMode,
  FilterParser,
} from '@raynode/graphql-connector'

import { Models } from './model-mapper'
import { DataTypes } from './type-guards'

import { Op } from 'sequelize'

// handle operations that sequelize does not support directly or update them to be more useful
const handlers = {
  startsWith: value => ({ [Op.like]: `%${value}` }),
  endsWith: value => ({ [Op.like]: `${value}%` }),
  like: value => ({ [Op.like]: `%${value}%` }),
}
// conversion function to get the correct operator
const getOperator = (handler: string, value: any) => handlers.hasOwnProperty(handler)
  ? handlers[handler](value)
  : Op.hasOwnProperty(handler)
    ? { [Op[handler]]: value }
    : null

// people who do not like recursion are people who do not ...
const applyFilterParser = <Key extends keyof Models>(
  mode: FilterMapperMode,
  model: Models[Key],
  data: Record<string, any>,
) => Object.keys(data).reduce((filters, name) => filterParser(mode, model, name, data[name], filters), {})

export const filterParser: FilterParser<DataTypes, Models> = (mode, model, name, value, filters) => {
  // convert all where-filters into the correct sequelize groups
  if(mode === 'where') {
    if(name === 'not') return {
      ...filters,
      [name]: getOperator(name, applyFilterParser(mode, model, value)),
    }
    if(name === 'and' || name === 'or')  return {
      ...filters,
      [name]: getOperator(name, value.map(entry => applyFilterParser(mode, model, entry))),
    }
    const [attribute, handler = 'eq'] = name.split('_')
    const operator = getOperator(handler, value)
    if(!operator)
      throw new Error(`unkown filter for ${name}`)
    filters[attribute] = {
      ...filters[attribute],
      ...operator,
    }
    return filters
  }
  // @TODO create
  // @TODO update
  return filters
}
