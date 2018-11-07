import { Attribute } from '@raynode/graphql-connector'
import { GraphQLString, isType } from 'graphql'
import { DataTypeConstructors, DataTypes } from './type-guards'
import { typeMapper } from './type-mapper'

const Constructors = {
  ABSTRACT: DataTypeConstructors.ABSTRACT,
  ARRAY: DataTypeConstructors.ARRAY,
  BIGINT: DataTypeConstructors.BIGINT,
  BLOB: DataTypeConstructors.BLOB,
  BOOLEAN: DataTypeConstructors.BOOLEAN,
  CHAR: DataTypeConstructors.CHAR,
  DATE: DataTypeConstructors.DATE,
  DATEONLY: DataTypeConstructors.DATEONLY,
  DECIMAL: DataTypeConstructors.DECIMAL,
  DOUBLE: DataTypeConstructors.DOUBLE,
  ENUM: DataTypeConstructors.ENUM,
  FLOAT: DataTypeConstructors.FLOAT,
  GEOMETRY: DataTypeConstructors.GEOMETRY,
  HSTORE: DataTypeConstructors.HSTORE,
  INTEGER: DataTypeConstructors.INTEGER,
  JSON: DataTypeConstructors.JSON,
  JSONB: DataTypeConstructors.JSONB,
  MEDIUMINT: DataTypeConstructors.MEDIUMINT,
  NONE: DataTypeConstructors.NONE,
  NOW: DataTypeConstructors.NOW,
  NUMBER: DataTypeConstructors.NUMBER,
  NUMERIC: DataTypeConstructors.NUMERIC,
  RANGE: DataTypeConstructors.RANGE,
  REAL: DataTypeConstructors.REAL,
  SMALLINT: DataTypeConstructors.SMALLINT,
  STRING: DataTypeConstructors.STRING,
  TEXT: DataTypeConstructors.TEXT,
  TIME: DataTypeConstructors.TIME,
  TINYINT: DataTypeConstructors.TINYINT,
  UUID: DataTypeConstructors.UUID,
  UUIDV1: DataTypeConstructors.UUIDV1,
  UUIDV4: DataTypeConstructors.UUIDV4,
  VIRTUAL: DataTypeConstructors.VIRTUAL,
}

const validConstructors = [
  'BIGINT',
  'BLOB',
  'BOOLEAN',
  'CHAR',
  'DATE',
  'DATEONLY',
  'DECIMAL',
  'DOUBLE',
  'FLOAT',
  'INTEGER',
  'JSON',
  'JSONB',
  'MEDIUMINT',
  'NONE',
  'NOW',
  'NUMERIC',
  'RANGE',
  'REAL',
  'SMALLINT',
  'STRING',
  'TEXT',
  'TIME',
  'TINYINT',
  'UUID',
  'UUIDV1',
  'UUIDV4',
  'VIRTUAL',
]

const invalidConstructors = ['ABSTRACT', 'GEOMETRY', 'HSTORE']

const specialConstructors: Array<[string, any[], any | null, string]> = [
  ['ARRAY', [{ type: new Constructors.STRING() }], null, '[String!]'],
  ['ENUM', [{ values: ['a', 'b'] }], { name: 'SampleModel' }, 'SampleModelSampleEnumType'],
  ['NUMBER', [{ length: 1 }], null, 'Int'],
]

describe('type-mapper', () => {
  validConstructors.forEach(name => {
    it(`should handle ${name}`, () => {
      const Constructor = Constructors[name]
      const attr: Attribute<DataTypes> = {
        fieldType: 'Attribute',
        list: false,
        name: 'Sample',
        nonNull: false,
        type: new Constructor(),
      }
      expect(isType(typeMapper(attr, null))).toBe(true)
    })
  })

  invalidConstructors.forEach(name => {
    it(`should not handle ${name}`, () => {
      const Constructor = Constructors[name]
      const attr: Attribute<DataTypes> = {
        fieldType: 'Attribute',
        list: false,
        name: 'Sample',
        nonNull: false,
        type: new Constructor(),
      }
      expect(() => typeMapper(attr, null)).toThrow()
    })
  })

  specialConstructors.forEach(([name, args, model, result]) => {
    it(`should handle ${name}`, () => {
      const Constructor = Constructors[name]
      const attr: Attribute<DataTypes> = {
        fieldType: 'Attribute',
        list: false,
        name: 'Sample',
        nonNull: false,
        type: new Constructor(...args),
      }
      const type = typeMapper(attr, model)
      expect(isType(type)).toBe(true)
      expect(type.toString()).toEqual(result)
    })
  })
})
