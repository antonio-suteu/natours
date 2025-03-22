const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// mergeParams is needed for nested routes to work properly
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(authController.protect, reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createNewReview
  );

router.route('/:id').delete(reviewController.deleteReview);

module.exports = router;
