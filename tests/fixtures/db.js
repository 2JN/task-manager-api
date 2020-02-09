const jwt = require('jsonwebtoken')
const mongoose =  require('mongoose')

const User = require('../../src/models/user')
const Task = require('../../src/models/task')

const user1Id = new mongoose.Types.ObjectId()
const user1 = {
  _id: user1Id,
  name: 'Mike',
  email: 'mike@example.com',
  password: 'Secret1!',
  tokens: [{
    token: jwt.sign({ _id: user1Id }, process.env.JWT_SECRET)
  }]
}

const user2Id = new mongoose.Types.ObjectId()
const user2 = {
  _id: user2Id,
  name: 'Jona',
  email: 'jona@example.com',
  password: 'Secret2?',
  tokens: [{
    token: jwt.sign({ _id: user2Id }, process.env.JWT_SECRET)
  }]
}

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: 'First task',
  completed: false,
  owner: user1Id
}

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Second task',
  completed: true,
  owner: user1Id
}

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: 'Third task',
  completed: true,
  owner: user2Id
}

const setupDataBase = async () => {
  await User.deleteMany()
  await Task.deleteMany()
  await User.create(user1)
  await User.create(user2)
  await Task.create(taskOne)
  await Task.create(taskTwo)
  await Task.create(taskThree)
}

module.exports = {
  user1,
  user1Id,
  user2,
  user2Id,
  taskOne,
  taskTwo,
  taskThree,
  setupDataBase,
}
