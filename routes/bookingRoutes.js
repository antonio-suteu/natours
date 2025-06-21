const express = require('express');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.post(
  '/checkout-session/:tourID',
  authController.protect,
  authController.restrictTo('user'),
  bookingController.createCheckoutSession
);

module.exports = router;
