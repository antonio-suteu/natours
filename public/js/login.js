/*eslint-disable */
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
      // Redirect to home page
      window.setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};
