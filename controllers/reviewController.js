const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Review.find(), req.query)
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
  const newReview = await Review.create({ ...req.body, user: req.user.id });
  res.status(201).send({ status: 'success', data: { tour: newReview } });
});
