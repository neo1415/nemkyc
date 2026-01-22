/**
 * Broker Tour Hook
 * 
 * Manages the state and lifecycle of the action-based broker onboarding tour.
 * Tracks current step, handles action-based progression, and persists state to Firestore.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { TourAction, TOUR_ACTIONS } from '../config/brokerTour';

// Debug mode flag (set to true for detailed logging)
const DEBUG_MODE = import.meta.env.DEV;

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`🎯 Tour: ${message}`, data || '');
  }
}

export function useBrokerTour() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionCompleted, setActionCompleted] = useState(false);
  
  // Use ref to avoid stale closure issues
  const currentStepRef = useRef<number>(0);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Load tour state from Firestore on mount
  useEffect(() => {
    const loadTourState = async () => {
      if (!user) {
        debugLog('No user, skipping tour check');
        setLoading(false);
        return;
      }

      debugLog('Loading tour state for user:', user.uid);

      try {
        const userDocRef = doc(db, 'userroles', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const completed = userData.onboardingTourCompleted || false;
          const step = userData.onboardingTourStep ?? 0;
          const userRole = userData.role || 'default';

          debugLog('User data loaded', {
            role: userRole,
            completed,
            currentStep: step,
            lastAction: userData.onboardingTourLastAction,
            startedAt: userData.onboardingTourStartedAt,
          });

          setTourCompleted(completed);
          setCurrentStep(step);

          // Tour is active if user is broker and not completed
          if (userRole !== 'broker' || completed) {
            debugLog('Tour not active', {
              isBroker: userRole === 'broker',
              isCompleted: completed,
            });
          } else {
            debugLog('Tour active at step', step);
          }
        } else {
          debugLog('User document not found in userroles collection');
        }
      } catch (error) {
        console.error('❌ Tour: Error loading tour state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTourState();
  }, [user]);

  // Save current step to Firestore
  const saveStepToFirestore = useCallback(async (step: number, action?: string) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'userroles', user.uid);
      
      // Check if document exists first
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        debugLog('User document does not exist, skipping save');
        return;
      }

      const updateData: any = {
        onboardingTourStep: step,
      };

      // Set startedAt timestamp on first step
      if (step === 0) {
        updateData.onboardingTourStartedAt = new Date();
      }

      // Track last action
      if (action) {
        updateData.onboardingTourLastAction = action;
      }

      await updateDoc(userDocRef, updateData);
      debugLog('Saved step to Firestore', { step, action });
    } catch (error) {
      // Log error but don't break the tour - it will still work in memory
      console.warn('⚠️ Tour: Could not save progress (tour will continue):', error);
    }
  }, [user]);

  // Complete the tour
  const completeTour = useCallback(async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'userroles', user.uid);
      
      // Check if document exists first
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        debugLog('User document does not exist, marking as completed in memory only');
        setTourCompleted(true);
        setCurrentStep(5);
        return;
      }

      await updateDoc(userDocRef, {
        onboardingTourCompleted: true,
        onboardingTourCompletedAt: new Date(),
        onboardingTourStep: 5,
      });

      setTourCompleted(true);
      setCurrentStep(5);
      debugLog('Tour completed');
    } catch (error) {
      console.warn('⚠️ Tour: Could not save completion (marking as completed anyway):', error);
      setTourCompleted(true);
      setCurrentStep(5);
    }
  }, [user]);

  // Advance to next step based on action
  const advanceStep = useCallback(async (action: TourAction) => {
    const current = currentStepRef.current; // Get current value FIRST
    debugLog('Advancing step with action:', action);
    debugLog('Current step from ref:', current);
    debugLog('Current step from state:', currentStep);

    // Map actions to step transitions
    const actionStepMap: Record<TourAction, number> = {
      [TOUR_ACTIONS.WELCOME_SHOWN]: 0, // Not used anymore
      [TOUR_ACTIONS.TEMPLATE_DOWNLOADED]: 1,
      [TOUR_ACTIONS.FILE_UPLOADED]: 2,
      [TOUR_ACTIONS.LIST_VIEWED]: 3,
      [TOUR_ACTIONS.ENTRIES_SELECTED]: 4,
      [TOUR_ACTIONS.EMAILS_SENT]: 5,
      [TOUR_ACTIONS.TOUR_COMPLETED]: 5,
    };

    const nextStep = actionStepMap[action];

    if (nextStep !== undefined && nextStep > current) {
      debugLog('Step advanced', { from: current, to: nextStep, action });
      setCurrentStep(nextStep);
      currentStepRef.current = nextStep; // Update ref immediately
      setActionCompleted(true);
      await saveStepToFirestore(nextStep, action);

      // Mark tour as completed when reaching final step
      if (nextStep === 5) {
        await completeTour();
      }

      // Reset action completed flag after a short delay
      setTimeout(() => setActionCompleted(false), 500);
    } else {
      debugLog('Step not advanced', { currentStep: current, nextStep, action });
    }
  }, [saveStepToFirestore, completeTour]);

  // Reset tour to beginning
  const resetTour = useCallback(async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'userroles', user.uid);
      
      // Check if document exists first
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        debugLog('User document does not exist, resetting in memory only');
        setTourCompleted(false);
        setCurrentStep(0);
        return;
      }

      await updateDoc(userDocRef, {
        onboardingTourCompleted: false,
        onboardingTourStep: 0,
        onboardingTourStartedAt: new Date(),
        onboardingTourLastAction: null,
      });

      setTourCompleted(false);
      setCurrentStep(0);
      debugLog('Tour reset to beginning');
    } catch (error) {
      console.warn('⚠️ Tour: Could not save reset (resetting anyway):', error);
      setTourCompleted(false);
      setCurrentStep(0);
    }
  }, [user]);

  // Skip tour (mark as completed)
  const skipTour = useCallback(async () => {
    debugLog('Skipping tour');
    await completeTour();
  }, [completeTour]);

  // Check if tour is active - DISABLED FOR NOW
  const isTourActive = false; // TODO: Re-enable after proper implementation
  // const isTourActive = !loading && !tourCompleted && currentStep < 5;

  // Expose debug info for console access
  if (DEBUG_MODE && typeof window !== 'undefined') {
    (window as any).__tourDebug = {
      currentStep,
      tourCompleted,
      loading,
      isTourActive,
      actionCompleted,
    };
  }

  return {
    currentStep,
    tourCompleted,
    loading,
    isTourActive,
    actionCompleted,
    advanceStep,
    completeTour,
    resetTour,
    skipTour,
  };
}


