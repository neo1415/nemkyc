// withAuthorization.js
import React, { useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserAuth } from '../Context/AuthContext';

// Define roles
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

const withAuthorization = (allowedRoles) => (WrappedComponent) => {
  return function WithAuthorization(props) {
    const { user } = useContext(UserAuth);
    const navigate = useNavigate();

    useEffect(() => {
      if (!user) {
        // Redirect to the login page if the user is not authenticated
        navigate('/signin');
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to the appropriate page if the user's role is not allowed
        switch (user.role) {
          case ROLES.ADMIN:
            navigate('/adminHome'); // Redirect admins to the admin dashboard
            break;
          case ROLES.USER:
            navigate('/adminHome'); // Redirect regular users to their dashboard
            break;
          default:
            navigate('/signin'); // Redirect others to the login page
        }
      }
    }, [user, navigate, allowedRoles]);

    if (!user || !allowedRoles.includes(user.role)) {
      // Render nothing if the user doesn't meet the required role
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuthorization;
