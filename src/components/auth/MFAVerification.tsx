import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const MFAVerification: React.FC = () => {
  const { verifyMFA, resendMFACode, firebaseUser } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) return;

    setLoading(true);
    setError('');

    try {
      await verifyMFA(verificationCode);
      toast.success('MFA verification successful!');
    } catch (error: any) {
      setError(error.message);
      setAttempts(prev => prev + 1);
      toast.error(error.message);
      
      // Clear the input on error
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');

    try {
      await resendMFACode();
      toast.success('New verification code sent!');
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setResending(false);
    }
  };

  // Show warning if too many attempts
  const showAttemptsWarning = attempts >= 3;
  const maxAttemptsReached = attempts >= 5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
          <CardDescription>
            Enter the verification code sent to your registered phone number
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showAttemptsWarning && !maxAttemptsReached && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: {attempts} failed attempts. Account may be temporarily locked after 5 failed attempts.
              </AlertDescription>
            </Alert>
          )}

          {maxAttemptsReached && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Too many failed attempts. Please wait 15 minutes before trying again or contact support.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={maxAttemptsReached}
                required
              />
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app or SMS
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || maxAttemptsReached || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={resending || maxAttemptsReached}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending...' : 'Resend Code'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Didn't receive a code? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble? Contact support for assistance
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MFAVerification;