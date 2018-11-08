import * as Sequelize from 'sequelize'
import { modelMapper } from './model-mapper'

const sequelize = new Sequelize({
  dialect: 'sqlite',
})

export const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    comment: 'Id of the user',
    defaultValue: Sequelize.fn('gen_random_uuid'),
  },
  state: {
    type: Sequelize.ENUM('admin', 'member', 'guest'),
    defaultValue: 'guest',
  },
  nickname: { type: Sequelize.STRING, allowNull: true },
  name: { type: Sequelize.STRING, allowNull: false },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    set(val) {
      this.setDataValue('email', val.toLowerCase())
    },
  },
})

export const Loop = sequelize.define('Loop', {
  id: {
    type: Sequelize.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true,
    comment: 'Id of the user',
    defaultValue: Sequelize.fn('gen_random_uuid'),
  },
})
Loop.hasOne(Loop, {
  as: 'next',
})

describe('model-mapper', () => {
  it('should find all attributes from a model', () => {
    const result = modelMapper('User', User)
    expect(result.attributes).toHaveProperty('id')
    expect(result.attributes).toHaveProperty('state')
    expect(result.attributes).toHaveProperty('nickname')
    expect(result.attributes).toHaveProperty('name')
    expect(result.attributes).toHaveProperty('email')
    expect(result.attributes).toHaveProperty('createdAt')
    expect(result.attributes).toHaveProperty('updatedAt')
    expect(Object.keys(result.attributes)).toHaveLength(7)
  })

  it('should find the attributes of a Loop', () => {
    const result = modelMapper('Loop', Loop)
    expect(result.attributes).toHaveProperty('id')
    expect(result.attributes).toHaveProperty('createdAt')
    expect(result.attributes).toHaveProperty('updatedAt')
  })

  it('should find the association of a Loop', () => {
    const result = modelMapper('Loop', Loop)
    expect(result.associations).toHaveProperty('next')
  })
})
