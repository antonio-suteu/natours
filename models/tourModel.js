const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [
        40,
        'The tour name must have less or equal than 40 characters'
      ],
      minLength: [
        10,
        'The tour name must have more or equal than 10 characters'
      ]
      //validate: [validator.isAlpha, 'Tour name must only contain characters']
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
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be either easy, medium, or hard'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be between 1 and 5'], //also works with Dates
      max: [5, 'Rating must be between 1 and 5'] //also works with Dates
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      defaut: 0,
      validate: {
        validator: function (val) {
          // only works on new document creation (not update)
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: { type: Date, default: Date.now(), select: false }, //select: set to false, it hides from response
    startDates: [Date],
    secretTour: { type: Boolean, default: false }, //Will be used by Query middleware
    // adding geospatial data as GeoJSON object (type and coordinates attributes are required)
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      // coordinates are first latitude then longitude
      // (basically reverse the ones returned by Google Maps)
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        // coordinates are first latitude then longitude
        coordinates: [Number],
        address: String,
        description: String,
        day: Number //start location would be day 0
      }
    ],
    guides: [
      //child reference
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
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

// #region INDEXES (for requests with more reads than writes)
// compound index (works for the individual fields too)
// when we update the document, the index also has to be updated
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// #endregion

// #region virtual properties
// we use a regular function because we use 'this' keyword
// we can't use these properties in queries
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// create a virtual populate for accessing the tour reviews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// tourSchema.virtual('startLocation').get(function () {
//   return this.locations[0];
// });

// #endregion

// #region DOCUMENT MIDDLEWARE: runs before .save() & .create() functions
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

// #endregion

// #region QUERY MIDDLEWARE: runs before the query gets executed
// /^find/ is a regex that matches the strings that start with 'find'
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  //this.queryStart = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // this fills our the guides user data from the arrays of user id's
  // contained in the 'guides' array
  this.populate({
    path: 'guides',
    select: '-passwordChangedAt'
  });

  next();
});

// runs after the query gets executed, so we get access to the returned documents
// tourSchema.post(/^find/, (docs, next) => {
//   console.log(`Query took ${Date.now() - this.queryStart} milliseconds`);
//   next();
// });

// #endregion

// 3. AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // pipeline() returs the curent pipeline
  // unshift() adds a new stage to the beginning of the pipeline
  // $match stage filters the documents to only include those where the secretTour field is not true
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
