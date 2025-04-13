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
  const photoInput = $('#photo');
  const userPhotoElement = $('.form__user-photo');

  photoInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Read and display the image in the existing photo element
    const reader = new FileReader();
    reader.onload = function (e) {
      userPhotoElement.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  saveUserDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Create a FormData object to handle file uploads
    const form = new FormData();
    form.append('name', $('#name').value);
    form.append('email', $('#email').value);

    // Handle photo upload if a file was selected
    const photoInput = $('#photo');
    if (photoInput.files.length > 0) {
      form.append('photo', photoInput.files[0]);
    }

    // Show loading state
    const saveButton = $('#saveUserDataBtn');
    saveButton.textContent = 'Saving...';

    try {
      await updateSettings(form, 'data');
      saveButton.textContent = 'Save settings';
    } catch (err) {
      saveButton.textContent = 'Save settings';
    }
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
