/**
 * Identity Lists Dashboard
 * 
 * Main admin page for viewing and managing uploaded customer lists.
 * Displays all lists with progress indicators and quick actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { UploadDialog } from '../../components/identity/UploadDialog';
import type { ListSummary } from '../../types/remediation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function IdentityListsDashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Calculate overall stats
  const totalEntries = lists.reduce((sum, list) => sum + list.totalEntries, 0);
  const totalVerified = lists.reduce((sum, list) => sum + list.verifiedCount, 0);
  const totalPending = lists.reduce((sum, list) => sum + list.pendingCount, 0);
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

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleUploadSuccess = (listId: string) => {
    setUploadDialogOpen(false);
    fetchLists();
    // Navigate to the new list
    navigate(`/admin/identity/${listId}`);
  };

  const handleDeleteClick = (listId: string) => {
    setSelectedListId(listId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedListId) return;

    try {
      setDeleting(true);
      const response = await fetch(`${API_BASE_URL}/api/identity/lists/${selectedListId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      setDeleteDialogOpen(false);
      setSelectedListId(null);
      fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    } finally {
      setDeleting(false);
    }
  };

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Lists
              </Typography>
              <Typography variant="h4">{lists.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
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
      ) : lists.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No customer lists yet
          </Typography>
          <Typography color="textSecondary" sx={{ mb: 3 }}>
            Upload a CSV or Excel file to get started
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
          {lists.map((list) => (
            <Grid item xs={12} sm={6} md={4} key={list.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => navigate(`/admin/identity/${list.id}`)}
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
                    Uploaded {formatDate(list.createdAt)} • {list.totalEntries} entries
                  </Typography>
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
