const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    // Used for manual bookings created by administrator
    type: Boolean,
    default: true
  }
});

// #region QUERY MIDDLEWARE runs before the query gets executed
// /^find/ is a regex that matches the strings that start with 'find'

bookingSchema.pre(/^find/, function (next) {
  // this fills our the tour and user data from the arrays of id's
  this.populate({
    path: 'tour',
    select: 'name'
  });

  this.populate({
    path: 'user',
    select: 'name email'
  });

  next();
});

// #endregion

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
