/**
 * Tour Overlay Component
 * 
 * Displays a subtle, non-blocking tooltip for the action-based broker tour.
 * Positions near target elements without blocking interaction.
 */

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ACTION_BASED_TOUR_STEPS } from '../../config/brokerTour';

interface TourOverlayProps {
  currentStep: number;
  actionCompleted: boolean;
  onSkip: () => void;
}

export function TourOverlay({ currentStep, actionCompleted, onSkip }: TourOverlayProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = ACTION_BASED_TOUR_STEPS.find(s => s.step === currentStep);

  useEffect(() => {
    console.log('🎯 TourOverlay: Rendering with step', currentStep, step);
    
    if (!step) {
      setVisible(false);
      return;
    }

    // Find target element
    const targetElement = document.querySelector(step.target);
    console.log('🎯 TourOverlay: Looking for target', step.target, 'found:', !!targetElement);
    
    // If target doesn't exist and it's not the body, hide tooltip
    if (!targetElement && step.target !== 'body') {
      console.log('🎯 TourOverlay: Target not found, hiding tooltip');
      setVisible(false);
      return;
    }

    // Calculate position
    const calculatePosition = () => {
      if (step.target === 'body') {
        // Center on screen for welcome
        const isMobile = window.innerWidth < 768;
        setPosition({
          top: isMobile ? 20 : window.innerHeight / 2 - 80,
          left: isMobile ? 10 : window.innerWidth / 2 - 150,
        });
        setVisible(true);
      } else if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const tooltipWidth = isMobile ? window.innerWidth - 20 : 280;
        
        // Position below target by default
        let top = rect.bottom + 12;
        let left = rect.left;

        // On mobile, center horizontally
        if (isMobile) {
          left = 10;
        } else {
          // Adjust if would go off screen
          if (left + tooltipWidth > window.innerWidth) {
            left = window.innerWidth - tooltipWidth - 20;
          }
          if (left < 10) {
            left = 10;
          }
        }

        // If would go off bottom, position above
        if (top + 150 > window.innerHeight) {
          top = rect.top - 150;
        }
        
        // Ensure not off top
        if (top < 10) {
          top = 10;
        }

        setPosition({ top, left });
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    calculatePosition();

    // Re-check target existence periodically (in case dialog opens/closes)
    const checkInterval = setInterval(() => {
      const currentTarget = document.querySelector(step.target);
      if (!currentTarget && step.target !== 'body') {
        setVisible(false);
      } else if (currentTarget) {
        calculatePosition();
      }
    }, 500);

    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [step, currentStep]);

  if (!step || !visible) {
    return null;
  }

  // Extract just the action instruction (first line)
  const instruction = step.content.split('\n')[0];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const tooltip = (
    <>
      {/* Subtle highlight on target (no blocking backdrop) */}
      {step.target !== 'body' && (
        <style>
          {`
            ${step.target} {
              position: relative;
              z-index: 9999 !important;
              box-shadow: 0 0 0 4px rgba(128, 0, 32, 0.3) !important;
              border-radius: 4px;
            }
          `}
        </style>
      )}

      {/* Compact Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: isMobile ? 'calc(100vw - 20px)' : '280px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          padding: '12px 16px',
          zIndex: 10000,
          border: '2px solid #800020',
          pointerEvents: 'auto',
        }}
      >
        {/* Compact instruction */}
        <div style={{
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#333',
          marginBottom: '8px',
        }}>
          {instruction}
        </div>

        {/* Minimal footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#999',
        }}>
          <span>Step {currentStep + 1}/7</span>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: '#800020',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '4px 8px',
              textDecoration: 'underline',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(tooltip, document.body);
}
