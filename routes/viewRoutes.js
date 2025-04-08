const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// check if there's currently a user logged in
// (we get access to his data trough 'user' varaible)
//router.use(authController.isUserLoggedIn);

router.get('/', authController.isUserLoggedIn, viewController.getOverview);
router.get(
  '/tour/:slug',
  authController.isUserLoggedIn,
  viewController.getTour
);
router.get(
  '/login',
  authController.isUserLoggedIn,
  viewController.getLoginForm
);

// protect all routes after this middleware
//router.use(authController.protect);
router.get('/me', authController.protect, viewController.getAccount);

module.exports = router;
