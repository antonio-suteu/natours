const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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

exports.createNewTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).send({ status: 'success', data: { tour: newTour } });
});

exports.getAllTours = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res
    .status(200)
    .send({ status: 'success', results: tours.length, data: { tours } });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).send({ status: 'success', data: { tour } });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true //this uses the validators declared in the Tour model
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.json({
    status: 'success',
    data: { tour: tour }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

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
