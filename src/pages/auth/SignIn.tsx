import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFormPageUrl, hasPendingSubmission } from '../../hooks/useAuthRequiredSubmit';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LogIn, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isAdminRole } from '../../utils/roleNormalization';
import MFAModal from '../../components/auth/MFAModal';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';
import logoImage from '../../assets/NEMs-Logo.jpg';

// Helper function to translate Firebase errors to user-friendly messages
const getErrorMessage = (error: any): string => {
  // Handle nested error structure from Firebase
  const errorCode = error?.code || error?.value?.code || '';
  const errorMessage = error?.message || error?.value?.message || '';

  console.log('Processing error:', { errorCode, errorMessage, fullError: error });

  // Firebase Auth errors
  if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
    return 'The email or password you entered is incorrect. Please try again.';
  }
  if (errorCode === 'auth/user-not-found') {
    return 'No account found with this email address. Please check your email or sign up for a new account.';
  }
  if (errorCode === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (errorCode === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact support for assistance.';
  }
  if (errorCode === 'auth/too-many-requests') {
    return 'Too many failed login attempts. Please wait a few minutes and try again, or reset your password.';
  }
  if (errorCode === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (errorCode === 'auth/operation-not-allowed') {
    return 'This sign-in method is not enabled. Please contact support.';
  }

  // Network and server errors
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (errorMessage.toLowerCase().includes('timeout')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  // Default user-friendly message
  return 'Unable to sign in. Please check your credentials and try again. If the problem persists, contact support.';
};

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const { 
    user, 
    signIn, 
    signInWithGoogle, 
    mfaRequired, 
    mfaEnrollmentRequired, 
    emailVerificationRequired,
    sendVerificationEmail,
    checkEmailVerification
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle redirect after successful authentication and user state update
  useEffect(() => {
    if (shouldRedirect && user) {
      console.log('🎯 Redirecting user:', user.role);
      setShouldRedirect(false);
      
      // Check if there's a pending submission - HIGHEST PRIORITY
      const pendingData = sessionStorage.getItem('pendingSubmission');
      if (pendingData) {
        console.log('🎯 Pending submission detected, redirecting to form page');
        const { formType } = JSON.parse(pendingData);
        const formPageUrl = getFormPageUrl(formType);
        
        // Redirect to form page - the form will handle submission processing
        navigate(formPageUrl, { replace: true });
        return;
      }

      // Normal sign-in flow - role-based navigation
      if (isAdminRole(user.role)) {
        console.log('🎯 Admin user detected, redirecting to /admin', { role: user.role });
        navigate('/admin', { replace: true });
      } else {
        console.log('🎯 Regular user, redirecting to:', from, { role: user.role });
        navigate(from, { replace: true });
      }
    }
  }, [user, shouldRedirect, navigate, from]);

  // Additional effect to handle immediate redirect when user is already authenticated
  useEffect(() => {
    // Don't redirect if there was a login error
    if (user && !loading && !mfaRequired && !mfaEnrollmentRequired && !emailVerificationRequired && !loginError) {
      console.log('🎯 User already authenticated, checking for redirect');
      
      // Check for pending submission first - HIGHEST PRIORITY
      const pendingData = sessionStorage.getItem('pendingSubmission');
      if (pendingData) {
        console.log('🎯 Pending submission detected, redirecting to form page');
        const { formType } = JSON.parse(pendingData);
        const formPageUrl = getFormPageUrl(formType);
        
        // Redirect to form page - the form will handle submission processing
        navigate(formPageUrl, { replace: true });
        return;
      }
      
      // Normal sign-in flow - role-based navigation only if no pending submission
      if (isAdminRole(user.role)) {
        console.log('🎯 Admin user already authenticated, redirecting to /admin', { role: user.role });
        navigate('/admin', { replace: true });
      }
    }
  }, [user, loading, mfaRequired, mfaEnrollmentRequired, emailVerificationRequired, loginError, navigate]);

  // Persisted auth error handling - show after redirects
  useEffect(() => {
    const authErr = sessionStorage.getItem('authError');
    const submissionErr = sessionStorage.getItem('submissionError');
    const message = submissionErr || authErr;
    if (message) {
      setError(message);
      setLoginError(true);
      toast.error(message);
      sessionStorage.removeItem('authError');
      sessionStorage.removeItem('submissionError');
    }
  }, []);

  // Note: getFormPageUrl is imported from useAuthRequiredSubmit hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors and reset error flag
    setError('');
    setLoginError(false);
    
    // Client-side validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoginError(true);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setLoginError(true);
      return;
    }

    setLoading(true);

    try {
      // Use AuthContext signIn method - this will handle the Firebase signIn and backend token exchange
      await signIn(email, password);
      
      // The signIn method will handle MFA flows automatically via AuthContext
      // If we reach here and no MFA/email verification is required, authentication was successful
      if (!mfaRequired && !mfaEnrollmentRequired && !emailVerificationRequired) {
        console.log('🚀 Sign in successful, setting redirect flag');
        // Clear error flag on successful login
        setLoginError(false);
        // Set flag to trigger redirect after user state is updated
        setShouldRedirect(true);
      } else {
        console.log('🔒 MFA/Email verification required:', { mfaRequired, mfaEnrollmentRequired, emailVerificationRequired });
      }
      setLoading(false);
      // If MFA or email verification is required, the modal will handle the flow
      
    } catch (err: any) {
      setLoading(false);
      setLoginError(true); // Mark that a login error occurred
      console.error('Sign in error:', err);
      const friendlyError = getErrorMessage(err);
      console.log('Friendly error message:', friendlyError);
      setError(friendlyError);
      // Persist error so it survives redirects
      sessionStorage.setItem('authError', friendlyError);
      
      // Show toast notification as well for better visibility
      toast.error(friendlyError);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoginError(false);
    setLoading(true);

    try {
      // Keep using direct Firebase for Google sign-in (as it's already secure)
      await signInWithGoogle();
      
      // If no MFA or email verification is required, set flag to trigger redirect after user state is updated
      if (!mfaRequired && !mfaEnrollmentRequired && !emailVerificationRequired) {
        setLoginError(false);
        setShouldRedirect(true);
      }
      setLoading(false);
      
    } catch (err: any) {
      setLoading(false);
      setLoginError(true);
      console.error('Google sign in error:', err);
      const friendlyError = getErrorMessage(err);
      setError(friendlyError);
      // Persist error so it survives redirects
      sessionStorage.setItem('authError', friendlyError);
      
      // Show toast notification as well
      toast.error(friendlyError);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={logoImage} 
              alt="NEM Insurance" 
              className="w-12 h-12 object-contain rounded"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(''); // Clear error when user starts typing
                }}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-red-900 hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <div>
              <Link to="/auth/reset-password" className="text-red-900 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        open={emailVerificationRequired}
        onClose={() => {}}
        email={email}
        onResendVerification={sendVerificationEmail}
        onCheckVerification={checkEmailVerification}
      />

      {/* MFA Modal */}
      <MFAModal
        isOpen={mfaRequired || mfaEnrollmentRequired}
        onClose={() => {}}
        type={mfaEnrollmentRequired ? 'enrollment' : 'verification'}
        onSuccess={() => {
          setShouldRedirect(true);
        }}
      />
    </div>
  );
};

export default SignIn;
