
import { applyFilterParser } from '@raynode/graphql-connector'
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
import { filterMapper } from './filter-mapper'
import { filterParser } from './filter-parser'

const parser = applyFilterParser(filterParser)({
  source: {
    associations: {
      Model: {
        as: 'm',
        target: { name: 'Model' },
      },
    },
  },
} as any)
const map = (name: string, type: GraphQLType) => filterMapper(name, type, GraphQLList(GraphQLNonNull(type)), false)
const expectFilterMapper = (name: string, type: GraphQLType) => expect(map(name, type)).toMatchSnapshot(name)
const expectFilterParser = (where: Record<string, any>) => expect(parser('where', where)).toMatchSnapshot()

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

      expectFilterParser({ AND: [{ int_gt: 1 },  { int_lt: 10 }]})
      expectFilterParser({ OR: [{ int_gt: 1 },  { int_lt: 10 }]})

      expectFilterParser({ NOT: {
        int_gt: 1,
        int_lt: 10,
      }})

      expectFilterParser({
        Model_some: { id: 1 },
      })

      expectFilterParser({
        Model_some: { NOT: { id: 1 }},
      })

      expectFilterParser({ NOT: {
        Model_some: { id: 1 },
      }})
    })
  })
})
