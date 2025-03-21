const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'], //also works with Dates
      max: [5, 'Rating must be between 1 and 5'], //also works with Dates
      required: [true, 'Review must have a rating']
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!']
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!']
    }
  },
  {
    // SCHEMA OPTIONS
    // allow for virtual properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // disable schema versioning
    versionKey: false
  }
);

// #region QUERY MIDDLEWARES

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name'
  }).populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});
// #endregion

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
