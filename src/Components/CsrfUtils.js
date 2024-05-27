import axios from 'axios';

// Base URL for the API
const BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

// Endpoint to fetch CSRF token
const CSRF_TOKEN_ENDPOINT = `${BASE_URL}/csrf-token`;

// Utility function to fetch CSRF token
const getCsrfToken = async () => {
    const response = await axios.get(CSRF_TOKEN_ENDPOINT, { withCredentials: true });
    return response.data.csrfToken;
};

// Utility function to make CSRF-protected POST requests
const csrfProtectedPost = async (url, data) => {
    const csrfToken = await getCsrfToken();
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': csrfToken
      },
      withCredentials: true // Include cookies in the request
    });
    return response; // Return the full response object
};

// Utility function to make CSRF-protected GET requests
const csrfProtectedGet = async (url) => {
  const csrfToken = await getCsrfToken();
  return axios.get(url, {
    headers: {
      'CSRF-Token': csrfToken
    },
    withCredentials: true // Include cookies in the request
  });
};

// Utility function to make CSRF-protected DELETE requests
const csrfProtectedDelete = async (url) => {
    const csrfToken = await getCsrfToken();
    const response = await axios.delete(url, {
      headers: {
        'CSRF-Token': csrfToken
      },
      withCredentials: true // Include cookies in the request
    });
    return response; // Return the full response object
};

export { getCsrfToken, csrfProtectedPost, csrfProtectedGet, csrfProtectedDelete };
