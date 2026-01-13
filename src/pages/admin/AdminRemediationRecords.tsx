import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridActionsCellItem,
  GridRowParams,
  GridRowSelectionModel,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Send,
  CheckCircle,
  Cancel,
  ArrowBack,
  Refresh,
  Download,
  Email,
  Replay,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, AlertTriangle, XCircle, Mail } from 'lucide-react';
import type {
  RemediationRecord,
  RemediationRecordStatus,
  BatchSummary,
} from '@/types/remediation';
import RecordReviewDialog from '@/components/remediation/RecordReviewDialog';
import BatchProgressBar from '@/components/remediation/BatchProgressBar';
import BatchTimeline from '@/components/remediation/BatchTimeline';

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

const AdminRemediationRecords: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { batchId } = useParams<{ batchId: string }>();
  const [records, setRecords] = useState<RemediationRecord[]>([]);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RemediationRecord | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [resending, setResending] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [bulkSendingEmails, setBulkSendingEmails] = useState(false);
  const [bulkResendingExpired, setBulkResendingExpired] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    if (batchId) {
      fetchBatchAndRecords();
    }
  }, [user, isAdmin, navigate, batchId]);

  const fetchBatchAndRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // Fetch batch details
      const batchResponse = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}`,
        { credentials: 'include' }
      );
      
      if (!batchResponse.ok) {
        throw new Error('Failed to fetch batch details');
      }
      
      const batchData = await batchResponse.json();
      setBatch(batchData.batch);

      // Fetch records
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const recordsResponse = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}/records?${params}`,
        { credentials: 'include' }
      );

      if (!recordsResponse.ok) {
        throw new Error('Failed to fetch records');
      }

      const recordsData = await recordsResponse.json();
      setRecords(recordsData.records || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load records');
      toast({
        title: 'Error',
        description: 'Failed to load records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async (recordId: string) => {
    try {
      setResending(recordId);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/records/${recordId}/resend`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resend link');
      }

      toast({
        title: 'Link Resent',
        description: 'Verification link has been resent successfully',
      });
      fetchBatchAndRecords();
    } catch (err) {
      console.error('Error resending link:', err);
      toast({
        title: 'Error',
        description: 'Failed to resend link',
        variant: 'destructive',
      });
    } finally {
      setResending(null);
    }
  };

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!selectedRecord) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/records/${selectedRecord.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewComment: reviewComment.trim() || undefined,
            reviewedBy: user?.uid,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} record`);
      }

      toast({
        title: action === 'approve' ? 'Record Approved' : 'Record Rejected',
        description: `Record has been ${action}d successfully`,
      });
      
      setReviewDialogOpen(false);
      setSelectedRecord(null);
      setReviewComment('');
      fetchBatchAndRecords();
    } catch (err) {
      console.error(`Error ${action}ing record:`, err);
      toast({
        title: 'Error',
        description: `Failed to ${action} record`,
        variant: 'destructive',
      });
    }
  };

  // Bulk send emails to selected or all pending records
  const handleBulkSendEmails = async () => {
    try {
      setBulkSendingEmails(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // If rows are selected, send to those; otherwise send to all pending
      const selectedIds = selectedRows.type === 'include' ? Array.from(selectedRows.ids) : [];
      const recordIds = selectedIds.length > 0 
        ? selectedIds.map(id => String(id))
        : undefined;
      
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}/send-emails`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recordIds }),
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
      
      setSelectedRows({ type: 'include', ids: new Set() });
      fetchBatchAndRecords();
    } catch (err) {
      console.error('Error sending bulk emails:', err);
      toast({
        title: 'Error',
        description: 'Failed to send emails',
        variant: 'destructive',
      });
    } finally {
      setBulkSendingEmails(false);
    }
  };

  // Bulk resend expired links
  const handleBulkResendExpired = async () => {
    try {
      setBulkResendingExpired(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // Get all expired records
      const expiredRecords = records.filter(r => r.status === 'link_expired');
      
      if (expiredRecords.length === 0) {
        toast({
          title: 'No Expired Links',
          description: 'There are no expired links to resend',
        });
        return;
      }

      let successCount = 0;
      let failCount = 0;

      // Resend each expired link
      for (const record of expiredRecords) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/remediation/records/${record.id}/resend`,
            {
              method: 'POST',
              credentials: 'include',
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }

      toast({
        title: 'Resend Complete',
        description: `Successfully resent ${successCount} links. ${failCount} failed.`,
      });
      
      fetchBatchAndRecords();
    } catch (err) {
      console.error('Error resending expired links:', err);
      toast({
        title: 'Error',
        description: 'Failed to resend expired links',
        variant: 'destructive',
      });
    } finally {
      setBulkResendingExpired(false);
    }
  };

  // Export batch records to CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/remediation/batches/${batchId}/export`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export records');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `remediation-records-${batchId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Records exported successfully',
      });
    } catch (err) {
      console.error('Error exporting records:', err);
      toast({
        title: 'Error',
        description: 'Failed to export records',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: RemediationRecordStatus) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'email_sent':
        return 'info';
      case 'email_failed':
        return 'error';
      case 'link_expired':
        return 'warning';
      case 'verified':
        return 'success';
      case 'verification_failed':
        return 'error';
      case 'review_required':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate statistics
  const stats = {
    total: records.length,
    pending: records.filter((r) => r.status === 'pending').length,
    emailSent: records.filter((r) => r.status === 'email_sent').length,
    verified: records.filter((r) => r.status === 'verified' || r.status === 'approved').length,
    failed: records.filter((r) => r.status === 'verification_failed' || r.status === 'rejected').length,
    reviewRequired: records.filter((r) => r.status === 'review_required').length,
    expired: records.filter((r) => r.status === 'link_expired').length,
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      type: 'actions',
      getActions: (params: GridRowParams) => {
        const actions = [];
        
        // Resend link action
        if (['pending', 'email_sent', 'email_failed', 'link_expired'].includes(params.row.status)) {
          actions.push(
            <GridActionsCellItem
              key="resend"
              icon={
                resending === params.id ? (
                  <CircularProgress size={20} />
                ) : (
                  <Send />
                )
              }
              label="Resend Link"
              onClick={() => handleResendLink(params.id as string)}
              disabled={resending === params.id}
            />
          );
        }
        
        // Review action for flagged records
        if (params.row.status === 'review_required') {
          actions.push(
            <GridActionsCellItem
              key="review"
              icon={<Visibility />}
              label="Review"
              onClick={() => {
                setSelectedRecord(params.row as RemediationRecord);
                setReviewDialogOpen(true);
              }}
            />
          );
        }
        
        return actions;
      },
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      width: 180,
      flex: 1,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 140,
    },
    {
      field: 'brokerName',
      headerName: 'Broker',
      width: 150,
    },
    {
      field: 'identityType',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'corporate' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ') || 'pending'}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'nameMatchScore',
      headerName: 'Match Score',
      width: 110,
      renderCell: (params) => {
        if (params.value === undefined || params.value === null) return '-';
        const score = params.value as number;
        return (
          <Chip
            label={`${score}%`}
            size="small"
            color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
          />
        );
      },
    },
    {
      field: 'resendCount',
      headerName: 'Resends',
      width: 80,
      type: 'number',
    },
    {
      field: 'emailSentAt',
      headerName: 'Email Sent',
      width: 110,
      valueFormatter: (params) => formatDate(params),
    },
    {
      field: 'verifiedAt',
      headerName: 'Verified',
      width: 110,
      valueFormatter: (params) => formatDate(params),
    },
  ];

  if (!user || !isAdmin()) return null;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => navigate('/admin/remediation')}>
            <ArrowBack />
          </IconButton>
          <div>
            <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
              {batch?.name || 'Batch Records'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage verification records for this batch
            </Typography>
          </div>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* Bulk Actions */}
            <Tooltip title={selectedRows.ids.size > 0 ? `Send emails to ${selectedRows.ids.size} selected records` : 'Send emails to all pending records'}>
              <Button
                variant="outlined"
                startIcon={bulkSendingEmails ? <CircularProgress size={20} /> : <Email />}
                onClick={handleBulkSendEmails}
                disabled={bulkSendingEmails}
              >
                {selectedRows.ids.size > 0 ? `Send Emails (${selectedRows.ids.size})` : 'Send All Emails'}
              </Button>
            </Tooltip>
            
            <Tooltip title="Resend links to all expired records">
              <Button
                variant="outlined"
                color="warning"
                startIcon={bulkResendingExpired ? <CircularProgress size={20} /> : <Replay />}
                onClick={handleBulkResendExpired}
                disabled={bulkResendingExpired || stats.expired === 0}
              >
                Resend Expired ({stats.expired})
              </Button>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
              onClick={handleExport}
              disabled={exporting}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchBatchAndRecords}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Summary Statistics Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
                </div>
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Email Sent</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.emailSent}</p>
                </div>
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Review Required</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.reviewRequired}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[150px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent className="p-4">
              <BatchProgressBar
                totalRecords={stats.total}
                verifiedCount={stats.verified}
                pendingCount={stats.pending}
                failedCount={stats.failed}
                reviewRequiredCount={stats.reviewRequired}
                emailSentCount={stats.emailSent}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Batch Timeline */}
        {batch && (
          <Box sx={{ mb: 3 }}>
            <Card>
              <CardContent className="p-4">
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Batch Timeline
                </Typography>
                <BatchTimeline
                  batchCreatedAt={batch.createdAt}
                  totalRecords={stats.total}
                  verifiedCount={stats.verified}
                  emailSentCount={stats.emailSent}
                />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setTimeout(fetchBatchAndRecords, 0);
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="email_sent">Email Sent</MenuItem>
              <MenuItem value="email_failed">Email Failed</MenuItem>
              <MenuItem value="link_expired">Link Expired</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="verification_failed">Verification Failed</MenuItem>
              <MenuItem value="review_required">Review Required</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Search"
            placeholder="Name, email, policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                fetchBatchAndRecords();
              }
            }}
            sx={{ minWidth: 250 }}
          />
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
            rows={records}
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
            }}
            checkboxSelection
            rowSelectionModel={selectedRows}
            onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
          />
        </Box>

        {/* Record Review Dialog */}
        <RecordReviewDialog
          record={selectedRecord}
          open={reviewDialogOpen}
          onClose={() => {
            setReviewDialogOpen(false);
            setSelectedRecord(null);
          }}
          onApprove={(comment) => {
            setReviewComment(comment);
            handleReviewAction('approve');
          }}
          onReject={(comment) => {
            setReviewComment(comment);
            handleReviewAction('reject');
          }}
        />
      </Box>
    </ThemeProvider>
  );
};

export default AdminRemediationRecords;
