const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
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

// #region multer middleware config for image uploa
const multerStorage = multer.memoryStorage(); // Store the image in memory

const multerFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
// exports.deleteTourPhotos = (req, res, next) => {

//   const path = `public/img/tours/tour-${req.params.id}-cover.jpeg`;
//   fs.unlink(path, (val) => {
//     //if (err) console.log(err);
//   });

//   next();
// };
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  // A) Cover Image
  //1) Create a unique filename and set it to the body of the request
  //  (needed by the next middleware what will actcually save the tour image)
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    // 2) Resize the image using sharp
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // B) Images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});
// #endregion

exports.createNewTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
  select: 'review rating user'
});
exports.getAllTours = factory.getAll(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Returns some stats of the tours grouped by difficulty level
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

// Returns tours that fall within a given distance from a given coordinates
// /tours-within/:distance/from/:latlng/unit/:unit')
// /tours-within/100/from/33.959346014448734, -118.34946466016014/unit/km')
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // #region controls
  // check valid distance
  const parsedDistance = distance * 1;
  if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
    return next(new AppError('Distance must be a positive number.', 400));
  }

  //check valid coordinates
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  // check valid unit
  if (!['km', 'mi'].includes(unit)) {
    return next(new AppError('Unit must be either km or mi.', 400));
  }
  // #endregion

  // calculate radiants (distance divided by Earth radius)
  const radius =
    unit === 'km' ? parsedDistance / 6378.1 : parsedDistance / 3963.2;

  const tours = await Tour.find({
    startLocation: {
      //$geoWithin: { $geometry: { type: 'Point', coordinetes: [lat, lng] } }
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).send({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

// Returns the distance between a given location and all the tours
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  //#region controls
  //check valid coordinates
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  // check valid unit
  if (!['km', 'mi'].includes(unit)) {
    return next(new AppError('Unit must be either km or mi.', 400));
  }

  //#endregion

  //... calculate distances and return them
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      // it needs an index in order to work,
      // if we have only one geospatial index, it will use that one
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    { $project: { distance: 1, name: 1 } }
  ]);

  res.status(200).send({
    status: 'success',
    data: {
      distances
    }
  });
});
