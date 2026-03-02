/**
 * Unit Tests: Password Strength Indicator Component
 * 
 * Tests the PasswordStrengthIndicator component with specific examples
 * to verify correct rendering and behavior.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';

describe('PasswordStrengthIndicator Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    expect(container.querySelector('.password-strength-indicator')).toBeTruthy();
  });

  it('should not show label or requirements for empty password', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />);
    const text = container.textContent || '';
    expect(text).not.toContain('Password Strength');
    expect(text).not.toContain('At least');
  });

  it('should show "Weak" for password with only lowercase letters', () => {
    const { container } = render(<PasswordStrengthIndicator password="abcdefgh" />);
    const text = container.textContent || '';
    expect(text).toContain('Weak');
  });

  it('should show "Medium" for password meeting 3-4 requirements', () => {
    const { container } = render(<PasswordStrengthIndicator password="Abcdefgh123" />);
    const text = container.textContent || '';
    expect(text).toContain('Medium');
  });

  it('should show "Strong" for password meeting all requirements', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="MyP@ssw0rd123" />
    );
    const text = container.textContent || '';
    expect(text).toContain('Strong');
  });

  it('should display all 5 requirements when showRequirements is true', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" showRequirements={true} />
    );
    const text = container.textContent || '';
    
    expect(text).toContain('At least');
    expect(text).toContain('uppercase');
    expect(text).toContain('lowercase');
    expect(text).toContain('number');
    expect(text).toContain('special character');
  });

  it('should not display requirements when showRequirements is false', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" showRequirements={false} />
    );
    const text = container.textContent || '';
    
    expect(text).not.toContain('At least');
  });

  it('should not display label when showLabel is false', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" showLabel={false} />
    );
    const text = container.textContent || '';
    
    expect(text).not.toContain('Password Strength');
  });

  it('should show checkmarks for met requirements', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="MyP@ssw0rd123" />
    );
    
    // Should have SVG icons (checkmarks and X marks)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should render progress bar', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="test" />
    );
    
    // Should have a progress bar with background color
    const progressBars = container.querySelectorAll('div[style*="background-color"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should accept custom minLength requirement', () => {
    const { container } = render(
      <PasswordStrengthIndicator 
        password="test" 
        requirements={{ minLength: 8 }}
      />
    );
    const text = container.textContent || '';
    
    expect(text).toContain('At least 8 characters');
  });

  it('should handle very long passwords', () => {
    const longPassword = 'A'.repeat(100) + 'a1@';
    const { container } = render(
      <PasswordStrengthIndicator password={longPassword} />
    );
    const text = container.textContent || '';
    
    expect(text).toContain('Strong');
  });

  it('should handle special characters correctly', () => {
    const { container } = render(
      <PasswordStrengthIndicator password="MyP@ssw0rd123!#$" />
    );
    const text = container.textContent || '';
    
    expect(text).toContain('Strong');
  });

  it('should update when password changes', () => {
    const { container, rerender } = render(
      <PasswordStrengthIndicator password="weak" />
    );
    
    let text = container.textContent || '';
    expect(text).toContain('Weak');
    
    // Update password
    rerender(<PasswordStrengthIndicator password="MyP@ssw0rd123" />);
    
    text = container.textContent || '';
    expect(text).toContain('Strong');
  });
});
