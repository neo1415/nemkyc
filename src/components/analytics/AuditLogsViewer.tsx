import { useState, useEffect } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { AuditLogEntry, FilterState } from '../../types/analytics';
import { analyticsAPI } from '../../services/analytics/AnalyticsAPI';
import { formatDateForAPI } from '../../services/analytics/filterUtils';

interface AuditLogsViewerProps {
  filters?: FilterState;
  data?: AuditLogEntry[];
  loading?: boolean;
}


export function AuditLogsViewer({ filters, data: externalData, loading: externalLoading }: AuditLogsViewerProps) {
  const [data, setData] = useState<AuditLogEntry[]>(externalData || []);
  const [loading, setLoading] = useState(externalLoading ?? (externalData ? false : true));
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch audit logs
  useEffect(() => {
    // If external data is provided, use it and don't fetch
    if (externalData !== undefined) {
      setData(externalData);
      setLoading(externalLoading ?? false);
      return;
    }
    
    // Only fetch if filters are provided
    if (!filters?.dateRange) {
      setLoading(false);
      return;
    }
    
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const startDate = formatDateForAPI(filters.dateRange.start);
        const endDate = formatDateForAPI(filters.dateRange.end);
        
        const logs = await analyticsAPI.fetchAuditLogs({
          startDate,
          endDate,
          limit: 1000
        });
        
        setData(logs);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters?.dateRange, externalData, externalLoading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
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
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No audit logs available</div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = data.filter((log) => {
    // Filter out duplicate "System" or "Unknown User" entries (duplicate logging bug)
    if (log.userName === 'System' || log.userName === 'Unknown User') {
      return false;
    }
    
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = providerFilter === 'all' || log.provider === providerFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesUserType = userTypeFilter === 'all' || (log as any).userType === userTypeFilter;
    
    return matchesSearch && matchesProvider && matchesStatus && matchesUserType;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by user name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="datapro">Datapro</SelectItem>
              <SelectItem value="verifydata">VerifyData</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                return (
                  <React.Fragment key={log.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(log.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>{log.userName}</TableCell>
                      <TableCell className="capitalize">{log.provider}</TableCell>
                      <TableCell className="uppercase">{log.verificationType}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            log.status === 'success'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'failure'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(log.cost)}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50">
                          <div className="p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium">User Name:</span>
                                <span className="text-sm ml-2">{log.userName}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">User Email:</span>
                                <span className="text-sm ml-2">{log.userEmail || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">IP Address:</span>
                                <span className="text-sm ml-2">{log.ipAddress}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Device Info:</span>
                              <span className="text-sm ml-2">{log.deviceInfo}</span>
                            </div>
                            {log.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 rounded">
                                <span className="text-sm font-medium text-red-800">Error:</span>
                                <span className="text-sm ml-2 text-red-700">{log.errorMessage}</span>
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

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of{' '}
            {filteredData.length} logs
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
