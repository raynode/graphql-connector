import * as Model from './model'
import { Models, Types } from './tests/utils'

const creator = Model.modelCreator<Types, Models>()

describe('model', () => {
  it('should create a model creator function', () => {
    expect(typeof creator).toEqual('function')
  })

  it('should return a model', () => {
    const sample = creator(
      'Sample',
      {
        text: {
          type: 'string',
        },
      },
      {
        something: {
          model: 'Other',
        },
      },
    )
    const other = creator('Other', {
      number: {
        type: 'int',
      },
    })
    expect(sample.attributes.text.type).toEqual('string')
    expect(other.attributes.number.type).toEqual('int')
    expect(sample.associations.something.model).toEqual('Other')
    expect(sample.associations.something.list).toEqual(false)
    expect(sample.associations.something.nonNull).toEqual(false)
  })
})
