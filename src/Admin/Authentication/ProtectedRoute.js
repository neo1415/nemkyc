import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';

const ProtectedRoute = ({ children, adminOnly, moderatorOnly }) => {
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole')); // Initialize with cached role
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          const response = await axios.post(`${serverURL}/check-user-role/${user.uid}`);
          const role = response.data.role;

          // Update the user role in the cache if it's different from the cached value
          if (role !== userRole) {
            localStorage.setItem('userRole', role);
            setUserRole(role);
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        } finally {
          setIsLoading(false); // Set isLoading to false regardless of success or failure
        }
      }
    };
  
    fetchUserRole();
  }, [user]);


  console.log('User Role:', userRole);

  // Check if the loading state is true, render loading component
  if (isLoading) {
    return (
      <div>
        <h1>Checking permissions</h1>
      </div>
    ); // Replace with your loading component
  }

  // Check if the user is logged in
  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Check if the user role is not 'loading' (role fetched) and proceed
  if (userRole !== 'loading') {
    // Check if the route is admin-only and the user is not an admin
    if (adminOnly && userRole !== 'admin') {
      return <Unauthourized />;
    }

    // Check if the route is moderator-only and the user is not a moderator
    if (moderatorOnly && userRole !== 'moderator') {
      return <Unauthourized />;
    }
  }

  return children;
};

export default ProtectedRoute;
