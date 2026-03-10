/**
 * ValidationAnnouncer Component
 * 
 * Provides centralized aria-live announcements for validation state changes.
 * This component creates a screen reader announcement region that announces:
 * - When a field becomes matched
 * - When a field becomes mismatched
 * - When all fields are validated successfully
 * 
 * Requirements: 17.3
 */

import React, { useEffect, useRef } from 'react';
import { FieldValidationState, FieldValidationStatus } from '@/types/realtimeVerificationValidation';

export interface ValidationAnnouncerProps {
  /** Current field validation states */
  fieldValidationStates: Record<string, FieldValidationState>;
  /** Field configurations for getting labels */
  fieldLabels: Record<string, string>;
}

/**
 * ValidationAnnouncer Component
 * 
 * Monitors validation state changes and announces them to screen readers.
 * Uses aria-live="polite" to avoid interrupting user input.
 */
export const ValidationAnnouncer: React.FC<ValidationAnnouncerProps> = ({
  fieldValidationStates,
  fieldLabels
}) => {
  const [announcement, setAnnouncement] = React.useState<string>('');
  const previousStatesRef = useRef<Record<string, FieldValidationState>>({});

  useEffect(() => {
    const previousStates = previousStatesRef.current;
    const currentStates = fieldValidationStates;

    // Check for state changes
    const changes: { fieldName: string; oldStatus: FieldValidationStatus; newStatus: FieldValidationStatus }[] = [];

    for (const [fieldName, currentState] of Object.entries(currentStates)) {
      const previousState = previousStates[fieldName];
      
      if (previousState && previousState.status !== currentState.status) {
        changes.push({
          fieldName,
          oldStatus: previousState.status,
          newStatus: currentState.status
        });
      }
    }

    // Generate announcement based on changes
    if (changes.length > 0) {
      const announcements: string[] = [];

      for (const change of changes) {
        const fieldLabel = fieldLabels[change.fieldName] || change.fieldName;

        if (change.newStatus === FieldValidationStatus.MATCHED) {
          announcements.push(`${fieldLabel} is now verified and matches records.`);
        } else if (change.newStatus === FieldValidationStatus.MISMATCHED) {
          announcements.push(`${fieldLabel} does not match verification records. Please correct this field.`);
        }
      }

      // Check if all fields are now validated
      const allMatched = Object.values(currentStates).every(
        state => state.status === FieldValidationStatus.MATCHED || state.status === FieldValidationStatus.NOT_VERIFIED
      );

      const anyMismatched = Object.values(currentStates).some(
        state => state.status === FieldValidationStatus.MISMATCHED
      );

      if (allMatched && changes.some(c => c.newStatus === FieldValidationStatus.MATCHED)) {
        announcements.push('All fields have been verified successfully. You may proceed to the next step.');
      } else if (anyMismatched) {
        const mismatchCount = Object.values(currentStates).filter(
          state => state.status === FieldValidationStatus.MISMATCHED
        ).length;
        announcements.push(`${mismatchCount} ${mismatchCount === 1 ? 'field needs' : 'fields need'} correction before you can proceed.`);
      }

      // Set announcement
      if (announcements.length > 0) {
        setAnnouncement(announcements.join(' '));
      }
    }

    // Update previous states
    previousStatesRef.current = { ...currentStates };
  }, [fieldValidationStates, fieldLabels]);

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

export default ValidationAnnouncer;
