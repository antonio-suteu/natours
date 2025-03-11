const mongoose = require('mongoose');
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name']
  },
  email: {
    type: String,
    required: [true, 'User must have an email'],
    unique: true,
    lowercase: true, //transform the email to lowerCase
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: 8,
    select: false //hide the password field to the client
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User must confirm password'],
    validate: {
      validator: function (val) {
        // only works on new document (not update)
        return val === this.password;
      },
      message: 'Passwords are not the same!'
    }
  }
});

// password encryption
userSchema.pre('save', async function (next) {
  // if password has not been modified, call the next middleware function
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // remove passwordConfirm field from the document
  this.passwordConfirm = undefined;

  next();
});

// instance method is available on all documents of a certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword // we pass the userPassword because se have hidden the password field in the schema
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
