/**
 * AccessibleNavigationButton Component
 * 
 * A navigation button wrapper that ensures proper keyboard accessibility
 * when validation blocking is active. Provides:
 * - Proper focus management
 * - Keyboard accessible tooltips via aria-describedby
 * - Clear disabled state communication
 * 
 * Requirements: 17.5
 */

import React from 'react';
import { ValidationTooltip } from './ValidationTooltip';

export interface AccessibleNavigationButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Whether the button is disabled due to validation */
  disabled: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Validation tooltip message */
  tooltipMessage?: string;
  /** List of mismatched fields for tooltip */
  mismatchedFields?: string[];
}

/**
 * AccessibleNavigationButton Component
 * 
 * Wraps a navigation button with proper accessibility attributes and
 * keyboard-accessible validation tooltip.
 */
export const AccessibleNavigationButton: React.FC<AccessibleNavigationButtonProps> = ({
  children,
  disabled,
  onClick,
  className = '',
  type = 'button',
  tooltipMessage = 'Please correct the following fields:',
  mismatchedFields = []
}) => {
  const tooltipId = 'navigation-validation-tooltip';
  const showTooltip = disabled && mismatchedFields.length > 0;

  return (
    <div className="relative inline-block">
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={className}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-disabled={disabled}
      >
        {children}
      </button>
      
      {showTooltip && (
        <ValidationTooltip
          show={true}
          message={tooltipMessage}
          mismatchedFields={mismatchedFields}
          id={tooltipId}
        />
      )}
    </div>
  );
};

export default AccessibleNavigationButton;
