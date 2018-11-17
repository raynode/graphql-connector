export * from './type-mapper'
export * from './model-mapper'
export * from './types'
export * from './type-guards'

import { PartialGeneratorConfiguration } from '@raynode/graphql-connector'

import { filterMapper } from './filter-mapper'
import { filterParser } from './filter-parser'
import { modelMapper, Models } from './model-mapper'
import { orderMapper } from './order-mapper'
import { DataTypes } from './type-guards'
import { typeMapper } from './type-mapper'

export const configuration: PartialGeneratorConfiguration<DataTypes, Models> = {
  filterMapper,
  filterParser,
  modelMapper,
  orderMapper,
  typeMapper,
}
