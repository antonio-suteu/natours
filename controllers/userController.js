//const APIFeatures = require('../utils/apiFeatures');
const User = require('../models/userModel');
//const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
