/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
var stripe = Stripe(
  'pk_test_51RFdeIPuRB5fNeA7fg8gYmsj9z6PKmslUDLiMAXgo27wTqKw3nRbDWqKIeD7g4mTHmkFFtFP3lerAZB2bqOeLP3m00aMRfUf3J'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      method: 'POST',
      url: `http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`
    });

    // 2) redirect to Stripe checkout page
    window.location.href = session.data.checkoutUrl;
  } catch (err) {
    console.error('Error in bookTour:', err);
    showAlert(
      'error',
      'An error occurred while booking the tour. Please try again later.'
    );
    return;
  }
};
