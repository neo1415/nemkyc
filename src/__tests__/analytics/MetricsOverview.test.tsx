import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsOverview } from '../../components/analytics/MetricsOverview';
import type { AnalyticsSummary } from '../../types/analytics';

describe('MetricsOverview', () => {
  const mockSummary: AnalyticsSummary = {
    totalCalls: 1500,
    totalCost: 125000,
    successRate: 95.5,
    failureRate: 4.5,
    dataproCalls: 1000,
    dataproCost: 50000,
    verifydataCalls: 500,
    verifydataCost: 75000,
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    previousPeriodComparison: {
      callsChange: 12.5,
      costChange: -5.2,
      successRateChange: 2.1,
    },
  };

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      render(<MetricsOverview summary={null} loading={true} />);
      
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts).toHaveLength(4);
    });
  });

  describe('Empty State', () => {
    it('should render empty state when summary is null and not loading', () => {
      render(<MetricsOverview summary={null} loading={false} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display total API calls with correct formatting', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('Total API Calls')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('should display total cost with currency formatting', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('Total Cost')).toBeInTheDocument();
      expect(screen.getByText('₦125,000')).toBeInTheDocument();
    });

    it('should display success rate with percentage', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('95.5%')).toBeInTheDocument();
    });

    it('should display provider breakdown', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('Provider Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Datapro (NIN)')).toBeInTheDocument();
      expect(screen.getByText('VerifyData (CAC)')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  describe('Period Comparison Indicators', () => {
    it('should show positive trend indicator for calls increase', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('should show negative trend indicator for cost decrease', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('-5.2%')).toBeInTheDocument();
    });

    it('should show positive trend indicator for success rate increase', () => {
      render(<MetricsOverview summary={mockSummary} />);
      
      expect(screen.getByText('+2.1%')).toBeInTheDocument();
    });

    it('should handle zero change correctly', () => {
      const summaryWithZeroChange: AnalyticsSummary = {
        ...mockSummary,
        previousPeriodComparison: {
          callsChange: 0,
          costChange: 0,
          successRateChange: 0,
        },
      };

      render(<MetricsOverview summary={summaryWithZeroChange} />);
      
      const zeroChangeElements = screen.getAllByText('+0.0%');
      expect(zeroChangeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', () => {
      const zeroSummary: AnalyticsSummary = {
        totalCalls: 0,
        totalCost: 0,
        successRate: 0,
        failureRate: 0,
        dataproCalls: 0,
        dataproCost: 0,
        verifydataCalls: 0,
        verifydataCost: 0,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        previousPeriodComparison: {
          callsChange: 0,
          costChange: 0,
          successRateChange: 0,
        },
      };

      render(<MetricsOverview summary={zeroSummary} />);
      
      expect(screen.getByText('₦0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle large numbers correctly', () => {
      const largeSummary: AnalyticsSummary = {
        ...mockSummary,
        totalCalls: 1000000,
        totalCost: 50000000,
      };

      render(<MetricsOverview summary={largeSummary} />);
      
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
      expect(screen.getByText('₦50,000,000')).toBeInTheDocument();
    });
  });
});
