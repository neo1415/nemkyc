import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridActionsCellItem,
  GridRowId,
  GridRenderCellParams,
  GridRowSelectionModel
} from '@mui/x-data-grid';
import { 
  ThemeProvider, 
  createTheme,
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
  Paper,
  Popover,
  Stack
} from '@mui/material';
import { 
  Visibility,
  Delete,
  GetApp,
  AccessTime,
  LocationOn,
  Computer,
  Security,
  Close,
  CompareArrows,
  FilterList,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

// Custom theme with burgundy and gold
const theme = createTheme({
  palette: {
    primary: { main: '#9E3234' }, // Updated burgundy color
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
  
  // State management
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dateFilterAnchor, setDateFilterAnchor] = useState<HTMLButtonElement | null>(null);
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    event: EventLog | null;
  }>({ open: false, event: null });

  // Real-time search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm || startDate || endDate) {
        setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
        fetchEvents();
      } else if (searchTerm === '' && !startDate && !endDate) {
        fetchEvents();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchEvents();
  }, [user, isAdmin, navigate, paginationModel]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if session cookie exists
      const cookies = document.cookie;
      console.log('🍪 Current cookies:', cookies);
      console.log('🔍 Has __session cookie:', cookies.includes('__session'));
      
      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        advanced: 'false',
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchTerm) params.append('searchTerm', searchTerm);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const finalUrl = `${API_BASE_URL}/api/events-logs?${params}`;

      console.log('📤 Fetching events from:', finalUrl);

      const timestamp = Date.now().toString();
      const nonce = `${timestamp}-${Math.random().toString(36).substring(2, 15)}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
      };

      // Add session token from localStorage for localhost cross-port auth
      const sessionToken = localStorage.getItem('__session');
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        console.log('🔑 Added session token to Authorization header');
      }

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Handle session expiry - redirect to signin
        if (response.status === 401) {
          toast({ 
            title: 'Session Expired', 
            description: 'Please log in again',
            variant: 'destructive' 
          });
          navigate('/signin');
          return;
        }
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setEvents(data.events || []);
      setTotalCount(data.pagination?.totalCount || 0);
      
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: 'Error fetching events', variant: 'destructive' });
    } finally {
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
    const { targetType, targetId, details } = event;
    
    if (targetType === 'email') {
      return `Email to ${targetId}`;
    }
    
    if (details?.formType) {
      return `${details.formType}`;
    }
    
    return `${targetType}: ${targetId.substring(0, 12)}...`;
  };

  const getLocationDisplay = (event: EventLog): string => {
    if (event.location && event.location !== 'Location Unknown') {
      return event.location;
    }
    return 'Unknown';
  };

  const openViewModal = (event: EventLog) => {
    setViewDialog({ open: true, event });
  };

  const handleDeleteClick = (id: string) => {
    setSelectedEventId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      
      setSelectedEventId(null);
      fetchEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) {
      toast({
        title: "No Data",
        description: "No events available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Timestamp', 'Action', 'Actor', 'Target', 'IP Address', 'Location', 'User Agent'];
    const csvData = events.map(event => [
      formatDate(event.ts),
      event.action,
      event.actorDisplayName || 'System',
      formatTargetSummary(event),
      event.ipMasked || 'N/A',
      getLocationDisplay(event),
      event.userAgent ? event.userAgent.substring(0, 50) + '...' : 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `events-log-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: GridColDef[] = [
    {
      field: 'ts',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatDate(params.value)}
          </Typography>
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
      field: 'actorInfo',
      headerName: 'Actor',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as EventLog;
        return (
          <Box>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {event.actorDisplayName || 'System'}
            </Typography>
            {event.actorEmail && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {event.actorEmail}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'targetSummary',
      headerName: 'Target',
      width: 220,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as EventLog;
        const summary = formatTargetSummary(event);
        
        return (
          <Typography variant="body2" noWrap title={summary}>
            {summary}
          </Typography>
        );
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const event = params.row as EventLog;
        return (
          <Typography variant="body2" noWrap>
            {getLocationDisplay(event)}
          </Typography>
        );
      },
    },
    {
      field: 'ipMasked',
      headerName: 'IP Address',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontFamily="monospace">
          {params.value || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: ({ id, row }: { id: GridRowId; row: EventLog }) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={() => openViewModal(row)}
          color="inherit"
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteClick(id as string)}
          color="inherit"
        />,
      ],
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
          Events Log Management
        </Typography>

        {/* Search and Filter Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {/* Search Bar */}
              <TextField
                label="Search events..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
                placeholder="Type to search in real-time..."
              />

              {/* Date Filter Button */}
              <Button
                variant="outlined"
                startIcon={<CalendarToday />}
                onClick={(e) => setDateFilterAnchor(e.currentTarget)}
                sx={{ 
                  minWidth: 140,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                Date Filter
              </Button>

              {/* Export CSV Button */}
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                onClick={handleExportCSV}
                disabled={events.length === 0}
                sx={{ 
                  minWidth: 120,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'primary.light',
                  }
                }}
              >
                Export CSV
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataGrid
              rows={events}
              columns={columns}
              loading={loading}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              rowCount={totalCount}
              pageSizeOptions={[25, 50, 100]}
              disableRowSelectionOnClick
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderColor: 'divider',
                  padding: '8px',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '60px !important',
                },
                border: 'none',
                minHeight: 500,
              }}
            />
          </CardContent>
        </Card>

        {/* Date Filter Popover */}
        <Popover
          open={Boolean(dateFilterAnchor)}
          anchorEl={dateFilterAnchor}
          onClose={() => setDateFilterAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <Card sx={{ p: 3, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              Filter by Date Range
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDateFilterAnchor(null);
                }}
                fullWidth
              >
                Clear Dates
              </Button>
            </Stack>
          </Card>
        </Popover>

        {/* View Event Dialog */}
        <Dialog
          open={viewDialog.open}
          onClose={() => setViewDialog({ open: false, event: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Event Details
            <IconButton onClick={() => setViewDialog({ open: false, event: null })}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {viewDialog.event && (
              <Box>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                    <Typography variant="body1">{formatDate(viewDialog.event.ts)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                    <Chip 
                      label={viewDialog.event.action} 
                      color={getActionChipColor(viewDialog.event.action)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Actor</Typography>
                    <Typography variant="body1">{viewDialog.event.actorDisplayName || 'System'}</Typography>
                    {viewDialog.event.actorEmail && (
                      <Typography variant="body2" color="text.secondary">{viewDialog.event.actorEmail}</Typography>
                    )}
                    {viewDialog.event.actorRole && (
                      <Chip label={viewDialog.event.actorRole} size="small" variant="outlined" sx={{ mt: 1 }} />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Target</Typography>
                    <Typography variant="body1">{formatTargetSummary(viewDialog.event)}</Typography>
                    <Typography variant="body2" color="text.secondary">ID: {viewDialog.event.targetId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Technical Details</Typography>
                    <Typography variant="body2">IP: {viewDialog.event.ipMasked || 'N/A'}</Typography>
                    <Typography variant="body2">Location: {getLocationDisplay(viewDialog.event)}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      User Agent: {viewDialog.event.userAgent || 'N/A'}
                    </Typography>
                  </Box>
                  {viewDialog.event.details && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Additional Details</Typography>
                      <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                          {JSON.stringify(viewDialog.event.details, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog({ open: false, event: null })}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this event? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EventsLogPage;