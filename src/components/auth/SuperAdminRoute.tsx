import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { rolesMatch } from '../../utils/roleNormalization';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard component that restricts access to super admin users only
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 * 
 * This component:
 * - Checks if the user has the 'super admin' role
 * - Redirects non-super-admins to the unauthorized page
 * - Logs all access attempts to the console (audit logging)
 * - Shows loading state while authentication is being verified
 */
const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Log access attempt
  useEffect(() => {
    if (!loading) {
      const timestamp = new Date().toISOString();
      const userEmail = user?.email || 'anonymous';
      const userRole = user?.role || 'none';
      const hasAccess = user ? rolesMatch(user.role, 'super admin') : false;

      console.log('🔐 SuperAdminRoute Access Attempt:', {
        timestamp,
        userEmail,
        userRole,
        hasAccess,
        result: hasAccess ? 'GRANTED' : 'DENIED'
      });

      // In production, this should also log to backend audit system
      if (user && !hasAccess) {
        console.warn('⚠️ Unauthorized access attempt to super admin route:', {
          userId: user.uid,
          email: user.email,
          role: user.role,
          timestamp
        });
      }
    }
  }, [user, loading]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    console.log('🔒 SuperAdminRoute: No user found, redirecting to signin');
    return <Navigate to="/auth/signin" replace />;
  }

  // Check if user has super admin role
  if (!rolesMatch(user.role, 'super admin')) {
    console.log('🚫 SuperAdminRoute: Access denied', {
      userRole: user.role,
      requiredRole: 'super admin',
      message: 'User does not have super admin privileges'
    });
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ SuperAdminRoute: Access granted for super admin:', user.email);

  return <>{children}</>;
};

export default SuperAdminRoute;
