// yeah.. the sequelize types are really bad...
export type DataTypes =
  | DataTypeAbstract
  | DataTypeArray
  | DataTypeBigInt
  | DataTypeBlob
  | DataTypeBoolean
  | DataTypeChar
  | DataTypeDate
  | DataTypeDateOnly
  | DataTypeDecimal
  | DataTypeDouble
  | DataTypeEnum
  | DataTypeFloat
  | DataTypeGeometry
  | DataTypeHStore
  | DataTypeInteger
  | DataTypeJSONB
  | DataTypeJSONType
  | DataTypeMediumInt
  | DataTypeNow
  | DataTypeNumber
  | DataTypeRange
  | DataTypeReal
  | DataTypeSmallInt
  | DataTypeString
  | DataTypeText
  | DataTypeTime
  | DataTypeTinyInt
  | DataTypeUUID
  | DataTypeUUIDv1
  | DataTypeUUIDv4
  | DataTypeVirtual

export interface DataTypeAbstract {
  dialectTypes: string
  toSql: () => string
  stringify: () => string
  key: string
}
export interface DataTypeAbstractString extends DataTypeAbstract {
  options: { binary: boolean; length: number }
  _binary: boolean
  _length: number
}
export interface DataTypeBasicAbstract extends DataTypeAbstract {
  key: 'ABSTRACT'
}
export interface DataTypeString extends DataTypeAbstractString {
  key: 'STRING'
}
export interface DataTypeChar extends DataTypeAbstractString {
  key: 'CHAR'
}
export interface DataTypeText extends DataTypeAbstractString {
  key: 'TEXT'
  _binary: never
  validate: (value: string) => boolean
}
export interface DataTypeAbstractNumberOptions {
  length: number
  zerofill: boolean
  decimals: number
  precision: number
  scale: number
  unsigned: boolean
}
export interface DataTypeAbstractNumber extends DataTypeAbstract {
  options: DataTypeAbstractNumberOptions
  _length: number
  _zerofill: boolean
  _decimals: number
  _precision: number
  _scale: number
  _unsigned: boolean
}
export interface DataTypeNumber extends DataTypeAbstractNumber {
  key: 'NUMBER'
}
export interface DataTypeTinyInt extends DataTypeAbstractNumber {
  key: 'TINYINT'
}
export interface DataTypeSmallInt extends DataTypeAbstractNumber {
  key: 'SMALLINT'
}
export interface DataTypeMediumInt extends DataTypeAbstractNumber {
  key: 'MEDIUMINT'
}
export interface DataTypeInteger extends DataTypeAbstractNumber {
  key: 'INTEGER'
}
export interface DataTypeBigInt extends DataTypeAbstractNumber {
  key: 'BIGINT'
}
export interface DataTypeFloat extends DataTypeAbstractNumber {
  key: 'FLOAT'
}
export interface DataTypeTime extends DataTypeAbstract {
  key: 'TIME'
}
export interface DataTypeDate extends DataTypeAbstract {
  key: 'DATE'
}
export interface DataTypeDateOnly extends DataTypeAbstract {
  key: 'DATEONLY'
}
export interface DataTypeBoolean extends DataTypeAbstract {
  key: 'BOOLEAN'
}
export interface DataTypeNow extends DataTypeAbstract {
  key: 'NOW'
}
export interface DataTypeBlob extends DataTypeAbstract {
  key: 'BLOB'
}
export interface DataTypeDecimal extends DataTypeAbstract {
  key: 'DECIMAL'
}
export interface DataTypeDecimal extends DataTypeAbstract {
  key: 'DECIMAL'
}
export interface DataTypeUUID extends DataTypeAbstract {
  key: 'UUID'
}
export interface DataTypeUUIDv1 extends DataTypeAbstract {
  key: 'UUIDV1'
}
export interface DataTypeUUIDv4 extends DataTypeAbstract {
  key: 'UUIDV4'
}
export interface DataTypeHStore extends DataTypeAbstract {
  key: 'HSTORE'
}
export interface DataTypeJSONType extends DataTypeAbstract {
  key: 'JSONTYPE'
}
export interface DataTypeJSONB extends DataTypeAbstract {
  key: 'JSONB'
}
export interface DataTypeVirtual extends DataTypeAbstract {
  key: 'VIRTUAL'
}
export interface DataTypeArray<DataType = DataTypeAbstract> extends DataTypeAbstract {
  key: 'ARRAY'
  type: DataType
}
export interface DataTypeVirtual<ReturnType = DataTypeAbstract> extends DataTypeAbstract {
  key: 'VIRTUAL'
  returnType: ReturnType
  fields: Record<string, DataTypeAbstract>
}
export interface DataTypeEnum extends DataTypeAbstract {
  key: 'ENUM'
  values: string[]
  validate: (value: any) => boolean
}

export type RangeSubTypes = 'integer' | 'bigint' | 'decimal' | 'dateonly' | 'date' | 'datenotz'
export interface DataTypeRange<DataType extends RangeSubTypes = 'integer'> extends DataTypeAbstract {
  key: 'RANGE'
  _subtype: DataType
  options: { subtype: DataType }
}
export interface DataTypeReal extends DataTypeAbstract {
  key: 'REAL'
}
export interface DataTypeDouble extends DataTypeAbstract {
  key: 'DOUBLE'
}
export interface DataTypeDouble extends DataTypeAbstract {
  key: 'DOUBLE'
}
export interface DataTypeGeometry extends DataTypeAbstract {
  key: 'GEOMETRY'
}
/*
  // this is not possible:
  const DataTypeConstructors: any = DataTypes
*/

// need to do this instead
// tslint:disable-next-line:no-duplicate-imports
import * as Sequelize from 'sequelize'
const DataTypeConstructors = (Sequelize as any).DataTypes

export const isAbstract = (type: any): type is DataTypeAbstract => type instanceof DataTypeConstructors.ABSTRACT
export const isArray = (type: any): type is DataTypeArray => type instanceof DataTypeConstructors.ARRAY
export const isBigInt = (type: any): type is DataTypeBigInt => type instanceof DataTypeConstructors.BIGINT
export const isBlob = (type: any): type is DataTypeBlob => type instanceof DataTypeConstructors.BLOB
export const isBoolean = (type: any): type is DataTypeBoolean => type instanceof DataTypeConstructors.BOOLEAN
export const isChar = (type: any): type is DataTypeChar => type instanceof DataTypeConstructors.CHAR
export const isDate = (type: any): type is DataTypeDate => type instanceof DataTypeConstructors.DATE
export const isDateOnly = (type: any): type is DataTypeDateOnly => type instanceof DataTypeConstructors.DATEONLY
export const isDecimal = (type: any): type is DataTypeDecimal => type instanceof DataTypeConstructors.DECIMAL
export const isDouble = (type: any): type is DataTypeDouble => type instanceof DataTypeConstructors.DOUBLE
export const isDoublePrecision = (type: any): type is DataTypeDouble => type instanceof DataTypeConstructors.DOUBLE
export const isEnum = (type: any): type is DataTypeEnum => type instanceof DataTypeConstructors.ENUM
export const isFloat = (type: any): type is DataTypeFloat => type instanceof DataTypeConstructors.FLOAT
export const isGeometry = (type: any): type is DataTypeGeometry => type instanceof DataTypeConstructors.GEOMETRY
export const isHstore = (type: any): type is DataTypeHStore => type instanceof DataTypeConstructors.HSTORE
export const isInteger = (type: any): type is DataTypeInteger => type instanceof DataTypeConstructors.INTEGER
export const isJson = (type: any): type is DataTypeJSONType => type instanceof DataTypeConstructors.JSON
export const isJsonb = (type: any): type is DataTypeJSONB => type instanceof DataTypeConstructors.JSONB
export const isMediumInt = (type: any): type is DataTypeMediumInt => type instanceof DataTypeConstructors.MEDIUMINT
export const isNone = (type: any): type is DataTypeVirtual => type instanceof DataTypeConstructors.NONE
export const isNow = (type: any): type is DataTypeNow => type instanceof DataTypeConstructors.NOW
export const isNumber = (type: any): type is DataTypeNumber => type instanceof DataTypeConstructors.NUMBER
export const isNumeric = (type: any): type is DataTypeDecimal => type instanceof DataTypeConstructors.NUMERIC
export const isRange = (type: any): type is DataTypeRange => type instanceof DataTypeConstructors.RANGE
export const isReal = (type: any): type is DataTypeReal => type instanceof DataTypeConstructors.REAL
export const isSmallInt = (type: any): type is DataTypeSmallInt => type instanceof DataTypeConstructors.SMALLINT
export const isString = (type: any): type is DataTypeString => type instanceof DataTypeConstructors.STRING
export const isText = (type: any): type is DataTypeText => type instanceof DataTypeConstructors.TEXT
export const isTime = (type: any): type is DataTypeTime => type instanceof DataTypeConstructors.TIME
export const isTinyInt = (type: any): type is DataTypeTinyInt => type instanceof DataTypeConstructors.TINYINT
export const isUUID = (type: any): type is DataTypeUUID => type instanceof DataTypeConstructors.UUID
export const isUUIDv1 = (type: any): type is DataTypeUUIDv1 => type instanceof DataTypeConstructors.UUIDV1
export const isUUIDv4 = (type: any): type is DataTypeUUIDv4 => type instanceof DataTypeConstructors.UUIDV4
export const isVirtual = (type: any): type is DataTypeVirtual => type instanceof DataTypeConstructors.VIRTUAL

// merge a few guards into similar ones as GraphQL does not have such a fine grained type system

export type DataTypeAnyFloat = DataTypeFloat | DataTypeDouble | DataTypeReal

export type DataTypeAnyInteger =
  | DataTypeNumber
  | DataTypeTinyInt
  | DataTypeSmallInt
  | DataTypeMediumInt
  | DataTypeInteger

export type DataTypeAnyNumber = DataTypeAnyFloat | DataTypeAnyInteger

export type DataTypeAnyString =
  | DataTypeChar
  | DataTypeString
  | DataTypeText
  | DataTypeBigInt // need to be stored as string
  | DataTypeDecimal // need to be stored as string

export type DataTypeAnyDate = DataTypeDate | DataTypeDateOnly | DataTypeTime

export type DataTypeScalar = DataTypeAnyNumber | DataTypeAnyString | DataTypeAnyDate | DataTypeUUID | DataTypeBoolean

export const isFloatType = (type: any): type is DataTypeAnyFloat =>
  isFloat(type) || isDouble(type) || isDoublePrecision(type) || isReal(type)

export const isIntegerType = (type: any): type is DataTypeAnyInteger =>
  isNumber(type) || isTinyInt(type) || isSmallInt(type) || isMediumInt(type) || isInteger(type)

export const isNumericType = (type: any): type is DataTypeAnyNumber => isFloatType(type) || isIntegerType(type)

export const isStringType = (type: any): type is DataTypeAnyString =>
  isChar(type) ||
  isText(type) ||
  isString(type) ||
  isBigInt(type) || // these need to be stored as string
  isDecimal(type) // these need to be stored as string

export const isDateType = (type: any): type is DataTypeAnyDate => isDate(type) || isDateOnly(type) || isTime(type)

export const isScalarType = (type: any): type is DataTypeScalar =>
  isNumericType(type) || isStringType(type) || isDateType(type) || isUUID(type) || isBoolean(type)

export const guards = {
  isAbstract,
  isArray,
  isBigInt,
  isBlob,
  isBoolean,
  isChar,
  isDate,
  isDateOnly,
  isDateType,
  isDecimal,
  isDouble,
  isDoublePrecision,
  isEnum,
  isFloat,
  isFloatType,
  isGeometry,
  isHstore,
  isInteger,
  isIntegerType,
  isJson,
  isJsonb,
  isMediumInt,
  isNone,
  isNow,
  isNumber,
  isNumeric,
  isNumericType,
  isRange,
  isReal,
  isScalarType,
  isSmallInt,
  isString,
  isStringType,
  isText,
  isTime,
  isTinyInt,
  isUUID,
  isUUIDv1,
  isUUIDv4,
  isVirtual,
}
