import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { CalendarIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { MetricsOverview } from '../../components/analytics/MetricsOverview';
import { UsageCharts } from '../../components/analytics/UsageCharts';
import { UserAttributionTable } from '../../components/analytics/UserAttributionTable';
import { CostTracker } from '../../components/analytics/CostTracker';
import { AuditLogsViewer } from '../../components/analytics/AuditLogsViewer';
import { ReportGenerator } from '../../components/analytics/ReportGenerator';
import { useAnalyticsDashboard } from '../../hooks/analytics/useAnalyticsDashboard';
import { useBudgetMonitoring } from '../../hooks/analytics/useBudgetMonitoring';
import { useRealtimeUpdates } from '../../hooks/analytics/useRealtimeUpdates';
import { FilterState } from '../../types/analytics';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConnectionStatus from '../../components/analytics/ConnectionStatus';
import { showErrorToast, retryOperation } from '../../utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import { analyticsAPI } from '../../services/analytics/AnalyticsAPI';
import { formatDateForAPI } from '../../services/analytics/filterUtils';
import '../../styles/analytics-responsive.css';

const AdminAnalyticsDashboard: React.FC = () => {
  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
      end: new Date() // Today
    },
    provider: 'all',
    status: 'all'
  });

  // State for audit logs (for report generation)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Fetch dashboard data
  const {
    summary,
    userAttribution,
    costTracking,
    dailyUsage,
    loading,
    error,
    refetch
  } = useAnalyticsDashboard(filters);

  // Budget monitoring
  const {
    budgetConfig,
    updateBudgetConfig,
    refetch: refetchBudget,
    loading: budgetLoading
  } = useBudgetMonitoring();

  // Real-time updates
  const { lastUpdate } = useRealtimeUpdates(30000); // 30 seconds

  // Fetch audit logs for report generation
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const startDate = formatDateForAPI(filters.dateRange.start);
        const endDate = formatDateForAPI(filters.dateRange.end);
        
        const logs = await analyticsAPI.fetchAuditLogs({
          startDate,
          endDate,
          limit: 10000 // Fetch more for reports
        });
        
        setAuditLogs(logs);
      } catch (error) {
        console.error('Error fetching audit logs for report:', error);
        setAuditLogs([]);
      }
    };

    fetchAuditLogs();
  }, [filters.dateRange]);

  // Handle filter changes
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    if (start && end) {
      setFilters(prev => ({
        ...prev,
        dateRange: { start, end }
      }));
    }
  };

  const handleProviderChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      provider: value as 'all' | 'datapro' | 'verifydata'
    }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value as 'all' | 'success' | 'failure'
    }));
  };

  const handleRefresh = async () => {
    try {
      await retryOperation(
        async () => {
          refetch();
          return Promise.resolve();
        },
        {
          maxAttempts: 3,
          delayMs: 1000,
          onRetry: (attempt) => {
            toast({
              title: 'Retrying...',
              description: `Attempt ${attempt} of 3`,
              duration: 2000,
            });
          },
        }
      );
    } catch (error) {
      showErrorToast(
        error as Error,
        'Failed to refresh dashboard data',
        { component: 'AdminAnalyticsDashboard', action: 'refresh' }
      );
    }
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
      },
      provider: 'all',
      status: 'all'
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-yellow-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Error loading analytics dashboard
                </h2>
                <p className="text-gray-600 mb-4">
                  {error.message}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Required Backend Endpoints:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><code className="bg-blue-100 px-1 rounded">/api/analytics/overview</code> - Dashboard metrics</li>
                  <li><code className="bg-blue-100 px-1 rounded">/api/analytics/user-attribution</code> - User attribution</li>
                  <li><code className="bg-blue-100 px-1 rounded">/api/analytics/cost-tracking</code> - Cost monitoring</li>
                  <li><code className="bg-blue-100 px-1 rounded">/api/analytics/budget-config</code> - Budget settings</li>
                  <li><code className="bg-blue-100 px-1 rounded">/api/audit/logs</code> - Audit logs (may already exist)</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Add analytics API endpoints to your <code className="bg-gray-200 px-1 rounded">server.js</code></li>
                  <li>Endpoints should query Firestore collections:
                    <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-xs">
                      <li><code>api-usage</code> - Daily aggregated usage</li>
                      <li><code>api-usage-logs</code> - Individual API calls</li>
                      <li><code>verification-audit-logs</code> - Verification attempts</li>
                      <li><code>budget-config</code> - Budget settings</li>
                    </ul>
                  </li>
                  <li>Use existing utilities: <code className="bg-gray-200 px-1 rounded">apiUsageTracker.cjs</code>, <code className="bg-gray-200 px-1 rounded">auditLogger.cjs</code></li>
                  <li>Firestore indexes are already deployed (from task 16)</li>
                </ol>
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => window.location.href = '/admin'} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Back to Admin Dashboard
                </Button>
                <Button onClick={handleRefresh} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Error: {error.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            API Analytics & Cost Tracking
          </h1>
          <p className="text-xs md:text-sm lg:text-base text-gray-600 mt-1">
            Monitor API usage, costs, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection Status */}
          <ConnectionStatus />
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="touch-target"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="filter-controls grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs md:text-sm touch-target",
                      !filters.dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.start ? (
                      format(filters.dateRange.start, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.start}
                    onSelect={(date) => handleDateRangeChange(date, filters.dateRange.end)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs md:text-sm touch-target",
                      !filters.dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.end ? (
                      format(filters.dateRange.end, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.end}
                    onSelect={(date) => handleDateRangeChange(filters.dateRange.start, date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Provider Filter */}
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">API Provider</label>
              <Select value={filters.provider} onValueChange={handleProviderChange}>
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="datapro">Datapro (NIN)</SelectItem>
                  <SelectItem value="verifydata">VerifyData (CAC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="touch-target">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Filters Button */}
          <div className="mt-3 md:mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="w-full sm:w-auto touch-target"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && !summary ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          <MetricsOverview summary={summary} loading={loading} />

          {/* Cost Tracker */}
          <CostTracker 
            data={costTracking} 
            budgetConfig={budgetConfig}
            onUpdateBudget={async (config) => {
              await updateBudgetConfig(config);
              refetchBudget();
            }}
            loading={loading || budgetLoading}
          />

          {/* Usage Charts */}
          <UsageCharts data={dailyUsage} loading={loading} />

          {/* User Attribution Table */}
          <UserAttributionTable 
            data={userAttribution}
          />

          {/* Audit Logs Viewer */}
          <AuditLogsViewer filters={filters} />

          {/* Report Generator */}
          <ReportGenerator 
            data={{
              summary: summary || undefined,
              usageData: dailyUsage && dailyUsage.length > 0 ? dailyUsage : undefined,
              brokerUsage: userAttribution && userAttribution.length > 0 ? userAttribution : undefined,
              auditLogs: auditLogs && auditLogs.length > 0 ? auditLogs : undefined
            }}
            currentUser={{
              email: 'admin@example.com',
              displayName: 'Admin User'
            }}
          />
        </>
      )}

      {/* Last Update Timestamp */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 text-center py-2">
          Last updated: {format(lastUpdate, "PPp")}
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
