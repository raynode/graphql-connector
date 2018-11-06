import {
  BooleanValueNode,
  EnumValueNode,
  FloatValueNode,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLString,
  IntValueNode,
  ListValueNode,
  ObjectValueNode,
  StringValueNode,
  VariableNode,
} from 'graphql'
import { Kind } from 'graphql/language'
import { property } from 'lodash'

const astToJson = {
  [Kind.INT]: (ast: IntValueNode) => GraphQLInt.parseLiteral(ast),
  [Kind.FLOAT]: (ast: FloatValueNode) => GraphQLFloat.parseLiteral(ast),
  [Kind.BOOLEAN]: (ast: BooleanValueNode) => GraphQLBoolean.parseLiteral(ast),
  [Kind.STRING]: (ast: StringValueNode) => GraphQLString.parseLiteral(ast),
  [Kind.ENUM]: (ast: EnumValueNode) => String(ast.value),
  [Kind.LIST]: (ast: ListValueNode) => ast.values.map(astItem => JSONType.parseLiteral(astItem)),
  [Kind.OBJECT]: (ast: ObjectValueNode) => {
    const obj = {}
    ast.fields.forEach(field => {
      obj[field.name.value] = JSONType.parseLiteral(field.value)
    })
    return obj
  },
  [Kind.VARIABLE]: (ast: VariableNode) => {
    /*
    this way converted query variables would be easily
    converted to actual values in the resolver.js by just
    passing the query variables object in to function below.
    We can`t convert them just in here because query variables
    are not accessible from GraphQLScalarType's parseLiteral method
    */
    return property(ast.name.value)
  },
}

export const JSONType = new GraphQLScalarType({
  name: 'SequelizeJSON',
  description: 'The `JSON` scalar type represents raw JSON as values.',
  serialize: value => value,
  parseValue: value => (typeof value === 'string' ? JSON.parse(value) : value),
  parseLiteral: ast => {
    const parser = astToJson[ast.kind]
    return parser ? parser(ast) : null
  },
})
