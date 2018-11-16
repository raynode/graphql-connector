import { createDefaultFilterParser, defaultFilterMapper, FilterMapper, FilterParser } from './filter-field-generator'
import { GeneratedModelMapper } from './model-mapper'
import { defaultNamingStrategy, NamingStrategy } from './naming-strategy'
import { defaultOrderMapper, OrderMapper } from './order-mapper'
import { TypeMapper } from './type-converter'

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
  filterParser?: FilterParser<Types, Models>
  orderMapper?: OrderMapper<any>
}

export const applyDefaultConfiguration = <Types, Models>(
  configuration: PartialGeneratorConfiguration<Types, Models>,
) => ({
  filterMapper: defaultFilterMapper,
  filterParser: createDefaultFilterParser<Types, Models>(),
  namingStrategy: defaultNamingStrategy,
  orderMapper: defaultOrderMapper,
  ...configuration,
})
