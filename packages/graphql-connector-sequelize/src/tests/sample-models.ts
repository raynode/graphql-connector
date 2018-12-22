// tslint:disable:no-object-literal-type-assertion

import { pluralize } from 'inflection'
import * as Sequelize from 'sequelize'
import '../model-mapper'

const sequelize = new Sequelize({
  dialect: 'sqlite',
})

export let seed = 100
const random = () => ++seed
// tslint:disable:no-bitwise
export const uuidv4 = (id = random()) => `${id}`
// tslint:enable:no-bitwise

const id: Sequelize.DefineAttributeColumnOptions = {
  type: Sequelize.UUID,
  allowNull: false,
  primaryKey: true,
  unique: true,
  comment: 'Id of this object',
  defaultValue: () => uuidv4(),
}

export const User = sequelize.define('User', {
  id,
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
  },
})

export const Post = sequelize.define('Post', {
  id,
  title: { type: Sequelize.STRING, allowNull: false },
  UserId: { type: Sequelize.UUID, allowNull: false, visible: false },
})

export const Link = sequelize.define('Link', {
  id,
  title: { type: Sequelize.STRING, allowNull: false },
  url: { type: Sequelize.STRING, allowNull: false },
  UserId: { type: Sequelize.UUID, allowNull: true, visible: false },
})

export const Tag = sequelize.define('Tag', {
  id,
  tag: { type: Sequelize.STRING, allowNull: false },
})

export const TagLink = sequelize.define('TagLink', {
  table: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  foreign_key: {
    type: Sequelize.UUID,
    allowNull: false,
  },
}, {
  tableName: 'Tag_Link',
  timestamps: false,
})

TagLink.belongsTo(Tag, { foreignKey: 'id' })
Tag.hasMany(TagLink, { foreignKey: 'id', constraints: true })

User.hasMany(Post)
Post.belongsTo(User)
User.hasMany(Link, { as: 'bookmarks', foreignKey: 'UserId', sourceKey: 'id' })
Link.belongsTo(User, { as: 'user', foreignKey: 'UserId', targetKey: 'id', constraints: false })

export const models = { User, Link, Post, Tag }

Object.keys(models).forEach(model => {
  if (model === 'Tag' || model === 'Tag_Link') return
  const Model = models[model]
  Model.belongsToMany(Tag, {
    as: 'tags',
    foreignKey: 'foreign_key',
    constraints: false,
    through: {
      model: TagLink,
      unique: false,
      scope: { table: Model.name },
    },
  })

  Tag.belongsToMany(Model, {
    foreignKey: 'id',
    constraints: false,
    through: {
      model: TagLink,
      unique: false,
    },
  })
})

export const initialize = async () => {
  // tslint:disable:max-line-length
  // remove all tables
  await Promise.all(Object.keys(models).map(key => pluralize(key)).map(async table => sequelize.query(`DROP TABLE IF EXISTS ${table};`)))

  // create all tables
  await sequelize.sync()

  // add data for Users
  await sequelize.query(`
    INSERT INTO Users (
    id              ,state    ,nickname     ,name        ,email                  ,createdAt                       ,updatedAt
    ) VALUES
   ('${uuidv4(1)}'  ,'admin'  ,'Admin'      ,'Admin'     ,'admin@example.com'    ,'2018-11-09 16:00:00.000 +00:00','2018-11-09 16:00:00.000 +00:00'),
   ('${uuidv4(2)}'  ,'member' ,'Mr.G!'      ,'Georg'     ,'georg@example.com'    ,'2018-11-09 16:30:00.000 +00:00','2018-11-09 16:30:00.000 +00:00'),
   ('${uuidv4(3)}'  ,'guest'  ,'Paulchen'   ,'Paul'      ,'paul@example.com'     ,'2018-11-09 16:40:00.000 +00:00','2018-11-09 16:40:00.000 +00:00'),
   ('${uuidv4(4)}'  ,'member' ,'Effy'       ,'Frank'     ,'frank@example.com'    ,'2018-11-09 16:50:00.000 +00:00','2018-11-09 16:50:00.000 +00:00')
    ;
  `)

  // add data for Posts
  await sequelize.query(`
    INSERT INTO Posts (
    id               ,title                          ,userId         ,createdAt                       ,updatedAt
    ) VALUES
   ('${uuidv4(10)}'  ,'This is a Post by the Admin'  ,'${uuidv4(1)}' ,'2018-11-09 19:00:00.000 +00:00','2018-11-09 19:00:00.000 +00:00'),
   ('${uuidv4(11)}'  ,'This is by Paulchen'          ,'${uuidv4(3)}' ,'2018-11-09 19:30:00.000 +00:00','2018-11-09 19:30:00.000 +00:00')
    ;
  `)

  // add data for Tags
  await sequelize.query(`
    INSERT INTO Tags (
    id               ,tag          ,createdAt                       ,updatedAt
    ) VALUES
   ('${uuidv4(20)}'  ,'Nice Pages' ,'2018-11-09 19:00:00.000 +00:00','2018-11-09 19:00:00.000 +00:00')
    ;
  `)
}
// tslint:enable:max-line-length
