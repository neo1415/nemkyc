import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, signInWithEmailAndPassword, verifyPasswordResetCode } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validatePasswordStrength } from '../../utils/passwordValidation';
import logoImage from '../../assets/NEMs-Logo.jpg';

/** Returns an error message, or null for a valid date of someone aged 18 or over. */
export const validateDateOfBirth = (value: string): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return 'Enter your date of birth';
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--;
  if (year < 1900 || age > 120) return 'Enter a valid date of birth';
  if (age < 18) return 'You must be at least 18 years old';
  return null;
};

const ResetPasswordConfirm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeValid, setCodeValid] = useState(false);

  const oobCode = searchParams.get('oobCode');
  // Accounts created from a guest submission arrive with accountSetup=1 in the continue URL: they
  // also give their date of birth here (ordinary forgot-password resets do not).
  const isAccountSetup = (searchParams.get('continueUrl') || '').includes('accountSetup=1');
  const [dateOfBirth, setDateOfBirth] = useState('');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid or missing reset code');
        setVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setCodeValid(true);
      } catch (err: any) {
        console.error('Code verification error:', err);
        if (err.code === 'auth/invalid-action-code') {
          setError('This password reset link has expired or has already been used');
        } else {
          setError('Invalid or expired reset link');
        }
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const strength = validatePasswordStrength(newPassword);
    if (!strength.isValid) {
      setError(strength.errors[0] || 'Choose a stronger password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (isAccountSetup) {
      const ageError = validateDateOfBirth(dateOfBirth);
      if (ageError) {
        setError(ageError);
        return;
      }
    }

    if (!oobCode) {
      setError('Invalid reset code');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      if (isAccountSetup) {
        // Sign in with the new password and store the date of birth on the profile. The password is
        // already set at this point, so a failure here must not look like the reset failed.
        try {
          const { user } = await signInWithEmailAndPassword(auth, email, newPassword);
          await Promise.all([
            updateDoc(doc(db, 'userroles', user.uid), { dateOfBirth }),
            updateDoc(doc(db, 'users', user.uid), { dateOfBirth }),
          ]);
        } catch (profileError) {
          console.error('Saving date of birth after account setup failed:', profileError);
          toast.warning('Your password is set. Please add your date of birth from your profile.');
        }
        setSuccess(true);
        toast.success('Your account is ready');
        setTimeout(() => navigate('/dashboard'), 1500);
        return;
      }

      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password');
      } else if (err.code === 'auth/invalid-action-code') {
        setError('This reset link has expired or has already been used');
      } else {
        setError(err.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!codeValid) {
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
            <CardTitle className="text-2xl font-bold text-center">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link to="/auth/reset-password">
                <Button variant="outline" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>
              <Link to="/auth/signin" className="block text-sm text-red-900 hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl font-bold text-center">
            {isAccountSetup ? 'Set Up Your Account' : 'Set New Password'}
          </CardTitle>
          <CardDescription className="text-center">
            {isAccountSetup
              ? `Choose a password and confirm your date of birth for ${email}`
              : `Enter your new password for ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {isAccountSetup
                    ? 'Your account is ready! Taking you to your dashboard...'
                    : 'Password reset successful! Redirecting to sign in...'}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {isAccountSetup && (
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    {/* A native date input yields 'YYYY-MM-DD' with no time zone involved. */}
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">You must be at least 18 years old</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <PasswordInput
                    id="newPassword"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput
                    id="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                Remember your password?{' '}
                <Link to="/auth/signin" className="text-red-900 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordConfirm;
