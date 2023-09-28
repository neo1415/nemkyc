import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from './Points';
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';

const ProtectedRoute = ({ children, adminOnly, moderatorOnly }) => {
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [userRole, setUserRole] = useState(null); // State to store user role

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const serverURL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          // Make an HTTP request to your server's endpoint to fetch the user's role
          const response = await axios.post(`${serverURL}/check-user-role/${user.uid}`);
          const role = response.data.role; // Assuming the response contains a 'role' field
          setUserRole(role);
          setIsLoading(false);
          console.log('User Role:', role);
        } catch (error) {
          console.error('Error checking user role:', error);
          // setUserRole('guest'); // Default to 'guest' role if there's an error
          setIsLoading(false);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  console.log('User Role:', userRole);

  // Check if the loading state is true, render loading component
  // if (isLoading) {
  //   return <PageLoad />; // Replace with your loading component
  // }

  // Check if the user is logged in
  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Check if the route is admin-only and the user is not an admin
  if (adminOnly && userRole !== 'admin') {
    return (
        <Unauthourized />
    )
  }

  // Check if the route is moderator-only and the user is not a moderator
  if (moderatorOnly && userRole !== 'moderator') {
    return (
        <Unauthourized />
    )
  }

  return children;
};

export default ProtectedRoute;