const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

// Middleware to validate ID in request parameters
//router.param('id', tourController.checkId);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  //.post(tourController.checkRequestBody, tourController.createNewTour);
  .post(tourController.createNewTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
