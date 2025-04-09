/*eslint-disable */

import { displayMap } from './leaflet_setup';
import { login, logout } from './login';
import { updateUserData } from './updateSettings';

const $ = document.querySelector.bind(document);

// DOM ELEMENTS
const mapContainer = $('#map');
const loginForm = $('.form');
const logOutBtn = $('.nav__el--logout');
const userDataForm = $('.form-user-data');

// VALUES
// how about this

// DELEGATION
if (mapContainer) {
  const locations = JSON.parse(mapContainer.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Get form data
    const email = $('#email').value;
    const password = $('#password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
if (userDataForm) {
  userDataForm.addEventListener('click', (e) => {
    e.preventDefault();
    const name = $('#name').value;
    const email = $('#email').value;
    updateUserData(name, email);
  });
}
