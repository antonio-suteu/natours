/*eslint-disable */

console.warn('login.js');

//login function that call api
const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: { email, password }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response.data);
    // show error message on UI
    // document.getElementById('error').textContent = err.response.data.message;
  }
};

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  // Get form data
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
