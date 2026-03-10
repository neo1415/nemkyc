/**
 * IdentifierFieldError Component
 * 
 * Displays error messages for verification API failures on the CAC/NIN field.
 * This component is attached ONLY to the identifier field (CAC/NIN).
 * 
 * CRITICAL: This component does NOT show matching errors.
 * Matching errors appear on the individual fields via FieldValidationIndicator.
 * 
 * This component only shows:
 * - Verification API errors (network, timeout, rate limit, auth, format)
 * - Loading indicator during verification
 * 
 * Requirements: 1.4, 18.1, 18.2, 18.3, 18.4
 */

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export interface IdentifierFieldErrorProps {
  /** Error message from verification API (null if no error) */
  verificationError: string | null;
  /** Whether verification is currently in progress */
  isVerifying: boolean;
}

/**
 * IdentifierFieldError Component
 * 
 * Renders verification status for the identifier field:
 * - Loading indicator when verifying
 * - Error message when verification fails
 * - Nothing when verification succeeds
 */
export const IdentifierFieldError: React.FC<IdentifierFieldErrorProps> = ({
  verificationError,
  isVerifying
}) => {
  // Show loading indicator during verification
  if (isVerifying) {
    return (
      <div className="flex items-center mt-1 text-sm text-blue-600" role="status" aria-live="polite">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
        <span>Verifying...</span>
      </div>
    );
  }

  // Show error message if verification failed
  if (verificationError) {
    return (
      <div
        className="flex items-start mt-1 text-sm text-red-600"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <span>{verificationError}</span>
      </div>
    );
  }

  // Render nothing when verification succeeds
  // (Field-level validation feedback is shown via FieldValidationIndicator)
  return null;
};

export default IdentifierFieldError;
