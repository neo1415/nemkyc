/**
 * Identity List Detail Page
 * 
 * Shows all entries in a customer list with dynamic columns.
 * Features:
 * - Dynamic DataGrid showing ALL original columns + verification columns
 * - Checkbox selection for entries
 * - "Request NIN" and "Request CAC" buttons
 * - Resend link functionality for individual entries
 * - Search and filter by status
 * - Export functionality
 * - Activity log panel showing recent actions
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Replay as ResendIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  GetApp as DownloadIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { SendConfirmDialog } from '../../components/identity/SendConfirmDialog';
import { VerificationDetailsDialog } from '../../components/identity/VerificationDetailsDialog';
import BulkVerifyConfirmDialog, { BulkVerifyAnalysis } from '../../components/identity/BulkVerifyConfirmDialog';
import SendLinksConfirmDialog, { SendLinksAnalysis } from '../../components/identity/SendLinksConfirmDialog';
import { useBrokerTourV2 } from '../../hooks/useBrokerTourV2';
import type { IdentityEntry, ListDetails, EntryStatus, VerificationType, ActivityLog, ActivityAction } from '../../types/remediation';
import { isEncrypted } from '../../utils/encryption';
import { formatDate, formatDateLong, formatDateTime } from '../../utils/dateFormatter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface IdentityListDetailProps {
  listId?: string;
  onBack?: () => void;
  isEmbedded?: boolean;
}

export default function IdentityListDetail({ 
  listId: propListId, 
  onBack, 
  isEmbedded = false 
}: IdentityListDetailProps = {}) {
  const { listId: paramListId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  
  // Tour integration
  const { advanceTour } = useBrokerTourV2();
  
  // Use prop listId if provided (embedded mode), otherwise use URL param
  const listId = propListId || paramListId;
  
  const [list, setList] = useState<ListDetails | null>(null);
  const [entries, setEntries] = useState<IdentityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [verificationType, setVerificationType] = useState<VerificationType>('NIN');
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  
  // Resend dialog state
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const [resendEntry, setResendEntry] = useState<IdentityEntry | null>(null);
  const [resending, setResending] = useState(false);

  // Bulk verification state
  const [bulkVerifying, setBulkVerifying] = useState(false);
  const [bulkVerifyDialogOpen, setBulkVerifyDialogOpen] = useState(false);
  const [bulkVerifyResults, setBulkVerifyResults] = useState<{
    processed: number;
    verified: number;
    failed: number;
    skipped: number;
  } | null>(null);

  // Analysis and confirmation state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BulkVerifyAnalysis | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Link sending analysis state
  const [linkAnalyzing, setLinkAnalyzing] = useState(false);
  const [linkAnalysisResult, setLinkAnalysisResult] = useState<any>(null);
  const [linkConfirmDialogOpen, setLinkConfirmDialogOpen] = useState(false);

  // Failure details dialog state
  const [failureDetailsOpen, setFailureDetailsOpen] = useState(false);
  const [selectedFailedEntry, setSelectedFailedEntry] = useState<IdentityEntry | null>(null);

  // Retry verification state
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [retryEntry, setRetryEntry] = useState<IdentityEntry | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [activityStartDate, setActivityStartDate] = useState<string>('');
  const [activityEndDate, setActivityEndDate] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (!listId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', String(page + 1));
      params.append('limit', String(pageSize));

      // Fetch list details and entries
      const [listRes, entriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/identity/lists/${listId}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/identity/lists/${listId}/entries?${params}`, { credentials: 'include' }),
      ]);

      if (!listRes.ok || !entriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const listData = await listRes.json();
      const entriesData = await entriesRes.json();

      setList(listData.list);
      setEntries(entriesData.entries || []);
      setTotal(entriesData.total || 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [listId, statusFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tour step 3 (Select Entries) should already be active when page loads
  // No need to advance here - it was advanced before navigation

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!listId) return;
    
    try {
      setActivityLoading(true);
      
      const params = new URLSearchParams();
      if (activityFilter !== 'all') params.append('action', activityFilter);
      if (activityStartDate) params.append('startDate', activityStartDate);
      if (activityEndDate) params.append('endDate', activityEndDate);
      params.append('limit', '20');
      
      const response = await fetch(
        `${API_BASE_URL}/api/identity/lists/${listId}/activity?${params}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data = await response.json();
      setActivityLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setActivityLoading(false);
    }
  }, [listId, activityFilter, activityStartDate, activityEndDate]);

  // Fetch activity logs when panel is expanded or filter changes
  useEffect(() => {
    if (activityExpanded) {
      fetchActivityLogs();
    }
  }, [activityExpanded, fetchActivityLogs]);

  // Helper function to get activity log icon
  const getActivityIcon = (action: ActivityAction) => {
    switch (action) {
      case 'list_created':
        return <AddIcon sx={{ color: '#800020' }} />;
      case 'list_deleted':
        return <DeleteIcon color="error" />;
      case 'links_sent':
        return <EmailIcon sx={{ color: '#800020' }} />;
      case 'link_resent':
        return <ResendIcon sx={{ color: '#B8860B' }} />;
      case 'verification_success':
        return <SuccessIcon color="success" />;
      case 'verification_failed':
        return <ErrorIcon color="error" />;
      case 'export_generated':
        return <DownloadIcon sx={{ color: '#800020' }} />;
      default:
        return <HistoryIcon />;
    }
  };

  // Helper function to format activity log message
  const formatActivityMessage = (log: ActivityLog): string => {
    const details = log.details || {};
    switch (log.action) {
      case 'list_created':
        return `List created with ${details.entryCount || 0} entries`;
      case 'list_deleted':
        return `List deleted (${details.entriesDeleted || 0} entries removed)`;
      case 'links_sent':
        return `${details.sent || 0} ${details.verificationType || ''} verification links sent`;
      case 'link_resent':
        return `Link resent to ${details.email || 'customer'} (${details.resendCount || 0} times)`;
      case 'verification_success':
        return `${details.verificationType || 'Identity'} verified for ${details.email || 'customer'}`;
      case 'verification_failed':
        return `Verification failed for ${details.email || 'customer'}`;
      case 'export_generated':
        return `List exported (${details.entryCount || 0} entries)`;
      default:
        return (log.action as string).replace(/_/g, ' ');
    }
  };

  // Build dynamic columns based on list schema
  const buildColumns = (): GridColDef[] => {
    if (!list) return [];

    const columns: GridColDef[] = [];
    
    // Reserved column names that we add as verification columns
    // Skip these from original data to prevent duplicates
    const reservedColumns = new Set([
      'status', 'Status', 'STATUS',
      'nin', 'NIN', 'Nin',
      'cac', 'CAC', 'Cac',
      'verifiedAt', 'verified_at', 'Verified At', 'VerifiedAt',
      'linkSentAt', 'link_sent_at', 'Link Sent At', 'LinkSentAt',
      'resendCount', 'resend_count', 'Resend Count', 'ResendCount',
      'verificationStatus', 'verification_status', 'Verification Status', 'VerificationStatus'
    ]);

    // Add original columns from the uploaded file (excluding reserved columns)
    list.columns.forEach((col) => {
      // Skip reserved columns to prevent duplicates
      if (reservedColumns.has(col)) {
        return;
      }
      
      columns.push({
        field: `data.${col}`,
        headerName: col,
        flex: 1,
        minWidth: 120,
        valueGetter: (value, row) => {
          const cellData = row.data?.[col];
          
          // Handle encrypted data - show indicator instead of object
          if (isEncrypted(cellData)) {
            return '[Encrypted]';
          }
          
          // Handle null/undefined
          if (cellData === null || cellData === undefined) {
            return '';
          }
          
          // Handle objects (shouldn't happen, but safety check)
          if (typeof cellData === 'object') {
            return '[Complex Data]';
          }
          
          return cellData;
        },
        renderCell: (params) => {
          const isEmailCol = col === list.emailColumn;
          const isEncryptedData = params.value === '[Encrypted]';
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isEmailCol && <span>📧</span>}
              {isEncryptedData ? (
                <Tooltip title="This field contains encrypted data that can only be viewed by authorized personnel">
                  <Chip 
                    label="🔒 Encrypted" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#f5f5f5', 
                      color: '#666',
                      fontSize: '0.75rem'
                    }} 
                  />
                </Tooltip>
              ) : (
                params.value
              )}
            </Box>
          );
        },
      });
    });

    // Add verification status column
    columns.push({
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = params.value as EntryStatus;
        const statusConfig: Record<EntryStatus, { bgcolor: string; color: string; label: string }> = {
          pending: { bgcolor: '#f5f5f5', color: '#666', label: 'Pending' },
          link_sent: { bgcolor: '#800020', color: 'white', label: 'Link Sent' },
          verified: { bgcolor: '#2e7d32', color: 'white', label: 'Verified' },
          verification_failed: { bgcolor: '#d32f2f', color: 'white', label: 'Verification Failed' },
          failed: { bgcolor: '#d32f2f', color: 'white', label: 'Failed' },
          email_failed: { bgcolor: '#B8860B', color: 'white', label: 'Email Failed' },
        };
        const config = statusConfig[status] || { bgcolor: '#f5f5f5', color: '#666', label: status };
        
        // Make verification_failed status clickable to show details
        const isClickable = status === 'verification_failed';
        
        return (
          <Chip 
            label={config.label} 
            size="small" 
            sx={{ 
              bgcolor: config.bgcolor, 
              color: config.color,
              cursor: isClickable ? 'pointer' : 'default',
              '&:hover': isClickable ? { opacity: 0.8 } : {}
            }}
            onClick={isClickable ? () => {
              setSelectedFailedEntry(params.row as IdentityEntry);
              setFailureDetailsOpen(true);
            } : undefined}
          />
        );
      },
    });

    // Add Verification Details column
    columns.push({
      field: 'verificationDetails',
      headerName: 'Verification Details',
      width: 200,
      renderCell: (params) => {
        const entry = params.row as IdentityEntry;
        const details = entry.verificationDetails;
        const status = entry.status;

        // Show nothing for pending or link_sent
        if (status === 'pending' || status === 'link_sent') {
          return <Typography variant="body2" color="textSecondary">-</Typography>;
        }

        // Show success indicator for verified
        if (status === 'verified') {
          const validatedFields = details?.fieldsValidated || [];
          return (
            <Tooltip title={
              <Box>
                <Typography variant="caption" fontWeight="bold">Validated Fields:</Typography>
                {validatedFields.length > 0 ? (
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {validatedFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="caption">All fields matched</Typography>
                )}
              </Box>
            }>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#2e7d32' }}>
                <CheckCircle2 size={16} />
                <Typography variant="body2" fontWeight="medium">
                  {validatedFields.length} fields matched
                </Typography>
              </Box>
            </Tooltip>
          );
        }

        // Show failure indicator for verification_failed
        if (status === 'verification_failed') {
          const failedFields = details?.failedFields || [];
          const failureReason = details?.failureReason || 'Verification failed';
          
          return (
            <Tooltip title={
              <Box>
                <Typography variant="caption" fontWeight="bold" color="error">Failed Fields:</Typography>
                {failedFields.length > 0 ? (
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    {failedFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="caption">{failureReason}</Typography>
                )}
                <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                  Click status for full details
                </Typography>
              </Box>
            }>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  color: '#d32f2f',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => {
                  setSelectedFailedEntry(entry);
                  setFailureDetailsOpen(true);
                }}
              >
                <XCircle size={16} />
                <Typography variant="body2" fontWeight="medium">
                  {failedFields.length > 0 ? `${failedFields.length} fields failed` : 'Failed'}
                </Typography>
              </Box>
            </Tooltip>
          );
        }

        // Show warning for other failure states
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#B8860B' }}>
            <AlertTriangle size={16} />
            <Typography variant="body2">{status}</Typography>
          </Box>
        );
      },
    });

    // Add Link Sent At column
    columns.push({
      field: 'linkSentAt',
      headerName: 'Link Sent',
      width: 150,
      valueGetter: (value) => {
        if (!value) return '-';
        // Handle both Date objects and Firestore timestamps
        const date = typeof value === 'object' && value !== null && 'toDate' in value 
          ? (value as { toDate: () => Date }).toDate() 
          : new Date(value as string | number | Date);
        return formatDate(date);
      },
    });

    // Add NIN column
    columns.push({
      field: 'nin',
      headerName: 'NIN',
      width: 130,
      valueGetter: (value) => {
        if (!value) return '-';
        // Handle encrypted data
        if (isEncrypted(value)) {
          return '[Encrypted]';
        }
        return value;
      },
      renderCell: (params) => {
        if (params.value === '[Encrypted]') {
          return (
            <Tooltip title="This field contains encrypted data">
              <Chip 
                label="🔒 Encrypted" 
                size="small" 
                sx={{ 
                  bgcolor: '#f5f5f5', 
                  color: '#666',
                  fontSize: '0.75rem'
                }} 
              />
            </Tooltip>
          );
        }
        return params.value || '-';
      },
    });

    // Add CAC column
    columns.push({
      field: 'cac',
      headerName: 'CAC',
      width: 130,
      valueGetter: (value) => {
        if (!value) return '-';
        // Handle encrypted data
        if (isEncrypted(value)) {
          return '[Encrypted]';
        }
        return value;
      },
      renderCell: (params) => {
        if (params.value === '[Encrypted]') {
          return (
            <Tooltip title="This field contains encrypted data">
              <Chip 
                label="🔒 Encrypted" 
                size="small" 
                sx={{ 
                  bgcolor: '#f5f5f5', 
                  color: '#666',
                  fontSize: '0.75rem'
                }} 
              />
            </Tooltip>
          );
        }
        return params.value || '-';
      },
    });

    // Add verified at column
    columns.push({
      field: 'verifiedAt',
      headerName: 'Verified At',
      width: 150,
      valueGetter: (value) => {
        if (!value) return '-';
        // Handle both Date objects and Firestore timestamps
        const date = typeof value === 'object' && value !== null && 'toDate' in value 
          ? (value as { toDate: () => Date }).toDate() 
          : new Date(value as string | number | Date);
        return formatDate(date);
      },
    });

    // Add resend count column
    columns.push({
      field: 'resendCount',
      headerName: 'Resends',
      width: 80,
      renderCell: (params) => {
        const count = params.value || 0;
        return (
          <Chip 
            label={count} 
            size="small" 
            color={count > 3 ? 'warning' : 'default'}
            variant="outlined"
          />
        );
      },
    });

    // Add actions column with resend button
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const entry = params.row as IdentityEntry;
        const canResend = entry.status !== 'verified' && entry.verificationType;
        
        return (
          <Tooltip title={
            entry.status === 'verified' 
              ? 'Already verified' 
              : !entry.verificationType 
                ? 'Send initial link first' 
                : `Resend link (${entry.resendCount || 0} times sent)`
          }>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={!canResend}
                onClick={() => handleResendClick(entry)}
              >
                <ResendIcon />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
    });

    return columns;
  };

  // Handle resend button click
  const handleResendClick = (entry: IdentityEntry) => {
    setResendEntry(entry);
    setResendDialogOpen(true);
  };

  // Handle resend confirmation
  const handleResendConfirm = async () => {
    if (!resendEntry) return;

    try {
      setResending(true);
      const response = await fetch(`${API_BASE_URL}/api/identity/entries/${resendEntry.id}/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification link');
      }

      const result = await response.json();
      
      setResendDialogOpen(false);
      setResendEntry(null);
      fetchData();
      
      // Show success message with warning if applicable
      if (result.warning) {
        setSuccessMessage(`Link resent successfully. Warning: ${result.warning}`);
      } else {
        setSuccessMessage(`Verification link resent to ${resendEntry.email}. Expires: ${formatDateLong(result.newExpiresAt)}`);
      }
    } catch (err) {
      console.error('Error resending link:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend link');
    } finally {
      setResending(false);
    }
  };

  const handleSendClick = async (type: VerificationType) => {
    const idsArray = getSelectedIdsArray();
    if (idsArray.length === 0) {
      setError('Please select at least one entry');
      return;
    }

    setVerificationType(type);
    
    // Call analysis endpoint
    try {
      setLinkAnalyzing(true);
      setLinkConfirmDialogOpen(true);
      
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/analyze-send-links`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds: idsArray,
          verificationType: type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze entries');
      }

      const analysis = await response.json();
      setLinkAnalysisResult(analysis);
    } catch (err) {
      console.error('Error analyzing entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze entries');
      setLinkConfirmDialogOpen(false);
    } finally {
      setLinkAnalyzing(false);
    }
  };

  // Helper to get selected IDs as array
  const getSelectedIdsArray = (): string[] => {
    if (selectedIds.type === 'include') {
      return Array.from(selectedIds.ids) as string[];
    }
    // For 'all' type, return all entry IDs except excluded ones
    return entries.map(e => e.id).filter(id => !selectedIds.ids.has(id));
  };

  const selectedCount = selectedIds.type === 'include' ? selectedIds.ids.size : entries.length - selectedIds.ids.size;

  const handleLinkSendConfirm = async () => {
    const idsArray = getSelectedIdsArray();
    if (idsArray.length === 0) return;

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds: idsArray,
          verificationType,
          analysisId: linkAnalysisResult?.analysisId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'ANALYSIS_EXPIRED') {
          setError('Analysis expired. Please try again.');
          setLinkConfirmDialogOpen(false);
          return;
        }
        throw new Error('Failed to send verification links');
      }

      const result = await response.json();
      setLinkConfirmDialogOpen(false);
      setSelectedIds({ type: 'include', ids: new Set() });
      fetchData();
      
      // Advance tour when emails are sent successfully
      if (result.sent > 0) {
        advanceTour();
      }
      
      // Show success message
      const message = `Sent ${result.sent} verification links.`;
      const details = [];
      if (result.failed > 0) details.push(`${result.failed} failed`);
      if (result.skipped > 0) details.push(`${result.skipped} skipped`);
      
      setSuccessMessage(details.length > 0 ? `${message} ${details.join(', ')}.` : message);
    } catch (err) {
      console.error('Error sending links:', err);
      setError(err instanceof Error ? err.message : 'Failed to send links');
    } finally {
      setSending(false);
    }
  };

  const handleSendConfirm = async () => {
    const idsArray = getSelectedIdsArray();
    if (idsArray.length === 0) return;

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds: idsArray,
          verificationType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification links');
      }

      const result = await response.json();
      setSendDialogOpen(false);
      setSelectedIds({ type: 'include', ids: new Set() });
      fetchData();
      
      // Advance tour when emails are sent successfully
      if (result.sent > 0) {
        advanceTour();
      }
      
      // Show success message
      alert(`Sent ${result.sent} verification links. ${result.failed} failed.`);
    } catch (err) {
      console.error('Error sending links:', err);
      setError(err instanceof Error ? err.message : 'Failed to send links');
    } finally {
      setSending(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/export`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${list?.name || 'export'}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  // Handle bulk verification
  const [bulkVerifyJobId, setBulkVerifyJobId] = useState<string | null>(null);
  const [bulkVerifyProgress, setBulkVerifyProgress] = useState<number>(0);
  const [bulkVerifyStatus, setBulkVerifyStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error' | 'queued'>('idle');
  const [bulkVerifyPollInterval, setBulkVerifyPollInterval] = useState<NodeJS.Timeout | null>(null);
  const pollingBackoffRef = useRef<number>(2000); // Start at 2 seconds

  // Poll for bulk verification progress
  const pollBulkVerifyProgress = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/identity/bulk-verify/${jobId}/status`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }
      
      const status = await response.json();
      setBulkVerifyProgress(status.progress || 0);
      setBulkVerifyStatus(status.status);
      
      // Reset backoff on successful response
      pollingBackoffRef.current = 2000;
      
      // Check completed flag instead of string matching on status
      if (status.completed) {
        // Stop polling
        if (bulkVerifyPollInterval) {
          clearInterval(bulkVerifyPollInterval);
          setBulkVerifyPollInterval(null);
        }
        
        // Fetch full results with details
        const detailsResponse = await fetch(`${API_BASE_URL}/api/identity/bulk-verify/${jobId}/status?includeDetails=true`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (detailsResponse.ok) {
          const results = await detailsResponse.json();
          setBulkVerifyResults(results);
          setBulkVerifyDialogOpen(true);
        }
        
        // Refresh data to show updated statuses
        await fetchData();
        setBulkVerifying(false);
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      
      // Increase backoff on error (exponential: 2s, 4s, 8s, 16s, max 30s)
      pollingBackoffRef.current = Math.min(pollingBackoffRef.current * 2, 30000);
    }
  };

  // Start polling with exponential backoff
  const startPolling = (jobId: string) => {
    // Reset backoff to initial value
    pollingBackoffRef.current = 2000;
    
    const poll = () => {
      pollBulkVerifyProgress(jobId).then(() => {
        // Schedule next poll with current backoff interval
        const timeout = setTimeout(poll, pollingBackoffRef.current);
        setBulkVerifyPollInterval(timeout as any);
      });
    };
    
    // Start first poll immediately
    poll();
  };

  const handleBulkVerify = async () => {
    if (!listId) return;
    
    try {
      setAnalyzing(true);
      setError(null);
      
      // Step 1: Analyze entries before verification
      const analysisResponse = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/analyze-bulk-verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 10
        })
      });
      
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.message || 'Failed to analyze entries');
      }
      
      const analysis = await analysisResponse.json();
      
      // Step 2: Show confirmation modal with analysis results
      setAnalysisResult(analysis);
      setConfirmDialogOpen(true);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze entries');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle confirmation from modal
  const handleConfirmBulkVerify = async () => {
    if (!listId || !analysisResult) return;
    
    try {
      setConfirmDialogOpen(false);
      setBulkVerifying(true);
      setError(null);
      setBulkVerifyProgress(0);
      setBulkVerifyStatus('running');
      
      // Step 3: Start verification with analysisId
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${listId}/bulk-verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 10,
          analysisId: analysisResult.analysisId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start bulk verification');
      }
      
      const result = await response.json();
      
      // Check if request was queued
      if (result.queued) {
        setBulkVerifying(false);
        setBulkVerifyStatus('queued');
        setError(null);
        
        alert(`Your bulk verification request has been queued.\n\nPosition: ${result.position}/${result.queueSize}\nEstimated wait: ${result.estimatedWaitTime} seconds\n\nYou will be notified when it completes.`);
        
        return;
      }
      
      // Normal processing - not queued
      setBulkVerifyJobId(result.jobId);
      
      // Start polling for progress with exponential backoff
      startPolling(result.jobId);
      
    } catch (err) {
      console.error('Bulk verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start bulk verification');
      setBulkVerifying(false);
      setBulkVerifyStatus('error');
    }
  };

  // Handle pause bulk verification
  const handlePauseBulkVerify = async () => {
    if (!bulkVerifyJobId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/identity/bulk-verify/${bulkVerifyJobId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to pause bulk verification');
      }
      
      setBulkVerifyStatus('paused');
      
      // Stop polling
      if (bulkVerifyPollInterval) {
        clearInterval(bulkVerifyPollInterval);
        setBulkVerifyPollInterval(null);
      }
    } catch (err) {
      console.error('Error pausing bulk verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause bulk verification');
    }
  };

  // Handle resume bulk verification
  const handleResumeBulkVerify = async () => {
    if (!bulkVerifyJobId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/identity/bulk-verify/${bulkVerifyJobId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resume bulk verification');
      }
      
      setBulkVerifyStatus('running');
      
      // Restart polling with exponential backoff
      startPolling(bulkVerifyJobId);
    } catch (err) {
      console.error('Error resuming bulk verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume bulk verification');
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (bulkVerifyPollInterval) {
        clearInterval(bulkVerifyPollInterval);
      }
    };
  }, [bulkVerifyPollInterval]);

  // Handle manual retry verification
  const handleRetryVerification = async () => {
    if (!retryEntry) return;

    try {
      setRetrying(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/identity/entries/${retryEntry.id}/retry-verification`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to retry verification');
      }

      const result = await response.json();
      
      setRetryDialogOpen(false);
      setRetryEntry(null);
      
      // Refresh data to show updated status
      await fetchData();
      
      if (result.success) {
        setSuccessMessage(`Verification retry successful for ${retryEntry.email}`);
      } else {
        setError(`Verification retry failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error retrying verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry verification');
    } finally {
      setRetrying(false);
    }
  };

  // Handle retry button click from dialog
  const handleRetryClick = (entry: IdentityEntry) => {
    setRetryEntry(entry);
    setRetryDialogOpen(true);
  };

  // Get selected entries for the dialog
  const selectedEntries = entries.filter((e) => {
    if (selectedIds.type === 'include') {
      return selectedIds.ids.has(e.id);
    }
    return !selectedIds.ids.has(e.id);
  });

  // Calculate progress
  const progress = list ? Math.round((list.verifiedCount / list.totalEntries) * 100) : 0;

  if (loading && !list) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => isEmbedded && onBack ? onBack() : navigate('/admin/identity')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5">{list?.name || 'Customer List'}</Typography>
          <Typography variant="body2" color="textSecondary">
            {list?.originalFileName} • {list?.totalEntries} entries
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Button startIcon={<ExportIcon />} onClick={handleExport} data-tour="export-button">
          Export
        </Button>
      </Box>

      {/* Progress Bar */}
      {list && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Progress: {list.verifiedCount} of {list.totalEntries} verified
            </Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#800020' }}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: '#f5f5f5',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#800020'
              }
            }} 
          />
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Filters and Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="link_sent">Link Sent</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="verification_failed">Verification Failed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="email_failed">Email Failed</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={analyzing ? <CircularProgress size={20} /> : bulkVerifying ? <CircularProgress size={20} /> : <RefreshIcon />}
          disabled={analyzing || bulkVerifying || !list || list.totalEntries === 0}
          onClick={handleBulkVerify}
          sx={{ 
            borderColor: '#800020',
            color: '#800020',
            '&:hover': { 
              borderColor: '#600018',
              bgcolor: 'rgba(128, 0, 32, 0.04)'
            }
          }}
        >
          {analyzing ? 'Analyzing...' : bulkVerifying ? `Verifying... ${bulkVerifyProgress}%` : 'Verify All Unverified'}
        </Button>
        
        {/* Pause/Resume buttons for bulk verification */}
        {bulkVerifying && bulkVerifyStatus === 'running' && (
          <Button
            variant="outlined"
            startIcon={<PauseIcon />}
            onClick={handlePauseBulkVerify}
            sx={{ 
              borderColor: '#FFA500',
              color: '#FFA500',
              '&:hover': { 
                borderColor: '#FF8C00',
                bgcolor: 'rgba(255, 165, 0, 0.04)'
              }
            }}
          >
            Pause
          </Button>
        )}
        
        {bulkVerifyStatus === 'paused' && (
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleResumeBulkVerify}
            sx={{ 
              borderColor: '#008000',
              color: '#008000',
              '&:hover': { 
                borderColor: '#006400',
                bgcolor: 'rgba(0, 128, 0, 0.04)'
              }
            }}
          >
            Resume
          </Button>
        )}
        
        <Box data-tour="request-buttons" sx={{ display: 'flex', gap: 1 }}>
          {/* Show Request NIN button only for individual lists */}
          {(!list?.listType || list.listType === 'individual') && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              disabled={selectedCount === 0}
              onClick={() => handleSendClick('NIN')}
              sx={{ 
                bgcolor: '#800020', 
                '&:hover': { bgcolor: '#600018' },
                color: 'white'
              }}
            >
              Request NIN ({selectedCount})
            </Button>
          )}
          
          {/* Show Request CAC button only for corporate lists */}
          {list?.listType === 'corporate' && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              disabled={selectedCount === 0}
              onClick={() => handleSendClick('CAC')}
              sx={{ 
                bgcolor: '#B8860B', 
                '&:hover': { bgcolor: '#8B6914' },
                color: 'white'
              }}
            >
              Request CAC ({selectedCount})
            </Button>
          )}
        </Box>
      </Box>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }} data-tour="select-entries">
        <DataGrid
          rows={entries}
          columns={buildColumns()}
          checkboxSelection
          rowSelectionModel={selectedIds}
          onRowSelectionModelChange={(newSelection) => {
            setSelectedIds(newSelection);
            // Advance tour when entries are selected
            const selectedCount = Array.isArray(newSelection) 
              ? newSelection.length 
              : (newSelection.type === 'include' ? newSelection.ids.size : entries.length - newSelection.ids.size);
            
            if (selectedCount > 0) {
              advanceTour();
            }
          }}
          isRowSelectable={(params) => params.row.status !== 'verified'}
          paginationMode="server"
          rowCount={total}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          loading={loading}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row.verified-row': {
              opacity: 0.6,
              backgroundColor: '#f5f5f5',
            },
          }}
          getRowClassName={(params) => params.row.status === 'verified' ? 'verified-row' : ''}
        />
      </Paper>

      {/* Send Confirmation Dialog */}
      <SendConfirmDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        onConfirm={handleSendConfirm}
        entries={selectedEntries}
        verificationType={verificationType}
        loading={sending}
      />

      {/* Bulk Verify Confirmation Dialog */}
      <BulkVerifyConfirmDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setAnalysisResult(null);
        }}
        onConfirm={handleConfirmBulkVerify}
        analysis={analysisResult}
        loading={analyzing}
      />

      {/* Send Links Confirmation Dialog */}
      <SendLinksConfirmDialog
        open={linkConfirmDialogOpen}
        onClose={() => {
          setLinkConfirmDialogOpen(false);
          setLinkAnalysisResult(null);
        }}
        onConfirm={handleLinkSendConfirm}
        analysis={linkAnalysisResult}
        loading={linkAnalyzing}
        sending={sending}
        verificationType={verificationType}
      />

      {/* Resend Confirmation Dialog */}
      <Dialog
        open={resendDialogOpen}
        onClose={() => !resending && setResendDialogOpen(false)}
      >
        <DialogTitle>Resend Verification Link</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {resendEntry && (
              <>
                Are you sure you want to resend the {resendEntry.verificationType} verification link to{' '}
                <strong>{resendEntry.email}</strong>?
                {(resendEntry.resendCount || 0) > 0 && (
                  <Box sx={{ mt: 1 }}>
                    This link has already been sent <strong>{resendEntry.resendCount}</strong> time(s).
                  </Box>
                )}
                {(resendEntry.resendCount || 0) >= 3 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    This link has been resent multiple times. Consider contacting the customer directly.
                  </Alert>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResendDialogOpen(false)} disabled={resending}>
            Cancel
          </Button>
          <Button 
            onClick={handleResendConfirm} 
            variant="contained" 
            disabled={resending}
            startIcon={resending ? <CircularProgress size={16} /> : <ResendIcon />}
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            {resending ? 'Sending...' : 'Resend Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Verification Results Dialog */}
      <Dialog
        open={bulkVerifyDialogOpen}
        onClose={() => setBulkVerifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bulk Verification Complete</DialogTitle>
        <DialogContent>
          {bulkVerifyResults && (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                The bulk verification process has completed. Here are the results:
              </DialogContentText>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Processed:</Typography>
                  <Chip label={bulkVerifyResults.processed} color="primary" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Successfully Verified:</Typography>
                  <Chip label={bulkVerifyResults.verified} color="success" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Failed:</Typography>
                  <Chip label={bulkVerifyResults.failed} color="error" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Skipped:</Typography>
                  <Chip label={bulkVerifyResults.skipped} color="default" />
                </Box>
              </Box>
              
              {bulkVerifyResults.verified > 0 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {bulkVerifyResults.verified} {bulkVerifyResults.verified === 1 ? 'entry has' : 'entries have'} been successfully verified!
                </Alert>
              )}
              
              {bulkVerifyResults.failed > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {bulkVerifyResults.failed} {bulkVerifyResults.failed === 1 ? 'entry' : 'entries'} failed verification. Check the status column for details.
                </Alert>
              )}
              
              {bulkVerifyResults.skipped > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {bulkVerifyResults.skipped} {bulkVerifyResults.skipped === 1 ? 'entry was' : 'entries were'} skipped (already verified or missing identity data).
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBulkVerifyDialogOpen(false)} 
            variant="contained"
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Log Panel */}
      <Accordion 
        expanded={activityExpanded} 
        onChange={(_, expanded) => setActivityExpanded(expanded)}
        sx={{ mt: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon sx={{ color: '#800020' }} />
            <Typography variant="h6">Activity Log</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {/* Activity Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Action</InputLabel>
              <Select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                label="Filter by Action"
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="list_created">List Created</MenuItem>
                <MenuItem value="links_sent">Links Sent</MenuItem>
                <MenuItem value="link_resent">Link Resent</MenuItem>
                <MenuItem value="verification_success">Verification Success</MenuItem>
                <MenuItem value="verification_failed">Verification Failed</MenuItem>
                <MenuItem value="export_generated">Export Generated</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={activityStartDate}
              onChange={(e) => setActivityStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              size="small"
              type="date"
              label="End Date"
              value={activityEndDate}
              onChange={(e) => setActivityEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            {(activityStartDate || activityEndDate || activityFilter !== 'all') && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setActivityFilter('all');
                  setActivityStartDate('');
                  setActivityEndDate('');
                }}
              >
                Clear Filters
              </Button>
            )}
            <IconButton onClick={fetchActivityLogs} disabled={activityLoading}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {/* Activity List */}
          {activityLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : activityLogs.length === 0 ? (
            <Typography color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
              No activity logs found
            </Typography>
          ) : (
            <List dense>
              {activityLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(log.action)}
                    </ListItemIcon>
                    <ListItemText
                      primary={formatActivityMessage(log)}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <span>
                            {formatDateTime(log.timestamp)}
                          </span>
                          {log.actorType === 'admin' && log.details?.sentBy && (
                            <span>by {log.details.sentBy}</span>
                          )}
                          {log.actorType === 'admin' && log.details?.createdBy && (
                            <span>by {log.details.createdBy}</span>
                          )}
                          {log.actorType === 'admin' && log.details?.exportedBy && (
                            <span>by {log.details.exportedBy}</span>
                          )}
                          {log.actorType === 'admin' && log.details?.resentBy && (
                            <span>by {log.details.resentBy}</span>
                          )}
                          {log.actorType === 'admin' && log.details?.deletedBy && (
                            <span>by {log.details.deletedBy}</span>
                          )}
                        </Box>
                      }
                    />
                    {log.action === 'verification_failed' && log.details?.attemptsRemaining !== undefined && (
                      <Chip 
                        label={`${log.details.attemptsRemaining} attempts left`} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Verification Details Dialog */}
      <VerificationDetailsDialog
        open={failureDetailsOpen}
        onClose={() => setFailureDetailsOpen(false)}
        entry={selectedFailedEntry}
        onRetry={handleRetryClick}
      />

      {/* Retry Verification Confirmation Dialog */}
      <Dialog
        open={retryDialogOpen}
        onClose={() => !retrying && setRetryDialogOpen(false)}
      >
        <DialogTitle>Retry Verification</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {retryEntry && (
              <>
                Are you sure you want to manually retry verification for{' '}
                <strong>{retryEntry.email}</strong>?
                <Box sx={{ mt: 2 }}>
                  This will attempt to verify the identity information again using the stored data.
                </Box>
                {(retryEntry.verificationAttempts || 0) > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Previous attempts: <strong>{retryEntry.verificationAttempts}</strong>
                  </Alert>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetryDialogOpen(false)} disabled={retrying}>
            Cancel
          </Button>
          <Button 
            onClick={handleRetryVerification} 
            variant="contained" 
            disabled={retrying}
            startIcon={retrying ? <CircularProgress size={16} /> : <RefreshIcon />}
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            {retrying ? 'Retrying...' : 'Retry Verification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
