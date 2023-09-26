// config.js

export   const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const endpoints = {
  getUsers: `${serverURL}/get-users`,
  assignAdminRole: (userId) => `${serverURL}/assign-admin-role/${userId}`,
  assignModeratorRole: (userId) => `${serverURL}/assign-moderator-role/${userId}`, // Add this line
  assignDefaultRole: (userId) => `${serverURL}/assign-default-role/${userId}`, // Add this line
  checkAdminClaim: `${serverURL}/check-admin-claim`,
  checkUserRole: (userId) => `${serverURL}/check-user-role/${userId}`,
};
