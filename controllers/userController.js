//const APIFeatures = require('../utils/apiFeatures');
const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// #region multer middleware config for image upload

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage(); // Store the image in memory

const multerFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
exports.deleteUserPhoto = (req, res, next) => {
  if (!req.user.photo.includes('default')) {
    const path = `public/img/users/${req.user.photo}`;
    fs.unlink(path, (val) => {
      //if (err) console.log(err);
    });
  }

  next();
};
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  //1) Create a unique filename
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // 2) Resize the image using sharp
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  // 3) Save the image to the user document
  req.body.photo = req.file.filename;
  next();
});
// #endregion

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
    message: 'This route is not defined. Plese use /signup insead!'
  });
};

// #region For the current user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

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
  if (req.file) filteredBody.photo = req.file.filename;

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

// #region Administrator
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
// #endregion
