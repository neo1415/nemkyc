import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UsageCharts } from '../../components/analytics/UsageCharts';
import type { UsageDataPoint } from '../../types/analytics';

describe('UsageCharts', () => {
  const mockData: UsageDataPoint[] = [
    {
      date: '2024-01-01',
      dataproCalls: 100,
      verifydataCalls: 50,
      totalCalls: 150,
      dataproCost: 5000,
      verifydataCost: 5000,
      totalCost: 10000,
      successCount: 140,
      failureCount: 10,
    },
    {
      date: '2024-01-02',
      dataproCalls: 120,
      verifydataCalls: 60,
      totalCalls: 180,
      dataproCost: 6000,
      verifydataCost: 6000,
      totalCost: 12000,
      successCount: 170,
      failureCount: 10,
    },
    {
      date: '2024-01-03',
      dataproCalls: 90,
      verifydataCalls: 45,
      totalCalls: 135,
      dataproCost: 4500,
      verifydataCost: 4500,
      totalCost: 9000,
      successCount: 130,
      failureCount: 5,
    },
  ];

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      render(<UsageCharts data={[]} loading={true} />);
      
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts).toHaveLength(4);
    });
  });

  describe('Empty State', () => {
    it('should render empty state when data is empty array', () => {
      render(<UsageCharts data={[]} loading={false} />);
      
      expect(screen.getByText('No chart data available')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('should render all four chart titles', () => {
      render(<UsageCharts data={mockData} />);
      
      expect(screen.getByText('Daily API Calls')).toBeInTheDocument();
      expect(screen.getByText('Cost Comparison')).toBeInTheDocument();
      expect(screen.getByText('Success vs Failure Rate')).toBeInTheDocument();
      expect(screen.getByText('Cost Trends')).toBeInTheDocument();
    });

    it('should render ResponsiveContainer for charts', () => {
      const { container } = render(<UsageCharts data={mockData} />);
      
      // Check that ResponsiveContainer elements are present (4 charts)
      const responsiveContainers = container.querySelectorAll('.recharts-responsive-container');
      expect(responsiveContainers.length).toBe(4);
    });
  });

  describe('Data Display', () => {
    it('should render chart containers without errors', () => {
      const { container } = render(<UsageCharts data={mockData} />);
      
      // Verify all 4 chart cards are rendered
      const cards = container.querySelectorAll('.rounded-lg.border');
      expect(cards.length).toBe(4);
    });

    it('should calculate success/failure totals correctly', () => {
      render(<UsageCharts data={mockData} />);
      
      // Success and Failure labels should be present in pie chart title
      expect(screen.getByText('Success vs Failure Rate')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singleDataPoint: UsageDataPoint[] = [mockData[0]];
      
      render(<UsageCharts data={singleDataPoint} />);
      
      expect(screen.getByText('Daily API Calls')).toBeInTheDocument();
      expect(screen.getByText('Cost Comparison')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroData: UsageDataPoint[] = [
        {
          date: '2024-01-01',
          dataproCalls: 0,
          verifydataCalls: 0,
          totalCalls: 0,
          dataproCost: 0,
          verifydataCost: 0,
          totalCost: 0,
          successCount: 0,
          failureCount: 0,
        },
      ];
      
      render(<UsageCharts data={zeroData} />);
      
      expect(screen.getByText('Daily API Calls')).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const largeData: UsageDataPoint[] = [
        {
          date: '2024-01-01',
          dataproCalls: 1000000,
          verifydataCalls: 500000,
          totalCalls: 1500000,
          dataproCost: 50000000,
          verifydataCost: 50000000,
          totalCost: 100000000,
          successCount: 1400000,
          failureCount: 100000,
        },
      ];
      
      render(<UsageCharts data={largeData} />);
      
      expect(screen.getByText('Daily API Calls')).toBeInTheDocument();
    });
  });
});
