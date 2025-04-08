const AppError = require('../utils/appError');

//#region operational Error handlers

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: "${Object.values(err.keyValue)[0]}". Plese use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (val) =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = (val) =>
  new AppError('Your token has expired! Please log in again!', 401);

//#endregion

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) Rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // #region A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or other unknown error: don't leak sensitive information
    // 1) Log the error message
    console.error('ERROR 💣', err);
    // 2) Send generic message to client
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong, please try again later'
    });
  }
  // #endregion

  // #region B) Rendered website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // Programming or other unknown error: don't leak sensitive information
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
  // #endregion
};

// since this function has 4 params, Express knows this is a global error handling middleware
module.exports = (err, req, res, next) => {
  //this prints out the stack trace
  //console.error(err.stack);

  // set default error status code to 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //complete error
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // make a hard copy of the err object
    let error = { ...err, message: err.message };

    //add more specific error handling here for different operational error types
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    switch (err.name) {
      case 'CastError':
        error = handleCastErrorDB(error);
        break;
      case 'ValidationError':
        error = handleValidationErrorDB(error);
        break;
      case 'JsonWebTokenError':
        error = handleJWTError(error);
        break;
      case 'TokenExpiredError':
        error = handleJWTExpiredError(error);
        break;
      default:
        break;
    }

    sendErrorProd(error, req, res);
  }
  next();
};
