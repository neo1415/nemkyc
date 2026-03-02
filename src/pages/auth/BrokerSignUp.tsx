import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerUser } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { UserPlus, Loader2, Check, X } from 'lucide-react';
import logoImage from '../../assets/NEMs-Logo.jpg';

// Password validation rules (must match server-side validation)
const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '@$!%*?&'
};

// Password validation helper
const validatePassword = (password: string) => {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };
};

const isPasswordValid = (password: string) => {
  const checks = validatePassword(password);
  return Object.values(checks).every(Boolean);
};

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
    return 'Password is too weak. Please use at least 12 characters with uppercase, lowercase, number, and special character.';
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
  if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('already in use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // Return the error message as-is if it's already user-friendly (from backend validation)
  if (errorMessage && errorMessage.length > 0 && errorMessage !== 'Registration failed') {
    return errorMessage;
  }

  // Default user-friendly message
  return 'Unable to create your account. Please try again. If the problem persists, contact support.';
};

// Password requirements component
const PasswordRequirements: React.FC<{ password: string; show: boolean }> = ({ password, show }) => {
  const checks = validatePassword(password);
  const allValid = Object.values(checks).every(Boolean);
  
  if (!show || allValid) return null;
  
  const requirements = [
    { key: 'minLength', label: `At least ${PASSWORD_RULES.minLength} characters`, valid: checks.minLength },
    { key: 'hasUppercase', label: 'One uppercase letter (A-Z)', valid: checks.hasUppercase },
    { key: 'hasLowercase', label: 'One lowercase letter (a-z)', valid: checks.hasLowercase },
    { key: 'hasNumber', label: 'One number (0-9)', valid: checks.hasNumber },
    { key: 'hasSpecial', label: `One special character (${PASSWORD_RULES.specialChars})`, valid: checks.hasSpecial },
  ];
  
  return (
    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
      <p className="text-slate-600 font-medium mb-2">Password must contain:</p>
      <ul className="space-y-1">
        {requirements.map(req => (
          <li key={req.key} className={`flex items-center gap-2 ${req.valid ? 'text-green-600' : 'text-slate-500'}`}>
            {req.valid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-slate-400" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const BrokerSignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    notificationPreference: 'email' as 'email' | 'sms',
    phone: '',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  
  // Memoized password validation
  const passwordValidation = useMemo(() => validatePassword(formData.password), [formData.password]);
  const isPasswordStrong = useMemo(() => isPasswordValid(formData.password), [formData.password]);

  // Handle redirect after successful authentication - BROKER SPECIFIC
  useEffect(() => {
    if (shouldRedirect && user) {
      console.log('🎯 Broker authenticated after signup, redirecting to /admin/identity');
      setShouldRedirect(false);
      
      // Redirect broker to identity page with upload dialog open
      navigate('/admin/identity', { replace: true, state: { openUploadDialog: true } });
    }
  }, [user, shouldRedirect, navigate]);

  // Additional effect to handle when user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🎯 Broker already authenticated on signup page, redirecting to /admin/identity');
      
      // Redirect broker to identity page with upload dialog open
      navigate('/admin/identity', { replace: true, state: { openUploadDialog: true } });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isPasswordStrong) {
      errors.password = 'Password does not meet the requirements';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Date of birth validation - must be 18+
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dateOfBirth = 'You must be at least 18 years old to register';
      }
    }

    // Phone validation for SMS preference
    if (formData.notificationPreference === 'sms' && !formData.phone) {
      errors.phone = 'Phone number is required for SMS notifications';
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Show the first error as the main error message
      const firstError = Object.values(errors)[0];
      setError(firstError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Use backend registration service to create the account with BROKER role
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        'user', // default role (backend will handle broker assignment)
        formData.dateOfBirth,
        'broker' // Pass broker userType to backend
      );
      
      if (!result.success) {
        // Show the actual error from the backend (already user-friendly)
        const errorMsg = getErrorMessage({ message: result.error });
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }
      
      // Account created successfully - now sign in the user
      console.log('✅ Broker account created, now signing in...');
      
      // Small delay to ensure Firestore document is fully written before signing in
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await signIn(formData.email, formData.password);
      
      // Set flag to trigger redirect after user state updates
      setShouldRedirect(true);
      
    } catch (err: any) {
      console.error('Broker sign up error:', err);
      setError(getErrorMessage(err));
      setIsSubmitting(false);
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
          <CardTitle className="text-2xl font-bold text-center">Broker Registration</CardTitle>
          <CardDescription className="text-center">
            Create your broker account to access identity verification services
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
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                className={fieldErrors.name ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                className={fieldErrors.email ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => {
                  setFormData({ ...formData, dateOfBirth: e.target.value });
                  if (fieldErrors.dateOfBirth) setFieldErrors(prev => ({ ...prev, dateOfBirth: '' }));
                }}
                className={fieldErrors.dateOfBirth ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
                max={(() => {
                  const date = new Date();
                  date.setFullYear(date.getFullYear() - 18);
                  return date.toISOString().split('T')[0];
                })()}
              />
              <p className="text-xs text-slate-500">You must be at least 18 years old</p>
              {fieldErrors.dateOfBirth && (
                <p className="text-sm text-red-500">{fieldErrors.dateOfBirth}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                onFocus={() => setShowPasswordRules(true)}
                className={fieldErrors.password ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
              />
              <PasswordRequirements password={formData.password} show={showPasswordRules} />
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Passwords match
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Notification Preference</Label>
              <RadioGroup
                value={formData.notificationPreference}
                onValueChange={(value) => setFormData({ ...formData, notificationPreference: value as 'email' | 'sms' })}
                disabled={isSubmitting}
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
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  className={fieldErrors.phone ? 'border-red-500' : ''}
                  required
                  disabled={isSubmitting}
                />
                {fieldErrors.phone && (
                  <p className="text-sm text-red-500">{fieldErrors.phone}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating broker account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Broker Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/auth/signin" className="text-red-900 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerSignUp;
