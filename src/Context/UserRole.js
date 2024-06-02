// UserRoleContext.js
import React, { createContext, useContext, useState } from 'react';

const UserRoleContext = createContext();

export const useUserRole = () => {
  return useContext(UserRoleContext);
};

export const UserRoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  const setUserRoleValue = (role) => {
    console.log('Setting user role:', role);
    setUserRole(role);
  };

  const value = {
    userRole,
    setUserRole: setUserRoleValue,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};
