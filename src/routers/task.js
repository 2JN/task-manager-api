const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  })

  try {
    const savedTask = await task.save()
    res.status(201).send(savedTask)
  } catch(err) {
    res.status(500).send(err)
  }
})

/**
 * Returns a list of the tasks from a user
 * @param {boolean} [completed] - marks if the task is completed
 * @param {number} [limit] - sets the pagination limit
 * @param {number} [skip] - indicates how many documents to skip
 * @param {string} [sortBy] - sorts results by specified field:value
 */
router.get('/tasks', auth, async (req, res) => {
  const {query: {
    completed,
    limit = 10,
    skip = 0,
    sortBy,
  }} = req

  const match = {}
  const sort = {}

  if (completed) match.completed =  completed === 'true'
  if (sortBy) {
    const parts = sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc'
      ? -1
      : 1
  }

  const options = {
    limit: parseInt(limit),
    skip: parseInt(skip),
    sort
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options,
    }).execPopulate()
    res.send(req.user.tasks)
  } catch(err) {
    res.status(500).send(err)
  }
})

router.get('/tasks/:_id', auth, async (req, res) => {
  const { _id } = req.params

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) return res.status(404).send()

    res.send(task)
  } catch(err) {
    res.status(500).send(err)
  }
})

router.patch('/tasks/:_id', auth, async (req, res) => {
  const { params: { _id }, body } = req
  const updates = Object.keys(body)
  const allowedUpdates = [
    'description',
    'completed',
  ]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
  if (!isValidOperation) return res.status(400).send({
    error: 'Invalid updates!'
  })

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })

    if (!task) return res.status(404).send()

    updates.forEach(update => task[update] = body[update])
    await task.save()

    res.send(task)
  } catch(err) {
    res.status(500).send(err)
  }
})

router.delete('/tasks/:_id', auth, async (req, res) => {
  const { _id } = req.params

  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

    if (!task) return res.status(404).send()

    res.send(task)
  } catch(err) {
    res.status(500).send()
  }
})

module.exports = router
