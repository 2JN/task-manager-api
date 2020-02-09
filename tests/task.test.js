const request = require('supertest')

const app = require('../src/app')
const Task = require('../src/models/task')
const {
  user1,
  user2,
  taskOne,
  taskTwo,
  setupDataBase,
} = require('./fixtures/db')

beforeEach(setupDataBase)

test('Should create task for user', async () => {
  const res = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send({
      description: 'test my server'
    })
    .expect(201)

  const task = await Task.findById(res.body._id)
  expect(task).not.toBeNull()
  expect(task.completed).toBe(false)
})

test('Should get a user\'s tasks', async () => {
  const res = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  expect(res.body.length).toBe(2)
})

test('Should fetch only completed tasks', async () => {
  const res = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  expect(res.body.length).toBe(1)
})

test('Should fetch only incompleted tasks', async () => {
  const res = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  expect(res.body.length).toBe(1)
})

test('Should sort tasks by description', async () => {
  const res = await request(app)
    .get('/tasks?sortBy=description:desc')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  const firstTask = taskTwo._id.equals(res.body[0]._id)
  const secondTask = taskOne._id.equals(res.body[1]._id)
  expect(firstTask).toBe(true)
  expect(secondTask).toBe(true)
})

test('Should fetch page of tasks', async () => {
  const res = await request(app)
    .get('/tasks?limit=1')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  expect(res.body.length).toBe(1)
})

test('Should delete users task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  const task = await Task.findById(taskOne._id)
  expect(task).toBeNull()
})

test('Should not delete task if unauthenticated', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)

  const task = await Task.findById(taskOne._id)
  expect(task).not.toBeNull()
})

test('Should not delete a non user\'s task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${user2.tokens[0].token}`)
    .send()
    .expect(404)

  const task = await Task.findById(taskOne._id)
  expect(task).not.toBeNull()
})
