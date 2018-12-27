import { AnyModel, createModelMapper, GeneratedModelMapper, Page } from '@raynode/graphql-connector'
import { capitalize } from 'inflection'
import * as Sequelize from 'sequelize'
import { applyParser, createEmptyFilter, ParsedFilter, parser } from './filter-parser'
import { DataTypes } from './type-guards'

// tslint:disable-next-line:no-duplicate-imports
import { AssociationOptions, DefineAttributeColumnOptions } from 'sequelize'
declare module 'sequelize' {
  interface DefineAttributeColumnOptions {
    // should this attribute be represented in the SDL and be handled by graphql-connector (default: true)
    visible?: boolean
    // should this attribute be in the update mutation (default: true)
    updateable?: boolean
    // should this attribute be in the create mutation (default: true)
    createable?: boolean
  }

  interface AssociationOptions {
    pagination?: boolean
  }
}
// somehow the sequelize types are really really bad!
export interface SequelizeAttributeReference {
  model: string
  key: string
}

// export interface SequelizeAttribute extends Sequelize.DefineAttributeColumnOptions {
//   // should this attribute be represented in the SDL and be handled by graphql-connector (default: true)
//   visible?: boolean
//   // should this attribute be in the update mutation (default: true)
//   updateable?: boolean
//   // should this attribute be in the create mutation (default: true)
//   createable?: boolean
//   // these are correct, but incompatible... these sequelize types...
//   type: DataTypes | Sequelize.DataTypeAbstract
// }

// export type SequelizeAttributes<Keys extends string = string> = Record<Keys, string | SequelizeAttribute>

export type SequelizeAssociationTypes = 'HasOne' | 'HasMany' | 'BelongsTo' | 'BelongsToMany'

export interface SequelizeAssociation extends AssociationOptions {
  accessors: Record<string, string>
  as: string
  associationType: SequelizeAssociationTypes
  foreignKey: string
  foreignKeyAttribute: string
  identifier: string
  identifierField: string
  isSingleAssociation: boolean
  otherKey: string
  source: SequelizeModel
  target: SequelizeModel
  targetIdentifier: string
  targetKey: string
  targetKeyField: string
  targetKeyIsPrimary: string
  through?: { model: SequelizeModel, unique: boolean, scope: any }
}

export interface SequelizeModel extends Sequelize.Model<any, any> {
  rawAttributes: Record<string, DefineAttributeColumnOptions>
  associations: Record<string, SequelizeAssociation>
}

export interface Models {
  [x: string]: Sequelize.Model<any, any>
}

const createPage = (offset: number, limit: number, page: number): Page => ({
  offset, limit, page,
})

export const isListAssociation = (association: SequelizeAssociation) =>
  association.hasOwnProperty('isSingleAssociation') ? !association.isSingleAssociation :
    association.associationType === 'HasMany' || association.associationType === 'BelongsToMany'

export const modelMapper = createModelMapper<DataTypes, Models>((localModel, addAttribute, addAssociation) => {
  const model: SequelizeModel = localModel as any
  Object.keys(model.rawAttributes).forEach(name => {
    const attribute = model.rawAttributes[name]
    if(attribute.visible === false)
      return

    addAttribute({
      name,
      type: attribute.type as DataTypes,
      nonNull: attribute.allowNull === false || attribute.primaryKey === true,
      resolver: instance => instance[name],
    })
  })

  Object.keys(model.associations).forEach(name => {
    const association = model.associations[name]
    const list = isListAssociation(association)

    const targetKey = association.targetKey || association.foreignKey
    const through = association.through
    const attribute = association.target.rawAttributes[targetKey]
    const pagination = association.pagination

    const nonNull = !!list || !!through || attribute.allowNull

    addAssociation({
      name: association.as,
      model: association.target.name,
      list,
      nonNull,
      pagination,
      resolver: async (instance, args, context, info) => {
        // @TODO
        // this needs to correctly submit nodes and page when done!
        const res = await instance[association.accessors.get]()
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

  const findFromModel = (model: SequelizeModel, list: boolean, filter: ParsedFilter) => list
  ? model.findAll(filter)
  : model.findOne(filter)

  const getModelData = (association: SequelizeAssociation, data: any) =>
    findFromModel(association.target, isListAssociation(association), applyParser(association.target, data))

  const reduceUpdateData = async (data: any = {}) => {
    const results = {}
    await Promise.all(Object.keys(data).map(async name => {
      const association = model.associations[name]
      if(!model.associations.hasOwnProperty(name)) {
        results[name] = data[name]
        return
      }
      const modelData = await getModelData(association, data[name])
      if(!modelData)
        // tslint:disable-next-line:max-line-length
        throw new Error(`Could not find instances for ${name}, are you sure about request data: ${JSON.stringify(data[name])}`)
      const modelKey = association.otherKey || association.targetKey || association.foreignKey
      results[association.through ? name : association.identifierField] =
        association.through ? modelData.map(({ dataValues }) => dataValues[modelKey]) : modelData[modelKey]
    }))
    return results
  }

  const updateAssociations = (data: any, instances: any[]) =>
    Promise.all(Object.keys(model.associations).map(async name => {
      console.log('updating:', name, data)
      const association = model.associations[name]
      if(!data.hasOwnProperty(name))
        return
      const modelData = await getModelData(association, data[name])
      console.log('update assoc:', modelData)
      return Promise.all(instances.map(result => result[association.accessors.set](modelData)))
    }))

  const resolvers = {
    create: async (_, { data }) => {
      console.log(data)
      const updateData = await reduceUpdateData(data)
      const instance = await model.create(updateData)
      await updateAssociations(data, [instance])
      return instance
    },
    delete: async (_, { where: { where } }) => {
      const deletedItems = await model.findAll({ where })
      await model.destroy({ where })
      return deletedItems
    },
    findMany: async (_, { order, where: { where = {}, include = [] } = {} }) => findAll(include, where, order),
    findOne: async (_, { order, where: { where = {}, include = [] } = {} }) => model.findOne({ include, where, order }),
    update: async (_, { data, where: { where, include } }) => {
      await model.update(data, { where })
      const results = await model.findAll({ where })

      await Promise.all(Object.keys(model.associations).map(async name => {
        const association = model.associations[name]
        if(!data.hasOwnProperty(name))
          return
        const modelData = await getModelData(association, data[name])
        return Promise.all(results.map(result => result[association.accessors.set](modelData)))
      }))
      return results
    },
  }
  return resolvers
})
