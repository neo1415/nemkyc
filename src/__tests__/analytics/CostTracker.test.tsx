import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CostTracker } from '../../components/analytics/CostTracker';
import type { CostTrackingData, BudgetConfig } from '../../types/analytics';

describe('CostTracker', () => {
  const mockBudgetConfig: BudgetConfig = {
    monthlyLimit: 100000,
    warningThreshold: 80,
    criticalThreshold: 100,
    notificationEnabled: true,
  };

  const normalData: CostTrackingData = {
    currentSpending: 50000,
    budgetLimit: 100000,
    utilization: 50,
    projectedCost: 75000,
    alertLevel: 'normal',
    daysElapsed: 15,
    daysInMonth: 30,
  };

  const warningData: CostTrackingData = {
    ...normalData,
    currentSpending: 85000,
    utilization: 85,
    alertLevel: 'warning',
  };

  const criticalData: CostTrackingData = {
    ...normalData,
    currentSpending: 105000,
    utilization: 105,
    alertLevel: 'critical',
  };

  it('should render loading state', () => {
    render(<CostTracker data={null} budgetConfig={null} loading={true} />);
    expect(screen.getByText('Cost Tracker')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<CostTracker data={null} budgetConfig={null} />);
    expect(screen.getByText('No cost data available')).toBeInTheDocument();
  });

  it('should display current spending', () => {
    render(<CostTracker data={normalData} budgetConfig={mockBudgetConfig} />);
    expect(screen.getByText('₦50,000')).toBeInTheDocument();
  });

  it('should display warning indicator at 80% utilization', () => {
    render(<CostTracker data={warningData} budgetConfig={mockBudgetConfig} />);
    expect(screen.getByText(/Warning:/)).toBeInTheDocument();
  });

  it('should display critical alert at 100% utilization', () => {
    render(<CostTracker data={criticalData} budgetConfig={mockBudgetConfig} />);
    expect(screen.getByText(/Critical:/)).toBeInTheDocument();
  });
});
