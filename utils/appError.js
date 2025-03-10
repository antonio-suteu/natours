class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //we call the parent constructor

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //for prod env, we only show operational errors

    // we add the stack trace of the error to the error object
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
