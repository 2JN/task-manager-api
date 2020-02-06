const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Task = require('../models/task')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  }, age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) throw new Error('Age must be a positive number')
    }
  }, email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) throw new Error('Email is invalid')
    }
  }, password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (validator.contains(value.toLowerCase(), 'password')) throw new Error('The password must not contain password')
      if (!validator.isLength(value, { min: 6 })) throw new Error('The password is too short')
    }
  }, avatar: {
    type: Buffer
  }, tokens: [{
    token: {
      type: String,
      required: true,
    }
  }]
}, {
  timestamps: true,
})

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
})

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })

  if (!user) throw new Error('Unable to login')

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) throw new Error('Unable to login')

  return user
}

userSchema.methods.toJSON = function () {
  const user = this
  const userObj = user.toObject()

  delete userObj.password
  delete userObj.tokens
  delete userObj.avatar

  return userObj
}

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

  user.tokens = user.tokens.concat({ token })
  user.save()

  return token
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// delete user tasks when the user is removed

userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
