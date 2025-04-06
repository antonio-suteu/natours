const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// global error handling class
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// routers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// #region Pug setup
// define view engine for server side rendering (in this case Pug)
app.set('view engine', 'pug');
// define folter containing the html templates
app.set('views', path.join(__dirname, 'views'));
// #endregion

// #region GLOBAL MIDDLEWARES

// Serving static files
// the 'public' folder is the root of our base pug template
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = ['https://unpkg.com/', 'https://tile.openstreetmap.org'];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls]
    }
  })
);
//app.use(helmet());

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

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      // whitelist params that are allowed duplicates
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers)
  next();
});
//#endregion

// 2) MOUNTING ROUTES
// needed for server side rendering, each HTTP GET response gets converted into HTML
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

// middleware for handling all the HTTP requests with an invalid url
// PLACE AT THE END OF ROUTES DEFINITION
app.all('*', (req, res, next) => {
  //when we pass a param to next(), Express assumes it is an error
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
