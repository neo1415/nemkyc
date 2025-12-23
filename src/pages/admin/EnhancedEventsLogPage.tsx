import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search, Filter, Download, Eye, AlertTriangle, 
  Activity, Users, Clock, MapPin, Smartphone, 
  TrendingUp, Shield, X, ChevronDown, Calendar,
  RefreshCw, BarChart3, PieChart, LineChart, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, subDays, subHours, parseISO } from 'date-fns';
import { JsonViewer } from '@/components/JsonViewer';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Helper function to format event details in a user-friendly way
const formatEventDetails = (event: any) => {
  const { action, details } = event;
  
  if (!details) return action.replace(/-/g, ' ');
  
  switch (action) {
    case 'login':
    case 'login-success':
      return `Login successful${details.loginCount ? ` (Login #${details.loginCount})` : ''}`;
    
    case 'failed-login':
      return `Login failed${details.error ? `: ${details.error}` : ''}`;
    
    case 'view':
      return `Viewed ${details.formType || details.viewType || 'document'}`;
    
    case 'status-update':
      const from = details.from?.status || 'unknown';
      const to = details.to?.status || 'unknown';
      return `Changed status from "${from}" to "${to}"${details.comment ? `: ${details.comment}` : ''}`;
    
    case 'submit':
      return `Submitted ${details.formType || 'form'}${details.status ? ` (${details.status})` : ''}`;
    
    case 'email-sent':
      return `Email sent: ${details.subject || details.emailType || 'notification'}`;
    
    case 'update':
      return `Updated ${details.formType || 'document'}`;
    
    case 'delete':
      return `Deleted ${details.formType || 'document'}`;
    
    case 'approve':
      return `Approved ${details.formType || 'document'}`;
    
    case 'reject':
      return `Rejected ${details.formType || 'document'}${details.reason ? `: ${details.reason}` : ''}`;
    
    case 'api-request':
      return `API request to ${details.requestPath || event.requestPath || 'endpoint'}`;
    
    default:
      return action.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

interface EventLog {
  id: string;
  ts: string;
  createdAt: string;
  action: string;
  severity: string;
  riskScore: number;
  actorUid?: string;
  actorDisplayName?: string;
  actorEmail?: string;
  actorPhone?: string;
  actorRole?: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatus?: number;
  responseTime?: number;
  ipMasked?: string;
  ipHash?: string;
  location?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  sessionId?: string;
  correlationId?: string;
  isAnomaly?: boolean;
  isSuspicious?: boolean;
  requiresReview?: boolean;
  details?: any;
  meta?: any;
}

const EnhancedEventsLogPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'analytics'>('table');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [savedFilters, setSavedFilters] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
    }
  }, [user, isAdmin, navigate]);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        advanced: 'true',
      });

      if (selectedActions.length > 0) params.append('action', selectedActions.join(','));
      if (selectedSeverities.length > 0) params.append('severity', selectedSeverities.join(','));
      if (selectedRoles.length > 0) params.append('actorRole', selectedRoles.join(','));
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('searchTerm', searchTerm);

      const timestamp = Date.now().toString();
      const nonce = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/events-logs?${params}`,
        {
          credentials: 'include',
          headers: { 
            'x-timestamp': timestamp,
            'x-nonce': nonce
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch events');

      const data = await response.json();
      setEvents(data.events || []);
      setTotalCount(data.pagination?.totalCount || 0);
      
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedActions, selectedSeverities, selectedRoles, startDate, endDate, searchTerm]);

  // Memoized analytics calculation for better performance
  const calculatedAnalytics = useMemo(() => {
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const failedLogins = events.filter(e => e.action === 'failed-login').length;
    const suspiciousActivity = events.filter(e => e.isSuspicious || e.isAnomaly).length;
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const userCounts: Record<string, any> = {};
    
    events.forEach(e => {
      byType[e.action] = (byType[e.action] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      
      if (e.actorEmail) {
        if (!userCounts[e.actorEmail]) {
          userCounts[e.actorEmail] = { email: e.actorEmail, name: e.actorDisplayName, count: 0 };
        }
        userCounts[e.actorEmail].count++;
      }
    });
    
    const topUsers = Object.values(userCounts).sort((a, b) => b.count - a.count).slice(0, 5);
    
    const timeline = events.reduce((acc: any[], e) => {
      const hour = format(parseISO(e.ts || e.createdAt), 'HH:00');
      const existing = acc.find(item => item.hour === hour);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ hour, count: 1 });
      }
      return acc;
    }, []).sort((a, b) => a.hour.localeCompare(b.hour));
    
    return {
      totalEvents: events.length,
      criticalEvents,
      failedLogins,
      suspiciousActivity,
      topUsers,
      eventsByType: byType,
      eventsBySeverity: bySeverity,
      eventsTimeline: timeline
    };
  }, [events]); // Only recalculate when events change

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, page, pageSize, selectedActions, selectedSeverities, selectedRoles, startDate, endDate, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [page, pageSize, selectedActions, selectedSeverities, selectedRoles, startDate, endDate, searchTerm]);

  // Memoized helper functions
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 text-white';
      case 'error': return 'bg-red-600 text-white';
      case 'warning': return 'bg-orange-500 text-white';
      case 'info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }, []);

  const getRiskScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-red-600 font-bold';
    if (score >= 60) return 'text-orange-600 font-semibold';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  }, []);

  const exportToCSV = useCallback(() => {
    if (events.length === 0) {
      toast.error('No events to export');
      return;
    }

    const headers = ['Timestamp', 'Action', 'Severity', 'Risk Score', 'Actor Name', 'Actor Email', 'Actor Phone', 'Actor Role', 'Target', 'IP Address', 'Location', 'Device', 'Browser', 'OS', 'Response Time'];
    const rows = events.map(e => [
      formatDate(e.ts || e.createdAt), e.action, e.severity, e.riskScore || 0,
      e.actorDisplayName || 'N/A', e.actorEmail || 'N/A', e.actorPhone || 'N/A', e.actorRole || 'N/A',
      `${e.targetType}: ${e.targetId}`, e.ipMasked || 'N/A', e.location || 'N/A',
      e.deviceType || 'N/A', e.browser || 'N/A', e.os || 'N/A', e.responseTime ? `${e.responseTime}ms` : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Events exported successfully');
  }, [events, formatDate]);

  const setDatePreset = useCallback((preset: string) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    switch (preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'week':
        setStartDate(format(subDays(now, 7), 'yyyy-MM-dd'));
        setEndDate(today);
        break;
      case 'month':
        setStartDate(format(subDays(now, 30), 'yyyy-MM-dd'));
        setEndDate(today);
        break;
      case 'clear':
        setStartDate('');
        setEndDate('');
        break;
    }
  }, []);

  const toggleRowExpansion = useCallback((eventId: string) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(eventId)) {
        newExpanded.delete(eventId);
      } else {
        newExpanded.add(eventId);
      }
      return newExpanded;
    });
  }, []);

  const saveCurrentFilter = useCallback(() => {
    const filterName = prompt('Enter a name for this filter preset:');
    if (!filterName) return;
    
    const newFilter = {
      name: filterName,
      actions: selectedActions,
      severities: selectedSeverities,
      roles: selectedRoles,
      startDate,
      endDate,
      searchTerm
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('eventLogFilters', JSON.stringify(updated));
    toast.success('Filter preset saved');
  }, [selectedActions, selectedSeverities, selectedRoles, startDate, endDate, searchTerm, savedFilters]);

  const loadFilter = useCallback((filter: any) => {
    setSelectedActions(filter.actions);
    setSelectedSeverities(filter.severities);
    setSelectedRoles(filter.roles);
    setStartDate(filter.startDate);
    setEndDate(filter.endDate);
    setSearchTerm(filter.searchTerm);
    toast.success(`Filter "${filter.name}" loaded`);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('eventLogFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Security Events Log</h1>
        <p className="text-gray-600">Comprehensive SIEM-like logging and monitoring</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            <Activity className="mr-2 h-4 w-4" />
            Events
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'outline'}
            onClick={() => setViewMode('analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Advanced Filters</span>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quick Dates</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('week')}>Week</Button>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('month')}>Month</Button>
                  <Button variant="outline" size="sm" onClick={() => setDatePreset('clear')}>Clear</Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={saveCurrentFilter}>
                Save Filter Preset
              </Button>
              {savedFilters.length > 0 && (
                <Select onValueChange={(value) => loadFilter(savedFilters[parseInt(value)])}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Load preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedFilters.map((filter, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {filter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{calculatedAnalytics.totalEvents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Critical Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{calculatedAnalytics.criticalEvents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Failed Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{calculatedAnalytics.failedLogins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Suspicious Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{calculatedAnalytics.suspiciousActivity}</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts with lazy loading for better performance */}
          <Suspense fallback={<div className="text-center py-8">Loading charts...</div>}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Events by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsCharts 
                        eventsByType={calculatedAnalytics.eventsByType}
                        eventsBySeverity={{}}
                        eventsTimeline={[]}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Events by Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnalyticsCharts 
                        eventsByType={{}}
                        eventsBySeverity={calculatedAnalytics.eventsBySeverity}
                        eventsTimeline={[]}
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Events Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsCharts 
                      eventsByType={{}}
                      eventsBySeverity={{}}
                      eventsTimeline={calculatedAnalytics.eventsTimeline}
                    />
                  </CardContent>
                </Card>
            </Suspense>

          <Card>
            <CardHeader>
              <CardTitle>Top Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedAnalytics.topUsers.length > 0 ? (
                <div className="space-y-3">
                  {calculatedAnalytics.topUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <Badge variant="secondary">{user.count} events</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'table' && (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <React.Fragment key={event.id}>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(event.id)}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedRows.has(event.id) ? 'rotate-180' : ''
                                  }`}
                                />
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(event.ts || event.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{event.action}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(event.severity)}>
                                {event.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={getRiskScoreColor(event.riskScore)}>
                                {event.riskScore || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">
                                  {event.actorDisplayName || event.actorEmail || 'Unknown User'}
                                </div>
                                {event.actorEmail && event.actorDisplayName && (
                                  <div className="text-gray-600">{event.actorEmail}</div>
                                )}
                                {event.actorRole && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    {event.actorRole}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div>
                                <div className="font-medium">{formatEventDetails(event)}</div>
                                <div className="text-gray-500 text-xs mt-1 space-x-2">
                                  {event.ipMasked && (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.ipMasked}
                                    </span>
                                  )}
                                  {event.responseTime && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {event.responseTime}ms
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowDetailModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedRows.has(event.id) && (
                            <TableRow>
                              <TableCell colSpan={8} className="bg-gray-50 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <h4 className="font-semibold mb-2">Request Details</h4>
                                    <div className="space-y-1">
                                      <div><span className="font-medium">Method:</span> {event.requestMethod || 'N/A'}</div>
                                      <div><span className="font-medium">Path:</span> {event.requestPath || 'N/A'}</div>
                                      <div><span className="font-medium">Status:</span> {event.responseStatus || 'N/A'}</div>
                                      <div><span className="font-medium">Session ID:</span> {event.sessionId || 'N/A'}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Device Info</h4>
                                    <div className="space-y-1">
                                      <div><span className="font-medium">Browser:</span> {event.browser || 'N/A'}</div>
                                      <div><span className="font-medium">OS:</span> {event.os || 'N/A'}</div>
                                      <div><span className="font-medium">Location:</span> {event.location || 'N/A'}</div>
                                      <div><span className="font-medium">IP Hash:</span> {event.ipHash?.substring(0, 16) || 'N/A'}...</div>
                                    </div>
                                  </div>
                                  {event.details && (
                                    <div className="md:col-span-2">
                                      <h4 className="font-semibold mb-2">Additional Details</h4>
                                      <div className="bg-white p-3 rounded border max-h-48 overflow-auto">
                                        <JsonViewer data={event.details} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {events.length} of {totalCount} events
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Complete information about this security event
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Event Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">ID:</span> {selectedEvent.id}</div>
                    <div><span className="font-medium">Timestamp:</span> {formatDate(selectedEvent.ts || selectedEvent.createdAt)}</div>
                    <div><span className="font-medium">Action:</span> <Badge variant="outline">{selectedEvent.action}</Badge></div>
                    <div><span className="font-medium">Severity:</span> <Badge className={getSeverityColor(selectedEvent.severity)}>{selectedEvent.severity}</Badge></div>
                    <div><span className="font-medium">Risk Score:</span> <span className={getRiskScoreColor(selectedEvent.riskScore)}>{selectedEvent.riskScore || 0}</span></div>
                    {selectedEvent.isAnomaly && <div className="text-red-600 font-medium">⚠️ Anomaly Detected</div>}
                    {selectedEvent.isSuspicious && <div className="text-orange-600 font-medium">⚠️ Suspicious Activity</div>}
                    {selectedEvent.requiresReview && <div className="text-yellow-600 font-medium">⚠️ Requires Review</div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Actor Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">UID:</span> {selectedEvent.actorUid || 'N/A'}</div>
                    <div><span className="font-medium">Name:</span> {selectedEvent.actorDisplayName || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {selectedEvent.actorEmail || 'N/A'}</div>
                    <div><span className="font-medium">Phone:</span> {selectedEvent.actorPhone || 'N/A'}</div>
                    <div><span className="font-medium">Role:</span> {selectedEvent.actorRole || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Request Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Method:</span> {selectedEvent.requestMethod || 'N/A'}</div>
                    <div><span className="font-medium">Path:</span> {selectedEvent.requestPath || 'N/A'}</div>
                    <div><span className="font-medium">Status:</span> {selectedEvent.responseStatus || 'N/A'}</div>
                    <div><span className="font-medium">Response Time:</span> {selectedEvent.responseTime ? `${selectedEvent.responseTime}ms` : 'N/A'}</div>
                    <div><span className="font-medium">Session ID:</span> {selectedEvent.sessionId || 'N/A'}</div>
                    <div><span className="font-medium">Correlation ID:</span> {selectedEvent.correlationId || 'N/A'}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Device & Location</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">IP (Masked):</span> {selectedEvent.ipMasked || 'N/A'}</div>
                    <div><span className="font-medium">IP Hash:</span> {selectedEvent.ipHash || 'N/A'}</div>
                    <div><span className="font-medium">Location:</span> {selectedEvent.location || 'N/A'}</div>
                    <div><span className="font-medium">Device:</span> {selectedEvent.deviceType || 'N/A'}</div>
                    <div><span className="font-medium">Browser:</span> {selectedEvent.browser || 'N/A'}</div>
                    <div><span className="font-medium">OS:</span> {selectedEvent.os || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {selectedEvent.details && (
                <div>
                  <h3 className="font-semibold mb-2">Additional Details</h3>
                  <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-auto">
                    <JsonViewer data={selectedEvent.details} />
                  </div>
                </div>
              )}

              {selectedEvent.meta && (
                <div>
                  <h3 className="font-semibold mb-2">Metadata</h3>
                  <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-auto">
                    <JsonViewer data={selectedEvent.meta} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedEventsLogPage;
