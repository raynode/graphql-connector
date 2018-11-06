import { createBaseSchemaGenerator, createModelMapper, createSchema, TypeMapper } from '..'

import { models as myModels } from './my-models'
import * as myTypes from './my-types'

import { GraphQLID, GraphQLInt, GraphQLString, printSchema } from 'graphql'
import { DateType } from './graphql-date-type'

it('should handle the example code', async () => {
  // myModels is expected to be { user: DBUserModel, post: DBPostModel, comment: DBCommentModel }
  type Models = typeof myModels

  // myTypes is expected to be { DBIntType: any, DBStringType: any, ... }
  type Types = typeof myTypes

  // utility to check if some type is a list-type
  const isListType = (type: myTypes.DBType): type is myTypes.DBListType => type instanceof myTypes.DBListType

  // utility to resolve the final type of a type
  const getFinalType = (type: myTypes.DBType) => (isListType(type) ? type.subtype : type)

  // The modelMapper is responsible to convert a my-model into a graphql-connector model
  // a graphql-connector model needs attributes, associations
  // each association and attribute could be setup with an resolver here
  const modelMapper = createModelMapper<myTypes.DBType, Models>((model, addAttribute, addAssociation) => {
    // to convert a my-model into a graphql-connector model, we need to tell the system all attributes and associations
    Object.keys(model.attributes).forEach(name => {
      const attribute = model.attributes[name]
      const type = getFinalType(attribute)
      const list = isListType(attribute)
      if (name !== 'id' && type instanceof myTypes.DBIDType)
        return addAssociation({
          list,
          model: type.source as any,
          name,
        })
      return addAttribute({
        list,
        name,
        type,
      })
    })
  })

  // this function tells the generator how to convert my-type into a GraphQLType
  const typeMapper: TypeMapper<Types, Models> = ({ type }) => {
    if (type instanceof myTypes.DBIDType) return GraphQLID
    if (type instanceof myTypes.DBDateType) return DateType
    if (type instanceof myTypes.DBIntType) return GraphQLInt
    if (type instanceof myTypes.DBStringType) return GraphQLString
    throw new Error('invalid type: ' + typeof type)
  }

  // Generate a baseSchemaGenerator by providing the modelMapper and typeMapper
  // here we could change other things, like the nameingStrategy
  const baseSchemaGenerator = createBaseSchemaGenerator({
    modelMapper,
    typeMapper,
  })

  // apply all my-models to the generator
  // the baseSchema will have all queryFields, mutationsFields and subscriptionFields
  const baseSchema = baseSchemaGenerator(myModels)

  // this part is graphql only, not more graphql-connector
  const schema = printSchema(createSchema(baseSchema))

  expect(schema).toMatchSnapshot('Schema')
})
