class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) filtering
    // create a hard copy of the query string
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // 1B) advanced filtering
    // put the $ before each operator (gte, gt, lte, lt)
    const queryString = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      '$$$1'
    );
    queryString.replace(/\b(gte|gt|lte|lt)\b/g, '$$$1');

    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    // 2) sorting (place '-' before  req.query.sort param value in query for descending order)
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // 3) Field limiting (only return certain fields specified in the http request)
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //include everything but the __v property
    }
    return this;
  }

  paginate() {
    // 4) Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skipAmount = (page - 1) * limit;
    this.query = this.query.skip(skipAmount).limit(limit);

    //  if (this.queryString.page) {
    //    const numTours = await Tour.countDocuments();
    //    if (skipAmount >= numTours) {
    //      throw new Error('Page does not exist');
    //    }
    //  }

    return this;
  }
}

module.exports = APIFeatures;
