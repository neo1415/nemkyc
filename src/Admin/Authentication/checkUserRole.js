// userUtils.js

import axios from 'axios';
import { endpoints } from './Points';

export const checkUserRole = async (uid, role) => {
  try {
    const endpoint = endpoints.checkUserRole(uid); // Use the endpoint with the UID
    console.log('Check User Role Endpoint:', endpoint); // Log the endpoint
    const response = await axios.post(endpoint, { role });
    console.log(role);
    return response.data.hasRole;
  } catch (error) {
    console.error(`Error checking ${role} claim:`, error);
    return false; // Default to false if there's an error
  }
};
