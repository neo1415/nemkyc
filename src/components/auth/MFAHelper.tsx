import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface MFAHelperProps {
  children: React.ReactNode;
}

/**
 * Component to handle MFA redirects and state management
 */
const MFAHelper: React.FC<MFAHelperProps> = ({ children }) => {
  // Use try-catch to handle context issues gracefully
  let authState;
  try {
    authState = useAuth();
  } catch (error) {
    console.warn('MFAHelper: AuthContext not available yet, rendering children without MFA logic');
    return <>{children}</>;
  }
  
  const { mfaRequired, mfaEnrollmentRequired, user, loading } = authState;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Don't redirect if already on MFA pages
    if (location.pathname.includes('/auth/mfa/')) return;

    // Redirect to MFA enrollment if required
    if (mfaEnrollmentRequired && user) {
      navigate('/auth/mfa/enroll', { replace: true });
      return;
    }

    // Redirect to MFA verification if required
    if (mfaRequired && user) {
      navigate('/auth/mfa/verify', { replace: true });
      return;
    }
  }, [mfaRequired, mfaEnrollmentRequired, user, loading, navigate, location.pathname]);

  return <>{children}</>;
};

export default MFAHelper;