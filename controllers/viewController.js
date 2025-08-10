const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get all tour data from collection
  const tours = await Tour.find();

  // 2) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (with reviews and tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Render that template using tour data from 1)
  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});

exports.getLoginForm = (_req, res) => {
  res.status(200).render('login', {
    title: 'Login'
  });
};

exports.getCheckout = (req, res) => {
  res.status(200).render('checkout', {
    title: 'Checkout'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

// This could have used a virtual populate
exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Get all bookings for the logged in user
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Get the tours for those bookings
  const tourIDs = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // 3) Render the 'my-tours' page with the tours data
  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  });
});
