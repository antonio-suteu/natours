const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
// global error handling class
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// #region GLOBAL MIDDLEWARES
// Set Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// rate limiting middleware, restricts the number of requests from a
// single IP address within a specific time window (1 hour in this case)
// if the app gets restated, then this counter will be reset
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '10kb' // limit the size of the request body to 10kb
  })
);

// Data sanitization against NoSQL query injections
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers)
  next();
});
//#endregion

// 2) ROUTES
// mounting the userRouter
app.use('/api/v1/users', userRouter);
// mounting the tourRouter
app.use('/api/v1/tours', tourRouter);

// middleware for handling all the HTTP requests with an invalid url
// PLACE AT THE END OF ROUTES DEFINITION
app.all('*', (req, res, next) => {
  //when we pass a param to next(), Express assumes it is an error
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
