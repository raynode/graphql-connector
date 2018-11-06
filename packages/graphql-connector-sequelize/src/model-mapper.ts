import { AnyModel, createModelMapper, GeneratedModelMapper, ModelMapperFn } from '@raynode/graphql-connector'
import * as Sequelize from 'sequelize'
import { DataTypes } from './type-guards'

// somehow the sequelize types are really really bad!

export interface SequelizeAttribute {
  type: DataTypes
  allowNull: boolean
  primaryKey: boolean
  comment: string
}

export type SequelizeAssociationTypes = 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany'

export interface SequelizeAssociation {
  source: SequelizeModel
  target: SequelizeModel
  as: string
  associationType: SequelizeAssociationTypes
  foreignKeyAttribute: string
  foreignKey: string
  identifier: string
  targetKey: string
  targetKeyField: string
  targetKeyIsPrimary: string
  targetIdentifier: string
  accessors: string
  identifierField: string
}

export interface SequelizeModel extends Sequelize.Model<any, any> {
  rawAttributes: Record<string, SequelizeAttribute>
  associations: Record<string, SequelizeAssociation>
}

export interface Models {
  [x: string]: Sequelize.Model<any, any>
}

export const modelMapper = createModelMapper<DataTypes, Models>((model, addAttribute, addAssociation) => {
  const rawModel: SequelizeModel = model as any
  Object.keys(rawModel.rawAttributes).forEach(name => {
    const attribute = rawModel.rawAttributes[name]
    addAttribute({
      name,
      type: attribute.type,
      nonNull: attribute.allowNull === false || attribute.primaryKey === true,
    })
  })

  Object.keys(rawModel.associations).forEach(name => {
    const association = rawModel.associations[name]
    addAssociation({
      name: association.as,
      model: association.target.name,
      list: association.associationType === 'HasMany' || association.associationType === 'BelongsToMany',
      nonNull: association.associationType === 'BelongsTo' || association.associationType === 'BelongsToMany',
    })
  })
})
