
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
  GraphQLType,
} from 'graphql'
import { applyFilterParser } from '@raynode/graphql-connector'
import { filterMapper } from './filter-mapper'
import { filterParser } from './filter-parser'

const parser = applyFilterParser(filterParser)({} as any)
const map = (name: string, type: GraphQLType) => filterMapper(name, type, GraphQLList(GraphQLNonNull(type)), false)
const expectFilterMapper = (name: string, type: GraphQLType) => expect(map(name, type)).toMatchSnapshot(name)
const expectFilterParser = (where: Record<string, any>) => {
  const val = parser('where', where)
  expect(val).toMatchSnapshot()
}

describe('filter', () => {
  describe('mapping', () => {
    it('should create all filter mappings for basic types', () => {
      expectFilterMapper('int', GraphQLInt)
      expectFilterMapper('float', GraphQLFloat)
      expectFilterMapper('string', GraphQLString)
      expectFilterMapper('boolean', GraphQLBoolean)
      expectFilterMapper('id', GraphQLID)
    })
  })

  describe('parsing', () => {
    it('should parse correctly', () => {
      // should handle two together
      expectFilterParser({
        int_gt: 1,
        int_lt: 10,
      })
      // equality filter
      expectFilterParser({
        int: 4,
      })
      // all ID filters
      expectFilterParser({ id_in: [1, 2, 3] })
      expectFilterParser({ id: 'test' })
      // all string filters
      expectFilterParser({ string: 'test' })
      expectFilterParser({ string_in: ['a', 'b'] })
      expectFilterParser({ string_like: ['at'] }) // matches 'bat' and 'atmosphere'
      expectFilterParser({ string_startsWith: ['at'] }) // matches 'atmosphere'
      expectFilterParser({ string_endsWith: ['at'] }) // matches 'bat'
      // all boolean filters
      expectFilterParser({ boolean: true }) // matches 'bat'

      expectFilterParser({ not: {
        int_gt: 1,
        int_lt: 10,
      }})

      expectFilterParser({ and: [{ int_gt: 1 },  { int_lt: 10 }]})
      expectFilterParser({ or: [{ int_gt: 1 },  { int_lt: 10 }]})

      console.log('shift')
      console.log('shift')
      console.log('shift')
    })
  })
})
