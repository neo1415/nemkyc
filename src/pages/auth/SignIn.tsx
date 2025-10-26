import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { exchangeToken } from '../../services/authService';
import { getFormPageUrl, hasPendingSubmission } from '../../hooks/useAuthRequiredSubmit';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LogIn, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase/config';
import MFAModal from '../../components/auth/MFAModal';
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
  
  const { user, signIn, signInWithGoogle, mfaRequired, mfaEnrollmentRequired, emailVerificationRequired } = useAuth();
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
      if (['admin', 'super admin', 'compliance', 'claims'].includes(user.role)) {
        console.log('🎯 Admin user detected, redirecting to /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('🎯 Regular user, redirecting to:', from);
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
      if (['admin', 'super admin', 'compliance', 'claims'].includes(user.role)) {
        console.log('🎯 Admin user already authenticated, redirecting to /admin');
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

  // Helper function to get form page URL from form type
  const getFormPageUrl = (formType: string) => {
    const formTypeLower = formType.toLowerCase();
    
    // KYC Forms
    if (formTypeLower.includes('individual kyc')) {
      return '/kyc/individual';
    }
    if (formTypeLower.includes('corporate kyc')) {
      return '/kyc/corporate';
    }
    
    // CDD Forms
    if (formTypeLower.includes('individual cdd')) {
      return '/cdd/individual';
    }
    if (formTypeLower.includes('corporate cdd')) {
      return '/cdd/corporate';
    }
    if (formTypeLower.includes('brokers cdd')) {
      return '/cdd/brokers';
    }
    if (formTypeLower.includes('agents cdd')) {
      return '/cdd/agents';
    }
    if (formTypeLower.includes('partners cdd')) {
      return '/cdd/partners';
    }
    if (formTypeLower.includes('naicom corporate')) {
      return '/cdd/naicom-corporate';
    }
    if (formTypeLower.includes('naicom partners')) {
      return '/cdd/naicom-partners';
    }
    
    // Claims Forms
    if (formTypeLower.includes('employers liability') && !formTypeLower.includes('combined')) {
      return '/claims/employers-liability';
    }
    if (formTypeLower.includes('combined') && formTypeLower.includes('gpa')) {
      return '/claims/combined-gpa-employers-liability';
    }
    if (formTypeLower.includes('public liability')) {
      return '/claims/public-liability';
    }
    if (formTypeLower.includes('professional indemnity')) {
      return '/claims/professional-indemnity';
    }
    if (formTypeLower.includes('motor')) {
      return '/claims/motor';
    }
    if (formTypeLower.includes('fire')) {
      return '/claims/fire-special-perils';
    }
    if (formTypeLower.includes('burglary')) {
      return '/claims/burglary';
    }
    if (formTypeLower.includes('all risk') || formTypeLower.includes('allrisk')) {
      return '/claims/all-risk';
    }
    if (formTypeLower.includes('goods')) {
      return '/claims/goods-in-transit';
    }
    if (formTypeLower.includes('money')) {
      return '/claims/money-insurance';
    }
    if (formTypeLower.includes('fidelity')) {
      return '/claims/fidelity-guarantee';
    }
    if (formTypeLower.includes('contractors')) {
      return '/claims/contractors-plant-machinery';
    }
    if (formTypeLower.includes('group') && formTypeLower.includes('personal')) {
      return '/claims/group-personal-accident';
    }
    if (formTypeLower.includes('rent')) {
      return '/claims/rent-assurance';
    }
    
    // Default fallback
    return '/dashboard';
  };

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
              <Input
                id="password"
                type="password"
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

      {/* MFA Modal */}
      <MFAModal
        isOpen={mfaRequired || mfaEnrollmentRequired || emailVerificationRequired}
        onClose={() => {}}
        type={emailVerificationRequired ? 'email-verification' : (mfaEnrollmentRequired ? 'enrollment' : 'verification')}
        onSuccess={() => {
          setShouldRedirect(true);
        }}
      />
    </div>
  );
};

export default SignIn;
