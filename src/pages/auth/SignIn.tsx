
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { exchangeToken } from '../../services/authService';
import { processPendingSubmissionUtil } from '../../hooks/useAuthRequiredSubmit';  
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LogIn, Mail, Loader2 } from 'lucide-react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebase/config';
import MFAModal from '../../components/auth/MFAModal';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const { user, signIn, signInWithGoogle, mfaRequired, mfaEnrollmentRequired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle redirect after successful authentication and user state update
  useEffect(() => {
    if (shouldRedirect && user) {
      setShouldRedirect(false);
      
      // Check if there's a pending submission
      const hasPendingSubmission = sessionStorage.getItem('pendingSubmission');
      if (hasPendingSubmission) {
        // Process pending submission and redirect back to original form page
        const pendingData = JSON.parse(hasPendingSubmission);
        processPendingSubmissionUtil(user.email!).then(() => {
          // Redirect to the specific form page based on form type
          const formPageUrl = getFormPageUrl(pendingData.formType);
          navigate(formPageUrl, { replace: true });
        });
        return;
      }

      // Normal sign-in flow - role-based navigation
      if (['admin', 'super-admin', 'compliance', 'claims'].includes(user.role)) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, shouldRedirect, navigate, from]);

  // Helper function to get form page URL from form type
  const getFormPageUrl = (formType: string) => {
    const formTypeLower = formType.toLowerCase();
    
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
    setError('');
    setLoading(true);

    try {
      // Use AuthContext signIn method - this will handle the Firebase signIn and backend token exchange
      await signIn(email, password);
      
      // The signIn method will handle MFA flows automatically via AuthContext
      // If we reach here and no MFA is required, authentication was successful
      if (!mfaRequired && !mfaEnrollmentRequired) {
        // Set flag to trigger redirect after user state is updated
        setShouldRedirect(true);
      }
      // If MFA is required, the modal will handle the flow
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      // Keep using direct Firebase for Google sign-in (as it's already secure)
      await signInWithGoogle();
      
      // If no MFA is required, set flag to trigger redirect after user state is updated
      if (!mfaRequired && !mfaEnrollmentRequired) {
        setShouldRedirect(true);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-900 to-yellow-600 rounded-lg"></div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-red-900 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>

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
