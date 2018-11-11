import { Database, models } from './my-models'

const { Comment, Post, User } = models

export const setupDatabase = () => {
  Database.reset()

  const userGeorg = User.create({
    name: 'Georg',
    email: 'georg@example.com',
    password: 'georg-is-good',
    group: 'member',
  })

  const userPaul = User.create({
    name: 'Paul',
    email: 'paul@example.com',
    password: 'pauls-password',
    group: 'admin',
  })

  const postFirst = Post.create({
    text: 'This is a good time to be alive, this is our new Blog. Clean code to the max!',
    title: 'Welcome to the new Blog!',
    upvotes: 17,
    userId: userPaul.get('id'),
  })

  const postSecond = Post.create({
    text: 'I think that is a fair question, GraphQL sometimes feels very alien to people.',
    title: 'Was alien technology involved?',
    upvotes: 4,
    userId: userGeorg.get('id'),
  })

  const comment = Comment.create({
    msg: 'I believe!',
    commentor: userGeorg.get('id'),
    post: postSecond.get('id'),
  })
}
