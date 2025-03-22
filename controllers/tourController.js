const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//#region Middleware logic
//parameter middleware to validate tour ID

exports.aliasTopTours = (req, res, next) => {
  //limit=5&sort=-ratingsAverage,price
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,summary,ratingsAverage,difficulty';
  next();
};

//#endregion

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } }, // only consider tours with a ratings of at least 4.5
    {
      $group: {
        //_id: null, //group all tours together
        _id: { $toUpper: '$difficulty' }, //group tours by difficulty
        avgRating: { $avg: '$ratingsAverage' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgDuration: { $avg: '$duration' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgPrice: -1 } } //sort by average rating in descending order
    //{ $match: { _id: { $ne: 'EASY' } } } //we can repeat operators
  ]);

  res.status(200).send({ status: 'success', data: { stats } });
});

// Returns the number of tours for each month in a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      // decompose each document into multiple ones (startDates is an array of dates)
      $unwind: '$startDates'
    },
    {
      // match tours created in the given year
      $match: {
        startDates: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 12, 31)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //group tours by month
        numTourStarts: { $sum: 1 }, //count the number of tours in each month
        tours: { $push: '$name' } // create array of the names of each tour
      }
    },
    { $addFields: { month: '$_id' } }, //add a field called month to the results
    { $project: { _id: 0 } }, //hide the _id field
    { $sort: { numTourStarts: -1 } }, //sort by tour starts in desc order
    { $limit: 12 } //limit the result to the first 12 months (just used for reference)
  ]);

  res.status(200).send({ status: 'success', data: { plan } });
});

exports.createNewTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
  select: 'review rating user'
});
exports.getAllTours = factory.getAll(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
