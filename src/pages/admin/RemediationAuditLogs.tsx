import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowId,
  GridRenderCellParams,
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
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Visibility,
  GetApp,
  CalendarToday,
  Close,
  FilterList,
  Refresh,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { RemediationAuditLog, AuditLogAction, AuditActorType } from '@/types/remediation';

// Custom theme with burgundy and gold (matching existing admin tables)
const theme = createTheme({
  palette: {
    primary: { main: '#800020' }, // Burgundy
    secondary: { main: '#FFD700' }, // Gold
    background: { default: '#ffffff' },
  },
});

// Valid action types for filtering
const ACTION_TYPES: AuditLogAction[] = [
  'batch_created',
  'batch_deleted',
  'emails_sent',
  'link_generated',
  'link_resent',
  'verification_attempted',
  'verification_success',
  'verification_failed',
  'record_approved',
  'record_rejected',
  'export_generated',
];

const RemediationAuditLogs: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get initial filter values from URL params
  const initialBatchId = searchParams.get('batchId') || '';
  const initialRecordId = searchParams.get('recordId') || '';

  // State management
  const [logs, setLogs] = useState<RemediationAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [batchIdFilter, setBatchIdFilter] = useState(initialBatchId);
  const [recordIdFilter, setRecordIdFilter] = useState(initialRecordId);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterAnchor, setDateFilterAnchor] = useState<HTMLButtonElement | null>(null);

  // View dialog state
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    log: RemediationAuditLog | null;
  }>({ open: false, log: null });

  // Fetch logs when filters or pagination change
  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchLogs();
  }, [user, isAdmin, navigate, paginationModel, batchIdFilter, recordIdFilter, actionFilter, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
      });

      if (batchIdFilter) params.append('batchId', batchIdFilter);
      if (recordIdFilter) params.append('recordId', recordIdFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/remediation/audit-logs?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Session Expired',
            description: 'Please log in again',
            variant: 'destructive',
          });
          navigate('/signin');
          return;
        }
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string | Date): string => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getActionChipColor = (action: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      batch_created: 'info',
      batch_deleted: 'error',
      emails_sent: 'info',
      link_generated: 'default',
      link_resent: 'warning',
      verification_attempted: 'default',
      verification_success: 'success',
      verification_failed: 'error',
      record_approved: 'success',
      record_rejected: 'error',
      export_generated: 'info',
      email_sent: 'info',
      email_failed: 'error',
      record_updated: 'warning',
    };
    return colors[action] || 'default';
  };

  const formatActionLabel = (action: string): string => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getActorTypeChipColor = (actorType: AuditActorType): 'primary' | 'secondary' | 'default' => {
    switch (actorType) {
      case 'admin':
        return 'primary';
      case 'customer':
        return 'secondary';
      case 'system':
      default:
        return 'default';
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast({
        title: 'No Data',
        description: 'No audit logs available to export',
        variant: 'destructive',
      });
      return;
    }

    const headers = ['Timestamp', 'Action', 'Actor Type', 'Actor ID', 'Batch ID', 'Record ID', 'IP Address', 'Details'];
    const csvData = logs.map((log) => [
      formatDate(log.timestamp),
      formatActionLabel(log.action),
      log.actorType,
      log.actorId || 'N/A',
      log.batchId || 'N/A',
      log.recordId || 'N/A',
      log.ipAddress || 'N/A',
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `remediation-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Audit logs exported successfully',
    });
  };

  const handleClearFilters = () => {
    setBatchIdFilter('');
    setRecordIdFilter('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
  };

  const openViewModal = (log: RemediationAuditLog) => {
    setViewDialog({ open: true, log });
  };

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={formatActionLabel(params.value)}
          color={getActionChipColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actorType',
      headerName: 'Actor Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={getActorTypeChipColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'actorId',
      headerName: 'Actor ID',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap title={params.value || 'N/A'}>
          {params.value ? `${params.value.substring(0, 20)}...` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'batchId',
      headerName: 'Batch ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          noWrap
          sx={{
            cursor: params.value ? 'pointer' : 'default',
            color: params.value ? 'primary.main' : 'text.secondary',
            '&:hover': params.value ? { textDecoration: 'underline' } : {},
          }}
          onClick={() => params.value && navigate(`/admin/remediation/${params.value}`)}
          title={params.value || 'N/A'}
        >
          {params.value ? `${params.value.substring(0, 12)}...` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'recordId',
      headerName: 'Record ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap title={params.value || 'N/A'}>
          {params.value ? `${params.value.substring(0, 12)}...` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'ipAddress',
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
      width: 80,
      getActions: ({ row }: { id: GridRowId; row: RemediationAuditLog }) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View Details"
          onClick={() => openViewModal(row)}
          color="inherit"
        />,
      ],
    },
  ];

  if (!user || !isAdmin()) return null;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/admin/remediation')} sx={{ color: 'primary.main' }}>
              <ArrowBack />
            </IconButton>
            <div>
              <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
                Remediation Audit Logs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View all remediation system activity and compliance logs
              </Typography>
            </div>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchLogs}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={handleExportCSV}
              disabled={logs.length === 0}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Filters Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              {/* Batch ID Filter */}
              <TextField
                label="Batch ID"
                variant="outlined"
                size="small"
                value={batchIdFilter}
                onChange={(e) => {
                  setBatchIdFilter(e.target.value);
                  setPaginationModel({ ...paginationModel, page: 0 });
                }}
                sx={{ minWidth: 200 }}
                placeholder="Filter by batch..."
              />

              {/* Record ID Filter */}
              <TextField
                label="Record ID"
                variant="outlined"
                size="small"
                value={recordIdFilter}
                onChange={(e) => {
                  setRecordIdFilter(e.target.value);
                  setPaginationModel({ ...paginationModel, page: 0 });
                }}
                sx={{ minWidth: 200 }}
                placeholder="Filter by record..."
              />

              {/* Action Type Filter */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  label="Action Type"
                  onChange={(e: SelectChangeEvent) => {
                    setActionFilter(e.target.value);
                    setPaginationModel({ ...paginationModel, page: 0 });
                  }}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {ACTION_TYPES.map((action) => (
                    <MenuItem key={action} value={action}>
                      {formatActionLabel(action)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Date Filter Button */}
              <Button
                variant="outlined"
                startIcon={<CalendarToday />}
                onClick={(e) => setDateFilterAnchor(e.currentTarget)}
                sx={{
                  minWidth: 140,
                  borderColor: startDate || endDate ? 'primary.main' : 'grey.400',
                  color: startDate || endDate ? 'primary.main' : 'text.secondary',
                }}
              >
                {startDate || endDate ? 'Date Set' : 'Date Filter'}
              </Button>

              {/* Clear Filters Button */}
              <Button
                variant="text"
                startIcon={<FilterList />}
                onClick={handleClearFilters}
                disabled={!batchIdFilter && !recordIdFilter && !actionFilter && !startDate && !endDate}
              >
                Clear Filters
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Data Grid */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataGrid
              rows={logs}
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
                  minHeight: '52px !important',
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
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPaginationModel({ ...paginationModel, page: 0 });
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="End Date"
                type="date"
                size="small"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPaginationModel({ ...paginationModel, page: 0 });
                }}
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

        {/* View Log Details Dialog */}
        <Dialog
          open={viewDialog.open}
          onClose={() => setViewDialog({ open: false, log: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Audit Log Details
            <IconButton onClick={() => setViewDialog({ open: false, log: null })}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {viewDialog.log && (
              <Box>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Timestamp
                    </Typography>
                    <Typography variant="body1">{formatDate(viewDialog.log.timestamp)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action
                    </Typography>
                    <Chip
                      label={formatActionLabel(viewDialog.log.action)}
                      color={getActionChipColor(viewDialog.log.action)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Actor
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={viewDialog.log.actorType}
                        color={getActorTypeChipColor(viewDialog.log.actorType)}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2">
                        {viewDialog.log.actorId || 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                  {viewDialog.log.batchId && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Batch ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => {
                          setViewDialog({ open: false, log: null });
                          navigate(`/admin/remediation/${viewDialog.log?.batchId}`);
                        }}
                      >
                        {viewDialog.log.batchId}
                      </Typography>
                    </Box>
                  )}
                  {viewDialog.log.recordId && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Record ID
                      </Typography>
                      <Typography variant="body1">{viewDialog.log.recordId}</Typography>
                    </Box>
                  )}
                  {viewDialog.log.ipAddress && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        IP Address
                      </Typography>
                      <Typography variant="body1" fontFamily="monospace">
                        {viewDialog.log.ipAddress}
                      </Typography>
                    </Box>
                  )}
                  {viewDialog.log.userAgent && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        User Agent
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {viewDialog.log.userAgent}
                      </Typography>
                    </Box>
                  )}
                  {viewDialog.log.details && Object.keys(viewDialog.log.details).length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Additional Details
                      </Typography>
                      <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <pre
                          style={{
                            fontSize: '12px',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(viewDialog.log.details, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog({ open: false, log: null })}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default RemediationAuditLogs;
