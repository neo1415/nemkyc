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

// Utility function to make CSRF-protected requests
const csrfProtectedRequest = async (method, url, data = null) => {
    const csrfToken = await getCsrfToken();
    const config = {
        method,
        url,
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken
        },
        withCredentials: true,
        data
    };
    const response = await axios(config);
    return response; // Return the full response object
};

// Export utility functions
export const csrfProtectedPost = (url, data) => csrfProtectedRequest('post', url, data);
export const csrfProtectedGet = (url) => csrfProtectedRequest('get', url);
export const csrfProtectedDelete = (url) => csrfProtectedRequest('delete', url);
