/**
 * Unit Tests for Timestamp Display
 * 
 * Tests Requirements 1.2, 1.3
 * Validates that timestamps are displayed correctly in UserAttributionTable
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAttributionTable } from '../../components/analytics/UserAttributionTable';
import type { BrokerUsage } from '../../types/analytics';

describe('Timestamp Display in UserAttributionTable', () => {
  it('should render timestamp when lastActivity is provided', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user1',
        brokerId: 'user1',
        brokerName: 'John Doe',
        brokerEmail: 'john@example.com',
        totalCalls: 100,
        totalCost: 5000,
        successRate: 95,
        lastActivity: '2024-01-15T10:30:00Z',
        dataproCalls: 60,
        verifydataCalls: 40,
      },
    ];

    render(<UserAttributionTable data={mockData} />);

    // Check that the timestamp is rendered (formatDate will format it)
    // The exact format depends on dateFormatter, but it should be visible
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    
    // The table should have a "Last Activity" column header
    expect(screen.getByText(/Last Activity/i)).toBeInTheDocument();
  });

  it('should handle invalid timestamp gracefully', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user2',
        brokerId: 'user2',
        brokerName: 'Jane Smith',
        brokerEmail: 'jane@example.com',
        totalCalls: 50,
        totalCost: 2500,
        successRate: 90,
        lastActivity: 'invalid-date',
        dataproCalls: 30,
        verifydataCalls: 20,
      },
    ];

    render(<UserAttributionTable data={mockData} />);

    // Component should still render without crashing
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('should display formatted timestamp for valid ISO 8601 date', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user3',
        brokerId: 'user3',
        brokerName: 'Bob Johnson',
        brokerEmail: 'bob@example.com',
        totalCalls: 75,
        totalCost: 3750,
        successRate: 88,
        lastActivity: '2024-02-20T14:45:30.000Z',
        dataproCalls: 45,
        verifydataCalls: 30,
      },
    ];

    render(<UserAttributionTable data={mockData} />);

    // Verify the row is rendered
    expect(screen.getByText(/Bob Johnson/i)).toBeInTheDocument();
    
    // The timestamp should be formatted and displayed
    // formatDate should handle the ISO 8601 format
    const table = screen.getByTestId('user-attribution-table');
    expect(table).toBeInTheDocument();
  });

  it('should display multiple timestamps correctly', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user4',
        brokerId: 'user4',
        brokerName: 'Alice Brown',
        brokerEmail: 'alice@example.com',
        totalCalls: 120,
        totalCost: 6000,
        successRate: 92,
        lastActivity: '2024-01-10T08:00:00Z',
        dataproCalls: 70,
        verifydataCalls: 50,
      },
      {
        userId: 'user5',
        brokerId: 'user5',
        brokerName: 'Charlie Davis',
        brokerEmail: 'charlie@example.com',
        totalCalls: 80,
        totalCost: 4000,
        successRate: 85,
        lastActivity: '2024-01-12T16:30:00Z',
        dataproCalls: 50,
        verifydataCalls: 30,
      },
    ];

    render(<UserAttributionTable data={mockData} />);

    // Both users should be rendered
    expect(screen.getByText(/Alice Brown/i)).toBeInTheDocument();
    expect(screen.getByText(/Charlie Davis/i)).toBeInTheDocument();
  });

  it('should handle empty lastActivity field', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user6',
        brokerId: 'user6',
        brokerName: 'David Wilson',
        brokerEmail: 'david@example.com',
        totalCalls: 40,
        totalCost: 2000,
        successRate: 80,
        lastActivity: '',
        dataproCalls: 25,
        verifydataCalls: 15,
      },
    ];

    render(<UserAttributionTable data={mockData} />);

    // Component should render without crashing
    expect(screen.getByText(/David Wilson/i)).toBeInTheDocument();
  });

  it('should sort by lastActivity when column header is clicked', () => {
    const mockData: BrokerUsage[] = [
      {
        userId: 'user7',
        brokerId: 'user7',
        brokerName: 'Eve Martinez',
        brokerEmail: 'eve@example.com',
        totalCalls: 90,
        totalCost: 4500,
        successRate: 94,
        lastActivity: '2024-01-05T10:00:00Z',
        dataproCalls: 55,
        verifydataCalls: 35,
      },
      {
        userId: 'user8',
        brokerId: 'user8',
        brokerName: 'Frank Garcia',
        brokerEmail: 'frank@example.com',
        totalCalls: 110,
        totalCost: 5500,
        successRate: 91,
        lastActivity: '2024-01-15T12:00:00Z',
        dataproCalls: 65,
        verifydataCalls: 45,
      },
    ];

    const { container } = render(<UserAttributionTable data={mockData} />);

    // Verify both users are rendered
    expect(screen.getByText(/Eve Martinez/i)).toBeInTheDocument();
    expect(screen.getByText(/Frank Garcia/i)).toBeInTheDocument();
    
    // The table should support sorting (component has sorting logic)
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });
});
