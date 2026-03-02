/**
 * Password Reset Guard
 * 
 * Route guard that checks if user must change password and redirects to password reset page.
 * Prevents users from bypassing the password reset requirement.
 * 
 * Task 17: Authentication Flow Integration
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface PasswordResetGuardProps {
  children: React.ReactNode;
}

export function PasswordResetGuard({ children }: PasswordResetGuardProps) {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkPasswordReset = async () => {
      // Skip check if auth is still loading
      if (authLoading) {
        return;
      }

      // Skip check if not authenticated
      if (!user || !firebaseUser) {
        setChecking(false);
        return;
      }

      // Skip check if already on password reset page
      if (location.pathname === '/auth/password-reset') {
        setChecking(false);
        return;
      }

      try {
        // Check if user must change password
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.mustChangePassword === true) {
            console.log('🔐 PasswordResetGuard: User must change password - redirecting');
            setMustChangePassword(true);
            
            // Store the intended destination
            sessionStorage.setItem('passwordResetRedirect', location.pathname);
            
            // Redirect to password reset page
            navigate('/auth/password-reset', { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('PasswordResetGuard: Error checking mustChangePassword:', error);
        // Don't block navigation if check fails
      }

      setChecking(false);
    };

    checkPasswordReset();
  }, [user, firebaseUser, authLoading, location.pathname, navigate]);

  // Show loading spinner while checking
  if (authLoading || checking) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If must change password, don't render children (redirect is in progress)
  if (mustChangePassword) {
    return null;
  }

  // Render children if no password reset required
  return <>{children}</>;
}

export default PasswordResetGuard;
