const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// global error handling class
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
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

// express.json() puts the client data into request.body
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// for each request we add a parameter for the time of the reqeust
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

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
