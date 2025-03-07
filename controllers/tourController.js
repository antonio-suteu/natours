const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

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

exports.createNewTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).send({ status: 'success', data: { tour: newTour } });
  } catch (error) {
    res.status(400).send({ status: 'fail', message: error.message });
  }
};

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).send({ status: 'fail', message: error.message });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).send({ status: 'success', data: { tour } });
  } catch (error) {
    res.status(404).send({ status: 'fail', message: error.message });
  }
};
exports.updateTour = async (req, res) => {
  try {
    const tourToUpdate = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json({
      status: 'success',
      data: { tour: tourToUpdate }
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Returns the number of tours for each month in a given year
exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e.message
    });
  }
};
