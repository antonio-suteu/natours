const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: { type: Number, select: false },
  // failedLoginAttempts: {
  //   type: Number,
  //   default: 0,
  //   select: false //hide the failedLoginAttempts field to the client
  // },
  lockUntil: { type: Date, select: false }
  // active: {
  //   type: Boolean,
  //   default: true,
  //   select: false //hide the active field to the client
  // }
});

// #region Middlewares
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

userSchema.pre('save', function (next) {
  // if password has not been modified or the document is new, call the next middleware function
  if (!this.isModified('password') || this.isNew) return next();

  // subtract one second to insure that the token is created AFTER the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// 2. QUERY MIDDLEWARE: runs before the query gets executed
// /^find/ is a regex that matches the strings that start with 'find'
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });

// #endregion

// instance methods are available on all documents of a certain collection
// #region Instance Methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword // we pass the userPassword because se have hidden the password field in the schema
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// If user changed password AFTER TOKEN generation
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

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.getFailedLoginAttempts = function () {
  if (!this.failedLoginAttempts) return 0;
  return this.failedLoginAttempts;
};

//#endregion

const User = mongoose.model('User', userSchema);
module.exports = User;
