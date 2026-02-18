import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Download, AlertTriangle } from 'lucide-react';
import type { BrokerUsage } from '../../types/analytics';
import { formatDate } from '../../utils/dateFormatter';

interface UserAttributionTableProps {
  data: BrokerUsage[];
  loading?: boolean;
  onExportCSV?: () => void;
}

type SortField = 'brokerName' | 'totalCalls' | 'totalCost' | 'successRate' | 'lastActivity' | 'userRole';
type SortDirection = 'asc' | 'desc';

/**
 * UserAttributionTable Component
 * 
 * Displays user usage attribution with sorting, pagination, and CSV export
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.11
 */
export function UserAttributionTable({ data, loading, onExportCSV }: UserAttributionTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalCalls');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broker Attribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Broker Attribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No broker data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Anomaly detection: brokers with unusually high usage (>2x average)
  const avgCalls = data.reduce((sum, b) => sum + b.totalCalls, 0) / data.length;
  const anomalyThreshold = avgCalls * 2;

  const isAnomaly = (broker: BrokerUsage) => broker.totalCalls > anomalyThreshold;

  // Sorting logic
  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'lastActivity') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (brokerId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(brokerId)) {
      newExpanded.delete(brokerId);
    } else {
      newExpanded.add(brokerId);
    }
    setExpandedRows(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <Card data-testid="user-attribution-table">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Attribution ({sortedData.length} brokers)</CardTitle>
        {onExportCSV && (
          <Button onClick={onExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('brokerName')}
                >
                  Name <SortIcon field="brokerName" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('userRole')}
                >
                  Role <SortIcon field="userRole" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalCalls')}
                >
                  Total Calls <SortIcon field="totalCalls" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalCost')}
                >
                  Cost <SortIcon field="totalCost" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('successRate')}
                >
                  Success Rate <SortIcon field="successRate" />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('lastActivity')}
                >
                  Last Activity <SortIcon field="lastActivity" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((broker) => {
                const isExpanded = expandedRows.has(broker.userId || broker.brokerId);
                return (
                  <React.Fragment key={broker.userId || broker.brokerId || Math.random().toString()}>
                    <TableRow
                      className={isAnomaly(broker) ? 'bg-yellow-50' : ''}
                    >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(broker.userId || broker.brokerId)}
                      >
                        {expandedRows.has(broker.userId || broker.brokerId) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {broker.brokerName}
                        {isAnomaly(broker) && (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{(broker as any).userRole || 'N/A'}</TableCell>
                    <TableCell>{broker.totalCalls.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(broker.totalCost)}</TableCell>
                    <TableCell>{broker.successRate.toFixed(1)}%</TableCell>
                    <TableCell>{formatDate(broker.lastActivity)}</TableCell>
                  </TableRow>
                  {expandedRows.has(broker.brokerId) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50">
                        <div className="p-4 space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Email:</span>
                              <span className="text-sm ml-2">{broker.brokerEmail}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">User ID:</span>
                              <span className="text-sm ml-2">{broker.brokerId}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium">Datapro Calls:</span>
                              <span className="text-sm ml-2">{broker.dataproCalls.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium">VerifyData Calls:</span>
                              <span className="text-sm ml-2">{broker.verifydataCalls.toLocaleString()}</span>
                            </div>
                          </div>
                          {isAnomaly(broker) && (
                            <div className="mt-2 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                              ⚠️ This user has unusually high usage (above average threshold)
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} brokers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 5) // Show max 5 page buttons
                .map((page) => (
                  <Button
                    key={`page-${page}`}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
