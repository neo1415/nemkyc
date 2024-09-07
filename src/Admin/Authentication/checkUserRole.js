import { endpoints } from './Points';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

export const checkUserRole = async (uid, role) => {
  try {
    const endpoint = endpoints.checkUserRole(uid); // Use the endpoint with the UID
    // console.log('Check User Role Endpoint:', endpoint); // Log the endpoint
    const response = await csrfProtectedPost(endpoint, { role });
    // console.log(role);
    return response.data.hasRole;
  } catch (error) {
    console.error(`Error checking ${role} claim:`, error);
    return false; // Default to false if there's an error
  }
};
