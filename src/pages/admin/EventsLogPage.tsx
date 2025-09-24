import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar,
  GridRenderCellParams
} from '@mui/x-data-grid';
import { 
  ThemeProvider, 
  createTheme,
  Box,
  Typography,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Paper
} from '@mui/material';
import { 
  Search,
  Refresh,
  Download,
  FilterList,
  AccessTime,
  LocationOn,
  Computer,
  Security,
  Close,
  CompareArrows
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Custom theme with burgundy and gold
const theme = createTheme({
  palette: {
    primary: { main: '#800020' },
    secondary: { main: '#FFD700' },
    background: { default: '#ffffff' },
  },
});

interface EventLog {
  id: string;
  ts: any;
  action: string;
  actorUid?: string;
  actorDisplayName?: string;
  actorEmail?: string;
  actorRole?: string;
  targetType: string;
  targetId: string;
  details: any;
  ipMasked?: string;
  ipHash?: string;
  location?: string;
  userAgent?: string;
  meta?: any;
}

const EventsLogPage: React.FC = () => {
  const { user, isAdmin } = useAuth();  
  const navigate = useNavigate();
  
  console.log('🔄 EventsLogPage: Component initialized');
  console.log('👤 User:', user?.uid, user?.email);
  console.log('🔒 isAdmin:', isAdmin());
  
  // State management
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0); // 0 = Regular, 1 = Advanced
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [totalCount, setTotalCount] = useState(0);
  const [diffDialog, setDiffDialog] = useState<{
    open: boolean;
    event: EventLog | null;
  }>({ open: false, event: null });

  console.log('📊 EventsLogPage State:', {
    eventsCount: events.length,
    loading,
    tabValue,
    searchTerm,
    actionFilter,
    targetTypeFilter,
    startDate,
    endDate,
    paginationModel,
    totalCount
  });

  // Log when events state changes
  useEffect(() => {
    console.log('🔄 Events state updated:', {
      eventsLength: events.length,
      firstEvent: events[0] || null,
      lastEvent: events[events.length - 1] || null,
      sampleEvents: events.slice(0, 2)
    });
  }, [events]);

  // Log when loading state changes
  useEffect(() => {
    console.log('⏳ Loading state changed to:', loading);
  }, [loading]);

  // Available action types
  const actionTypes = [
    'all', 'approve', 'reject', 'edit', 'delete', 'submit', 'register', 
    'login', 'failed-login', 'password-reset', 'role-change', 'file-download', 
    'email-sent', 'view'
  ];

  // Available target types
  const targetTypes = [
    'all', 'kyc-form', 'cdd-form', 'claim', 'user', 'email'
  ];

  // Helper function to generate test events
  const generateTestEvents = async () => {
    try {
      console.log('🧪 Generating test events from frontend...');
      
      const response = await fetch('https://nem-server-rhdb.onrender.com/api/generate-test-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': Date.now().toString(),
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Test events generated successfully:', result);
        toast({
          title: "Success",
          description: `Generated ${result.success} test events successfully!`,
        });
        // Refresh the events after generating
        fetchEvents();
      } else {
        console.error('❌ Failed to generate test events:', result);
        toast({
          title: "Error",
          description: result.error || "Failed to generate test events",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Error generating test events:', error);
      toast({
        title: "Error",
        description: "Network error while generating test events",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('🔄 EventsLogPage useEffect triggered');
    console.log('⚠️  Dependencies:', { 
      user: !!user, 
      isAdmin: isAdmin(), 
      paginationModel, 
      actionFilter, 
      targetTypeFilter, 
      startDate, 
      endDate 
    });
    
    if (!user || !isAdmin()) {
      console.log('🚫 Unauthorized access, navigating to /unauthorized');
      navigate('/unauthorized');
      return;
    }
    
    console.log('✅ User authorized, calling fetchEvents');
    fetchEvents();
  }, [user, isAdmin, navigate, paginationModel, actionFilter, targetTypeFilter, startDate, endDate]);

  const fetchEvents = async () => {
    try {
      console.log('🚀 fetchEvents: Starting fetch');
      console.log('📝 Current filters:', {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        advanced: tabValue === 1,
        actionFilter,
        targetTypeFilter,
        startDate,
        endDate,
        searchTerm
      });
      
      setLoading(true);
      
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        advanced: tabValue === 1 ? 'true' : 'false',
      });

      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (targetTypeFilter !== 'all') params.append('targetType', targetTypeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('searchTerm', searchTerm);

      const finalUrl = `https://nem-server-rhdb.onrender.com/api/events-logs?${params}`;
      console.log('🌐 Request URL:', finalUrl);

      // Prepare headers with required timestamp for server security
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Timestamp': Date.now().toString(),
      };

      console.log('📤 Request headers:', headers);

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      console.log('📨 Response status:', response.status, response.statusText);
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      console.log('📊 Events received:', data.events?.length || 0);
      console.log('📊 Total count:', data.pagination?.totalCount || 0);
      console.log('📋 Sample events:', data.events?.slice(0, 3));
      
      setEvents(data.events || []);
      setTotalCount(data.pagination?.totalCount || 0);
      
      console.log('✅ fetchEvents completed successfully');
      
    } catch (error) {
      console.error('💥 Error in fetchEvents:', error);
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast({ title: 'Error fetching events', variant: 'destructive' });
    } finally {
      console.log('🏁 fetchEvents: Setting loading to false');
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    try {
      let date: Date;
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else {
        date = new Date(timestamp);
      }
      return date.toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getActionChipColor = (action: string) => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      approve: 'success',
      reject: 'error',
      delete: 'error',
      edit: 'warning',
      submit: 'info',
      login: 'success',
      'failed-login': 'error',
      register: 'info',
      view: 'default'
    };
    return colors[action] || 'default';
  };

  const formatTargetSummary = (event: EventLog): string => {
    const { targetType, targetId, details, meta } = event;
    
    if (targetType === 'email') {
      return `Email to ${targetId}`;
    }
    
    if (details?.formType) {
      return `${details.formType} (${targetId.substring(0, 8)}...)`;
    }
    
    return `${targetType}: ${targetId.substring(0, 8)}...`;
  };

  const hasEditDiff = (event: EventLog): boolean => {
    return event.action === 'edit' && event.details?.from && event.details?.to;
  };

  const openDiffModal = (event: EventLog) => {
    setDiffDialog({ open: true, event });
  };

  const renderEditDiff = (event: EventLog) => {
    const { from, to } = event.details;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Changes Made
        </Typography>
        <Box display="flex" gap={2}>
          <Box flex={1}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#ffebee' }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Before
              </Typography>
              <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(from, null, 2)}
              </pre>
            </Paper>
          </Box>
          <Box flex={1}>
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#e8f5e8' }}>
              <Typography variant="subtitle2" color="success.main" gutterBottom>
                After
              </Typography>
              <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(to, null, 2)}
              </pre>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  };

  // Regular view columns
  const regularColumns: GridColDef[] = [
    {
      field: 'ts',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          {formatDate(params.value)}
        </Box>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value} 
          color={getActionChipColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'targetSummary',
      headerName: 'Target',
      width: 250,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as EventLog;
        const summary = formatTargetSummary(event);
        const canShowDiff = hasEditDiff(event);
        
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2">{summary}</Typography>
            {canShowDiff && (
              <IconButton 
                size="small" 
                onClick={() => openDiffModal(event)}
                title="View changes"
              >
                <CompareArrows fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      },
    },
    {
      field: 'actorInfo',
      headerName: 'Actor',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as EventLog;
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {event.actorDisplayName || 'System'}
            </Typography>
            {event.actorEmail && (
              <Typography variant="caption" color="text.secondary">
                {event.actorEmail}
              </Typography>
            )}
            {event.actorRole && (
              <Chip label={event.actorRole} size="small" variant="outlined" sx={{ ml: 1 }} />
            )}
          </Box>
        );
      },
    },
  ];

  // Advanced view columns (includes additional fields)
  const advancedColumns: GridColDef[] = [
    ...regularColumns,
    {
      field: 'ipMasked',
      headerName: 'IP Address',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          <Security fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" fontFamily="monospace">
            {params.value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          {params.value || 'Unknown'}
        </Box>
      ),
    },
    {
      field: 'userAgent',
      headerName: 'User Agent',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center">
          <Computer fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" noWrap title={params.value}>
            {params.value ? `${params.value.substring(0, 30)}...` : 'Unknown'}
          </Typography>
        </Box>
      ),
    },
  ];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    console.log('🔄 Tab changed from', tabValue, 'to', newValue);
    setTabValue(newValue);
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    fetchEvents();
  };

  const handleSearch = () => {
    console.log('🔍 Search triggered with filters:', { 
      searchTerm, 
      actionFilter, 
      targetTypeFilter, 
      startDate, 
      endDate 
    });
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    fetchEvents();
  };

  const handleExportCSV = () => {
    console.log('📤 Exporting CSV with', events.length, 'events');
    if (events.length === 0) {
      console.log('⚠️  No events to export');
      return;
    }

    const headers = tabValue === 0 
      ? ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Actor Name', 'Actor Email', 'Actor Role']
      : ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Actor Name', 'Actor Email', 'Actor Role', 'IP', 'Location', 'User Agent'];

    const rows = events.map(event => {
      const baseRow = [
        formatDate(event.ts),
        event.action,
        event.targetType,
        event.targetId,
        event.actorDisplayName || 'System',
        event.actorEmail || 'N/A',
        event.actorRole || 'N/A'
      ];

      if (tabValue === 1) {
        baseRow.push(
          event.ipMasked || 'N/A',
          event.location || 'Unknown',
          event.userAgent || 'Unknown'
        );
      }

      return baseRow;
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-log-${tabValue === 0 ? 'regular' : 'advanced'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          📝 Events Log
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab label="Regular View" />
              <Tab label="Advanced View" />
            </Tabs>

            {/* Filters */}
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
              <Box sx={{ minWidth: 200, flex: '1 1 300px' }}>
                <TextField
                  fullWidth
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={actionFilter}
                    label="Action"
                    onChange={(e) => setActionFilter(e.target.value)}
                  >
                    {actionTypes.map(action => (
                      <MenuItem key={action} value={action}>
                        {action === 'all' ? 'All Actions' : action}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth>
                  <InputLabel>Target Type</InputLabel>
                  <Select
                    value={targetTypeFilter}
                    label="Target Type"
                    onChange={(e) => setTargetTypeFilter(e.target.value)}
                  >
                    {targetTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type === 'all' ? 'All Types' : type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box display="flex" gap={1} alignItems="flex-start">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<FilterList />}
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setActionFilter('all');
                    setTargetTypeFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
                    fetchEvents();
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Box>

            {/* Action buttons */}
            <Box display="flex" gap={1} mb={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchEvents}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={generateTestEvents}
                disabled={loading}
              >
                Generate Test Events
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportCSV}
                disabled={events.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={(() => {
                console.log('🏠 Rendering DataGrid with:', {
                  rowsLength: events.length,
                  columns: tabValue === 0 ? 'regularColumns' : 'advancedColumns',
                  loading,
                  totalCount,
                  paginationModel,
                  firstRow: events[0] || null
                });
                return events;
              })()}
              columns={tabValue === 0 ? regularColumns : advancedColumns}
              loading={loading}
              paginationMode="server"
              rowCount={totalCount}
              paginationModel={paginationModel}
              onPaginationModelChange={(model) => {
                console.log('📄 Pagination model changed:', model);
                setPaginationModel(model);
              }}
              pageSizeOptions={[25, 50, 100]}
              disableRowSelectionOnClick
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false,
                },
              }}
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(128, 0, 32, 0.04)',
                },
              }}
            />
          </Box>
        </Card>

        {/* Edit Diff Dialog */}
        <Dialog
          open={diffDialog.open}
          onClose={() => setDiffDialog({ open: false, event: null })}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Edit Changes - {diffDialog.event?.targetType}
              </Typography>
              <IconButton onClick={() => setDiffDialog({ open: false, event: null })}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {diffDialog.event && renderEditDiff(diffDialog.event)}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiffDialog({ open: false, event: null })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EventsLogPage;