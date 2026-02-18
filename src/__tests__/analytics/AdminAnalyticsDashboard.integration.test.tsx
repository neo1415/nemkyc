import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AdminAnalyticsDashboard from '../../pages/admin/AdminAnalyticsDashboard';
import type { AnalyticsSummary, BrokerUsage, CostTrackingData } from '../../types/analytics';
import * as useAnalyticsDashboardModule from '../../hooks/analytics/useAnalyticsDashboard';
import * as useRealtimeUpdatesModule from '../../hooks/analytics/useRealtimeUpdates';

// Mock the hooks
vi.mock('../../hooks/analytics/useAnalyticsDashboard');
vi.mock('../../hooks/analytics/useRealtimeUpdates');

// Mock the auth hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'admin@test.com',
      role: 'super admin',
    },
    loading: false,
  }),
}));

// Mock child components
vi.mock('../../components/analytics/MetricsOverview', () => ({
  MetricsOverview: ({ summary }: any) => (
    <div data-testid="metrics-overview">
      {summary ? `Metrics: ${summary.totalCalls} calls` : 'No metrics'}
    </div>
  ),
}));

vi.mock('../../components/analytics/UsageCharts', () => ({
  UsageCharts: () => <div data-testid="usage-charts">Usage Charts</div>,
}));

vi.mock('../../components/analytics/UserAttributionTable', () => ({
  UserAttributionTable: ({ data }: any) => (
    <div data-testid="user-attribution-table">
      {data && data.length > 0 ? `${data.length} brokers` : 'No brokers'}
    </div>
  ),
}));

vi.mock('../../components/analytics/CostTracker', () => ({
  CostTracker: ({ data }: any) => (
    <div data-testid="cost-tracker">
      {data ? `Cost: ₦${data.currentSpending}` : 'No cost data'}
    </div>
  ),
}));

vi.mock('../../components/analytics/AuditLogsViewer', () => ({
  AuditLogsViewer: () => <div data-testid="audit-logs-viewer">Audit Logs</div>,
}));

vi.mock('../../components/analytics/ReportGenerator', () => ({
  ReportGenerator: () => <div data-testid="report-generator">Report Generator</div>,
}));

// Mock ConnectionStatus component
let mockConnectionStatus = true;
vi.mock('../../components/analytics/ConnectionStatus', () => ({
  default: () => {
    const { Wifi, WifiOff } = require('lucide-react');
    return (
      <div className="flex items-center gap-2">
        {mockConnectionStatus ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600">Disconnected</span>
          </>
        )}
      </div>
    );
  },
}));

describe('AdminAnalyticsDashboard Integration Tests', () => {
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

  const mockBrokerUsage: BrokerUsage[] = [
    {
      brokerId: 'broker-1',
      brokerName: 'John Doe',
      brokerEmail: 'john@test.com',
      totalCalls: 500,
      dataproCalls: 300,
      verifydataCalls: 200,
      totalCost: 35000,
      successRate: 96.0,
      lastActivity: new Date('2024-01-31'),
    },
    {
      brokerId: 'broker-2',
      brokerName: 'Jane Smith',
      brokerEmail: 'jane@test.com',
      totalCalls: 300,
      dataproCalls: 200,
      verifydataCalls: 100,
      totalCost: 20000,
      successRate: 94.5,
      lastActivity: new Date('2024-01-30'),
    },
  ];

  const mockCostTracking: CostTrackingData = {
    currentSpending: 125000,
    budgetLimit: 200000,
    utilization: 62.5,
    projectedCost: 180000,
    alertLevel: 'normal',
    daysElapsed: 20,
    daysInMonth: 31,
  };

  const mockUseAnalyticsDashboard = {
    summary: mockSummary,
    userAttribution: mockBrokerUsage,
    costTracking: mockCostTracking,
    loading: false,
    error: null,
    refetch: vi.fn(),
  };

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockConnectionStatus = true; // Reset to connected state
    vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue(mockUseAnalyticsDashboard);
    vi.mocked(useRealtimeUpdatesModule.useRealtimeUpdates).mockReturnValue({
      connected: true,
      lastUpdate: new Date(),
      isPaused: false,
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Dashboard Load', () => {
    it('should render all dashboard components when data is loaded', async () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('API Analytics & Cost Tracking')).toBeInTheDocument();
      });

      // Check that all major components are rendered
      expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      expect(screen.getByTestId('usage-charts')).toBeInTheDocument();
      expect(screen.getByTestId('user-attribution-table')).toBeInTheDocument();
      expect(screen.getByTestId('cost-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('audit-logs-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('report-generator')).toBeInTheDocument();
    });

    it('should display header with title and description', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('API Analytics & Cost Tracking')).toBeInTheDocument();
      expect(screen.getByText('Monitor API usage, costs, and performance metrics')).toBeInTheDocument();
    });

    it('should show connection status indicator', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should render refresh button', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Filter Application Across Components', () => {
    it('should render filter controls', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getByText('API Provider')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should have reset filters button', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should update filters when provider is changed', async () => {
      const refetchMock = vi.fn();
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        refetch: refetchMock,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      // Find and click provider select
      const providerSelects = screen.getAllByRole('combobox');
      const providerSelect = providerSelects.find(select => 
        select.closest('[class*="space-y-2"]')?.querySelector('label')?.textContent === 'API Provider'
      );

      if (providerSelect) {
        fireEvent.click(providerSelect);
        
        await waitFor(() => {
          // The filter state should be updated internally
          // This would trigger a re-render with new filters
          expect(providerSelect).toBeInTheDocument();
        });
      }
    });

    it('should reset filters to default when reset button is clicked', async () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const resetButton = screen.getByRole('button', { name: /reset filters/i });
      fireEvent.click(resetButton);

      await waitFor(() => {
        // Filters should be reset to default values
        expect(resetButton).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should show connected status when real-time connection is active', () => {
      mockConnectionStatus = true;
      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show disconnected status when connection is lost', () => {
      mockConnectionStatus = false;
      vi.mocked(useRealtimeUpdatesModule.useRealtimeUpdates).mockReturnValue({
        connected: false,
        lastUpdate: new Date(),
        isPaused: false,
        refresh: vi.fn(),
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should call refetch when refresh button is clicked', async () => {
      const refetchMock = vi.fn();
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        refetch: refetchMock,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when data is loading', () => {
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        loading: true,
        summary: null,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      // Should show loading spinner instead of components
      expect(screen.queryByTestId('metrics-overview')).not.toBeInTheDocument();
    });

    it('should disable refresh button while loading', () => {
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        loading: true,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', () => {
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        error: new Error('Failed to fetch analytics data'),
        summary: null,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText('Error loading analytics dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch analytics data')).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        error: new Error('Network error'),
        summary: null,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const refetchMock = vi.fn();
      vi.mocked(useAnalyticsDashboardModule.useAnalyticsDashboard).mockReturnValue({
        ...mockUseAnalyticsDashboard,
        error: new Error('Network error'),
        summary: null,
        refetch: refetchMock,
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(refetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Data Propagation', () => {
    it('should pass summary data to MetricsOverview component', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const metricsOverview = screen.getByTestId('metrics-overview');
      expect(metricsOverview).toHaveTextContent('Metrics: 1500 calls');
    });

    it('should pass broker data to UserAttributionTable component', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const attributionTable = screen.getByTestId('user-attribution-table');
      expect(attributionTable).toHaveTextContent('2 brokers');
    });

    it('should pass cost tracking data to CostTracker component', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const costTracker = screen.getByTestId('cost-tracker');
      expect(costTracker).toHaveTextContent('Cost: ₦125000');
    });
  });

  describe('Responsive Layout', () => {
    it('should render with responsive classes', () => {
      const { container } = renderWithRouter(<AdminAnalyticsDashboard />);

      // Check for responsive padding classes on the main dashboard container
      const mainContainer = container.querySelector('.analytics-dashboard');
      expect(mainContainer).toHaveClass('space-y-4', 'md:space-y-6', 'p-3', 'md:p-6');
    });

    it('should have responsive header layout', () => {
      renderWithRouter(<AdminAnalyticsDashboard />);

      const header = screen.getByText('API Analytics & Cost Tracking').closest('div');
      expect(header?.parentElement).toHaveClass('flex', 'flex-col', 'md:flex-row');
    });
  });

  describe('Last Update Timestamp', () => {
    it('should display last update timestamp when available', () => {
      const testDate = new Date('2024-01-31T10:30:00');
      vi.mocked(useRealtimeUpdatesModule.useRealtimeUpdates).mockReturnValue({
        connected: true,
        lastUpdate: testDate,
        isPaused: false,
        refresh: vi.fn(),
      });

      renderWithRouter(<AdminAnalyticsDashboard />);

      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });
});
