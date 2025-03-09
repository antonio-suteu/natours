// since this function has 4 params, Express knows this is a global error handling middleware
module.exports = (err, req, res, next) => {
  //this prints out the stack trace
  //console.log(err.stack);

  // set default error status code to 500
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });

  next();
};
