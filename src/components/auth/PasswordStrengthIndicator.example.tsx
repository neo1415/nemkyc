/**
 * Example Usage: Password Strength Indicator Component
 * 
 * This file demonstrates how to use the PasswordStrengthIndicator component
 * in different scenarios.
 */

import React, { useState } from 'react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

// Example 1: Basic usage with password input
export const BasicExample: React.FC = () => {
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Basic Password Strength Indicator</h3>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}
      />
      <PasswordStrengthIndicator password={password} />
    </div>
  );
};

// Example 2: Minimal display (only progress bar and label)
export const MinimalExample: React.FC = () => {
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Minimal Display</h3>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}
      />
      <PasswordStrengthIndicator 
        password={password}
        showRequirements={false}
      />
    </div>
  );
};

// Example 3: Custom requirements
export const CustomRequirementsExample: React.FC = () => {
  const [password, setPassword] = useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Custom Requirements (8 characters minimum)</h3>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '16px',
          fontSize: '14px'
        }}
      />
      <PasswordStrengthIndicator 
        password={password}
        requirements={{
          minLength: 8
        }}
      />
    </div>
  );
};

// Example 4: In a form with validation
export const FormExample: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Check if password is strong enough
    const validation = require('../../utils/passwordValidation').validatePasswordStrength(password);
    if (!validation.valid) {
      setError('Password does not meet requirements');
      return;
    }
    
    setError('');
    alert('Password is valid!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Password Form with Validation</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <PasswordStrengthIndicator password={password} />
        
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px'
            }}
          />
        </div>
        
        {error && (
          <div style={{ color: '#f44336', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#800020',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

// Example 5: Side-by-side comparison
export const ComparisonExample: React.FC = () => {
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');

  return (
    <div style={{ padding: '20px' }}>
      <h3>Compare Two Passwords</h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <h4>Password 1</h4>
          <input
            type="password"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          />
          <PasswordStrengthIndicator password={password1} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h4>Password 2</h4>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          />
          <PasswordStrengthIndicator password={password2} />
        </div>
      </div>
    </div>
  );
};

export default {
  BasicExample,
  MinimalExample,
  CustomRequirementsExample,
  FormExample,
  ComparisonExample
};
