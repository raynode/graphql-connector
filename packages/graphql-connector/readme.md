
Graphql Connector
=================

This library is designed to easily connect a existing database system to the graphql ecosystem.
It takes the types and models of the source system and maps them to GraphQL.

Usage
-----

The connector needs to know 2 things to work:
* a ModelMapper to convert a Model from the source system into the GraphQL Connector Model-Type
* a TypeMapper to convert a Datatype of the source system into a GraphQLType

To see it in action you can look at the code for this example in the [tests](https://github.com/raynode/graphql-connector/blob/master/src/tests/example.spec.ts).
This code will be kept up to date and be used as a test

@TODO: subscriptions are not in yet

First step, define a graphql-connector model mapper
```Typescript
import {
  createModelMapper,
} from 'graphql-connector'

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
```

Next step is to create a type mapper to convert our my-types into GraphQLType
```Typescript
import { TypeMapper } from 'graphql-connector'
// this function tells the generator how to convert my-type into a GraphQLType
const typeMapper: TypeMapper<Types, Models> = ({ type }) => {
  if (type instanceof myTypes.DBIDType) return GraphQLID
  if (type instanceof myTypes.DBDateType) return DateType
  if (type instanceof myTypes.DBIntType) return GraphQLInt
  if (type instanceof myTypes.DBStringType) return GraphQLString
  throw new Error('invalid type: ' + typeof type)
}
```

The last step is to input the typeMapper and the modelMapper into the createBaseSchema function and use the result to generate a BaseSchema
```Typescript
// Generate a baseSchemaGenerator by providing the modelMapper and typeMapper
// here we could change other things, like the nameingStrategy
const baseSchemaGenerator = createBaseSchemaGenerator({
  modelMapper,
  typeMapper,
})

// apply all my-models to the generator
// the baseSchema will have all queryFields, mutationsFields and subscriptionFields
const baseSchema = baseSchemaGenerator(myModels)
```

Now we have generated all required queryFields, mutationFields and subscriptionFields.
These now need to be converted to a GraphQLSchema, there is a utility function for it, but the step uses graphql code only.
```Typescript
// import { createSchema } from 'graphql-connector'
import {
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql'

export const createSchema = ({ queryFields, mutationFields }: BaseSchema) =>
  new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryFields,
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: mutationFields,
    }),
  })

const schema = createSchema(baseSchema)
```

This results in an SDL like:
```Graphql
type Comment implements Node {
  msg: String
  id: ID
  createdAt: Date
  lastUpdate: Date
  commentor: User
  Post: Post
}

type Comments implements List {
  nodes: [Comment!]!
  page: Page!
}

"""
A special custom Scalar type for Dates that converts to a ISO formatted string
"""
scalar Date

interface List {
  nodes: [Node!]!
  page: Page!
}

type Mutation {
  createUser: User
  updateUser: User
  deleteUsers: Users
  createPost: Post
  updatePost: Post
  deletePosts: Posts
  createComment: Comment
  updateComment: Comment
  deleteComments: Comments
}

interface Node {
  id: ID
}

type Page {
  limit: Int
  offset: Int
}

type Post implements Node {
  title: String
  text: String
  upvotes: Int
  id: ID
  createdAt: Date
  lastUpdate: Date
  author: User
  Comment: Comments
}

type Posts implements List {
  nodes: [Post!]!
  page: Page!
}

type Query {
  User: User
  Users: Users
  Post: Post
  Posts: Posts
  Comment: Comment
  Comments: Comments
}

type User implements Node {
  name: String
  email: String
  password: String
  id: ID
  createdAt: Date
  lastUpdate: Date
  Post: Posts
  Comment: Comments
}

type Users implements List {
  nodes: [User!]!
  page: Page!
}
```
