import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import type { RemediationRecord } from '@/types/remediation';

interface RecordReviewDialogProps {
  record: RemediationRecord | null;
  open: boolean;
  onClose: () => void;
  onApprove: (comment: string) => void;
  onReject: (comment: string) => void;
}

/**
 * Dialog for reviewing flagged remediation records that need manual approval.
 * Displays submitted vs existing data side-by-side with name match score visualization.
 * Requirements: 5.4, 5.5
 */
const RecordReviewDialog: React.FC<RecordReviewDialogProps> = ({
  record,
  open,
  onClose,
  onApprove,
  onReject,
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(comment);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(comment);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the verified name from the verification response
  const getVerifiedName = (): string => {
    if (!record?.verificationResponse) return 'N/A';
    const response = record.verificationResponse as Record<string, unknown>;
    
    // Try different possible field names for the verified name
    if (typeof response.name === 'string') return response.name;
    if (typeof response.fullName === 'string') return response.fullName;
    if (typeof response.first_name === 'string' && typeof response.last_name === 'string') {
      return `${response.first_name} ${response.last_name}`;
    }
    if (typeof response.firstName === 'string' && typeof response.lastName === 'string') {
      return `${response.firstName} ${response.lastName}`;
    }
    
    return 'N/A';
  };

  // Get match score color based on threshold
  const getMatchScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  // Get match score text color
  const getMatchScoreTextColor = (score: number): string => {
    if (score >= 80) return '#2e7d32'; // green
    if (score >= 60) return '#ed6c02'; // orange
    return '#d32f2f'; // red
  };

  if (!record) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Review Record</Typography>
          <Chip
            label={record.status?.replace(/_/g, ' ') || 'review required'}
            color="warning"
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Customer Information Section */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Customer Information
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: 2,
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1
            }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography fontWeight="medium">{record.customerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography fontWeight="medium">{record.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Policy Number
                </Typography>
                <Typography fontWeight="medium">{record.policyNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Broker
                </Typography>
                <Typography fontWeight="medium">{record.brokerName}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Identity Type
                </Typography>
                <Chip 
                  label={record.identityType} 
                  size="small" 
                  color={record.identityType === 'corporate' ? 'primary' : 'default'}
                />
              </Box>
              {record.submittedIdentityNumber && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Submitted {record.identityType === 'corporate' ? 'CAC Number' : 'NIN/BVN'}
                  </Typography>
                  <Typography fontWeight="medium">{record.submittedIdentityNumber}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Name Comparison Section - Side by Side */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Name Comparison
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
              gap: 2 
            }}>
              {/* Existing Name */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Existing Name (from upload)
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {record.existingName || record.customerName}
                </Typography>
              </Box>
              
              {/* Verified Name */}
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.light', 
                borderRadius: 1,
                color: 'primary.contrastText',
                border: '1px solid',
                borderColor: 'primary.main'
              }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, opacity: 0.9 }}>
                  Verified Name (from ID verification)
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {getVerifiedName()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Match Score Visualization */}
          {record.nameMatchScore !== undefined && record.nameMatchScore !== null && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Name Match Score
              </Typography>
              
              {/* Score Display */}
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 'bold',
                  color: getMatchScoreTextColor(record.nameMatchScore),
                  mb: 1
                }}
              >
                {record.nameMatchScore}%
              </Typography>
              
              {/* Progress Bar */}
              <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={record.nameMatchScore}
                  color={getMatchScoreColor(record.nameMatchScore)}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: 'grey.200'
                  }}
                />
              </Box>
              
              {/* Threshold Indicator */}
              <Typography variant="body2" color="text.secondary">
                {record.nameMatchScore >= 80 
                  ? '✓ Above 80% threshold - Auto-approval eligible'
                  : record.nameMatchScore >= 60
                  ? '⚠ Between 60-80% - Manual review recommended'
                  : '✗ Below 60% - Significant mismatch detected'}
              </Typography>
            </Box>
          )}

          <Divider />

          {/* Review Comment */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Review Comment
            </Typography>
            <TextField
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Add a comment explaining your decision (optional)..."
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper'
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<Cancel />}
          onClick={handleReject}
          disabled={isSubmitting}
        >
          Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
          onClick={handleApprove}
          disabled={isSubmitting}
        >
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordReviewDialog;
