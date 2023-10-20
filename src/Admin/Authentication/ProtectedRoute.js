import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';

const ProtectedRoute = ({ children, adminOnly, moderatorOnly }) => {
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(!localStorage.getItem('userRole')); // Display loading only if user role is not in cache
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

          const cachedRole = localStorage.getItem('userRole');
          if (cachedRole) {
            setUserRole(cachedRole);
          }

          const response = await axios.post(`${serverURL}/check-user-role/${user.uid}`);
          const role = response.data.role;

          setUserRole(role);
          localStorage.setItem('userRole', role);

          // Update isLoading when the user role is available
          setIsLoading(false);
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  console.log('User Role:', userRole);

  if (isLoading) {
    return (
      <PageLoad />
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (userRole !== 'loading') {
    if (adminOnly && userRole !== 'admin') {
      return <Unauthourized />;
    }

    if (moderatorOnly && userRole !== 'moderator') {
      return <Unauthourized />;
    }
  }

  if (userRole === 'default') {
    return <Unauthourized />;
  }

  return children;
};

export default ProtectedRoute;
