import { capitalize, pluralize, singularize } from 'inflection'

export interface Names {
  fields: Record<'create' | 'delete' | 'findMany' | 'findOne' | 'update', string>
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
})
