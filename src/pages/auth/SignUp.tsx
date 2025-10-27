import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerUser } from '../../services/authService';
import { getFormPageUrl } from '../../hooks/useAuthRequiredSubmit';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { UserPlus, Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import logoImage from '../../assets/NEMs-Logo.jpg';

// Helper function to translate Firebase errors to user-friendly messages
const getErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Firebase Auth errors
  if (errorCode === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead or use a different email.';
  }
  if (errorCode === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (errorCode === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.';
  }
  if (errorCode === 'auth/operation-not-allowed') {
    return 'Account creation is currently disabled. Please contact support.';
  }
  if (errorCode === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (errorCode === 'auth/too-many-requests') {
    return 'Too many signup attempts. Please wait a few minutes and try again.';
  }

  // Network and server errors
  if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (errorMessage.toLowerCase().includes('timeout')) {
    return 'The request took too long. Please check your connection and try again.';
  }

  // Backend registration errors
  if (errorMessage.toLowerCase().includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // Default user-friendly message
  return 'Unable to create your account. Please try again. If the problem persists, contact support.';
};

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    notificationPreference: 'email' as 'email' | 'sms',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedFormType, setSubmittedFormType] = useState('');
  
  const { user, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.notificationPreference === 'sms' && !formData.phone) {
      setError('Phone number is required for SMS notifications');
      return;
    }

    setLoading(true);

    try {
      // Use backend registration service
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        'user' // default role
      );
      
      if (!result.success) {
        const errorObj = { message: result.error || 'Failed to create account' };
        setError(getErrorMessage(errorObj));
        return;
      }
      
      // Check if there's a pending submission
      const pendingData = sessionStorage.getItem('pendingSubmission');
      if (pendingData) {
        const { formType } = JSON.parse(pendingData);
        console.log('🎯 Pending submission detected after signup, redirecting to form page');
        
        // Redirect to form page - the form will handle submission processing
        const formPageUrl = getFormPageUrl(formType);
        navigate(formPageUrl, { replace: true });
        return;
      } else {
        // Navigate to dashboard for default users
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(getErrorMessage(err));
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
      
      // Check if there's a pending submission
      const pendingData = sessionStorage.getItem('pendingSubmission');
      if (pendingData) {
        const { formType } = JSON.parse(pendingData);
        console.log('🎯 Pending submission detected after Google signup, redirecting to form page');
        
        // Redirect to form page - the form will handle submission processing
        const formPageUrl = getFormPageUrl(formType);
        navigate(formPageUrl, { replace: true });
        return;
      } else {
        // Navigate based on user role from context
        if (user?.role && ['admin', 'super admin', 'compliance', 'claims'].includes(user.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get form page URL from form type
  const getFormPageUrl = (formType: string) => {
    const formTypeLower = formType.toLowerCase();
    
    if (formTypeLower.includes('motor')) {
      return '/claims/motor';
    }
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
    if (formTypeLower.includes('fire')) {
      return '/claims/fire-special-perils';
    }
    if (formTypeLower.includes('burglary')) {
      return '/claims/burglary';
    }
    if (formTypeLower.includes('all risk') || formTypeLower.includes('allrisk')) {
      return '/claims/all-risk';
    }
    
    // Default fallback
    return '/claims/motor';
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
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Sign up to access insurance forms and services
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Notification Preference</Label>
              <RadioGroup
                value={formData.notificationPreference}
                onValueChange={(value) => setFormData({ ...formData, notificationPreference: value as 'email' | 'sms' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email-pref" />
                  <Label htmlFor="email-pref">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms-pref" />
                  <Label htmlFor="sms-pref">SMS</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.notificationPreference === 'sms' && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
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
                  Signing up...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Sign up with Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-red-900 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <DialogTitle className="text-center">Form Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your {submittedFormType} has been submitted successfully. Confirmation emails have been sent to the relevant departments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 pt-4">
            <Button 
              onClick={() => {
                setShowSuccess(false);
                
                // Navigate based on user role from context
                if (user?.role && ['admin', 'super admin', 'compliance', 'claims'].includes(user.role)) {
                  navigate('/admin');
                } else {
                  navigate('/dashboard');
                }
              }}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuccess(false);
                navigate(-1);
              }}
              className="w-full"
            >
              Back to Form
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignUp;
