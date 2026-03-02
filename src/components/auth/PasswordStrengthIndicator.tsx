/**
 * Password Strength Indicator Component
 * 
 * Displays password strength with visual feedback including:
 * - Progress bar with color coding (red → yellow → green)
 * - Checklist of requirements with checkmarks
 * - Overall strength label
 * 
 * Updates in real-time as password changes.
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import {
  validatePasswordStrength,
  getStrengthColor,
  getStrengthLabel,
  getPasswordStrengthPercentage,
  type PasswordRequirements
} from '../../utils/passwordValidation';

// ========== Type Definitions ==========

export interface PasswordStrengthIndicatorProps {
  password: string;
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecialChar?: boolean;
  };
  showLabel?: boolean;
  showRequirements?: boolean;
}

// ========== Component ==========

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  requirements = {},
  showLabel = true,
  showRequirements = true
}) => {
  // Validate password strength
  const validation = validatePasswordStrength(password);
  const { requirements: reqs, strength } = validation;
  
  // Get visual properties
  const percentage = getPasswordStrengthPercentage(password);
  const color = getStrengthColor(strength);
  const label = getStrengthLabel(strength);

  // Requirement items for display
  const minLength = requirements.minLength !== undefined ? requirements.minLength : 12;
  const requirementItems = [
    {
      key: 'minLength',
      met: reqs.hasMinLength,
      label: `At least ${minLength} characters`,
      show: requirements.minLength !== 0
    },
    {
      key: 'uppercase',
      met: reqs.hasUppercase,
      label: 'One uppercase letter (A-Z)',
      show: requirements.requireUppercase !== false
    },
    {
      key: 'lowercase',
      met: reqs.hasLowercase,
      label: 'One lowercase letter (a-z)',
      show: requirements.requireLowercase !== false
    },
    {
      key: 'number',
      met: reqs.hasNumber,
      label: 'One number (0-9)',
      show: requirements.requireNumber !== false
    },
    {
      key: 'specialChar',
      met: reqs.hasSpecialChar,
      label: 'One special character (!@#$%^&*...)',
      show: requirements.requireSpecialChar !== false
    }
  ].filter(item => item.show);

  return (
    <div className="password-strength-indicator" style={{ width: '100%' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: color,
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Strength Label */}
      {showLabel && password && (
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: color,
            marginBottom: showRequirements ? '12px' : '0'
          }}
        >
          Password Strength: {label}
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && password && (
        <div style={{ fontSize: '13px' }}>
          {requirementItems.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '6px',
                color: item.met ? '#4caf50' : '#666'
              }}
            >
              {item.met ? (
                <Check size={16} style={{ marginRight: '8px', color: '#4caf50' }} />
              ) : (
                <X size={16} style={{ marginRight: '8px', color: '#999' }} />
              )}
              <span style={{ textDecoration: item.met ? 'line-through' : 'none' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
