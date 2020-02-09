const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const User = require('../models/user')
const auth = require('../middleware/auth')
const {
  sendWelcomeEmail,
  sendCancellationEmail,
} = require('../emails/account')

const router = express.Router()
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|)$/))
      return cb(new Error('Please upload an image'))

    cb(undefined, true)
  }
})

router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    savedUser = await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()

    res.status(201).send({
      user: savedUser,
      token,
    })
  } catch(err) {
    res.status(400).send(err)
  }
})

router.post('/users/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await User.findByCredentials(email, password)
    const token = await user.generateAuthToken()

    res.send({ user, token })
  } catch(err) {
    res.status(400).send(err)
  }
})

router.post('/users/logout', auth,  async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(({token}) => token !== req.token)
    await req.user.save()

    res.send()
  } catch(err) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()

    res.send()
  } catch(err) {
    res.status(500).send()
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

router.get('/users/:_id', async (req, res) => {
  const { _id } = req.params

  try {
    const user = await User.findById(_id)
    if (!user) return res.status(404).send()

    res.send(user)
  } catch(err) {
    res.status(500).send(err)
  }
})

router.patch('/users/me', auth, async (req, res) => {
  const { body, user } = req
  const updates = Object.keys(body)
  const allowedUpdates = [
    'name',
    'age',
    'email',
    'password',
  ]
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

  if (!isValidOperation) return res.status(400).send({
    error: 'Invalid updates!'
  })

  try {
    updates.forEach((update) => user[update] = body[update])
    await user.save()

    res.send(user)
  } catch(err) {
    res.status(500).send(err)
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    const user = await req.user.remove()
    sendCancellationEmail(user.email, user.name)
    res.send(req.user)
  } catch(err) {
    res.status(500).send()
  }
})

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(
      req.file.buffer
    ).resize({
      width: 250,
      height: 250,
    }).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()

    res.send()
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message })
  }
)

router.get('/users/:_id/avatar', async (req, res) => {
  const { _id } = req.params

  try {
    const user = await User.findById(_id)

    if (!user || !user.avatar) throw new Error()

    res.set('Content-Type', 'image/png').send(user.avatar)
  } catch(err) {
    console.log(err)
    res.status(404).send()
  }
})

router.delete(
  '/users/me/avatar',
  auth,
  async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
  }
)

module.exports = router
