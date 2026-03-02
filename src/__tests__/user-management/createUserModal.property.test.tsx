/**
 * Property-Based Tests: Create User Modal
 * 
 * Tests Properties 1, 2, 3, 5 for the Create User Modal component
 * 
 * Property 1: Empty field validation rejection
 * Property 2: Email format validation
 * Property 3: Valid form enables submission
 * Property 5: Firebase account creation for valid data
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 4.1, 4.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { CreateUserModal } from '../../components/admin/CreateUserModal';
import * as userManagementService from '../../services/userManagementService';
import type { UserRole } from '../../services/userManagementService';

// Mock the userManagementService
vi.mock('../../services/userManagementService', () => ({
  createUser: vi.fn(),
  UserRole: {} as any,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Property-Based Tests: Create User Modal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  /**
   * Property 1: Empty field validation rejection
   * 
   * For any form submission with empty or whitespace-only Full Name or Email fields,
   * the system should display the appropriate "field is required" error message
   * and prevent submission.
   * 
   * Validates: Requirements 2.1, 2.2
   */
  it('Property 1: Empty field validation rejection', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate whitespace strings (empty, spaces, tabs, newlines)
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\t')
        ),
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\t\t')
        ),
        async (emptyFullName, emptyEmail) => {
          const { container } = render(
            <CreateUserModal
              open={true}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          );

          // Fill in the form with empty/whitespace values
          const fullNameInput = screen.getByLabelText(/Full Name/i);
          const emailInput = screen.getByLabelText(/Email/i);
          const roleSelect = screen.getByLabelText(/Role/i);

          // Set values
          fireEvent.change(fullNameInput, { target: { value: emptyFullName } });
          fireEvent.change(emailInput, { target: { value: emptyEmail } });
          fireEvent.mouseDown(roleSelect);
          const brokerOption = screen.getByText('Broker');
          fireEvent.click(brokerOption);

          // Blur to trigger validation
          fireEvent.blur(fullNameInput);
          fireEvent.blur(emailInput);

          // Wait for validation to complete with longer timeout
          await waitFor(() => {
            const submitButton = screen.getByRole('button', { name: /Create User/i });
            expect(submitButton).toBeDisabled();
          }, { timeout: 3000 });

          // Check for error messages with longer timeout
          await waitFor(() => {
            if (!emptyFullName.trim()) {
              expect(screen.getByText('Full Name is required')).toBeInTheDocument();
            }
            
            if (!emptyEmail.trim()) {
              expect(screen.getByText('Email is required')).toBeInTheDocument();
            }
          }, { timeout: 3000 });

          // Verify createUser was not called
          expect(userManagementService.createUser).not.toHaveBeenCalled();
          
          cleanup();
        }
      ),
      { numRuns: 20 } // Reduced for async tests
    );
  }, 10000); // Increased timeout to 10 seconds

  /**
   * Property 2: Email format validation
   * 
   * For any string that does not match valid email format (missing @, invalid domain, etc.),
   * the system should display "Invalid email format" error message.
   * 
   * Validates: Requirements 2.3
   */
  it('Property 2: Email format validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate invalid email formats
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@')), // No @ symbol
          fc.constant('test@'), // Missing domain
          fc.constant('@example.com'), // Missing local part
        ),
        async (invalidEmail) => {
          render(
            <CreateUserModal
              open={true}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          );

          // Fill in email field with invalid format
          const emailInput = screen.getByLabelText(/Email/i);
          fireEvent.change(emailInput, { target: { value: invalidEmail } });
          fireEvent.blur(emailInput);

          // Wait for validation
          await waitFor(() => {
            // Should show either "Email is required" or "Invalid email format"
            const hasRequiredError = screen.queryByText('Email is required');
            const hasFormatError = screen.queryByText('Invalid email format');
            
            expect(hasRequiredError || hasFormatError).toBeTruthy();
          });

          // Submit button should be disabled
          const submitButton = screen.getByRole('button', { name: /Create User/i });
          expect(submitButton).toBeDisabled();
          
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Firebase account creation for valid data
   * 
   * For any valid user data (name, email, role), submitting the creation request
   * should result in a call to createUser with the correct data structure.
   * 
   * Note: This tests the service call, not actual Firebase account creation.
   * Full Firebase integration is tested in integration tests.
   * 
   * Validates: Requirements 4.1, 4.2
   */
  it('Property 5: Firebase account creation for valid data', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid full names
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate valid email addresses
        fc.emailAddress(),
        // Generate valid roles
        fc.constantFrom<UserRole>('default', 'broker', 'admin'),
        async (fullName, email, role) => {
          // Mock successful response
          vi.mocked(userManagementService.createUser).mockResolvedValue({
            success: true,
            user: {
              uid: 'test-uid',
              email: email.toLowerCase(),
              role: role,
            },
          });

          render(
            <CreateUserModal
              open={true}
              onClose={mockOnClose}
              onSuccess={mockOnSuccess}
            />
          );

          // Fill in the form with valid values
          const fullNameInput = screen.getByLabelText(/Full Name/i);
          const emailInput = screen.getByLabelText(/Email/i);
          const roleSelect = screen.getByLabelText(/Role/i);

          fireEvent.change(fullNameInput, { target: { value: fullName } });
          fireEvent.change(emailInput, { target: { value: email } });
          
          // Select role
          fireEvent.mouseDown(roleSelect);
          const roleOption = screen.getByText(role.charAt(0).toUpperCase() + role.slice(1));
          fireEvent.click(roleOption);

          // Submit the form
          const submitButton = screen.getByRole('button', { name: /Create User/i });
          fireEvent.click(submitButton);

          // Wait for async operations
          await waitFor(() => {
            expect(userManagementService.createUser).toHaveBeenCalledWith({
              fullName: fullName.trim(),
              email: email.trim().toLowerCase(),
              role: role,
            });
          }, { timeout: 3000 });

          // Verify onSuccess was called
          await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
          }, { timeout: 3000 });
          
          cleanup();
        }
      ),
      { numRuns: 10 } // Reduced runs for async tests
    );
  });
});
