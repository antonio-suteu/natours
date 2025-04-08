/*eslint-disable */

import { displayMap } from './leaflet_setup';
import { login } from './login';

// DOM ELEMENTS
const mapContainer = document.getElementById('map');
const loginForm = document.querySelector('.form');

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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
