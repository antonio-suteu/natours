const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

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
module.exports = (err, req, res, next) => {
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
    let error = { ...err };

    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    //simple error
    sendErrorProd(error, res);
  }
  next();
};
