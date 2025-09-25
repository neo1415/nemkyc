import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, Phone, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'enrollment' | 'verification' | 'email-verification';
  onSuccess: () => void;
}

const MFAModal: React.FC<MFAModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const { enrollMFA, verifyMFAEnrollment, verifyMFA, resendMFACode, sendVerificationEmail, checkEmailVerification } = useAuth();

  // Initialize reCAPTCHA for phone auth
  useEffect(() => {
    if (isOpen && type === 'enrollment') {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
      document.head.appendChild(script);

      // Initialize invisible reCAPTCHA
      (window as any).recaptchaVerifier = new (window as any).firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        }
      });

      return () => {
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
        }
      };
    }
  }, [isOpen, type]);

  const handleSendEmailVerification = async () => {
    setError('');
    setLoading(true);

    try {
      await sendVerificationEmail();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setError('');
    setLoading(true);

    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        // Email is verified, modal will close and MFA enrollment modal will open
        return;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await enrollMFA(phoneNumber);
      setCodeSent(true);
      toast.success('Verification code sent to your phone');
    } catch (err: any) {
      console.error('Error sending MFA code:', err);
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (attempts >= maxAttempts) {
      setError('Maximum verification attempts exceeded. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'enrollment') {
        await verifyMFAEnrollment(verificationCode);
        toast.success('MFA enrollment successful!');
      } else {
        await verifyMFA(verificationCode);
        toast.success('MFA verification successful!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error verifying MFA code:', err);
      setAttempts(prev => prev + 1);
      const remainingAttempts = maxAttempts - attempts - 1;
      
      if (remainingAttempts > 0) {
        setError(`Invalid code. ${remainingAttempts} attempts remaining.`);
      } else {
        setError('Maximum attempts exceeded. Please try again later.');
      }
      
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      await resendMFACode();
      toast.success('Verification code resent');
      setAttempts(0); // Reset attempts on resend
    } catch (err: any) {
      console.error('Error resending MFA code:', err);
      setError(err.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setVerificationCode('');
    setError('');
    setCodeSent(false);
    setAttempts(0);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const getTitle = () => {
    switch (type) {
      case 'email-verification':
        return 'Email Verification Required';
      case 'enrollment':
        return 'Set Up Two-Factor Authentication';
      case 'verification':
        return 'Two-Factor Authentication Required';
      default:
        return 'Authentication Required';
    }
  };

  const isEnrollmentFlow = type === 'enrollment';
  const showPhoneInput = isEnrollmentFlow && !codeSent;
  const showCodeInput = (isEnrollmentFlow && codeSent) || type === 'verification';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {getTitle()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {type === 'email-verification' ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Your email address must be verified before you can enroll in multi-factor authentication.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Button onClick={handleSendEmailVerification} className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Click the button above to receive a verification email, then click the link in the email.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <Button onClick={handleCheckEmailVerification} variant="outline" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'I have verified my email'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {attempts >= 3 && attempts < maxAttempts && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Multiple failed attempts detected. Please double-check your verification code.
                    </AlertDescription>
                  </Alert>
                )}

                {showPhoneInput && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>We'll send a verification code to your phone</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <Button 
                      onClick={handleSendCode} 
                      disabled={loading || !phoneNumber.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Code...
                        </>
                      ) : (
                        <>
                          <Phone className="mr-2 h-4 w-4" />
                          Send Verification Code
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {showCodeInput && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                      <span>
                        {isEnrollmentFlow 
                          ? 'Enter the verification code sent to your phone' 
                          : 'Enter your authentication code to continue'
                        }
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        disabled={loading || attempts >= maxAttempts}
                        maxLength={6}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleVerifyCode} 
                        disabled={loading || !verificationCode.trim() || attempts >= maxAttempts}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify Code'
                        )}
                      </Button>

                      <Button 
                        variant="outline"
                        onClick={handleResendCode}
                        disabled={resendLoading || attempts >= maxAttempts}
                      >
                        {resendLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Resend'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                  {isEnrollmentFlow 
                    ? 'Your role requires two-factor authentication for enhanced security. This is a one-time setup.'
                    : 'Two-factor authentication is required every 3rd login for your security role.'
                  }
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </>
  );
};

export default MFAModal;