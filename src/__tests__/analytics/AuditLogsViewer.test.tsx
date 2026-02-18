import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditLogsViewer } from '../../components/analytics/AuditLogsViewer';
import type { AuditLogEntry } from '../../types/analytics';

describe('AuditLogsViewer', () => {
  const mockData: AuditLogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date('2024-01-15T10:30:00'),
      userId: 'user-1',
      userName: 'John Doe',
      provider: 'datapro',
      verificationType: 'nin',
      status: 'success',
      cost: 50,
      ipAddress: '192.168.1.1',
      deviceInfo: 'Chrome/Windows',
    },
    {
      id: 'log-2',
      timestamp: new Date('2024-01-15T11:00:00'),
      userId: 'user-2',
      userName: 'Jane Smith',
      provider: 'verifydata',
      verificationType: 'cac',
      status: 'failure',
      cost: 100,
      ipAddress: '192.168.1.2',
      deviceInfo: 'Firefox/Mac',
      errorMessage: 'Invalid CAC number',
    },
  ];

  it('should render loading state', () => {
    render(<AuditLogsViewer data={[]} loading={true} />);
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<AuditLogsViewer data={[]} />);
    expect(screen.getByText('No audit logs available')).toBeInTheDocument();
  });

  it('should display audit log entries', () => {
    render(<AuditLogsViewer data={mockData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should filter by search term', () => {
    render(<AuditLogsViewer data={mockData} />);
    const searchInput = screen.getByPlaceholderText(/Search by user name/);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should expand row to show details', () => {
    render(<AuditLogsViewer data={mockData} />);
    const expandButtons = screen.getAllByRole('button');
    const firstExpandButton = expandButtons.find(btn => btn.querySelector('svg'));
    if (firstExpandButton) {
      fireEvent.click(firstExpandButton);
      expect(screen.getByText(/User ID:/)).toBeInTheDocument();
    }
  });
});
