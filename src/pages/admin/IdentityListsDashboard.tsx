/**
 * Identity Lists Dashboard
 * 
 * Main admin page for viewing and managing uploaded customer lists.
 * Displays all lists with progress indicators and quick actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  CheckCircle as VerifiedIcon,
  Schedule as PendingIcon,
  Error as FailedIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as CheckIcon,
  Cancel as CancelIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { UploadDialog } from '../../components/identity/UploadDialog';
import IdentityListDetail from './IdentityListDetail';
import '../../styles/broker-tour.css';
import type { ListSummary } from '../../types/remediation';
import { formatDate } from '../../utils/dateFormatter';
import { getDocumentStatusSummary } from '../../services/cacMetadataService';
import { DocumentStatusSummary, DocumentStatus, CACDocumentType } from '../../types/cacDocuments';
import { CACDocumentPreview, useDocumentPreview } from '../../components/identity/CACDocumentPreview';
import { getDocumentsByType } from '../../services/cacMetadataService';

// Import tour reset utility for testing (makes it available in console)
import '../../utils/resetBrokerTour';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface IdentityListsDashboardProps {
  isEmbedded?: boolean;
}

export default function IdentityListsDashboard({ isEmbedded = false }: IdentityListsDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentTab, setCurrentTab] = useState<'individual' | 'corporate'>('individual');
  
  // Document status state for corporate lists
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, DocumentStatusSummary>>(new Map());
  const [loadingDocumentStatuses, setLoadingDocumentStatuses] = useState(false);
  
  // Document preview hook
  const { previewDocument, previewOpen, previewOwnerId, openPreview, closePreview } = useDocumentPreview();

  // Filter lists by tab
  // For backward compatibility: if listType is not set, show in both tabs
  const filteredLists = lists.filter(list => {
    if (!list.listType || list.listType === 'flexible') {
      // Lists without listType or with 'flexible' type show in both tabs
      return true;
    }
    return list.listType === currentTab;
  });

  // Calculate overall stats for current tab
  const totalEntries = filteredLists.reduce((sum, list) => sum + list.totalEntries, 0);
  const totalVerified = filteredLists.reduce((sum, list) => sum + list.verifiedCount, 0);
  const totalPending = filteredLists.reduce((sum, list) => sum + list.pendingCount, 0);
  const overallProgress = totalEntries > 0 ? Math.round((totalVerified / totalEntries) * 100) : 0;

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/identity/lists`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }

      const data = await response.json();
      setLists(data.lists || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches document status for corporate lists
   * Requirement: 7.7 - Update status in real-time when documents are uploaded
   */
  const fetchDocumentStatuses = useCallback(async (corporateLists: ListSummary[]) => {
    if (corporateLists.length === 0) {
      return;
    }

    try {
      setLoadingDocumentStatuses(true);
      const statusMap = new Map<string, DocumentStatusSummary>();

      // Fetch document status for each corporate list
      await Promise.all(
        corporateLists.map(async (list) => {
          try {
            const status = await getDocumentStatusSummary(list.id);
            statusMap.set(list.id, status);
          } catch (err) {
            console.error(`Failed to fetch document status for list ${list.id}:`, err);
            // Set default missing status on error
            statusMap.set(list.id, {
              identityRecordId: list.id,
              certificateOfIncorporation: DocumentStatus.MISSING,
              particularsOfDirectors: DocumentStatus.MISSING,
              shareAllotment: DocumentStatus.MISSING,
              uploadTimestamps: {},
              isComplete: false
            });
          }
        })
      );

      setDocumentStatuses(statusMap);
    } catch (err) {
      console.error('Error fetching document statuses:', err);
    } finally {
      setLoadingDocumentStatuses(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Fetch document statuses when lists change and we're on corporate tab
  useEffect(() => {
    const corporateLists = lists.filter(list => list.listType === 'corporate');
    if (corporateLists.length > 0 && currentTab === 'corporate') {
      fetchDocumentStatuses(corporateLists);
    }
  }, [lists, currentTab, fetchDocumentStatuses]);

  useEffect(() => {
    if (location.state?.openUploadDialog) {
      setUploadDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleUploadSuccess = (listId: string) => {
    setUploadDialogOpen(false);
    fetchLists();
    // Navigate to the new list - use embedded mode if applicable
    if (isEmbedded) {
      setSelectedListId(listId);
    } else {
      navigate(`/admin/identity/${listId}`);
    }
  };

  const handleDeleteClick = (listId: string) => {
    setDeleteListId(listId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteListId) return;

    try {
      setDeleting(true);
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${deleteListId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      setDeleteDialogOpen(false);
      setDeleteListId(null);
      fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    } finally {
      setDeleting(false);
    }
  };

  const handleListClick = (listId: string) => {
    if (isEmbedded) {
      setSelectedListId(listId);
    } else {
      navigate(`/admin/identity/${listId}`);
    }
  };

  const handleBackToList = () => {
    setSelectedListId(null);
    fetchLists();
  };

  /**
   * Handles clicking on a document status indicator to preview the document
   * Requirement: 7.5 - Make status indicators clickable to preview documents
   */
  const handleDocumentStatusClick = async (
    e: React.MouseEvent,
    listId: string,
    documentType: CACDocumentType,
    status: DocumentStatus
  ) => {
    e.stopPropagation(); // Prevent list card click

    // Only open preview if document is uploaded
    if (status !== DocumentStatus.UPLOADED) {
      return;
    }

    try {
      // Fetch the document metadata
      const documents = await getDocumentsByType(documentType, listId);
      if (documents.length > 0) {
        const document = documents[0]; // Get the current version
        openPreview(document, listId);
      }
    } catch (err) {
      console.error('Failed to load document for preview:', err);
      setError('Failed to load document preview. Please try again.');
    }
  };

  // If embedded and a list is selected, show the detail view
  if (isEmbedded && selectedListId) {
    return <IdentityListDetail listId={selectedListId} onBack={handleBackToList} isEmbedded />;
  }

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'success';
    if (progress >= 50) return 'warning';
    return 'inherit'; // Will use custom burgundy
  };

  const getProgressBarSx = (progress: number) => ({
    flexGrow: 1, 
    height: 8, 
    borderRadius: 4,
    bgcolor: '#f5f5f5',
    '& .MuiLinearProgress-bar': {
      bgcolor: progress >= 100 ? '#2e7d32' : progress >= 50 ? '#B8860B' : '#800020'
    }
  });

  /**
   * Renders a document status indicator
   * Requirements: 7.2, 7.3, 7.4, 7.5
   */
  const renderDocumentStatus = (
    listId: string,
    documentType: CACDocumentType,
    status: DocumentStatus,
    uploadTimestamp?: Date
  ) => {
    const isUploaded = status === DocumentStatus.UPLOADED;
    const isMissing = status === DocumentStatus.MISSING;
    const isClickable = isUploaded;

    const getDocumentLabel = (type: CACDocumentType): string => {
      switch (type) {
        case CACDocumentType.CERTIFICATE_OF_INCORPORATION:
          return 'Certificate';
        case CACDocumentType.PARTICULARS_OF_DIRECTORS:
          return 'Directors';
        case CACDocumentType.SHARE_ALLOTMENT:
          return 'Share Allotment';
        default:
          return 'Document';
      }
    };

    return (
      <Tooltip
        title={
          isUploaded && uploadTimestamp
            ? `Uploaded ${formatDate(uploadTimestamp)}`
            : isMissing
            ? 'Not uploaded'
            : 'Pending'
        }
      >
        <Box
          onClick={(e) => isClickable && handleDocumentStatusClick(e, listId, documentType, status)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: isClickable ? 'pointer' : 'default',
            padding: '4px 8px',
            borderRadius: 1,
            bgcolor: isUploaded ? '#e8f5e9' : '#ffebee',
            border: '1px solid',
            borderColor: isUploaded ? '#2e7d32' : '#d32f2f',
            transition: 'all 0.2s',
            '&:hover': isClickable ? {
              boxShadow: 1,
              transform: 'translateY(-1px)'
            } : {}
          }}
        >
          {isUploaded ? (
            <CheckIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
          ) : (
            <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
          )}
          <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
            {getDocumentLabel(documentType)}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Identity Collection
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLists} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            data-tour="upload-button"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            Upload New List
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
            },
            '& .Mui-selected': {
              color: '#800020',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#800020',
            },
          }}
        >
          <Tab label="Individual Lists" value="individual" />
          <Tab label="Corporate Lists" value="corporate" />
        </Tabs>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* @ts-expect-error - MUI Grid v6 type issue with item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {currentTab === 'individual' ? 'Individual Lists' : 'Corporate Lists'}
              </Typography>
              <Typography variant="h4">{filteredLists.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error - MUI Grid v6 type issue with item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Entries
              </Typography>
              <Typography variant="h4">{totalEntries.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error - MUI Grid v6 type issue with item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Verified
              </Typography>
              <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                {totalVerified.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error - MUI Grid v6 type issue with item prop */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Overall Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4">{overallProgress}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={getProgressBarSx(overallProgress)}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lists Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredLists.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No {currentTab} lists yet
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            Upload a CSV or Excel file with {currentTab} customer data to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            Upload Your First List
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredLists.map((list, index) => (
            // @ts-expect-error - MUI Grid v6 type issue with item prop
            <Grid item xs={12} sm={6} md={4} key={list.id}>
              <Card 
                data-tour={index === 0 ? "list-card" : undefined}
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => handleListClick(list.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                      {list.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(list.id);
                      }}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {list.originalFileName}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<VerifiedIcon />}
                      label={`${list.verifiedCount} verified`}
                      size="small"
                      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', borderColor: '#2e7d32' }}
                      variant="outlined"
                    />
                    <Chip
                      icon={<PendingIcon />}
                      label={`${list.pendingCount} pending`}
                      size="small"
                      sx={{ bgcolor: '#fff8e1', color: '#B8860B', borderColor: '#B8860B' }}
                      variant="outlined"
                    />
                    {list.failedCount > 0 && (
                      <Chip
                        icon={<FailedIcon />}
                        label={`${list.failedCount} failed`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="textSecondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" sx={{ color: '#800020' }}>
                        {list.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={list.progress}
                      sx={{
                        height: 6, 
                        borderRadius: 3,
                        bgcolor: '#f5f5f5',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: list.progress >= 100 ? '#2e7d32' : list.progress >= 50 ? '#B8860B' : '#800020'
                        }
                      }}
                    />
                  </Box>

                  <Typography variant="caption" color="textSecondary">
                    Uploaded {formatDate(
                      typeof list.createdAt === 'object' && list.createdAt !== null && 'toDate' in list.createdAt 
                        ? (list.createdAt as { toDate: () => Date }).toDate() 
                        : list.createdAt
                    )} • {list.totalEntries} entries
                  </Typography>

                  {/* CAC Document Status for Corporate Lists - Requirement: 7.1, 7.6 */}
                  {list.listType === 'corporate' && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <DocumentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary" fontWeight="medium">
                          CAC Documents
                        </Typography>
                      </Box>
                      {loadingDocumentStatuses ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(() => {
                            const docStatus = documentStatuses.get(list.id);
                            if (!docStatus) {
                              return (
                                <Typography variant="caption" color="textSecondary">
                                  No document status available
                                </Typography>
                              );
                            }
                            return (
                              <>
                                {renderDocumentStatus(
                                  list.id,
                                  CACDocumentType.CERTIFICATE_OF_INCORPORATION,
                                  docStatus.certificateOfIncorporation,
                                  docStatus.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION]
                                )}
                                {renderDocumentStatus(
                                  list.id,
                                  CACDocumentType.PARTICULARS_OF_DIRECTORS,
                                  docStatus.particularsOfDirectors,
                                  docStatus.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS]
                                )}
                                {renderDocumentStatus(
                                  list.id,
                                  CACDocumentType.SHARE_ALLOTMENT,
                                  docStatus.shareAllotment,
                                  docStatus.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT]
                                )}
                              </>
                            );
                          })()}
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Document Preview Dialog - Requirement: 7.5 */}
      <CACDocumentPreview
        open={previewOpen}
        onClose={closePreview}
        document={previewDocument}
        ownerId={previewOwnerId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer List?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the list and all its entries. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
