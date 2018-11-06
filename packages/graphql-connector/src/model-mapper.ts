import {
  AnyModel,
  Model,
  modelCreator,
  PartialAssociation,
  PartialAssociations,
  PartialAttribute,
  PartialAttributes,
} from 'model'

export type ModelMapperFn<Types, Models> = <Key extends keyof Models>(
  model: Models[Key],
  addAttribute: (attribute: PartialAttribute<Types>) => void,
  addAssociation: (association: PartialAssociation<keyof Models>) => void,
) => void

export type GeneratedModelMapper<Types, Models> = <Key extends keyof Models>(
  key: Key,
  model: Models[Key],
) => AnyModel<Types, Models, Models[Key]>

export type ModelMapper<Types, Models> = (mapper: ModelMapperFn<Types, Models>) => GeneratedModelMapper<Types, Models>

export const createModelMapper = <Types, Models>(
  mapper: ModelMapperFn<Types, Models>,
): GeneratedModelMapper<Types, Models> => {
  const creator = modelCreator<Types, Models>()
  return <Key extends keyof Models>(key: Key, model: Models[Key]) => {
    const attributes: PartialAttributes<any, any> = {}
    const associations: PartialAssociations<any, any> = {}
    mapper(
      model,
      (attribute: PartialAttribute<Types>) => (attributes[attribute.name] = attribute),
      (association: PartialAssociation<keyof Models>) => (associations[association.name] = association),
    )
    return creator(key, attributes, associations, model)
  }
}
