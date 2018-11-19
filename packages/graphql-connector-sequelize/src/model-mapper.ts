import { AnyModel, createModelMapper, GeneratedModelMapper, Page } from '@raynode/graphql-connector'
import * as Sequelize from 'sequelize'
import { DataTypes } from './type-guards'
import { capitalize } from 'inflection'

// somehow the sequelize types are really really bad!

export interface SequelizeAttributeReference {
  model: string
  key: string
}

export interface SequelizeAttribute {
  _autoGenerated?: boolean
  type: DataTypes
  allowNull: boolean
  primaryKey?: boolean
  comment: string
  references?: SequelizeAttributeReference
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

const createPage = (offset: number, limit: number, page: number): Page => ({
  offset, limit, page,
})

export const modelMapper = createModelMapper<DataTypes, Models>((model, addAttribute, addAssociation) => {
  const rawModel: SequelizeModel = model as any
  Object.keys(rawModel.rawAttributes).forEach(name => {
    const attribute = rawModel.rawAttributes[name]
    // if(d) console.log(JSON.stringify(attribute, null, 2))
    addAttribute({
      name,
      type: attribute.type,
      nonNull: attribute.allowNull === false || attribute.primaryKey === true,
      resolver: instance => instance[name],
      // changable: !(attribute._autoGenerated || attribute.primaryKey || attribute.references),
    })
  })

  Object.keys(rawModel.associations).forEach(name => {
    const association = rawModel.associations[name]
    const list = association.associationType === 'HasMany' || association.associationType === 'BelongsToMany'
    addAssociation({
      name: association.as,
      model: association.target.name,
      list,
      nonNull: association.associationType === 'BelongsTo' || association.associationType === 'BelongsToMany',
      resolver: async (instance, args, context, info) => {
        // @TODO
        // this needs to correctly submit nodes and page when done!
        const getter = `${capitalize(association.as)}`
        const res = await instance[`get${getter}`]()

        return list
        ? {
          nodes: res,
          page: createPage(0, 100, 0),
        } : res
      },
    })
  })

  const findAll = async (include, where, order?) => {
    const nodes = await model.findAll({ include, where, order })
    return {
      nodes,
      page: createPage(0, 100, 0),
    }
  }

  const resolvers = {
    create: async (_, { data }) => model.create(data),
    delete: async (_, { where: { where } }) => {
      const items = await model.findAll({ where })
      const rows = await model.destroy({ where })
      return items
    },
    findMany: async (_, { order, where: { where = {}, include = [] } = {} }) => findAll(include, where, order),
    findOne: async (_, { order, where: { where = {}, include = [] } = {} }) => model.findOne({ include, where, order }),
    update: async (_, { data, where: { where, include } }) => {
      await model.update(data, { where })
      return findAll(include, where)
    },
  }
  return resolvers
})
