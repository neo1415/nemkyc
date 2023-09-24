// UserRoleContext.js
import React, { createContext, useContext, useState } from 'react';

const UserRoleContext = createContext();

export const useUserRole = () => {
  return useContext(UserRoleContext);
};

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  // Function to set the user's role
  const setUserRoleValue = (role) => {
    setUserRole(role);
  };

  const value = {
    userRole,
    setUserRole: setUserRoleValue, // Make the function available in the context
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};
