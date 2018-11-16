import { GraphQLList, GraphQLNonNull, GraphQLType } from 'graphql'
import { AnyModel, Attribute, BaseField, ExtendedModel, isAssociationField } from './model'

export type TypeMapper<Types, Models> = <Inst>(
  type: Attribute<Inst, Types>,
  model: AnyModel<Types, Models>,
) => GraphQLType

export const applyTypeMapper = <Types, Models>(
  typeMapper: TypeMapper<Types, Models>,
  getModel: (name: keyof Models) => ExtendedModel<Types, Models>,
) => <Model, Inst>(field: BaseField<Types, Models, Inst>, model: ExtendedModel<Types, Models>): GraphQLType => {
  if (isAssociationField(field)) {
    const model = getModel(field.model)
    if (!model) return null
    return field.list ? model.types.list : model.types.type
  }
  try {
    const type = typeMapper(field as Attribute<Inst, Types>, model)
    if (!type) return null
    return field.list ? new GraphQLList(new GraphQLNonNull(type)) : type
  } catch (err) {
    return null
  }
}
