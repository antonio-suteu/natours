const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true
    },
    slug: String, //needed for slugifying
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
    startDates: [Date],
    secretTour: { type: Boolean, default: false } //Will be used by Query middleware
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

// #region Type of Mongoose Middlewares
// 1. DOCUMENT MIDDLEWARE: runs before .save() & .create() functions
// NOTE: does not work for .saveMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', (next) => {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log('New tour created!', doc);
//   next();
// });

// 2. QUERY MIDDLEWARE: runs before the query gets executed
// /^find/ is a regex that matches the strings that start with 'find'
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.queryStart = Date.now();
  next();
});

// runs after the query gets executed, so we get access to the returned documents
tourSchema.post(/^find/, (docs, next) => {
  console.log(`Query took ${Date.now() - this.queryStart} milliseconds`);
  next();
});

// 3. AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // pipeline() returs the curent pipeline
  // unshift() adds a new stage to the beginning of the pipeline
  // $match stage filters the documents to only include those where the secretTour field is not true
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
//#endregion

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
