/*eslint-disable */
import { showAlert } from './alerts';
import axios from 'axios';
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: { email, password }
    });
    console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');

      // Redirect to home page
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
