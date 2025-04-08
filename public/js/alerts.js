/*eslint-disable */
// type is 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert();

  const markup = `
    <div class="alert alert--${type}">
      <span class="alert__text">${msg}</span>
      <button class="alert__close">&times;</button>
    </div>`;

  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  const alertEl = document.querySelector('.alert');

  // Allow CSS animation to apply
  window.setTimeout(() => {
    alertEl.classList.remove('alert--hidden');
  }, 10);

  // Dismiss on close button click
  alertEl.querySelector('.alert__close').addEventListener('click', hideAlert);

  // Auto-hide after 5s
  window.setTimeout(() => {
    alertEl.classList.add('alert--hidden');
    window.setTimeout(hideAlert, 500); // Wait for animation
  }, 5000);
};
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};
