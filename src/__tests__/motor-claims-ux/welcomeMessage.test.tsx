/**
 * Property-Based Tests for Welcome Message
 * 
 * Feature: motor-claims-ux-improvements
 * Property 7: Welcome Message Contains User Name
 * 
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the services before importing the component
vi.mock('../../services/userSubmissionsService', () => ({
  getUserSubmissions: vi.fn().mockResolvedValue([]),
  getUserAnalytics: vi.fn().mockReturnValue({
    totalSubmissions: 0,
    kycForms: 0,
    claimForms: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  }),
  subscribeToUserSubmissions: vi.fn((email, callback) => {
    callback([]);
    return () => {}; // Return unsubscribe function
  })
}));

// Mock Firebase auth
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    updatePassword: vi.fn(),
    EmailAuthProvider: {
      credential: vi.fn()
    },
    reauthenticateWithCredential: vi.fn(),
    getAuth: vi.fn(() => ({})),
    setPersistence: vi.fn().mockResolvedValue(undefined),
    browserSessionPersistence: {}
  };
});

// Mock the AuthContext module
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Import after mocking
import UserDashboard from '../../pages/dashboard/UserDashboard';
import { useAuth } from '../../contexts/AuthContext';

// Arbitrary generator for user names
const userNameArbitrary = fc.oneof(
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  fc.constantFrom(
    'John Doe',
    'Jane Smith',
    'Alice Johnson',
    'Bob Williams',
    'Charlie Brown',
    'David Lee',
    'Emma Wilson',
    'Frank Miller',
    'Grace Davis',
    'Henry Martinez'
  )
);

// Arbitrary generator for user data
const userArbitrary = fc.record({
  name: userNameArbitrary,
  email: fc.emailAddress(),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
  role: fc.constantFrom('user', 'default'),
  uid: fc.uuid(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  notificationPreference: fc.constantFrom('email', 'sms') as fc.Arbitrary<'email' | 'sms'>
});

describe('Feature: motor-claims-ux-improvements, Property 7: Welcome Message Contains User Name', () => {
  /**
   * Property: Welcome Message Contains User Name
   * For any user dashboard rendered, the welcome message SHALL contain the authenticated user's name.
   * 
   * **Validates: Requirements 6.2**
   */
  it('should display welcome message with user name for any authenticated user', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          // Mock the useAuth hook to return our test user
          vi.mocked(useAuth).mockReturnValue({
            user,
            firebaseUser: { email: user.email } as any,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn()
          });

          const { container } = render(
            <BrowserRouter>
              <UserDashboard />
            </BrowserRouter>
          );

          const textContent = container.textContent || '';

          // Check that the welcome message contains the user's name
          expect(textContent).toContain(`Welcome, ${user.name}!`);

          // Check that "Welcome" text is present
          expect(textContent).toContain('Welcome');

          // Check that the user's name appears in the text content (handles HTML encoding)
          expect(textContent).toContain(user.name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Welcome Message Handles Missing Name
   * For any user without a name, the welcome message SHALL display a fallback
   * 
   * **Validates: Requirements 6.2**
   */
  it('should display fallback when user name is not provided', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        userArbitrary.map(u => ({ ...u, name: undefined })),
        (user) => {
          // Mock the useAuth hook
          vi.mocked(useAuth).mockReturnValue({
            user: user as any,
            firebaseUser: { email: user.email } as any,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn()
          });

          const { container } = render(
            <BrowserRouter>
              <UserDashboard />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check that "Welcome, User!" is displayed as fallback
          expect(html).toContain('Welcome, User!');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Welcome Message Prominence
   * For any user dashboard, the welcome message SHALL be prominently displayed
   * (large font, visible styling)
   * 
   * **Validates: Requirements 6.2**
   */
  it('should display welcome message prominently for any user', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          // Mock the useAuth hook
          vi.mocked(useAuth).mockReturnValue({
            user,
            firebaseUser: { email: user.email } as any,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn()
          });

          const { container } = render(
            <BrowserRouter>
              <UserDashboard />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check for prominent styling (h1 tag with large text)
          expect(html).toMatch(/<h1[^>]*>.*Welcome.*<\/h1>/);

          // Check for text size classes (text-3xl or similar)
          expect(html).toContain('text-3xl');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: User Initial Display
   * For any user with a name, the dashboard SHALL display the user's initial
   * in the avatar circle
   * 
   * **Validates: Requirements 6.2**
   */
  it('should display user initial in avatar for any user with a name', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          // Mock the useAuth hook
          vi.mocked(useAuth).mockReturnValue({
            user,
            firebaseUser: { email: user.email } as any,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn()
          });

          const { container } = render(
            <BrowserRouter>
              <UserDashboard />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check that the first letter of the user's name appears (uppercase)
          const expectedInitial = user.name.charAt(0).toUpperCase();
          expect(html).toContain(expectedInitial);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Welcome Message Consistency
   * For any user, the name in the welcome message SHALL match the authenticated user's name
   * 
   * **Validates: Requirements 6.2**
   */
  it('should display consistent user name across welcome message', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          // Mock the useAuth hook
          vi.mocked(useAuth).mockReturnValue({
            user,
            firebaseUser: { email: user.email } as any,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            resetPassword: vi.fn()
          });

          const { container } = render(
            <BrowserRouter>
              <UserDashboard />
            </BrowserRouter>
          );

          const textContent = container.textContent || '';

          // Count occurrences of the user's name in the welcome section
          const welcomeSection = textContent.substring(0, 200); // First 200 chars
          // Escape special regex characters in the user name
          const escapedName = user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const nameOccurrences = (welcomeSection.match(new RegExp(escapedName, 'g')) || []).length;

          // The name should appear at least once in the welcome section
          expect(nameOccurrences).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
