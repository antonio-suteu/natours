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

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unknown error: don't leak sensitive information
  } else {
    // 1) Log the error message
    console.error('ERROR 💣', err);
    // 2) Send generic message to client
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong, please try again later'
    });
  }
};

// since this function has 4 params, Express knows this is a global error handling middleware
module.exports = (err, _req, res, next) => {
  //this prints out the stack trace
  //console.log(err.stack);

  // set default error status code to 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    //complete error
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // make a hard copy of the err object
    let error = { ...err, message: err.message };

    //add more specific error handling here for different operational error types
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);

    sendErrorProd(error, res);
  }
  next();
};
