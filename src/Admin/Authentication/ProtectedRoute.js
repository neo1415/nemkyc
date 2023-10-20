import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';

const ProtectedRoute = ({ children, adminOnly, moderatorOnly }) => {
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(true); // Display loading until the user role is fetched
  const [userRole, setUserRole] = useState(null); // Initialize userRole as null

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const cachedRole = localStorage.getItem('userRole');

          if (cachedRole) {
            setUserRole(cachedRole);
            setIsLoading(false); // Set isLoading to false if userRole is cached
          }

          const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          const response = await axios.post(`${serverURL}/check-user-role/${user.uid}`);
          const role = response.data.role;

          // Update the user role and cache it
          setUserRole(role);
          localStorage.setItem('userRole', role);
        } catch (error) {
          console.error('Error checking user role:', error);
        } finally {
          setIsLoading(false);
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

  if (userRole !== null) {
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
