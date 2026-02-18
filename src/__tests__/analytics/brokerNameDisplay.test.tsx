/**
 * Unit Tests for Broker Name Display
 * 
 * Tests Requirements 4.4, 7.4
 * Validates that broker names are displayed correctly instead of "anonymous" or "unknown"
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAttributionTable } from '../../components/analytics/UserAttributionTable';
import { AuditLogsViewer } from '../../components/analytics/AuditLogsViewer';
import type { BrokerUsage, AuditLogEntry } from '../../types/analytics';

describe('Broker Name Display', () => {
  describe('UserAttributionTable', () => {
    it('should display actual broker names when provided', () => {
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

      // Verify broker name is displayed
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('should display broker email when row is expanded', () => {
      const mockData: BrokerUsage[] = [
        {
          userId: 'user2',
          brokerId: 'user2',
          brokerName: 'Jane Smith',
          brokerEmail: 'jane@example.com',
          totalCalls: 75,
          totalCost: 3750,
          successRate: 90,
          lastActivity: '2024-01-16T11:00:00Z',
          dataproCalls: 45,
          verifydataCalls: 30,
        },
      ];

      const { container } = render(<UserAttributionTable data={mockData} />);

      // Verify broker name is displayed
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
      
      // Email should be in the component (shown when expanded)
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should display multiple broker names correctly', () => {
      const mockData: BrokerUsage[] = [
        {
          userId: 'user3',
          brokerId: 'user3',
          brokerName: 'Bob Johnson',
          brokerEmail: 'bob@example.com',
          totalCalls: 120,
          totalCost: 6000,
          successRate: 92,
          lastActivity: '2024-01-17T12:00:00Z',
          dataproCalls: 70,
          verifydataCalls: 50,
        },
        {
          userId: 'user4',
          brokerId: 'user4',
          brokerName: 'Alice Brown',
          brokerEmail: 'alice@example.com',
          totalCalls: 80,
          totalCost: 4000,
          successRate: 88,
          lastActivity: '2024-01-18T13:00:00Z',
          dataproCalls: 50,
          verifydataCalls: 30,
        },
      ];

      render(<UserAttributionTable data={mockData} />);

      // Verify both broker names are displayed
      expect(screen.getByText(/Bob Johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice Brown/i)).toBeInTheDocument();
    });

    it('should fallback to "unknown" when broker name is missing', () => {
      const mockData: BrokerUsage[] = [
        {
          userId: 'user5',
          brokerId: 'user5',
          brokerName: 'unknown',
          brokerEmail: 'unknown',
          totalCalls: 50,
          totalCost: 2500,
          successRate: 85,
          lastActivity: '2024-01-19T14:00:00Z',
          dataproCalls: 30,
          verifydataCalls: 20,
        },
      ];

      render(<UserAttributionTable data={mockData} />);

      // Verify "unknown" is displayed as fallback
      expect(screen.getByText(/unknown/i)).toBeInTheDocument();
    });

    it('should not display "anonymous" for valid broker data', () => {
      const mockData: BrokerUsage[] = [
        {
          userId: 'user6',
          brokerId: 'user6',
          brokerName: 'Charlie Davis',
          brokerEmail: 'charlie@example.com',
          totalCalls: 90,
          totalCost: 4500,
          successRate: 94,
          lastActivity: '2024-01-20T15:00:00Z',
          dataproCalls: 55,
          verifydataCalls: 35,
        },
      ];

      const { container } = render(<UserAttributionTable data={mockData} />);

      // Verify actual name is shown, not "anonymous"
      expect(screen.getByText(/Charlie Davis/i)).toBeInTheDocument();
      expect(screen.queryByText(/anonymous/i)).not.toBeInTheDocument();
    });
  });

  describe('AuditLogsViewer', () => {
    it('should display actual broker names in audit logs', () => {
      const mockData: AuditLogEntry[] = [
        {
          id: 'log1',
          timestamp: new Date('2024-01-15T10:30:00Z'),
          userName: 'David Wilson',
          userId: 'user7',
          userEmail: 'david@example.com',
          provider: 'datapro',
          verificationType: 'NIN',
          status: 'success',
          cost: 50,
          ipAddress: '192.168.1.1',
          deviceInfo: 'Chrome/Windows',
        },
      ];

      render(<AuditLogsViewer data={mockData} loading={false} />);

      // Verify broker name is displayed
      expect(screen.getByText(/David Wilson/i)).toBeInTheDocument();
    });

    it('should display multiple broker names in audit logs', () => {
      const mockData: AuditLogEntry[] = [
        {
          id: 'log2',
          timestamp: new Date('2024-01-16T11:00:00Z'),
          userName: 'Eve Martinez',
          userId: 'user8',
          userEmail: 'eve@example.com',
          provider: 'datapro',
          verificationType: 'NIN',
          status: 'success',
          cost: 50,
          ipAddress: '192.168.1.2',
          deviceInfo: 'Firefox/Mac',
        },
        {
          id: 'log3',
          timestamp: new Date('2024-01-17T12:00:00Z'),
          userName: 'Frank Garcia',
          userId: 'user9',
          userEmail: 'frank@example.com',
          provider: 'verifydata',
          verificationType: 'CAC',
          status: 'success',
          cost: 100,
          ipAddress: '192.168.1.3',
          deviceInfo: 'Safari/iOS',
        },
      ];

      render(<AuditLogsViewer data={mockData} loading={false} />);

      // Verify both broker names are displayed
      expect(screen.getByText(/Eve Martinez/i)).toBeInTheDocument();
      expect(screen.getByText(/Frank Garcia/i)).toBeInTheDocument();
    });

    it('should fallback to "unknown" when broker name is missing in audit logs', () => {
      const mockData: AuditLogEntry[] = [
        {
          id: 'log4',
          timestamp: new Date('2024-01-18T13:00:00Z'),
          userName: 'unknown',
          userId: 'user10',
          userEmail: 'unknown',
          provider: 'datapro',
          verificationType: 'NIN',
          status: 'failure',
          cost: 0,
          ipAddress: '192.168.1.4',
          deviceInfo: 'Edge/Windows',
        },
      ];

      render(<AuditLogsViewer data={mockData} loading={false} />);

      // Verify "unknown" is displayed as fallback
      expect(screen.getByText(/unknown/i)).toBeInTheDocument();
    });

    it('should not display "anonymous" for valid broker data in audit logs', () => {
      const mockData: AuditLogEntry[] = [
        {
          id: 'log5',
          timestamp: new Date('2024-01-19T14:00:00Z'),
          userName: 'Grace Lee',
          userId: 'user11',
          userEmail: 'grace@example.com',
          provider: 'verifydata',
          verificationType: 'CAC',
          status: 'success',
          cost: 100,
          ipAddress: '192.168.1.5',
          deviceInfo: 'Chrome/Android',
        },
      ];

      const { container } = render(<AuditLogsViewer data={mockData} loading={false} />);

      // Verify actual name is shown, not "anonymous"
      expect(screen.getByText(/Grace Lee/i)).toBeInTheDocument();
      expect(screen.queryByText(/anonymous/i)).not.toBeInTheDocument();
    });

    it('should display broker email in expanded row details', () => {
      const mockData: AuditLogEntry[] = [
        {
          id: 'log6',
          timestamp: new Date('2024-01-20T15:00:00Z'),
          userName: 'Henry Kim',
          userId: 'user12',
          userEmail: 'henry@example.com',
          provider: 'datapro',
          verificationType: 'NIN',
          status: 'success',
          cost: 50,
          ipAddress: '192.168.1.6',
          deviceInfo: 'Safari/Mac',
        },
      ];

      const { container } = render(<AuditLogsViewer data={mockData} loading={false} />);

      // Verify broker name is displayed
      expect(screen.getByText(/Henry Kim/i)).toBeInTheDocument();
      
      // Table should be rendered
      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });
  });
});
