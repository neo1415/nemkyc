import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../Context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { endpoints } from './Points';
import { db } from '../../APi';
import { doc, getDoc } from 'firebase/firestore'; 
import Unauthourized from '../../Components/Unauthourized';
import PageLoad from '../../Components/PageLoad';

const ProtectedRoute = ({ children, adminOnly, moderatorOnly }) => {
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [userRole, setUserRole] = useState(null); // State to store user role


  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDocRef = doc(db, 'userroles', user.uid);
        const userDocSnap = await getDoc(userDocRef);
  
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role);
        }

        // Once the user role is fetched, set isLoading to false
        setIsLoading(false);
      }
    };
  
    fetchUserRole();
  }, [user]); 

  // Check if the loading state is true, render "Checking permissions" message
  if (isLoading) {
    return <div>Checking permissions...</div>;
  }

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