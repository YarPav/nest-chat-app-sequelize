import {
  relocateToMainPage,
  formDataToJson,
  getAuthToken,
  setCookie,
  BASE_URL,
} from './util.js';

document.addEventListener('DOMContentLoaded', () => {
  if (getAuthToken()) {
    relocateToMainPage();
  }
});

const loginForm = document.querySelector('#login-form');
const registrationForm = document.querySelector('#registration-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const jsonForm = formDataToJson(formData);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: jsonForm,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const responseJson = await response.json();
      // localStorage.setItem('authToken', responseJson.token);
      setCookie('Authorization', responseJson.token);
      relocateToMainPage();
    }
  });
}

if (registrationForm) {
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(registrationForm);
    const jsonForm = formDataToJson(formData);

    const response = await fetch(`${BASE_URL}/auth/registration`, {
      method: 'POST',
      body: jsonForm,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const responseJson = await response.json();
      console.log(responseJson);
      // localStorage.setItem('authToken', responseJson.token);
      setCookie('Authorization', responseJson.token);
      relocateToMainPage();
    }
  });
}
