/**
 * FieldValidationIndicator Component
 * 
 * Displays visual feedback for field validation status:
 * - Green checkmark icon for matched fields
 * - Red error message below field for mismatched fields
 * - Nothing for not_verified or pending status
 * 
 * CRITICAL: This component is attached to EACH FIELD, not to the CAC/NIN field.
 * Error messages appear on the specific field that has the mismatch.
 * 
 * Requirements: 3.1, 3.2, 4.1, 4.2
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { FieldValidationStatus } from '@/types/realtimeVerificationValidation';

export interface FieldValidationIndicatorProps {
  /** Current validation status of the field */
  status: FieldValidationStatus;
  /** Error message to display (only for mismatched fields) */
  errorMessage: string | null;
  /** ID of the field this indicator is for (used for aria-describedby) */
  fieldId: string;
  /** Human-readable label of the field (used in error message) */
  fieldLabel: string;
}

/**
 * FieldValidationIndicator Component
 * 
 * Renders validation feedback based on field status:
 * - matched: Green checkmark icon
 * - mismatched: Red error message below field
 * - not_verified/pending: Nothing
 */
export const FieldValidationIndicator: React.FC<FieldValidationIndicatorProps> = ({
  status,
  errorMessage,
  fieldId,
  fieldLabel
}) => {
  // Render green checkmark for matched fields
  if (status === FieldValidationStatus.MATCHED) {
    return (
      <div className="flex items-center mt-1" role="status" aria-live="polite">
        <CheckCircle className="w-4 h-4 text-green-600 mr-1" aria-hidden="true" />
        <span className="text-sm text-green-600">Verified</span>
      </div>
    );
  }

  // Render red error message for mismatched fields
  if (status === FieldValidationStatus.MISMATCHED && errorMessage) {
    return (
      <div
        id={`${fieldId}-validation-error`}
        className="mt-1 text-sm text-red-600"
        role="alert"
        aria-live="assertive"
      >
        {errorMessage}
      </div>
    );
  }

  // Render nothing for not_verified or pending status
  return null;
};

export default FieldValidationIndicator;
