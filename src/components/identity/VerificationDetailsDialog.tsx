/**
 * Verification Details Dialog Component
 * 
 * Shows comprehensive verification results for an identity entry.
 * Displays:
 * - Full verification results
 * - API response data (sanitized)
 * - Field-by-field comparison
 * - Timestamps and attempt count
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Replay as RetryIcon,
} from '@mui/icons-material';
import type { IdentityEntry } from '../../types/remediation';
import { formatDateTime } from '../../utils/dateFormatter';

interface VerificationDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  entry: IdentityEntry | null;
  onRetry?: (entry: IdentityEntry) => void;
}

export const VerificationDetailsDialog: React.FC<VerificationDetailsDialogProps> = ({
  open,
  onClose,
  entry,
  onRetry,
}) => {
  if (!entry) return null;

  const isVerified = entry.status === 'verified';
  const isFailed = entry.status === 'verification_failed';
  const details = entry.verificationDetails;

  // Get status color
  const getStatusColor = () => {
    if (isVerified) return 'success';
    if (isFailed) return 'error';
    return 'warning';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isVerified) return <CheckIcon sx={{ color: '#2e7d32' }} />;
    if (isFailed) return <ErrorIcon sx={{ color: '#d32f2f' }} />;
    return <InfoIcon sx={{ color: '#B8860B' }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        {getStatusIcon()}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">Verification Details</Typography>
          <Typography variant="caption" color="textSecondary">
            Entry ID: {entry.id}
          </Typography>
        </Box>
        <Chip 
          label={entry.status.replace(/_/g, ' ').toUpperCase()} 
          color={getStatusColor()}
          size="small"
        />
      </DialogTitle>

      <DialogContent dividers>
        {/* Customer Information Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon fontSize="small" />
            Customer Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            {entry.displayName && (
              <Box>
                <Typography variant="caption" color="textSecondary">Name</Typography>
                <Typography variant="body2" fontWeight="medium">{entry.displayName}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="textSecondary">Email</Typography>
              <Typography variant="body2" fontWeight="medium">{entry.email}</Typography>
            </Box>
            {entry.policyNumber && (
              <Box>
                <Typography variant="caption" color="textSecondary">Policy Number</Typography>
                <Typography variant="body2" fontWeight="medium">{entry.policyNumber}</Typography>
              </Box>
            )}
            {entry.verificationType && (
              <Box>
                <Typography variant="caption" color="textSecondary">Verification Type</Typography>
                <Typography variant="body2" fontWeight="medium">{entry.verificationType}</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Verification Result Section */}
        {isVerified && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ✓ Verification Successful
            </Typography>
            <Typography variant="body2">
              All identity fields were successfully validated against the official records.
            </Typography>
          </Alert>
        )}

        {isFailed && details?.failureReason && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ✗ Verification Failed
            </Typography>
            <Typography variant="body2">
              {details.failureReason}
            </Typography>
          </Alert>
        )}

        {/* Field Validation Details */}
        {details && (details.fieldsValidated || details.failedFields) && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Field Validation Results
            </Typography>
            
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Field</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {details.fieldsValidated?.map((field, idx) => {
                    const failed = details.failedFields?.includes(field);
                    return (
                      <TableRow key={idx}>
                        <TableCell>{field}</TableCell>
                        <TableCell>
                          {failed ? (
                            <Chip 
                              label="Mismatch" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                              icon={<ErrorIcon />}
                            />
                          ) : (
                            <Chip 
                              label="Matched" 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              icon={<CheckIcon />}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {details.failedFields && details.failedFields.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> The fields marked as "Mismatch" did not match the official records. 
                  Please verify the customer information is accurate.
                </Typography>
              </Alert>
            )}
          </Paper>
        )}

        {/* Verification Attempts Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Attempt Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="caption" color="textSecondary">Total Attempts</Typography>
              <Typography variant="body2" fontWeight="medium">
                {entry.verificationAttempts || 0}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary">Resend Count</Typography>
              <Typography variant="body2" fontWeight="medium">
                {entry.resendCount || 0}
              </Typography>
            </Box>
            {entry.linkSentAt && (
              <Box>
                <Typography variant="caption" color="textSecondary">Link Sent At</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(entry.linkSentAt)}
                </Typography>
              </Box>
            )}
            {entry.lastAttemptAt && (
              <Box>
                <Typography variant="caption" color="textSecondary">Last Attempt</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(entry.lastAttemptAt)}
                </Typography>
              </Box>
            )}
            {entry.verifiedAt && (
              <Box>
                <Typography variant="caption" color="textSecondary">Verified At</Typography>
                <Typography variant="body2" fontWeight="medium" color="success.main">
                  {formatDateTime(entry.verifiedAt)}
                </Typography>
              </Box>
            )}
          </Box>

          {entry.lastAttemptError && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="textSecondary">Last Error Message</Typography>
              <Alert severity="error" sx={{ mt: 0.5 }}>
                <Typography variant="body2">
                  {entry.lastAttemptError}
                </Typography>
              </Alert>
            </Box>
          )}
        </Paper>

        {/* Identity Numbers Section */}
        {(entry.nin || entry.cac || entry.bvn) && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Identity Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              {entry.nin && (
                <Box>
                  <Typography variant="caption" color="textSecondary">NIN</Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                    {entry.nin.substring(0, 4)}****{entry.nin.substring(entry.nin.length - 3)}
                  </Typography>
                </Box>
              )}
              {entry.bvn && (
                <Box>
                  <Typography variant="caption" color="textSecondary">BVN</Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                    {entry.bvn.substring(0, 4)}****{entry.bvn.substring(entry.bvn.length - 3)}
                  </Typography>
                </Box>
              )}
              {entry.cac && (
                <Box>
                  <Typography variant="caption" color="textSecondary">CAC</Typography>
                  <Typography variant="body2" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                    {entry.cac}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Recommended Actions */}
        {isFailed && (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Recommended Next Steps
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Verify that the customer information in your records is accurate</li>
                <li>Contact the customer to confirm their identity details</li>
                <li>If the information is correct, you may retry the verification</li>
                <li>Consider reaching out to compliance for assistance if the issue persists</li>
              </ul>
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
        {isFailed && onRetry && (
          <Button
            variant="contained"
            startIcon={<RetryIcon />}
            onClick={() => {
              onRetry(entry);
              onClose();
            }}
            sx={{ 
              bgcolor: '#800020', 
              '&:hover': { bgcolor: '#600018' },
              color: 'white'
            }}
          >
            Retry Verification
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
