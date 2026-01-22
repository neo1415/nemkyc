/**
 * Utility to reset broker tour for testing purposes
 * 
 * This file can be used to reset the onboarding tour flag for a broker user
 * so you can test the tour with existing users.
 * 
 * USAGE:
 * 1. Import this in your browser console or call from a component
 * 2. Call resetBrokerTourForUser(userId) with the broker's UID
 * 3. Refresh the page and the tour should start
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Reset the onboarding tour flag for a specific user
 * This allows the tour to run again for testing purposes
 */
export async function resetBrokerTourForUser(userId: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'userroles', userId);
    await updateDoc(userDocRef, {
      onboardingTourCompleted: false,
      onboardingTourStep: 0,
      onboardingTourStartedAt: new Date(),
      onboardingTourLastAction: null,
    });
    console.log('✅ Tour flag reset successfully for user:', userId);
    console.log('🔄 Please refresh the page to start the tour');
  } catch (error) {
    console.error('❌ Error resetting tour flag:', error);
    console.error('💡 Make sure the user document exists in the "userroles" collection');
    throw error;
  }
}

/**
 * Reset tour for the currently logged-in user
 * Call this from browser console: resetMyBrokerTour()
 */
export async function resetMyBrokerTour(): Promise<void> {
  // Get current user from auth context
  const auth = (await import('../firebase/config')).auth;
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently logged in');
    return;
  }
  
  await resetBrokerTourForUser(currentUser.uid);
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).resetBrokerTour = resetMyBrokerTour;
  (window as any).resetBrokerTourForUser = resetBrokerTourForUser;
}
