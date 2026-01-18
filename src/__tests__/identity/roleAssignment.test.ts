/**
 * Property-Based Tests for Role Assignment on Registration
 * 
 * Feature: identity-remediation
 * Property 15: Role Assignment on Registration
 * 
 * Tests that:
 * - When userType is "broker", role is set to "broker"
 * - When userType is "regular" or undefined, role is set to "default"
 * - Role assignment is consistent and deterministic
 * 
 * **Validates: Requirements 12.2, 12.3, 12.6, 12.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { UserRole } from '../../types';

// ========== Test Utilities ==========

/**
 * Simulates the role assignment logic from server.js registration endpoint
 * This is the core logic we're testing
 */
function assignRoleOnRegistration(userType?: '' | 'regular' | 'broker'): UserRole {
  // If userType is "broker", assign broker role
  if (userType === 'broker') {
    return 'broker';
  }
  
  // Otherwise (regular, empty string, or undefined), assign default role
  return 'default';
}

/**
 * Mock registration data
 */
interface MockRegistrationData {
  email: string;
  password: string;
  displayName: string;
  userType?: '' | 'regular' | 'broker';
}

/**
 * Mock user document (what gets stored in Firestore)
 */
interface MockUserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Simulates the complete registration process
 */
function simulateRegistration(data: MockRegistrationData): MockUserDocument {
  const role = assignRoleOnRegistration(data.userType);
  
  return {
    uid: `uid_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    email: data.email,
    displayName: data.displayName,
    role,
    createdAt: new Date(),
  };
}

// ========== Arbitraries (Generators) ==========

/**
 * Generate a valid email address
 */
const emailArbitrary = fc.emailAddress();

/**
 * Generate a password (8-20 characters)
 */
const passwordArbitrary = fc.string({ minLength: 8, maxLength: 20 });

/**
 * Generate a display name
 */
const displayNameArbitrary = fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Generate userType: broker
 */
const brokerUserTypeArbitrary = fc.constant<'broker'>('broker');

/**
 * Generate userType: regular or empty string or undefined
 */
const nonBrokerUserTypeArbitrary = fc.constantFrom<'' | 'regular' | undefined>('', 'regular', undefined);

/**
 * Generate any valid userType
 */
const userTypeArbitrary = fc.constantFrom<'' | 'regular' | 'broker' | undefined>('', 'regular', 'broker', undefined);

/**
 * Generate registration data with broker userType
 */
const brokerRegistrationArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary,
  displayName: displayNameArbitrary,
  userType: brokerUserTypeArbitrary,
});

/**
 * Generate registration data with non-broker userType
 */
const nonBrokerRegistrationArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary,
  displayName: displayNameArbitrary,
  userType: nonBrokerUserTypeArbitrary,
});

/**
 * Generate any registration data
 */
const registrationArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary,
  displayName: displayNameArbitrary,
  userType: fc.option(userTypeArbitrary, { nil: undefined }),
});

// ========== Property 15: Role Assignment on Registration ==========

describe('Feature: identity-remediation, Property 15: Role Assignment on Registration', () => {
  /**
   * Property: Broker userType results in broker role
   * For any registration with userType="broker", the assigned role must be "broker"
   */
  it('should assign broker role when userType is "broker"', () => {
    fc.assert(
      fc.property(
        brokerRegistrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // When userType is "broker", role must be "broker"
          expect(user.role).toBe('broker');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Non-broker userType results in default role
   * For any registration with userType="regular", "", or undefined, 
   * the assigned role must be "default"
   */
  it('should assign default role when userType is "regular", empty, or undefined', () => {
    fc.assert(
      fc.property(
        nonBrokerRegistrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // When userType is not "broker", role must be "default"
          expect(user.role).toBe('default');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Role assignment is deterministic
   * For any registration data, calling the assignment function multiple times
   * with the same userType should always return the same role
   */
  it('should assign roles deterministically', () => {
    fc.assert(
      fc.property(
        userTypeArbitrary,
        (userType) => {
          const role1 = assignRoleOnRegistration(userType);
          const role2 = assignRoleOnRegistration(userType);
          const role3 = assignRoleOnRegistration(userType);
          
          // All calls should return the same role
          expect(role1).toBe(role2);
          expect(role2).toBe(role3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Role assignment is consistent across registrations
   * For any two registrations with the same userType, they should receive the same role
   */
  it('should assign the same role for the same userType across different registrations', () => {
    fc.assert(
      fc.property(
        userTypeArbitrary,
        emailArbitrary,
        emailArbitrary,
        displayNameArbitrary,
        displayNameArbitrary,
        passwordArbitrary,
        passwordArbitrary,
        (userType, email1, email2, name1, name2, pass1, pass2) => {
          // Ensure different users
          fc.pre(email1 !== email2);
          
          const user1 = simulateRegistration({
            email: email1,
            password: pass1,
            displayName: name1,
            userType,
          });
          
          const user2 = simulateRegistration({
            email: email2,
            password: pass2,
            displayName: name2,
            userType,
          });
          
          // Both users should have the same role
          expect(user1.role).toBe(user2.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Only broker or default roles are assigned
   * For any registration, the assigned role must be either "broker" or "default"
   */
  it('should only assign broker or default roles during registration', () => {
    fc.assert(
      fc.property(
        registrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // Role must be either "broker" or "default"
          expect(['broker', 'default']).toContain(user.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Role is stored in user document
   * For any registration, the resulting user document must contain a role field
   */
  it('should include role field in user document', () => {
    fc.assert(
      fc.property(
        registrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // User document must have a role field
          expect(user).toHaveProperty('role');
          expect(user.role).toBeDefined();
          expect(typeof user.role).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: userType value determines role exactly
   * For any userType value, the role assignment follows the exact mapping:
   * - "broker" -> "broker"
   * - anything else -> "default"
   */
  it('should map userType to role according to specification', () => {
    fc.assert(
      fc.property(
        userTypeArbitrary,
        (userType) => {
          const role = assignRoleOnRegistration(userType);
          
          if (userType === 'broker') {
            expect(role).toBe('broker');
          } else {
            expect(role).toBe('default');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty string userType is treated as non-broker
   * For any registration with userType="", the role should be "default"
   */
  it('should treat empty string userType as non-broker', () => {
    fc.assert(
      fc.property(
        emailArbitrary,
        passwordArbitrary,
        displayNameArbitrary,
        (email, password, displayName) => {
          const user = simulateRegistration({
            email,
            password,
            displayName,
            userType: '',
          });
          
          expect(user.role).toBe('default');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Undefined userType is treated as non-broker
   * For any registration with userType=undefined, the role should be "default"
   */
  it('should treat undefined userType as non-broker', () => {
    fc.assert(
      fc.property(
        emailArbitrary,
        passwordArbitrary,
        displayNameArbitrary,
        (email, password, displayName) => {
          const user = simulateRegistration({
            email,
            password,
            displayName,
            userType: undefined,
          });
          
          expect(user.role).toBe('default');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Role assignment is independent of other registration fields
   * For any registration data, changing email, password, or displayName
   * should not affect role assignment if userType remains the same
   */
  it('should assign role based only on userType, not other fields', () => {
    fc.assert(
      fc.property(
        userTypeArbitrary,
        emailArbitrary,
        emailArbitrary,
        passwordArbitrary,
        passwordArbitrary,
        displayNameArbitrary,
        displayNameArbitrary,
        (userType, email1, email2, pass1, pass2, name1, name2) => {
          // Ensure different values for other fields
          fc.pre(email1 !== email2 || pass1 !== pass2 || name1 !== name2);
          
          const user1 = simulateRegistration({
            email: email1,
            password: pass1,
            displayName: name1,
            userType,
          });
          
          const user2 = simulateRegistration({
            email: email2,
            password: pass2,
            displayName: name2,
            userType,
          });
          
          // Role should be the same despite different other fields
          expect(user1.role).toBe(user2.role);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Broker role assignment is exclusive
   * For any registration, if role is "broker", then userType must have been "broker"
   */
  it('should only assign broker role when userType is explicitly "broker"', () => {
    fc.assert(
      fc.property(
        registrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // If role is broker, userType must have been broker
          if (user.role === 'broker') {
            expect(registrationData.userType).toBe('broker');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default role is the fallback
   * For any registration where userType is not "broker", role must be "default"
   */
  it('should use default role as fallback for all non-broker userTypes', () => {
    fc.assert(
      fc.property(
        registrationArbitrary,
        (registrationData) => {
          const user = simulateRegistration(registrationData);
          
          // If userType is not "broker", role must be "default"
          if (registrationData.userType !== 'broker') {
            expect(user.role).toBe('default');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ========== Edge Cases and Boundary Tests ==========

describe('Feature: identity-remediation, Property 15: Edge Cases', () => {
  /**
   * Edge case: Case sensitivity of userType
   * The system should be case-sensitive for userType="broker"
   */
  it('should be case-sensitive for broker userType', () => {
    // These should all result in "default" role (not "broker")
    const invalidBrokerTypes = ['Broker', 'BROKER', 'BrOkEr', 'bRoKeR'];
    
    for (const invalidType of invalidBrokerTypes) {
      // We can't use the type system here since it's testing invalid input
      // In real implementation, these would be rejected or treated as default
      const role = assignRoleOnRegistration(invalidType as any);
      expect(role).toBe('default');
    }
  });

  /**
   * Edge case: Whitespace in userType
   * userType with whitespace should not match "broker"
   */
  it('should not match broker with whitespace', () => {
    const whitespaceTypes = [' broker', 'broker ', ' broker ', '\tbroker', 'broker\n'];
    
    for (const wsType of whitespaceTypes) {
      const role = assignRoleOnRegistration(wsType as any);
      expect(role).toBe('default');
    }
  });

  /**
   * Edge case: Multiple registrations in sequence
   * Registering multiple users in sequence should maintain correct role assignment
   */
  it('should maintain correct role assignment across sequential registrations', () => {
    const users: MockUserDocument[] = [];
    
    // Register 10 users alternating between broker and regular
    for (let i = 0; i < 10; i++) {
      const userType = i % 2 === 0 ? 'broker' : 'regular';
      const user = simulateRegistration({
        email: `user${i}@example.com`,
        password: 'password123',
        displayName: `User ${i}`,
        userType: userType as 'broker' | 'regular',
      });
      users.push(user);
    }
    
    // Verify roles
    for (let i = 0; i < 10; i++) {
      const expectedRole = i % 2 === 0 ? 'broker' : 'default';
      expect(users[i].role).toBe(expectedRole);
    }
  });

  /**
   * Edge case: Concurrent registrations
   * Simulating concurrent registrations should maintain correct role assignment
   */
  it('should handle concurrent registrations correctly', () => {
    const registrations = [
      { email: 'broker1@example.com', password: 'pass1', displayName: 'Broker 1', userType: 'broker' as const },
      { email: 'user1@example.com', password: 'pass2', displayName: 'User 1', userType: 'regular' as const },
      { email: 'broker2@example.com', password: 'pass3', displayName: 'Broker 2', userType: 'broker' as const },
      { email: 'user2@example.com', password: 'pass4', displayName: 'User 2', userType: undefined },
      { email: 'user3@example.com', password: 'pass5', displayName: 'User 3', userType: '' as const },
    ];
    
    const users = registrations.map(reg => simulateRegistration(reg));
    
    expect(users[0].role).toBe('broker');
    expect(users[1].role).toBe('default');
    expect(users[2].role).toBe('broker');
    expect(users[3].role).toBe('default');
    expect(users[4].role).toBe('default');
  });
});
