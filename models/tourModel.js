const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: { type: String, trim: true },
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: ['easy', 'medium', 'hard']
    },
    ratingsAverage: { type: Number, default: 4.5 },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: { type: Number, default: 0, min: 0, max: 100 },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false }, //select: set to false, it hides from response
    startDates: [Date]
  },
  {
    // schema options
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual properties
// we use a regular function because we use 'this' keyword
// we can't use these properties in queries
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() & .create() functions
tourSchema.pre('save', function () {
  console.warn(this);
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
