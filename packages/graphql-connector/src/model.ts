import { GraphQLInputObjectType, GraphQLObjectType } from 'graphql'
import { applyToRecordOf, RecordOf } from './utils'

export type AttributeFieldType = 'Attribute'
export type AssociationFieldType = 'Association'
export type FieldType = AttributeFieldType | AssociationFieldType
export type Mutations = 'create' | 'update' | 'delete'
export type Queries = 'findOne' | 'findMany'
export type DataTypes = 'type'

export interface ModelFields {
  type: GraphQLObjectType
  list: GraphQLObjectType
  create: GraphQLInputObjectType
  update: GraphQLInputObjectType
}

export interface ExtendedModel<Types, Models> extends AnyModel<Types, Models> {
  mutationTypes: Record<Mutations, GraphQLInputObjectType>
  queryTypes: Record<Queries, GraphQLObjectType>
  types: ModelFields
  dataTypes: Record<DataTypes, any>
}

export interface BaseAttribute {
  fieldType: FieldType
  name: string
  nonNull: boolean
  list: boolean
}
export type PartialBaseAttribute = Partial<BaseAttribute>

export interface BaseField<Types, Models> extends BaseAttribute {
  list: boolean
  name: string
  nonNull: boolean
}

export const isAttributeField = <Types, Models>(field: BaseField<Types, Models>): field is Attribute<Types> =>
  field.fieldType === 'Attribute'

export const isAssociationField = <Types, Models>(field: BaseField<Types, Models>): field is Association<Models> =>
  field.fieldType === 'Association'

export interface Attribute<Types> extends BaseAttribute {
  fieldType: AttributeFieldType
  type: Types
}
export interface PartialAttribute<Types> extends PartialBaseAttribute {
  type: Types
}

export interface Association<Models> extends BaseAttribute {
  fieldType: AssociationFieldType
  model: keyof Models
}
export interface PartialAssociation<Models> extends PartialBaseAttribute {
  model: keyof Models
}
export type Attributes<Attrs, Types> = RecordOf<Attrs, Attribute<Types>>
export type PartialAttributes<Attrs, Types> = RecordOf<Attrs, PartialAttribute<Types>>
export type Associations<Assocs, Models> = RecordOf<Assocs, Association<Models>>
export type PartialAssociations<Assocs, Models> = RecordOf<Assocs, PartialAssociation<Models>>

export type Fields<Attrs, Assocs, Types, Models> = RecordOf<Attrs & Assocs, BaseAttribute>

export interface Model<Attrs, Assocs, Types, Models, Source> {
  name: keyof Models
  attributes: Attributes<Attrs, Types>
  associations: Associations<Assocs, Models>
  fields: Array<BaseField<Types, Models>>
  source?: Source
}
export type AnyModel<Types, Models, Source = any> = Model<any, any, Types, Models, Source>

export type ModelCache<Models extends string, Type = any> = { [key in Models]: Type }

export const completeBaseAttribute = (
  fieldType: FieldType,
  attribute: PartialBaseAttribute,
  name: string,
): BaseAttribute => ({
  list: false,
  name,
  nonNull: false,
  ...attribute,
  fieldType,
})

export const completeAttribute = <Types>(attribute: PartialAttribute<Types>, name: string): Attribute<Types> => ({
  ...attribute,
  ...completeBaseAttribute('Attribute', attribute, name),
  fieldType: 'Attribute',
})

export const completeAssociation = <Models>(
  association: PartialAssociation<Models>,
  name: string,
): Association<Models> => ({
  ...association,
  ...completeBaseAttribute('Association', association, name),
  fieldType: 'Association',
})

export type ModelCreator<Types, Models> = <Attrs, Assocs, Name extends keyof Models, Source>(
  name: Name,
  attributes?: PartialAttributes<Attrs, Types>,
  associations?: PartialAssociations<Assocs, Models>,
  source?: Source,
) => Model<Attrs, Assocs, Types, Models, Source>

export const modelCreator = <Types, Models>(): ModelCreator<Types, Models> => (
  name,
  partialAttributes = {} as any,
  partialAssociations = {} as any,
  source = null,
) => {
  const attributes = applyToRecordOf(partialAttributes, completeAttribute)
  const associations = applyToRecordOf(partialAssociations, completeAssociation)
  const fields = Object.keys(attributes)
    .map(
      (field: string): BaseField<Types, Models> => ({
        fieldType: 'Attribute',
        name: field,
        ...attributes[field],
      }),
    )
    .concat(
      Object.keys(associations).map(
        (field: string): BaseField<Types, Models> => ({
          fieldType: 'Association',
          name: field,
          ...associations[field],
        }),
      ),
    )
  return { attributes, associations, name, fields, source }
}
