/**
 * Property-Based Tests for Tour Completion Tracking
 * 
 * Feature: identity-remediation
 * Property 27: Tour Completion Tracking
 * 
 * Tests that:
 * - Tour is shown only once for brokers (when onboardingTourCompleted is false/undefined)
 * - Upon completion or dismissal, onboardingTourCompleted is updated to true
 * - Tour tracking is consistent and deterministic
 * - Non-broker users don't see the tour
 * 
 * **Validates: Requirements 25.3, 25.4, 25.6, 25.7**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { UserRole } from '../../types';

// ========== Test Utilities ==========

/**
 * Mock user document (what's stored in Firestore)
 */
interface MockUserDocument {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  onboardingTourCompleted?: boolean;
  onboardingTourCompletedAt?: Date;
  createdAt: Date;
}

/**
 * Tour state that would be managed by useBrokerTour hook
 */
interface TourState {
  runTour: boolean;
  tourCompleted: boolean;
  loading: boolean;
}

/**
 * Simulates the tour status check logic from useBrokerTour hook
 * This determines whether the tour should run
 */
function checkTourStatus(user: MockUserDocument): TourState {
  const completed = user.onboardingTourCompleted || false;
  const userRole = user.role || 'default';

  // Only run tour for brokers who haven't completed it
  const shouldRunTour = userRole === 'broker' && !completed;

  return {
    runTour: shouldRunTour,
    tourCompleted: completed,
    loading: false,
  };
}

/**
 * Simulates completing the tour (updates user document)
 */
function completeTour(user: MockUserDocument): MockUserDocument {
  return {
    ...user,
    onboardingTourCompleted: true,
    onboardingTourCompletedAt: new Date(),
  };
}

/**
 * Simulates dismissing/skipping the tour (same as completing)
 */
function skipTour(user: MockUserDocument): MockUserDocument {
  return completeTour(user);
}

/**
 * Simulates the full tour lifecycle
 */
function simulateTourLifecycle(user: MockUserDocument, action: 'complete' | 'skip' | 'none'): {
  initialState: TourState;
  finalState: TourState;
  updatedUser: MockUserDocument;
} {
  const initialState = checkTourStatus(user);
  
  let updatedUser = user;
  if (action === 'complete') {
    updatedUser = completeTour(user);
  } else if (action === 'skip') {
    updatedUser = skipTour(user);
  }
  
  const finalState = checkTourStatus(updatedUser);
  
  return { initialState, finalState, updatedUser };
}

// ========== Arbitraries (Generators) ==========

/**
 * Generate a valid UID
 */
const uidArbitrary = fc.string({ minLength: 20, maxLength: 28 }).map(s => `uid_${s}`);

/**
 * Generate a valid email address
 */
const emailArbitrary = fc.emailAddress();

/**
 * Generate a display name
 */
const displayNameArbitrary = fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 0);

/**
 * Generate a user role
 */
const roleArbitrary = fc.constantFrom<UserRole>(
  'default',
  'broker',
  'compliance',
  'claims',
  'admin',
  'super_admin'
);

/**
 * Generate a broker role
 */
const brokerRoleArbitrary = fc.constant<UserRole>('broker');

/**
 * Generate a non-broker role
 */
const nonBrokerRoleArbitrary = fc.constantFrom<UserRole>(
  'default',
  'compliance',
  'claims',
  'admin',
  'super_admin'
);

/**
 * Generate tour completion status
 */
const tourCompletedArbitrary = fc.boolean();

/**
 * Generate a user document with broker role
 */
const brokerUserArbitrary = fc.record({
  uid: uidArbitrary,
  email: emailArbitrary,
  displayName: displayNameArbitrary,
  role: brokerRoleArbitrary,
  onboardingTourCompleted: fc.option(tourCompletedArbitrary, { nil: undefined }),
  createdAt: fc.date(),
});

/**
 * Generate a user document with non-broker role
 */
const nonBrokerUserArbitrary = fc.record({
  uid: uidArbitrary,
  email: emailArbitrary,
  displayName: displayNameArbitrary,
  role: nonBrokerRoleArbitrary,
  onboardingTourCompleted: fc.option(tourCompletedArbitrary, { nil: undefined }),
  createdAt: fc.date(),
});

/**
 * Generate any user document
 */
const userArbitrary = fc.record({
  uid: uidArbitrary,
  email: emailArbitrary,
  displayName: displayNameArbitrary,
  role: roleArbitrary,
  onboardingTourCompleted: fc.option(tourCompletedArbitrary, { nil: undefined }),
  createdAt: fc.date(),
});

/**
 * Generate a new broker user (tour not completed)
 */
const newBrokerUserArbitrary = fc.record({
  uid: uidArbitrary,
  email: emailArbitrary,
  displayName: displayNameArbitrary,
  role: brokerRoleArbitrary,
  onboardingTourCompleted: fc.constantFrom(false, undefined),
  createdAt: fc.date(),
});

/**
 * Generate an existing broker user (tour completed)
 */
const existingBrokerUserArbitrary = fc.record({
  uid: uidArbitrary,
  email: emailArbitrary,
  displayName: displayNameArbitrary,
  role: brokerRoleArbitrary,
  onboardingTourCompleted: fc.constant(true),
  onboardingTourCompletedAt: fc.date(),
  createdAt: fc.date(),
});

/**
 * Generate tour action
 */
const tourActionArbitrary = fc.constantFrom<'complete' | 'skip' | 'none'>('complete', 'skip', 'none');

// ========== Property 27: Tour Completion Tracking ==========

describe('Feature: identity-remediation, Property 27: Tour Completion Tracking', () => {
  /**
   * Property: Tour runs only for new brokers
   * For any broker user with onboardingTourCompleted=false or undefined,
   * the tour should run (runTour=true)
   */
  it('should run tour for new broker users', () => {
    fc.assert(
      fc.property(
        newBrokerUserArbitrary,
        (user) => {
          const state = checkTourStatus(user);
          
          // Tour should run for new brokers
          expect(state.runTour).toBe(true);
          expect(state.tourCompleted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour does not run for existing brokers
   * For any broker user with onboardingTourCompleted=true,
   * the tour should not run (runTour=false)
   */
  it('should not run tour for existing broker users', () => {
    fc.assert(
      fc.property(
        existingBrokerUserArbitrary,
        (user) => {
          const state = checkTourStatus(user);
          
          // Tour should not run for existing brokers
          expect(state.runTour).toBe(false);
          expect(state.tourCompleted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour does not run for non-broker users
   * For any user with role other than "broker", the tour should not run
   * regardless of onboardingTourCompleted status
   */
  it('should not run tour for non-broker users', () => {
    fc.assert(
      fc.property(
        nonBrokerUserArbitrary,
        (user) => {
          const state = checkTourStatus(user);
          
          // Tour should never run for non-brokers
          expect(state.runTour).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Completing tour updates onboardingTourCompleted to true
   * For any user, after completing the tour, onboardingTourCompleted must be true
   */
  it('should set onboardingTourCompleted to true after completion', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const updatedUser = completeTour(user);
          
          // Tour completion flag must be set
          expect(updatedUser.onboardingTourCompleted).toBe(true);
          expect(updatedUser.onboardingTourCompletedAt).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Skipping tour updates onboardingTourCompleted to true
   * For any user, after skipping/dismissing the tour, onboardingTourCompleted must be true
   * (Validates Requirement 25.7: dismissing marks as completed)
   */
  it('should set onboardingTourCompleted to true after dismissal', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const updatedUser = skipTour(user);
          
          // Tour completion flag must be set even when skipped
          expect(updatedUser.onboardingTourCompleted).toBe(true);
          expect(updatedUser.onboardingTourCompletedAt).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour runs only once
   * For any broker user, after completing or skipping the tour,
   * checking tour status again should return runTour=false
   * (Validates Requirement 25.4: shown only on first login)
   */
  it('should show tour only once for broker users', () => {
    fc.assert(
      fc.property(
        newBrokerUserArbitrary,
        tourActionArbitrary,
        (user, action) => {
          // Skip 'none' action as it doesn't complete the tour
          fc.pre(action !== 'none');
          
          const { initialState, finalState } = simulateTourLifecycle(user, action);
          
          // Initially, tour should run
          expect(initialState.runTour).toBe(true);
          
          // After completion/skip, tour should not run
          expect(finalState.runTour).toBe(false);
          expect(finalState.tourCompleted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour status is deterministic
   * For any user, checking tour status multiple times should return the same result
   */
  it('should return consistent tour status for the same user', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const state1 = checkTourStatus(user);
          const state2 = checkTourStatus(user);
          const state3 = checkTourStatus(user);
          
          // All checks should return the same result
          expect(state1.runTour).toBe(state2.runTour);
          expect(state2.runTour).toBe(state3.runTour);
          expect(state1.tourCompleted).toBe(state2.tourCompleted);
          expect(state2.tourCompleted).toBe(state3.tourCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour completion is idempotent
   * For any user, completing the tour multiple times should have the same effect
   */
  it('should handle multiple tour completions idempotently', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const updated1 = completeTour(user);
          const updated2 = completeTour(updated1);
          const updated3 = completeTour(updated2);
          
          // All should have tour completed
          expect(updated1.onboardingTourCompleted).toBe(true);
          expect(updated2.onboardingTourCompleted).toBe(true);
          expect(updated3.onboardingTourCompleted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour status depends only on role and completion flag
   * For any two users with the same role and onboardingTourCompleted status,
   * they should have the same tour status
   */
  it('should determine tour status based only on role and completion flag', () => {
    fc.assert(
      fc.property(
        roleArbitrary,
        tourCompletedArbitrary,
        uidArbitrary,
        uidArbitrary,
        emailArbitrary,
        emailArbitrary,
        displayNameArbitrary,
        displayNameArbitrary,
        (role, completed, uid1, uid2, email1, email2, name1, name2) => {
          // Ensure different users
          fc.pre(uid1 !== uid2);
          
          const user1: MockUserDocument = {
            uid: uid1,
            email: email1,
            displayName: name1,
            role,
            onboardingTourCompleted: completed,
            createdAt: new Date(),
          };
          
          const user2: MockUserDocument = {
            uid: uid2,
            email: email2,
            displayName: name2,
            role,
            onboardingTourCompleted: completed,
            createdAt: new Date(),
          };
          
          const state1 = checkTourStatus(user1);
          const state2 = checkTourStatus(user2);
          
          // Both should have the same tour status
          expect(state1.runTour).toBe(state2.runTour);
          expect(state1.tourCompleted).toBe(state2.tourCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Undefined completion status is treated as false
   * For any user with onboardingTourCompleted=undefined,
   * it should be treated the same as onboardingTourCompleted=false
   */
  it('should treat undefined completion status as false', () => {
    fc.assert(
      fc.property(
        uidArbitrary,
        emailArbitrary,
        displayNameArbitrary,
        roleArbitrary,
        (uid, email, displayName, role) => {
          const userUndefined: MockUserDocument = {
            uid,
            email,
            displayName,
            role,
            onboardingTourCompleted: undefined,
            createdAt: new Date(),
          };
          
          const userFalse: MockUserDocument = {
            uid,
            email,
            displayName,
            role,
            onboardingTourCompleted: false,
            createdAt: new Date(),
          };
          
          const stateUndefined = checkTourStatus(userUndefined);
          const stateFalse = checkTourStatus(userFalse);
          
          // Both should have the same tour status
          expect(stateUndefined.runTour).toBe(stateFalse.runTour);
          expect(stateUndefined.tourCompleted).toBe(stateFalse.tourCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour completion preserves other user fields
   * For any user, completing the tour should only update tour-related fields
   */
  it('should preserve other user fields when completing tour', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const updatedUser = completeTour(user);
          
          // Other fields should remain unchanged
          expect(updatedUser.uid).toBe(user.uid);
          expect(updatedUser.email).toBe(user.email);
          expect(updatedUser.displayName).toBe(user.displayName);
          expect(updatedUser.role).toBe(user.role);
          expect(updatedUser.createdAt).toBe(user.createdAt);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour runs for broker regardless of other fields
   * For any broker user with tour not completed, the tour should run
   * regardless of email, displayName, or other fields
   */
  it('should run tour for any new broker regardless of other fields', () => {
    fc.assert(
      fc.property(
        uidArbitrary,
        emailArbitrary,
        displayNameArbitrary,
        fc.date(),
        (uid, email, displayName, createdAt) => {
          const user: MockUserDocument = {
            uid,
            email,
            displayName,
            role: 'broker',
            onboardingTourCompleted: false,
            createdAt,
          };
          
          const state = checkTourStatus(user);
          
          // Tour should always run for new brokers
          expect(state.runTour).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Complete and skip have the same effect
   * For any user, completing or skipping the tour should result in the same state
   */
  it('should have the same effect for complete and skip actions', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const completed = completeTour(user);
          const skipped = skipTour(user);
          
          // Both should set the completion flag
          expect(completed.onboardingTourCompleted).toBe(skipped.onboardingTourCompleted);
          expect(completed.onboardingTourCompleted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour completion timestamp is set
   * For any user, after completing or skipping the tour,
   * onboardingTourCompletedAt should be defined
   */
  it('should set completion timestamp when tour is completed or skipped', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        tourActionArbitrary,
        (user, action) => {
          // Skip 'none' action
          fc.pre(action !== 'none');
          
          const { updatedUser } = simulateTourLifecycle(user, action);
          
          // Completion timestamp should be set
          expect(updatedUser.onboardingTourCompletedAt).toBeDefined();
          expect(updatedUser.onboardingTourCompletedAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Tour state transition is valid
   * For any broker user, the tour state can only transition from:
   * - not completed + runTour=true -> completed + runTour=false
   * - completed + runTour=false -> completed + runTour=false (no change)
   */
  it('should have valid tour state transitions', () => {
    fc.assert(
      fc.property(
        brokerUserArbitrary,
        tourActionArbitrary,
        (user, action) => {
          const { initialState, finalState } = simulateTourLifecycle(user, action);
          
          if (action === 'none') {
            // No action means no state change
            expect(finalState.runTour).toBe(initialState.runTour);
            expect(finalState.tourCompleted).toBe(initialState.tourCompleted);
          } else {
            // Complete or skip action
            if (initialState.runTour) {
              // Was running, should now be completed and not running
              expect(finalState.runTour).toBe(false);
              expect(finalState.tourCompleted).toBe(true);
            } else {
              // Was already completed, should remain completed
              expect(finalState.runTour).toBe(false);
              expect(finalState.tourCompleted).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ========== Edge Cases and Boundary Tests ==========

describe('Feature: identity-remediation, Property 27: Edge Cases', () => {
  /**
   * Edge case: Multiple sequential tour completions
   * Completing the tour multiple times in sequence should maintain consistency
   */
  it('should handle sequential tour completions correctly', () => {
    const user: MockUserDocument = {
      uid: 'test-uid',
      email: 'broker@example.com',
      displayName: 'Test Broker',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    // Complete tour multiple times
    const updated1 = completeTour(user);
    const updated2 = completeTour(updated1);
    const updated3 = completeTour(updated2);

    // All should be completed
    expect(updated1.onboardingTourCompleted).toBe(true);
    expect(updated2.onboardingTourCompleted).toBe(true);
    expect(updated3.onboardingTourCompleted).toBe(true);

    // Tour should not run after any completion
    expect(checkTourStatus(updated1).runTour).toBe(false);
    expect(checkTourStatus(updated2).runTour).toBe(false);
    expect(checkTourStatus(updated3).runTour).toBe(false);
  });

  /**
   * Edge case: Alternating complete and skip
   * Alternating between complete and skip should maintain consistency
   */
  it('should handle alternating complete and skip actions', () => {
    const user: MockUserDocument = {
      uid: 'test-uid',
      email: 'broker@example.com',
      displayName: 'Test Broker',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    const completed = completeTour(user);
    const skipped = skipTour(completed);
    const completedAgain = completeTour(skipped);

    // All should be completed
    expect(completed.onboardingTourCompleted).toBe(true);
    expect(skipped.onboardingTourCompleted).toBe(true);
    expect(completedAgain.onboardingTourCompleted).toBe(true);
  });

  /**
   * Edge case: Role change after tour completion
   * If a user's role changes after completing the tour, the completion should persist
   */
  it('should persist tour completion across role changes', () => {
    const brokerUser: MockUserDocument = {
      uid: 'test-uid',
      email: 'user@example.com',
      displayName: 'Test User',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    // Complete tour as broker
    const completedBroker = completeTour(brokerUser);
    expect(completedBroker.onboardingTourCompleted).toBe(true);

    // Change role to admin
    const adminUser: MockUserDocument = {
      ...completedBroker,
      role: 'admin',
    };

    // Tour should still be marked as completed
    const adminState = checkTourStatus(adminUser);
    expect(adminState.tourCompleted).toBe(true);
    expect(adminState.runTour).toBe(false); // Admin doesn't get tour anyway
  });

  /**
   * Edge case: New broker after being another role
   * If a user becomes a broker after being another role, and hasn't completed the tour,
   * they should see the tour
   */
  it('should show tour to users who become brokers', () => {
    const defaultUser: MockUserDocument = {
      uid: 'test-uid',
      email: 'user@example.com',
      displayName: 'Test User',
      role: 'default',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    // Default user doesn't see tour
    const defaultState = checkTourStatus(defaultUser);
    expect(defaultState.runTour).toBe(false);

    // User becomes broker
    const brokerUser: MockUserDocument = {
      ...defaultUser,
      role: 'broker',
    };

    // Now should see tour
    const brokerState = checkTourStatus(brokerUser);
    expect(brokerState.runTour).toBe(true);
  });

  /**
   * Edge case: Broker with tour completed becomes default user
   * If a broker completes the tour then becomes a default user,
   * the completion should persist
   */
  it('should persist tour completion when broker becomes default user', () => {
    const brokerUser: MockUserDocument = {
      uid: 'test-uid',
      email: 'broker@example.com',
      displayName: 'Test Broker',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    // Complete tour as broker
    const completedBroker = completeTour(brokerUser);

    // Change to default user
    const defaultUser: MockUserDocument = {
      ...completedBroker,
      role: 'default',
    };

    // Tour completion should persist
    expect(defaultUser.onboardingTourCompleted).toBe(true);
    const state = checkTourStatus(defaultUser);
    expect(state.tourCompleted).toBe(true);
  });

  /**
   * Edge case: Multiple brokers completing tour concurrently
   * Multiple brokers completing the tour should each have their own completion tracked
   */
  it('should track tour completion independently for multiple brokers', () => {
    const broker1: MockUserDocument = {
      uid: 'broker1-uid',
      email: 'broker1@example.com',
      displayName: 'Broker 1',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    const broker2: MockUserDocument = {
      uid: 'broker2-uid',
      email: 'broker2@example.com',
      displayName: 'Broker 2',
      role: 'broker',
      onboardingTourCompleted: false,
      createdAt: new Date(),
    };

    // Broker 1 completes tour
    const completedBroker1 = completeTour(broker1);
    expect(completedBroker1.onboardingTourCompleted).toBe(true);

    // Broker 2 should still see tour
    const broker2State = checkTourStatus(broker2);
    expect(broker2State.runTour).toBe(true);

    // Broker 2 completes tour
    const completedBroker2 = completeTour(broker2);
    expect(completedBroker2.onboardingTourCompleted).toBe(true);

    // Both should have tour completed
    expect(checkTourStatus(completedBroker1).runTour).toBe(false);
    expect(checkTourStatus(completedBroker2).runTour).toBe(false);
  });
});
