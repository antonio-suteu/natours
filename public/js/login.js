/*eslint-disable */

console.warn('login.js');

//login function that call api
const login = async (email, password) => {
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

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  // Get form data
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
