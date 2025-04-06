const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// #region internal utils
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production', // only send cookie over https in production
    httpOnly: true
  };

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).send({ status: 'success', token, data: { user } });
};
// #endregion

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  // create JWT token
  createSendToken(newUser, 201, res);
});

// #region Authentication
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) check if user exists and password is correct
  // when we use select, using + indicates that we want
  // to include a previously hidden field to the schema
  const user = await User.findOne({ email }).select(
    '+password +failedLoginAttempts +lockUntil'
  );

  // If email is not in database
  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // If email is in database and password is wrong
  if (!(await user.correctPassword(password, user.password))) {
    // increment failed login attempt counter
    user.failedLoginAttempts = user.getFailedLoginAttempts() + 1;
    if (user.failedLoginAttempts > 3)
      user.lockUntil = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) Check if user is locked out
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(
      new AppError(
        'Your account is locked due to too many failed login attempts.',
        403
      )
    );
  }

  // 4) Reset failed login attempt counter
  user.failedLoginAttempts = undefined;
  await user.save({ validateBeforeSave: false });

  // 5) If everything is correct, generate token and send it to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401)
    );
  }

  // 2) Verification of the token (no alteration or expiration)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User has changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  // we pass data trough middlewares by using the 'req' and 'res' objects
  req.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isUserLoggedIn = catchAsync(async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    // 1) Verification of the token (no alteration or expiration)
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 2) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    // 3) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    // THERE IS A LOGGED IN USER
    // we make it accessible to our Pug template
    res.locals.user = currentUser;
  }
  next();
});
// #endregion

// #region Route Authorization middleware
// ...roles creates an array of the roles passed to the middleware
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
// #endregion

// #region Password Reset
// step 1
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // 2) Generate the random reset token (not jwt)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //this will deactivate all the validators in the schema

  // 3) Send it back as an email
  // we send the plain version of the token, NOT the encripted
  // version, which is saved to the database
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. 
  \nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Failed sending the reset password email. Try again later.',
        500
      )
    );
  }
});

// step 2
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Encrypt the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Look for a user with that encrypted token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Invalid token or token expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt for current user

  // 4) Log the user in (send JWT)
  createSendToken(user, 200, res);
});

// #endregion

// # region Change Password (Authenticated users only)
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  //add the password field to the select, since in the schema it's hidden by default
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  // 3) If it is, then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log the user in (send JWT)
  createSendToken(user, 200, res);
});
// # endregion
