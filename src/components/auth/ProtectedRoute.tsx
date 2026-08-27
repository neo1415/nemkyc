
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, mfaRequired, mfaEnrollmentRequired } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth/signin?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
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
