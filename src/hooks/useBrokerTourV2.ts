/**
 * Broker Tour Hook V2 - Using Driver.js
 * 
 * Simple, reliable tour implementation with localStorage persistence.
 * Resumes from last step across sessions until completed or skipped.
 */

import { useEffect, useRef, useCallback } from 'react';
import { driver, DriveStep, Driver, Config } from 'driver.js';
import { useLocation } from 'react-router-dom';
import 'driver.js/dist/driver.css';
import { useAuth } from '../contexts/AuthContext';

const TOUR_STORAGE_KEY = 'broker-tour-state';

interface TourState {
  completed: boolean;
  currentStep: number;
  lastUpdated: string;
  userId?: string; // Track which user completed it
}

const getTourState = (userId?: string): TourState => {
  const storageKey = userId ? `${TOUR_STORAGE_KEY}-${userId}` : TOUR_STORAGE_KEY;
  
  let stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    stored = sessionStorage.getItem(storageKey);
    
    if (stored) {
      try {
        localStorage.setItem(storageKey, stored);
      } catch (e) {
        // Silent fail
      }
    }
  }
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed;
    } catch {
      return { completed: false, currentStep: 0, lastUpdated: new Date().toISOString(), userId };
    }
  }
  return { completed: false, currentStep: 0, lastUpdated: new Date().toISOString(), userId };
};

const saveTourState = (state: Partial<TourState>, userId?: string) => {
  try {
    const current = getTourState(userId);
    const updated = {
      ...current,
      ...state,
      userId,
      lastUpdated: new Date().toISOString(),
    };
    const storageKey = userId ? `${TOUR_STORAGE_KEY}-${userId}` : TOUR_STORAGE_KEY;
    
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    const verification = localStorage.getItem(storageKey);
    if (!verification) {
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
    }
  } catch (error) {
    // Silent fail for production
  }
};

const tourSteps: DriveStep[] = [
  {
    element: '[data-tour="download-template"]',
    popover: {
      title: 'Download Template',
      description: '📥 Download the Excel template.',
      side: 'bottom',
      align: 'start',
      showButtons: ['close'],
    },
  },
  {
    element: '[data-tour="upload-area"]',
    popover: {
      title: 'Upload File',
      description: '📤 Drag & drop your filled file here.',
      side: 'top',
      align: 'center',
      showButtons: ['previous', 'close'],
    },
  },
  {
    element: '[data-tour="create-list-button"]',
    popover: {
      title: 'Create List',
      description: '✅ Review preview, then click "Create List".',
      side: 'top',
      align: 'end',
      showButtons: ['previous', 'close'],
    },
  },
  {
    element: '[data-tour="select-entries"]',
    popover: {
      title: 'Select Customers',
      description: '✅ Click top-left checkbox to select all.',
      side: 'left',
      align: 'start',
      showButtons: ['previous', 'close'],
    },
  },
  {
    element: '[data-tour="request-buttons"]',
    popover: {
      title: 'Send Requests',
      description: '📧 Click button, then confirm.',
      side: 'left',
      align: 'start',
      showButtons: ['previous', 'close'],
    },
  },
  {
    popover: {
      title: 'All Done! 🎉',
      description: 'Track progress in the status column.',
      showButtons: ['close'],
    },
  },
];

const driverConfig: Config = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  progressText: 'Step {{current}} of {{total}}',
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Close',
  allowClose: true,
  smoothScroll: false,
  animate: false,
  popoverClass: 'broker-tour-popover',
  allowKeyboardControl: true,
  disableActiveInteraction: false,
  // CRITICAL: Completely disable overlay and make everything interactive
  overlayColor: 'transparent', // Make overlay invisible
  overlayOpacity: 0, // No opacity
  stagePadding: 0, // No padding around highlighted element
  stageRadius: 4, // Small radius for subtle highlight
};

export function useBrokerTourV2() {
  const { user } = useAuth();
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);

  const advanceTour = useCallback(() => {
    if (!driverRef.current) {
      return;
    }

    try {
      const activeIndex = driverRef.current.getActiveIndex();
      
      if (activeIndex === undefined || activeIndex === null) {
        return;
      }

      if (activeIndex >= tourSteps.length - 1) {
        const userId = user?.uid;
        saveTourState({ completed: true }, userId);
        driverRef.current.destroy();
        return;
      }

      const nextStep = activeIndex + 1;
      const userId = user?.uid;
      
      saveTourState({ currentStep: nextStep }, userId);
      driverRef.current.drive(nextStep);
    } catch (error) {
      // Silent fail
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    (window as any).__currentUserId = user.uid;

    const tourState = getTourState(user.uid);
    
    if (tourState.completed) {
      return;
    }

    const timer = setTimeout(() => {
      let targetElement: Element | null = null;
      let elementSelector = '';
      
      switch (tourState.currentStep) {
        case 0:
          elementSelector = '[data-tour="download-template"]';
          break;
        case 1:
          elementSelector = '[data-tour="upload-area"]';
          break;
        case 2:
          elementSelector = '[data-tour="create-list-button"]';
          break;
        case 3:
          elementSelector = '[data-tour="select-entries"]';
          break;
        case 4:
          elementSelector = '[data-tour="request-buttons"]';
          break;
        default:
          elementSelector = '[data-tour="download-template"]';
          tourState.currentStep = 0;
      }
      
      targetElement = document.querySelector(elementSelector);
      
      if (!targetElement) {
        if (driverRef.current) {
          driverRef.current.destroy();
          driverRef.current = null;
        }
        return;
      }

      if (driverRef.current) {
        driverRef.current.destroy();
      }

      driverRef.current = driver({
        ...driverConfig,
        steps: tourSteps,
      });

      driverRef.current.drive(tourState.currentStep);
      
      setTimeout(() => {
        const userId = user?.uid;
        
        const handleClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          
          const closeButton = target.closest('.driver-popover-close-btn') ||
                             target.closest('.driver-popover-done-btn') ||
                             target.closest('button[aria-label="Close"]');
          
          if (closeButton) {
            e.preventDefault();
            e.stopPropagation();
            
            saveTourState({ completed: true }, userId);
            
            if (driverRef.current) {
              driverRef.current.destroy();
              driverRef.current = null;
            }
          }
        };
        
        document.addEventListener('click', handleClick, true);
        (window as any).__tourClickHandler = handleClick;
      }, 100);
    }, 2500);

    return () => {
      clearTimeout(timer);
      
      const clickHandler = (window as any).__tourClickHandler;
      if (clickHandler) {
        document.removeEventListener('click', clickHandler, true);
        delete (window as any).__tourClickHandler;
      }
      
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [user, location.pathname]);

  const resetTour = useCallback(() => {
    const userId = user?.uid;
    
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    
    saveTourState({ completed: false, currentStep: 0 }, userId);
    window.location.reload();
  }, [user]);

  const skipTour = useCallback(() => {
    const userId = user?.uid;
    saveTourState({ completed: true }, userId);
    if (driverRef.current) {
      driverRef.current.destroy();
    }
  }, [user]);

  return {
    advanceTour,
    resetTour,
    skipTour,
  };
}

// Make reset available globally for testing (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).resetBrokerTour = () => {
    const userId = (window as any).__currentUserId;
    if (userId) {
      const storageKey = `${TOUR_STORAGE_KEY}-${userId}`;
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
    } else {
      localStorage.removeItem(TOUR_STORAGE_KEY);
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
    }
    window.location.reload();
  };
  
  (window as any).checkBrokerTourState = () => {
    const localKeys = Object.keys(localStorage).filter(k => k.includes('broker-tour'));
    const sessionKeys = Object.keys(sessionStorage).filter(k => k.includes('broker-tour'));
    const userId = (window as any).__currentUserId;
    
    return {
      localStorage: localKeys.map(k => ({ key: k, value: localStorage.getItem(k) })),
      sessionStorage: sessionKeys.map(k => ({ key: k, value: sessionStorage.getItem(k) })),
      currentUserId: userId
    };
  };
}
