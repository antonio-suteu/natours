const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // EXECUTE QUERY
  const features = new APIFeatures(Review.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const reviews = await features.query;

  // SEND RESPONSE
  res
    .status(200)
    .send({ status: 'success', results: reviews.length, data: { reviews } });
});

exports.createNewReview = catchAsync(async (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).send({ status: 'success', data: { tour: newReview } });
});

exports.deleteReview = factory.deleteOne(Review);
