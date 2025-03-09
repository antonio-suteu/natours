const express = require('express');
const morgan = require('morgan');
// global error handling class
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
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
