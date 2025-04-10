/*eslint-disable */

import { displayMap } from './leaflet_setup';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

const $ = document.querySelector.bind(document);

// DOM ELEMENTS
const mapContainer = $('#map');
const loginForm = $('.form-login');
const logOutBtn = $('.nav__el--logout');
const saveUserDataForm = $('.form-user-data');
const savePasswordForm = $('.form-user-settings');

// VALUES

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

if (saveUserDataForm) {
  saveUserDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value;
    const email = $('#email').value;
    updateSettings({ name, email }, 'data');
  });
}

if (savePasswordForm) {
  savePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const savePasswordBtn = $('#updateUserPwdBtn');
    const passwordCurrent = $('#password-current').value;
    const password = $('#password').value;
    const passwordConfirm = $('#password-confirm').value;

    // Change text on button while processing
    savePasswordBtn.textContent = 'Updating...';

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    // Clear input fields
    $('#password-current').value = '';
    $('#password').value = '';
    $('#password-confirm').value = '';

    // Reset button text
    savePasswordBtn.textContent = 'Save password';
  });
}
