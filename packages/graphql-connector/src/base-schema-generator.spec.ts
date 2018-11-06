import { BaseSchemaGenerator, createBaseSchemaGenerator } from 'base-schema-generator'
import { modelCreator, ModelCreator } from 'model'
import { basicTypeMapper, createSDL, Models, Types } from 'tests/utils'

const nonNull = true
const list = true

it('shoudl test', () => undefined)

// describe.skip('base-schema-generator', () => {
//   let creator: ModelCreator<Types, Models>
//   let generator: BaseSchemaGenerator<Types, Models>
//   beforeEach(() => {
//     creator = modelCreator<Types, Models>()
//     generator = createBaseSchemaGenerator({
//       typeMapper: basicTypeMapper,
//     })
//   })

//   it('should be a function, and generate a empty schema without any models', () => {
//     expect(typeof generator).toBe('function')
//     const baseSchema = generator([])
//     expect(typeof baseSchema).toBe('object')
//     expect(baseSchema).toHaveProperty('queryFields')
//     expect(baseSchema).toHaveProperty('mutationFields')
//     // expect(baseSchema).toHaveProperty('subscriptionFields')
//   })

//   it('should create the fields list in a model', () => {
//     const sampleModel = creator('Sample', {
//       number: { type: 'int', nonNull },
//       name: { type: 'string', list },
//     })
//     const otherModel = creator(
//       'Other',
//       {
//         value: { type: 'string', list, nonNull },
//       },
//       {
//         sample: { model: 'Sample', nonNull },
//         more: { model: 'Other', list },
//       },
//     )
//     const baseSchema = generator([sampleModel, otherModel])
//     console.log(createSDL(baseSchema))
//   })
// })
