import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';
import { hasAnyRole } from '../../utils/roleNormalization';

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

  // Check if user has any of the allowed roles using normalization
  if (!hasAnyRole(user.role, allowedRoles)) {
    console.log('🚫 Role not allowed:', { 
      userRole: user.role, 
      allowedRoles,
      message: 'User role does not match any allowed roles'
    });
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
