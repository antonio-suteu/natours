//const APIFeatures = require('../utils/apiFeatures');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
//const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

//#region Utils
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  allowedFields.forEach((field) => {
    if (obj[field]) newObj[field] = obj[field];
  });
  return newObj;
};
//#endregion

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet'
  });
};

exports.getAllUsers = catchAsync(async (req, res) => {
  // EXECUTE QUERY
  const users = await User.find();

  // SEND RESPONSE
  res
    .status(200)
    .send({ status: 'success', results: users.length, data: { users } });
});

// #region For the current user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create an error if the user tries to update the password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  // 2) Filter out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //this returns the updated object
    runValidators: true
  });

  // 4) Send updated user document
  res.status(200).send({ status: 'success', data: { user: updatedUser } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) Delete user document
  await User.findByIdAndDelete(req.user.id);
  //await User.findByIdAndUpdate(req.user.id, { active: false });

  // 2) Send a success message
  res.status(204).send({ status: 'success', data: null });
});
// #endregion

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet'
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet'
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not implemented yet'
  });
};
