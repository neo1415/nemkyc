
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, mfaRequired, mfaEnrollmentRequired } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Show MFA enrollment if required
  if (mfaEnrollmentRequired) {
    return <MFAEnrollment />;
  }

  // Show MFA verification if required
  if (mfaRequired) {
    return <MFAVerification />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
