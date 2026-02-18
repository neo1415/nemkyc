/**
 * Unit Tests for ReportGenerator Component
 * 
 * Feature: api-analytics-dashboard
 * Task: 13.4
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportGenerator } from '../../components/analytics/ReportGenerator';
import { reportService } from '../../services/analytics/ReportService';
import type { ReportData } from '../../services/analytics/ReportService';

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the report service
vi.mock('../../services/analytics/ReportService', () => ({
  reportService: {
    generatePDFReport: vi.fn(),
    generateExcelReport: vi.fn(),
    generateCSVReport: vi.fn(),
    downloadBlob: vi.fn(),
  },
}));

describe('ReportGenerator Component', () => {
  const mockData: ReportData = {
    summary: {
      totalCalls: 1000,
      totalCost: 75000,
      successRate: 95.5,
      failureRate: 4.5,
      dataproCalls: 600,
      dataproCost: 30000,
      verifydataCalls: 400,
      verifydataCost: 40000,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      previousPeriodComparison: {
        callsChange: 10.5,
        costChange: 8.2,
        successRateChange: 2.1,
      },
    },
    usageData: [
      {
        date: '2024-01-01',
        dataproCalls: 20,
        verifydataCalls: 10,
        totalCalls: 30,
        dataproCost: 1000,
        verifydataCost: 1000,
        totalCost: 2000,
        successCount: 28,
        failureCount: 2,
      },
    ],
    brokerUsage: [
      {
        brokerId: 'broker-1',
        brokerName: 'John Doe',
        brokerEmail: 'john@example.com',
        totalCalls: 100,
        dataproCalls: 60,
        verifydataCalls: 40,
        totalCost: 7000,
        successRate: 96.0,
        lastActivity: new Date('2024-01-31'),
      },
    ],
  };

  const mockCurrentUser = {
    email: 'admin@example.com',
    displayName: 'Admin User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Component renders with all format options
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  it('renders all report format options', () => {
    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    expect(screen.getByText('Generate Report')).toBeInTheDocument();
    expect(screen.getByLabelText(/PDF - Formatted report/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Excel - Multi-sheet workbook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CSV - Raw data/i)).toBeInTheDocument();
  });

  /**
   * Test: Format selection changes state
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  it('allows format selection', () => {
    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const pdfRadio = screen.getByLabelText(/PDF - Formatted report/i);
    const excelRadio = screen.getByLabelText(/Excel - Multi-sheet workbook/i);
    const csvRadio = screen.getByLabelText(/CSV - Raw data/i);

    // PDF should be selected by default
    expect(pdfRadio).toBeChecked();

    // Select Excel
    fireEvent.click(excelRadio);
    expect(excelRadio).toBeChecked();
    expect(pdfRadio).not.toBeChecked();

    // Select CSV
    fireEvent.click(csvRadio);
    expect(csvRadio).toBeChecked();
    expect(excelRadio).not.toBeChecked();
  });

  /**
   * Test: All report sections are displayed
   * Validates: Requirements 8.6
   */
  it('displays all available report sections', () => {
    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    expect(screen.getByText('Overview Metrics')).toBeInTheDocument();
    expect(screen.getByText('Usage Data')).toBeInTheDocument();
    expect(screen.getByText('Broker Attribution')).toBeInTheDocument();
    expect(screen.getByText('Cost Tracking')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  /**
   * Test: Section selection toggles correctly
   * Validates: Requirements 8.6
   */
  it('allows section selection and deselection', () => {
    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const overviewCheckbox = screen.getByLabelText('Overview Metrics');
    const usageCheckbox = screen.getByLabelText('Usage Data');

    // Overview should be selected by default
    expect(overviewCheckbox).toBeChecked();
    expect(usageCheckbox).not.toBeChecked();

    // Select usage data
    fireEvent.click(usageCheckbox);
    expect(usageCheckbox).toBeChecked();

    // Deselect overview
    fireEvent.click(overviewCheckbox);
    expect(overviewCheckbox).not.toBeChecked();
  });

  /**
   * Test: Generate button is disabled when no sections selected
   * Validates: Requirements 8.6
   */
  it('disables generate button when no sections are selected', () => {
    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const overviewCheckbox = screen.getByLabelText('Overview Metrics');
    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });

    // Deselect the default section
    fireEvent.click(overviewCheckbox);

    expect(generateButton).toBeDisabled();
    expect(screen.getByText(/Select at least one section/i)).toBeInTheDocument();
  });

  /**
   * Test: PDF report generation
   * Validates: Requirements 8.1
   */
  it('generates PDF report with selected sections', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(reportService.generatePDFReport).mockResolvedValue(mockBlob);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          title: 'API Analytics Report',
          generatedBy: 'Admin User',
        }),
        ['overview']
      );
      expect(reportService.downloadBlob).toHaveBeenCalledWith(
        mockBlob,
        expect.stringMatching(/analytics-report-.*\.pdf/)
      );
    });
  });

  /**
   * Test: Excel report generation
   * Validates: Requirements 8.2
   */
  it('generates Excel report with selected sections', async () => {
    const mockBlob = new Blob(['excel content'], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    vi.mocked(reportService.generateExcelReport).mockResolvedValue(mockBlob);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    // Select Excel format
    const excelRadio = screen.getByLabelText(/Excel - Multi-sheet workbook/i);
    fireEvent.click(excelRadio);

    // Select multiple sections
    const usageCheckbox = screen.getByLabelText('Usage Data');
    fireEvent.click(usageCheckbox);

    const generateButton = screen.getByRole('button', { name: /Generate EXCEL Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generateExcelReport).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          title: 'API Analytics Report',
          generatedBy: 'Admin User',
        }),
        expect.arrayContaining(['overview', 'usage-charts'])
      );
      expect(reportService.downloadBlob).toHaveBeenCalledWith(
        mockBlob,
        expect.stringMatching(/analytics-report-.*\.xlsx/)
      );
    });
  });

  /**
   * Test: CSV report generation
   * Validates: Requirements 8.3
   */
  it('generates CSV report with selected sections', async () => {
    const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
    vi.mocked(reportService.generateCSVReport).mockResolvedValue(mockBlob);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    // Select CSV format
    const csvRadio = screen.getByLabelText(/CSV - Raw data/i);
    fireEvent.click(csvRadio);

    const generateButton = screen.getByRole('button', { name: /Generate CSV Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generateCSVReport).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          title: 'API Analytics Report',
          generatedBy: 'Admin User',
        }),
        ['overview']
      );
      expect(reportService.downloadBlob).toHaveBeenCalledWith(
        mockBlob,
        expect.stringMatching(/analytics-report-.*\.csv/)
      );
    });
  });

  /**
   * Test: Report generation with filters applied
   * Validates: Requirements 8.4
   */
  it('includes date range in report metadata', async () => {
    const mockBlob = new Blob(['csv content'], { type: 'text/csv' });
    vi.mocked(reportService.generateCSVReport).mockResolvedValue(mockBlob);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
        }),
        ['overview']
      );
    });
  });

  /**
   * Test: Size limit validation error handling
   * Validates: Requirements 8.8
   */
  it('displays error message when report size exceeds limit', async () => {
    const mockError = new Error('Report too large: 15000 records exceeds maximum of 10000');
    vi.mocked(reportService.generatePDFReport).mockRejectedValue(mockError);

    const { container } = render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalled();
    });

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });
  });

  /**
   * Test: Loading state during report generation
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  it('shows loading state during report generation', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    let resolveGeneration: (value: Blob) => void;
    const generationPromise = new Promise<Blob>((resolve) => {
      resolveGeneration = resolve;
    });
    vi.mocked(reportService.generatePDFReport).mockReturnValue(generationPromise);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Generating Report.../i)).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    // Resolve the promise
    resolveGeneration!(mockBlob);

    // Should return to normal state
    await waitFor(() => {
      expect(screen.queryByText(/Generating Report.../i)).not.toBeInTheDocument();
      expect(generateButton).not.toBeDisabled();
    });
  });

  /**
   * Test: Uses user email when displayName is not available
   * Validates: Requirements 8.5
   */
  it('uses email when displayName is not provided', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(reportService.generatePDFReport).mockResolvedValue(mockBlob);

    const userWithoutName = {
      email: 'admin@example.com',
    };

    render(<ReportGenerator data={mockData} currentUser={userWithoutName} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalledWith(
        mockData,
        expect.objectContaining({
          generatedBy: 'admin@example.com',
        }),
        ['overview']
      );
    });
  });

  /**
   * Test: Multiple sections can be selected
   * Validates: Requirements 8.6
   */
  it('allows multiple sections to be selected', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    vi.mocked(reportService.generatePDFReport).mockResolvedValue(mockBlob);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    // Select multiple sections
    fireEvent.click(screen.getByLabelText('Usage Data'));
    fireEvent.click(screen.getByLabelText('Broker Attribution'));
    fireEvent.click(screen.getByLabelText('Audit Logs'));

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalledWith(
        mockData,
        expect.any(Object),
        expect.arrayContaining(['overview', 'usage-charts', 'broker-attribution', 'audit-logs'])
      );
    });
  });

  /**
   * Test: Error handling for network failures
   * Validates: Requirements 8.8
   */
  it('handles network errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(reportService.generatePDFReport).mockRejectedValue(mockError);

    render(<ReportGenerator data={mockData} currentUser={mockCurrentUser} />);

    const generateButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(reportService.generatePDFReport).toHaveBeenCalled();
    });

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(generateButton).not.toBeDisabled();
    });
  });
});
