import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridActionsCellItem,
  GridRowParams,
} from '@mui/x-data-grid';
import {
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Download,
  Send,
  Add,
  Refresh,
  History,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import type {
  BatchSummary,
  RemediationBatchStatus,
} from '@/types/remediation';
import BatchUploadDialog from '@/components/remediation/BatchUploadDialog';

// Custom theme with burgundy and gold (matching existing admin tables)
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
    background: {
      default: '#ffffff',
    },
  },
});

const AdminRemediationBatches: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [sendingEmails, setSendingEmails] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchBatches();
  }, [user, isAdmin, navigate]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/remediation/batches`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }

      const data = await response.json();
      setBatches(data.batches || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to load remediation batches');
      toast({
        title: 'Error',
        description: 'Failed to load remediation batches',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecords = (batchId: string) => {
    navigate(`/admin/remediation/${batchId}`);
  };

  const handleSendEmails = async (batchId: string) => {
    try {
      setSendingEmails(batchId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}/send-emails`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send emails');
      }

      const result = await response.json();
      toast({
        title: 'Emails Sent',
        description: `Successfully sent ${result.sent} emails. ${result.failed} failed.`,
      });
      fetchBatches(); // Refresh data
    } catch (err) {
      console.error('Error sending emails:', err);
      toast({
        title: 'Error',
        description: 'Failed to send emails',
        variant: 'destructive',
      });
    } finally {
      setSendingEmails(null);
    }
  };

  const handleExport = async (batchId: string) => {
    try {
      setExporting(batchId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}/export`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export batch');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `remediation-batch-${batchId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Batch data exported successfully',
      });
    } catch (err) {
      console.error('Error exporting batch:', err);
      toast({
        title: 'Error',
        description: 'Failed to export batch',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleDeleteClick = (batchId: string) => {
    setSelectedBatchId(batchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBatchId) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${selectedBatchId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete batch');
      }

      setBatches(batches.filter((b) => b.id !== selectedBatchId));
      toast({
        title: 'Batch Deleted',
        description: 'Remediation batch deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting batch:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete batch',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBatchId(null);
    }
  };

  const handleUploadSuccess = (batchId: string) => {
    setUploadDialogOpen(false);
    fetchBatches();
    toast({
      title: 'Batch Created',
      description: 'Remediation batch created successfully',
    });
  };

  const getStatusColor = (status: RemediationBatchStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate summary statistics
  const stats = {
    total: batches.length,
    pending: batches.filter((b) => b.status === 'pending').length,
    inProgress: batches.filter((b) => b.status === 'in_progress').length,
    completed: batches.filter((b) => b.status === 'completed').length,
    totalRecords: batches.reduce((sum, b) => sum + b.totalRecords, 0),
    totalVerified: batches.reduce((sum, b) => sum + b.verifiedCount, 0),
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      type: 'actions',
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View Records"
          onClick={() => handleViewRecords(params.id as string)}
        />,
        <GridActionsCellItem
          key="send"
          icon={
            sendingEmails === params.id ? (
              <CircularProgress size={20} />
            ) : (
              <Send />
            )
          }
          label="Send Emails"
          onClick={() => handleSendEmails(params.id as string)}
          disabled={sendingEmails === params.id || params.row.status === 'completed'}
        />,
        <GridActionsCellItem
          key="export"
          icon={
            exporting === params.id ? (
              <CircularProgress size={20} />
            ) : (
              <Download />
            )
          }
          label="Export"
          onClick={() => handleExport(params.id as string)}
          disabled={exporting === params.id}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDeleteClick(params.id as string)}
        />,
      ],
    },
    {
      field: 'name',
      headerName: 'Batch Name',
      width: 200,
      flex: 1,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('_', ' ') || 'pending'}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 60,
              height: 8,
              bgcolor: 'grey.200',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${params.value || 0}%`,
                height: '100%',
                bgcolor: 'primary.main',
              }}
            />
          </Box>
          <Typography variant="body2">{params.value || 0}%</Typography>
        </Box>
      ),
    },
    {
      field: 'totalRecords',
      headerName: 'Total Records',
      width: 120,
      type: 'number',
    },
    {
      field: 'verifiedCount',
      headerName: 'Verified',
      width: 100,
      type: 'number',
    },
    {
      field: 'pendingCount',
      headerName: 'Pending',
      width: 100,
      type: 'number',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params) => formatDate(params),
    },
  ];

  if (!user || !isAdmin()) return null;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <div>
            <Typography variant="h4" gutterBottom>
              Identity Remediation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage customer identity verification batches
            </Typography>
          </div>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => navigate('/admin/remediation/audit-logs')}
            >
              Audit Logs
            </Button>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchBatches}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setUploadDialogOpen(true)}
            >
              New Batch
            </Button>
          </Box>
        </Box>

        {/* Summary Statistics Cards */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Batches</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.inProgress}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[180px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Verified</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalVerified} / {stats.totalRecords}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Data Grid */}
        <Box sx={{ height: 600, width: '100%', bgcolor: 'background.paper' }}>
          <DataGrid
            rows={batches}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
            }}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
          />
        </Box>

        {/* Upload Dialog */}
        <BatchUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Batch</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this remediation batch? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminRemediationBatches;
