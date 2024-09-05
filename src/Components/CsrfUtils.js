// csrf-utils.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
const CSRF_TOKEN_ENDPOINT = `${BASE_URL}/csrf-token`;

const getCsrfToken = async () => {
  try {
    const response = await axios.get(CSRF_TOKEN_ENDPOINT, { withCredentials: true });
    const csrfToken = response.data.csrfToken;
    console.log('Fetched CSRF Token:', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF Token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const csrfProtectedRequest = async (method, url, data = null) => {
  const timestamp = Date.now().toString(); // Add current timestamp

  const config = {
    method,
    url,
    headers: {
      'x-timestamp': timestamp,
      ...(method !== 'DELETE' && { 'Content-Type': 'application/json' }) // Add 'Content-Type' only if method is not DELETE
    },
    withCredentials: true,  // This ensures that cookies (including the CSRF token) are sent
    ...(data && { data }),   // Only include `data` if it's provided
  };

  const response = await axios(config);
  return response;
};


export const csrfProtectedPost = (url, data) => csrfProtectedRequest('post', url, data);
export const csrfProtectedGet = (url) => csrfProtectedRequest('get', url);
export const csrfProtectedDelete = (url) => csrfProtectedRequest('delete', url); // No data needed here
