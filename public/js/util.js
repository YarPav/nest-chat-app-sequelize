export const BASE_URL = 'https://y6e0pbuxm.localto.net';

export const validatedAuthToken = () => {
  // TODO сделать проверку не протух ли токен
  const token = getAuthToken();
  if (!token) {
    relocateToLoginPage();
    return false;
  } else {
    return token;
  }
};

export const getAuthToken = () => {
  // return localStorage.getItem('authToken');
  return getCookie('Authorization');
};

export const relocateToMainPage = () => {
  const baseUrl = window.location.origin;
  window.location.replace(`${baseUrl}/chat/all`);
};

export const relocateToLoginPage = () => {
  const baseUrl = window.location.origin;
  window.location.replace(`${baseUrl}/auth/login`);
};

export const formDataToJson = (formData) => {
  const obj = {};

  Array.from(formData).forEach((i) => {
    obj[i[0]] = i[1];
  });

  return JSON.stringify(obj);
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/users/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  return await res.json();
};

export function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        '=([^;]*)',
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

export const setCookie = (name, value, options = {}) => {
  options = {
    path: '/',
    // при необходимости добавьте другие значения по умолчанию
    ...options,
  };

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie =
    encodeURIComponent(name) + '=' + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += '; ' + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += '=' + optionValue;
    }
  }

  document.cookie = updatedCookie;
};
