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

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout'
    });

    if (res.data.status === 'success') location.reload(true); //true forces reload from server
  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
};
