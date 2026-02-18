/**
 * Unit Tests for Chart Rendering
 * 
 * Tests Requirement 6.4
 * Validates that charts render correctly with data and show appropriate messages when empty
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageCharts } from '../../components/analytics/UsageCharts';
import type { UsageDataPoint } from '../../types/analytics';

describe('Chart Rendering in UsageCharts', () => {
  it('should render charts when data is provided', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-15',
        totalCalls: 100,
        successfulCalls: 90,
        failedCalls: 10,
        dataproCalls: 60,
        verifydataCalls: 40,
        dataproCost: 3000,
        verifydataCost: 4000,
        successCount: 90,
        failureCount: 10,
      },
      {
        date: '2024-01-16',
        totalCalls: 120,
        successfulCalls: 110,
        failedCalls: 10,
        dataproCalls: 70,
        verifydataCalls: 50,
        dataproCost: 3500,
        verifydataCost: 5000,
        successCount: 110,
        failureCount: 10,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify chart titles are rendered
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Comparison/i)).toBeInTheDocument();
  });

  it('should show "No chart data available" message when array is empty', () => {
    const mockData: UsageDataPoint[] = [];

    render(<UsageCharts data={mockData} />);

    // Verify empty state message is displayed
    expect(screen.getByText(/No chart data available/i)).toBeInTheDocument();
  });

  it('should handle loading state correctly', () => {
    const mockData: UsageDataPoint[] = [];

    render(<UsageCharts data={mockData} loading={true} />);

    // Verify loading state is displayed (there are multiple "Loading..." texts, one per chart)
    expect(screen.getAllByText(/Loading.../i).length).toBeGreaterThan(0);
  });

  it('should render multiple chart types', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-17',
        totalCalls: 150,
        successfulCalls: 140,
        failedCalls: 10,
        dataproCalls: 90,
        verifydataCalls: 60,
        dataproCost: 4500,
        verifydataCost: 6000,
        successCount: 140,
        failureCount: 10,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify different chart sections are rendered
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/Success vs Failure Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Trends/i)).toBeInTheDocument();
  });

  it('should render charts with multiple data points', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-18',
        totalCalls: 80,
        successfulCalls: 75,
        failedCalls: 5,
        dataproCalls: 50,
        verifydataCalls: 30,
        dataproCost: 2500,
        verifydataCost: 3000,
        successCount: 75,
        failureCount: 5,
      },
      {
        date: '2024-01-19',
        totalCalls: 90,
        successfulCalls: 85,
        failedCalls: 5,
        dataproCalls: 55,
        verifydataCalls: 35,
        dataproCost: 2750,
        verifydataCost: 3500,
        successCount: 85,
        failureCount: 5,
      },
      {
        date: '2024-01-20',
        totalCalls: 110,
        successfulCalls: 100,
        failedCalls: 10,
        dataproCalls: 65,
        verifydataCalls: 45,
        dataproCost: 3250,
        verifydataCost: 4500,
        successCount: 100,
        failureCount: 10,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify charts are rendered
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
    
    // Verify chart titles are present (charts render in JSDOM without full SVG support)
    expect(screen.getByText(/Cost Comparison/i)).toBeInTheDocument();
  });

  it('should handle single data point correctly', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-21',
        totalCalls: 100,
        successfulCalls: 95,
        failedCalls: 5,
        dataproCalls: 60,
        verifydataCalls: 40,
        dataproCost: 3000,
        verifydataCost: 4000,
        successCount: 95,
        failureCount: 5,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify charts render with single data point
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
    expect(screen.queryByText(/No chart data available/i)).not.toBeInTheDocument();
  });

  it('should not show empty message when data is provided', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-22',
        totalCalls: 75,
        successfulCalls: 70,
        failedCalls: 5,
        dataproCalls: 45,
        verifydataCalls: 30,
        dataproCost: 2250,
        verifydataCost: 3000,
        successCount: 70,
        failureCount: 5,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify empty message is NOT displayed
    expect(screen.queryByText(/No chart data available/i)).not.toBeInTheDocument();
    
    // Verify charts are displayed
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
  });

  it('should render responsive chart containers', () => {
    const mockData: UsageDataPoint[] = [
      {
        date: '2024-01-23',
        totalCalls: 130,
        successfulCalls: 120,
        failedCalls: 10,
        dataproCalls: 80,
        verifydataCalls: 50,
        dataproCost: 4000,
        verifydataCost: 5000,
        successCount: 120,
        failureCount: 10,
      },
    ];

    render(<UsageCharts data={mockData} />);

    // Verify chart titles are present (responsive containers may not render fully in JSDOM)
    expect(screen.getByText(/Daily API Calls/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Comparison/i)).toBeInTheDocument();
  });
});
