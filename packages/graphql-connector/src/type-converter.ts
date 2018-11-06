import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql'
import { AnyModel, Attribute, BaseField, ExtendedModel, isAssociationField } from 'model'

export type TypeMapper<Types, Models> = (type: Attribute<Types>) => GraphQLType

export const applyTypeMapper = <Types, Models>(
  typeMapper: TypeMapper<Types, Models>,
  getModel: (name: keyof Models) => ExtendedModel<Types, Models>,
) => (field: BaseField<Types, Models>): GraphQLType => {
  if (isAssociationField(field)) {
    const model = getModel(field.model)
    return field.list ? model.types.list : model.types.type
  }
  const type = typeMapper(field as Attribute<Types>)
  return field.list ? new GraphQLList(new GraphQLNonNull(type)) : type
}
