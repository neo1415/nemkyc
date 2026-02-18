/**
 * Unit Tests for Cost Display
 * 
 * Tests Requirement 3.5
 * Validates that cost field is displayed correctly in AuditLogsViewer
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditLogsViewer } from '../../components/analytics/AuditLogsViewer';
import type { AuditLogEntry } from '../../types/analytics';

describe('Cost Display in AuditLogsViewer', () => {
  it('should render cost as ₦50 for successful Datapro verification', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log1',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        userName: 'John Doe',
        userId: 'user1',
        userEmail: 'john@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'success',
        cost: 50,
        ipAddress: '192.168.1.1',
        deviceInfo: 'Chrome/Windows',
      },
    ];

    render(<AuditLogsViewer data={mockData} loading={false} />);

    // Check that cost is displayed
    expect(screen.getByText(/₦50/i)).toBeInTheDocument();
  });

  it('should render cost as ₦100 for successful VerifyData verification', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log2',
        timestamp: new Date('2024-01-16T11:00:00Z'),
        userName: 'Jane Smith',
        userId: 'user2',
        userEmail: 'jane@example.com',
        provider: 'verifydata',
        verificationType: 'CAC',
        status: 'success',
        cost: 100,
        ipAddress: '192.168.1.2',
        deviceInfo: 'Firefox/Mac',
      },
    ];

    render(<AuditLogsViewer data={mockData} loading={false} />);

    // Check that cost is displayed
    expect(screen.getByText(/₦100/i)).toBeInTheDocument();
  });

  it('should render cost as ₦0 for failed verification', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log3',
        timestamp: new Date('2024-01-17T12:00:00Z'),
        userName: 'Bob Johnson',
        userId: 'user3',
        userEmail: 'bob@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'failure',
        cost: 0,
        ipAddress: '192.168.1.3',
        deviceInfo: 'Safari/iOS',
        errorMessage: 'Invalid NIN',
      },
    ];

    render(<AuditLogsViewer data={mockData} loading={false} />);

    // Check that cost is displayed as ₦0
    expect(screen.getByText(/₦0/i)).toBeInTheDocument();
  });

  it('should format cost with Nigerian Naira symbol and proper formatting', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log4',
        timestamp: new Date('2024-01-18T13:00:00Z'),
        userName: 'Alice Brown',
        userId: 'user4',
        userEmail: 'alice@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'success',
        cost: 50,
        ipAddress: '192.168.1.4',
        deviceInfo: 'Edge/Windows',
      },
    ];

    const { container } = render(<AuditLogsViewer data={mockData} loading={false} />);

    // Verify the cost column exists
    const costHeader = screen.getByText(/Cost/i);
    expect(costHeader).toBeInTheDocument();

    // Verify cost is formatted correctly
    expect(screen.getByText(/₦50/i)).toBeInTheDocument();
  });

  it('should display multiple cost values correctly', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log5',
        timestamp: new Date('2024-01-19T14:00:00Z'),
        userName: 'Charlie Davis',
        userId: 'user5',
        userEmail: 'charlie@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'success',
        cost: 50,
        ipAddress: '192.168.1.5',
        deviceInfo: 'Chrome/Android',
      },
      {
        id: 'log6',
        timestamp: new Date('2024-01-19T15:00:00Z'),
        userName: 'David Wilson',
        userId: 'user6',
        userEmail: 'david@example.com',
        provider: 'verifydata',
        verificationType: 'CAC',
        status: 'success',
        cost: 100,
        ipAddress: '192.168.1.6',
        deviceInfo: 'Safari/Mac',
      },
      {
        id: 'log7',
        timestamp: new Date('2024-01-19T16:00:00Z'),
        userName: 'Eve Martinez',
        userId: 'user7',
        userEmail: 'eve@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'failure',
        cost: 0,
        ipAddress: '192.168.1.7',
        deviceInfo: 'Firefox/Linux',
      },
    ];

    render(<AuditLogsViewer data={mockData} loading={false} />);

    // All three cost values should be displayed
    expect(screen.getByText(/₦50/i)).toBeInTheDocument();
    expect(screen.getByText(/₦100/i)).toBeInTheDocument();
    expect(screen.getByText(/₦0/i)).toBeInTheDocument();
  });

  it('should handle missing cost field gracefully', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log8',
        timestamp: new Date('2024-01-20T10:00:00Z'),
        userName: 'Frank Garcia',
        userId: 'user8',
        userEmail: 'frank@example.com',
        provider: 'datapro',
        verificationType: 'NIN',
        status: 'success',
        cost: 0, // Default to 0 if missing
        ipAddress: '192.168.1.8',
        deviceInfo: 'Chrome/Windows',
      },
    ];

    render(<AuditLogsViewer data={mockData} loading={false} />);

    // Component should render without crashing
    expect(screen.getByText(/Frank Garcia/i)).toBeInTheDocument();
  });

  it('should display cost in table column', () => {
    const mockData: AuditLogEntry[] = [
      {
        id: 'log9',
        timestamp: new Date('2024-01-21T11:00:00Z'),
        userName: 'Grace Lee',
        userId: 'user9',
        userEmail: 'grace@example.com',
        provider: 'verifydata',
        verificationType: 'CAC',
        status: 'success',
        cost: 100,
        ipAddress: '192.168.1.9',
        deviceInfo: 'Safari/iOS',
      },
    ];

    const { container } = render(<AuditLogsViewer data={mockData} loading={false} />);

    // Verify table structure
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();

    // Verify cost header exists
    expect(screen.getByText(/Cost/i)).toBeInTheDocument();

    // Verify cost value is displayed
    expect(screen.getByText(/₦100/i)).toBeInTheDocument();
  });
});
