import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { useUserRole } from '../../Context/UserRole';
import { Navigate } from 'react-router-dom';
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

const ProtectedRoute = ({ children, superAdminOnly,adminOnly, complianceOnly }) => {
  const { user } = UserAuth();
  const { userRole, setUserRole } = useUserRole();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user && user.uid) {
        // console.log('User found:', user);
        try {
          const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          const response = await csrfProtectedPost(`${serverURL}/check-user-role`, { uid: user.uid });
          const role = response.data.role;
          // console.log('Fetched role from server:', role);
          setUserRole(role);
        } catch (error) {
          console.error('Error checking user role:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // console.log('No user found or invalid user UID');
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, setUserRole]);

  if (isLoading) {
    console.log('Loading...');
    return <PageLoad />;
  }

  // console.log('User role:', userRole);

  if (!user) {
    console.log('No user, redirecting to signin');
    return <Navigate to="/signin" />;
  }

  if (userRole === 'default') {
    // console.log('Unauthorized, userRole:', userRole);
    return <Unauthourized />;
  }

  if (superAdminOnly && userRole !== 'superAdmin') {
    // console.log('Admin only, userRole:', userRole);
    return <Unauthourized />;
  }

  if (adminOnly && userRole !== 'admin') {
    // console.log('Admin only, userRole:', userRole);
    return <Unauthourized />;
  }

  if (complianceOnly && userRole !== 'admin' && userRole !== 'superAdmin' && userRole !== 'compliance') {
    // console.log('Moderator only, userRole:', userRole);
    return <Unauthourized />;
  }

  console.log('Access granted');
  return children;
};

export default ProtectedRoute;
