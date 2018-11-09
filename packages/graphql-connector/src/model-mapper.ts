import {
  AnyModel,
  Model,
  modelCreator,
  ModelResolver,
  PartialAssociation,
  PartialAssociations,
  PartialAttribute,
  PartialAttributes,
} from './model'

export type GeneratedModelMapper<Types, Models> = <Key extends keyof Models>(
  key: Key,
  model: Models[Key],
) => AnyModel<Types, Models, Models[Key]>

export const createModelMapper = <Types, Models>(
  mapper: <Key extends keyof Models>(
    model: Models[Key],
    addAttribute: <Inst>(attribute: PartialAttribute<Inst, Types>) => void,
    addAssociation: <Inst>(association: PartialAssociation<Inst, Models>) => void,
  ) => ModelResolver<any>,
): GeneratedModelMapper<Types, Models> => {
  const creator = modelCreator<Types, Models>()
  return <Key extends keyof Models, Inst>(key: Key, model: Models[Key]) => {
    const attributes: PartialAttributes<any, any, Types> = {}
    const associations: PartialAssociations<any, any, Models> = {}
    const reducers = mapper(
      model,
      attribute => (attributes[attribute.name] = attribute),
      association => (associations[association.name] = association),
    )
    return creator<Key, Inst>(key, attributes, associations, reducers, model)
  }
}
