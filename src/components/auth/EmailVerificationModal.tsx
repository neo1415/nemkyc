import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onResendVerification: () => Promise<void>;
  onCheckVerification: () => Promise<boolean>;
}

/**
 * EmailVerificationModal - Modal shown when user tries to login with unverified email
 * 
 * Features:
 * - Clear instructions for email verification
 * - Resend verification email button
 * - Check verification status button
 * - Auto-close on successful verification
 */
const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  onClose,
  email,
  onResendVerification,
  onCheckVerification
}) => {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResend = async () => {
    try {
      setIsResending(true);
      await onResendVerification();
      setEmailSent(true);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      const isVerified = await onCheckVerification();
      
      if (isVerified) {
        toast.success('Email verified successfully! You can now log in.');
        onClose();
      } else {
        toast.error('Email not yet verified. Please check your email and click the verification link.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to check verification status');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle>Email Verification Required</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-2">
            <p>
              Please verify your email address before logging in.
            </p>
            <p className="font-medium text-gray-900">
              {email}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Check your email</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Look for an email from NEM Insurance</li>
                  <li>Check your spam/junk folder if you don't see it</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here and click "I've Verified My Email"</li>
                </ul>
              </div>
            </div>
          </div>

          {emailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-900">
                Verification email sent successfully!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending || isChecking}
            className="w-full sm:w-auto"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Email
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleCheckVerification}
            disabled={isResending || isChecking}
            className="w-full sm:w-auto"
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                I've Verified My Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailVerificationModal;
