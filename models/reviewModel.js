const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

// #region Static Methods (they operate on the entire collection)
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this keyword refers to the model itself (Review)
  // calculate review stats for the tour
  const stats = await this.aggregate([
    { $match: { tour: tourId } }, //select all the reviews of a given tour
    {
      // group by tour id (in this case there will be multiple reviews with the same tourId)
      $group: {
        _id: '$tour',
        nReviews: { $sum: 1 }, // count all the reviews of a given tour
        avgRating: { $avg: '$rating' } // calculate the average rating
      }
    }
  ]);

  //Update tour with calculated review stats
  await Tour.findByIdAndUpdate(stats[0]._id, {
    ratingsQuantity: stats[0].nReviews,
    ratingsAverage: stats[0].avgRating
  });
};
// #endregion

// #region QUERY MIDDLEWARES
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name'
  });

  next();
});
// #endregion

// #region DOCUMENT MIDDLEWARES

reviewSchema.post('save', function () {
  // this points to current review
  // mongoose.model('Review') gives us access to the Review model
  this.constructor.calcAverageRatings(this.tour);
});
// #endregion

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
