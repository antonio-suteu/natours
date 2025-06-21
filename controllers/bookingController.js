const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  // 2) Create checkout session object
  const productConfig = [
    {
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: tour.price * 100, // multiply by 100 to convert to cents (required by stripe)
        product_data: {
          name: `${tour.name} Tour`,
          description: tour.summary,
          images: [
            // `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}` (for deployed website)
            `https://www.natours.dev/img/tours/${tour.imageCover}`
          ]
        }
      }
    }
  ];

  const sessionConfig = {
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.params.tourID, // custom field to store the tour ID (for deployed website)
    payment_intent_data: {
      description: `1x ${tour.name} Tour` // This wil show up in the Stripe Transacions Dashboard
    },
    line_items: productConfig,
    mode: 'payment',
    ui_mode: 'hosted',
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`
  };

  // 3) Create checkout session in Stripe
  const session = await stripe.checkout.sessions.create(sessionConfig);

  // 4) Send checkout page URL to client
  res.status(200).json({
    status: 'success',
    checkoutUrl: session.url
  });
});
