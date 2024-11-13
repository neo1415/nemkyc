// config.js

export const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const endpoints = {
  getUsers: `${serverURL}/get-users`,
  getCorporateData: `${serverURL}/get-corporate-data`,
  logIn: `${serverURL}/login`,
  getBrokersData: `${serverURL}/get-brokers-data`,
  getPartnersData: `${serverURL}/get-partners-data`,
  getAgentsData: `${serverURL}/get-agents-data`,
  saveAgentsStepData: `${serverURL}/save-agents-step-data`,
  getCorporateKYCData: `${serverURL}/get-corporate-kyc-data`,
  getIndividualKYCData: `${serverURL}/get-individual-kyc-data`,
  getIndividualData: `${serverURL}/get-individual-data`,
  assignSuperAdminRole: (userId) => `${serverURL}/assign-super-admin-role/${userId}`,
  assignAdminRole: (userId) => `${serverURL}/assign-admin-role/${userId}`,
  assignModeratorRole: (userId) => `${serverURL}/assign-moderator-role/${userId}`, // Add this line
  assignDefaultRole: (userId) => `${serverURL}/assign-default-role/${userId}`, // Add this line
  checkAdminClaim: `${serverURL}/check-admin-claim`,
  checkUserRole: (userId) => `${serverURL}/check-user-role/${userId}`,
  updateUserRole: (userId) => `${serverURL}/update-user-role/${userId}`,
  deleteUser: (userId) => `${serverURL}/delete-user/${userId}`,
  listenForUpdates: `${serverURL}/listenForUpdates`,
  submitCorporateForm: `${serverURL}/submit-corporate-form`,
  submitIndividualForm: `${serverURL}/submit-individual-form`,
  submitPartnersForm: `${serverURL}/submit-partners-form`,
  submitAgentsForm: `${serverURL}/submit-agents-form`,
  submitBrokersForm: `${serverURL}/submit-brokers-form`,
  submitCorporateKYCForm: `${serverURL}/submit-corporate-kyc-form`,
  submitIndividualKYCForm: `${serverURL}/submit-individual-kyc-form`,
  // editAgentsForm: `${serverURL}edit-agents-form/${data.id}`,
};
