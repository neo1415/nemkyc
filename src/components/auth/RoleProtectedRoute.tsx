import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, mfaRequired, mfaEnrollmentRequired } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Show MFA enrollment if required for sensitive roles
  if (mfaEnrollmentRequired) {
    return <MFAEnrollment />;
  }

  // Show MFA verification if required for sensitive roles
  if (mfaRequired) {
    return <MFAVerification />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;