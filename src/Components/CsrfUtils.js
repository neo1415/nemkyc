// // csrf-utils.js
// import axios from 'axios';

// const BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
// const CSRF_TOKEN_ENDPOINT = `${BASE_URL}/csrf-token`;

// const getCsrfToken = async () => {
//   const response = await axios.get(CSRF_TOKEN_ENDPOINT, { withCredentials: true });
//   const csrfToken = response.data.csrfToken;
//   console.log('Fetched CSRF Token:', csrfToken);
//   return csrfToken;
// };

// const csrfProtectedRequest = async (method, url, data = null) => {
//   const csrfToken = await getCsrfToken();
//   console.log('Sending CSRF Token:', csrfToken);
//   const config = {
//     method,
//     url,
//     headers: {
//       'Content-Type': 'application/json',
//       'CSRF-Token': csrfToken
//     },
//     withCredentials: true,
//     data
//   };
//   const response = await axios(config);
//   return response;
// };

// export const csrfProtectedPost = (url, data) => csrfProtectedRequest('post', url, data);
// export const csrfProtectedGet = (url) => csrfProtectedRequest('get', url);
// export const csrfProtectedDelete = (url) => csrfProtectedRequest('delete', url);
