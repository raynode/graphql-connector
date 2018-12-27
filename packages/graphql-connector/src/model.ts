import { GraphQLInputObjectType, GraphQLObjectType, GraphQLType, GraphQLTypeResolver } from 'graphql'
import { ArgsFields } from './args-filter-generator'
import { Page } from './generic-types'
import { Names } from './naming-strategy'
import { applyToRecordOf, RecordOf } from './utils'

export type Resolver<Inst, Args, Context, Result> = (
  obj: Inst,
  args: Args,
  context: Context,
  info: any,
) => Promise<Result> | Result

export type AttributeFieldType = 'Attribute'
export type AssociationFieldType = 'Association'
export type FieldType = AttributeFieldType | AssociationFieldType
export type Mutations = 'create' | 'update' | 'delete'
export type Queries = 'findOne' | 'findMany'
export type DataTypes = 'type' | 'where' | 'data' | 'create' | 'filter' | 'page'

export interface ModelFields {
  type: GraphQLObjectType
  list: GraphQLObjectType
  create: GraphQLInputObjectType
  update: GraphQLInputObjectType
}

export interface Paged<Inst> {
  nodes: Inst[]
  page: Page
}

export interface ModelResolver<Inst> {
  create: Resolver<null, any, any, Inst>
  update: Resolver<null, any, any, Inst>
  delete: Resolver<null, any, any, Inst[]>
  findOne: Resolver<null, any, any, Inst>
  findMany: Resolver<null, any, any, Paged<Inst>>
}

export interface ExtendedModel<Types, Models> extends AnyModel<Types, Models> {
  mutationTypes: Record<Mutations, GraphQLInputObjectType>
  queryTypes: Record<Queries, GraphQLObjectType>
  types: ModelFields
  dataTypes: Record<DataTypes, any>
  filterType: GraphQLInputObjectType
  genericFields: GenericField[]
  names: Names
  argsFields: ArgsFields
}

export interface GenericField {
  list: boolean
  fieldType: FieldType
  name: string
  nonNull: boolean
  resolver: Resolver<any, any, any, any>
  type: GraphQLType
  model?: ExtendedModel<any, any>
}

export interface BaseAttribute<Inst, Result = any> {
  fieldType: FieldType
  name: string
  nonNull: boolean
  list: boolean
  pagination: boolean
  resolver?: Resolver<Inst, any, any, Result>
}
export type PartialBaseAttribute<Inst> = Partial<BaseAttribute<Inst>>

export interface BaseField<Types, Models, Inst> extends BaseAttribute<Inst> {
  list: boolean
  name: string
  nonNull: boolean
}

export const isAttributeField = <Inst, Types, Models>(
  field: BaseField<Types, Models, Inst>,
): field is Attribute<Inst, Types> => field.fieldType === 'Attribute'

export const isAssociationField = <Inst, Types, Models>(
  field: BaseField<Types, Models, Inst>,
): field is Association<Inst, Models> => field.fieldType === 'Association'

export interface Attribute<Inst, Types> extends BaseAttribute<Inst> {
  fieldType: AttributeFieldType
  type: Types
  resolver: Resolver<Inst, any, any, Types>
}
export interface PartialAttribute<Inst, Types> extends PartialBaseAttribute<Inst> {
  type: Types
  resolver: Resolver<Inst, any, any, Types>
}

export interface Association<Inst, Models> extends BaseAttribute<Inst> {
  fieldType: AssociationFieldType
  model: keyof Models
  resolver: Resolver<Inst, any, any, Inst | Paged<Inst>>
}
export interface PartialAssociation<Inst, Models> extends PartialBaseAttribute<Inst> {
  model: keyof Models
  resolver: Resolver<Inst, any, any, Inst | Paged<Inst>>
}
export type Attributes<Inst, Attrs, Types> = RecordOf<Attrs, Attribute<Inst, Types>>
export type PartialAttributes<Inst, Attrs, Types> = RecordOf<Attrs, PartialAttribute<Inst, Types>>
export type Associations<Inst, Assocs, Models> = RecordOf<Assocs, Association<Inst, Models>>
export type PartialAssociations<Inst, Assocs, Models> = RecordOf<Assocs, PartialAssociation<Inst, Models>>

export type Fields<Attrs, Assocs, Types, Models, Inst> = RecordOf<Attrs & Assocs, BaseAttribute<Inst>>

export interface Model<Attrs, Assocs, Types, Models, Inst> {
  name: keyof Models
  attributes: Attributes<Inst, Attrs, Types>
  associations: Associations<Inst, Assocs, Models>
  fields: Array<BaseField<Types, Models, Inst>>
  resolvers: ModelResolver<Inst>
  source: Models[keyof Models]
}
export type AnyModel<Types, Models, Inst = any> = Model<any, any, Types, Models, Inst>

export const completeBaseAttribute = <Inst>(
  fieldType: FieldType,
  attribute: PartialBaseAttribute<Inst>,
  name: string,
): BaseAttribute<Inst> => ({
  list: false,
  name,
  nonNull: false,
  pagination: fieldType === 'Association' ? true : false,
  ...attribute,
  fieldType,
})

export const completeAttribute = <Inst, Types>(
  attribute: PartialAttribute<Inst, Types>,
  name: string,
): Attribute<Inst, Types> => ({
  ...attribute,
  ...completeBaseAttribute('Attribute', attribute, name),
  fieldType: 'Attribute',
})

export const completeAssociation = <Inst, Models>(
  association: PartialAssociation<Inst, Models>,
  name: string,
): Association<Inst, Models> => ({
  ...association,
  ...completeBaseAttribute('Association', association, name),
  fieldType: 'Association',
})

export const modelCreator = <Types, Models>() => <Name extends keyof Models, Inst, Attrs = any, Assocs = any>(
  name: Name,
  partialAttributes: PartialAttributes<Inst, Attrs, Types> = {} as any,
  partialAssociations: PartialAssociations<Inst, Assocs, Models> = {} as any,
  resolvers: ModelResolver<Inst>,
  source: Models[Name],
): Model<Attrs, Assocs, Types, Models, Inst> => {
  const attributes = applyToRecordOf(partialAttributes, completeAttribute)
  const associations = applyToRecordOf(partialAssociations, completeAssociation)
  const fields = Object.keys(attributes)
    .map(
      (field: string): BaseField<Types, Models, Inst> => ({
        fieldType: 'Attribute',
        name: field,
        ...attributes[field],
      }),
    )
    .concat(
      Object.keys(associations).map(
        (field: string): BaseField<Types, Models, Inst> => ({
          fieldType: 'Association',
          name: field,
          ...associations[field],
        }),
      ),
    )
  return { attributes, associations, name, fields, resolvers, source }
}
