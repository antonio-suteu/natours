const mongoose = require('mongoose');
const validator = require('validator');
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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
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
  },
  passwordChangedAt: Date
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

// instance methods are available on all documents of a certain collection
// #region Instance Methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword // we pass the userPassword because se have hidden the password field in the schema
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

///If user changed password AFTER TOKEN generation
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

//#endregion

const User = mongoose.model('User', userSchema);
module.exports = User;
