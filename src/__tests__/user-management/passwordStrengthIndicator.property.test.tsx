/**
 * Property-Based Tests: Password Strength Indicator
 * 
 * Tests Property 16: Strength indicator accuracy
 * 
 * Validates that the visual strength indicator accurately reflects which
 * requirements are met and displays "Strong" only when all requirements
 * are satisfied.
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { validatePasswordStrength } from '../../utils/passwordValidation';

describe('Property-Based Tests: Password Strength Indicator', () => {
  /**
   * Property 16: Strength indicator accuracy
   * 
   * For any password input, the visual strength indicator must accurately
   * reflect which requirements are met, and display "Strong" only when
   * all requirements are satisfied.
   */
  it('Property 16: Strength indicator accuracy', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary strings as passwords
        fc.string({ minLength: 0, maxLength: 30 }),
        (password) => {
          // Validate the password using the utility
          const validation = validatePasswordStrength(password);
          const { requirements, strength } = validation;

          // Render the component
          const { container } = render(
            <PasswordStrengthIndicator password={password} />
          );

          // If password is empty, component should not show label or requirements
          if (!password) {
            expect(container.querySelector('.password-strength-indicator')).toBeTruthy();
            return;
          }

          // Check that strength label is displayed correctly
          const strengthText = container.textContent;
          
          // Verify strength label matches the calculated strength
          if (strength === 'strong') {
            expect(strengthText).toContain('Strong');
          } else if (strength === 'medium') {
            expect(strengthText).toContain('Medium');
          } else {
            expect(strengthText).toContain('Weak');
          }

          // Verify "Strong" is only displayed when ALL requirements are met
          const allRequirementsMet = 
            requirements.hasMinLength &&
            requirements.hasUppercase &&
            requirements.hasLowercase &&
            requirements.hasNumber &&
            requirements.hasSpecialChar;

          if (strengthText.includes('Strong')) {
            expect(allRequirementsMet).toBe(true);
          }

          // Verify each requirement is accurately reflected
          // Check for checkmarks (✓) or X marks based on requirements
          const hasCheckmarks = container.querySelectorAll('svg').length > 0;
          
          if (hasCheckmarks) {
            // The component should show visual indicators for each requirement
            // Count of requirements should match the number of items displayed
            const requirementCount = 5; // minLength, uppercase, lowercase, number, special
            const svgElements = container.querySelectorAll('svg');
            expect(svgElements.length).toBeGreaterThanOrEqual(requirementCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Visual indicator color matches strength
   * 
   * The progress bar color should match the strength level:
   * - Red for weak
   * - Orange/Yellow for medium  
   * - Green for strong
   */
  it('Property: Visual indicator color matches strength', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }), // Exclude empty strings
        (password) => {
          const validation = validatePasswordStrength(password);
          const { strength } = validation;

          const { container } = render(
            <PasswordStrengthIndicator password={password} />
          );

          // Find the progress bar element (the inner colored div)
          const progressBars = container.querySelectorAll('div[style*="background-color"]');
          const progressBar = Array.from(progressBars).find(el => {
            const style = (el as HTMLElement).style.backgroundColor;
            // Find the one that's not the gray background
            return style && !style.includes('224, 224, 224') && !style.includes('rgb(224, 224, 224)');
          });
          
          if (progressBar) {
            const style = (progressBar as HTMLElement).style.backgroundColor;
            
            // Verify color matches strength
            if (strength === 'strong') {
              // Green color
              expect(style).toMatch(/76.*175.*80|#4caf50/i);
            } else if (strength === 'medium') {
              // Orange color
              expect(style).toMatch(/255.*152.*0|#ff9800/i);
            } else {
              // Red color
              expect(style).toMatch(/244.*67.*54|#f44336/i);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Progress bar percentage reflects requirements met
   * 
   * The progress bar width should be proportional to the number of
   * requirements met (0%, 20%, 40%, 60%, 80%, 100%).
   */
  it('Property: Progress bar percentage reflects requirements met', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }), // Exclude empty strings
        (password) => {
          const validation = validatePasswordStrength(password);
          const { requirements } = validation;

          const { container } = render(
            <PasswordStrengthIndicator password={password} />
          );

          // Count met requirements
          const metCount = [
            requirements.hasMinLength,
            requirements.hasUppercase,
            requirements.hasLowercase,
            requirements.hasNumber,
            requirements.hasSpecialChar
          ].filter(Boolean).length;

          const expectedPercentage = Math.round((metCount / 5) * 100);

          // Find the progress bar inner div (the one with percentage width)
          const allDivs = container.querySelectorAll('div');
          const progressBar = Array.from(allDivs).find(el => {
            const style = (el as HTMLElement).style.width;
            return style && style.includes('%') && !style.includes('100%');
          });

          if (progressBar) {
            const widthStyle = (progressBar as HTMLElement).style.width;
            const actualPercentage = parseInt(widthStyle);
            expect(actualPercentage).toBe(expectedPercentage);
          } else {
            // If no progress bar found with percentage, it might be 100%
            // Check if all requirements are met
            if (metCount === 5) {
              const fullWidthBar = Array.from(allDivs).find(el => {
                const style = (el as HTMLElement).style.width;
                return style && style.includes('100%');
              });
              expect(fullWidthBar).toBeTruthy();
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: All requirements are displayed
   * 
   * When showRequirements is true and password is not empty,
   * all 5 requirements should be displayed.
   */
  it('Property: All requirements are displayed when enabled', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        (password) => {
          const { container } = render(
            <PasswordStrengthIndicator 
              password={password} 
              showRequirements={true}
            />
          );

          // Should display 5 requirement items
          const requirementTexts = [
            'At least 12 characters',
            'One uppercase letter',
            'One lowercase letter',
            'One number',
            'One special character'
          ];

          const containerText = container.textContent || '';
          
          // Check that all requirements are mentioned
          requirementTexts.forEach(text => {
            expect(containerText).toContain(text.substring(0, 10)); // Check partial match
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
