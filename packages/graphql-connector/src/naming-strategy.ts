import { capitalize, pluralize, singularize } from 'inflection'

export interface Names {
  fields: Record<'create' | 'delete' | 'findMany' | 'findOne' | 'update', string>
  arguments: Record<'data' | 'order' | 'page' | 'where', string>
  types: Record<'createType' | 'dataType' | 'orderType' | 'whereType', string>
}
export type NamingStrategy<Models = any> = (name: keyof Models) => Names

export const defaultNamingStrategy: NamingStrategy = name => ({
  fields: {
    create: `create${singularize(name.toString())}`,
    delete: `delete${pluralize(name.toString())}`,
    findMany: `${pluralize(name.toString())}`,
    findOne: `${singularize(name.toString())}`,
    update: `update${singularize(name.toString())}`,
  },
  arguments: {
    data: 'data',
    order: 'order',
    page: 'page',
    where: 'where',
  },
  types: {
    createType: `Create${singularize(name.toString())}Data`,
    dataType: `Update${singularize(name.toString())}Data`,
    orderType: `${singularize(name.toString())}SortOrder`,
    whereType: `${singularize(name.toString())}Filter`,
  },
})
