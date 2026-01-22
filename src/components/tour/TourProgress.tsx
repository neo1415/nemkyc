/**
 * Tour Progress Component
 * 
 * Displays a progress indicator for the broker onboarding tour.
 * Shows current step and completed steps with checkmarks.
 */

import React from 'react';
import { ACTION_BASED_TOUR_STEPS } from '../../config/brokerTour';

interface TourProgressProps {
  currentStep: number;
}

export function TourProgress({ currentStep }: TourProgressProps) {
  const totalSteps = ACTION_BASED_TOUR_STEPS.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        padding: '12px 16px',
        zIndex: 9998,
        minWidth: '200px',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#800020',
          marginBottom: '8px',
        }}
      >
        Onboarding Tour
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e0e0e0',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#800020',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Step indicator */}
      <div
        style={{
          fontSize: '11px',
          color: '#666',
        }}
      >
        Step {currentStep + 1} of {totalSteps}
      </div>

      {/* Step list */}
      <div style={{ marginTop: '12px' }}>
        {ACTION_BASED_TOUR_STEPS.map((step) => (
          <div
            key={step.step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '6px',
              fontSize: '11px',
              color: step.step <= currentStep ? '#333' : '#999',
            }}
          >
            {/* Checkmark or step number */}
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: step.step < currentStep ? '#28a745' : step.step === currentStep ? '#800020' : '#e0e0e0',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {step.step < currentStep ? '✓' : step.step + 1}
            </div>

            {/* Step title (truncated) */}
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
