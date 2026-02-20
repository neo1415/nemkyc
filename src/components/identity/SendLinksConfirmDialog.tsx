/**
 * Send Links Confirmation Dialog
 * 
 * Displays analysis results before sending verification links and requires user confirmation.
 * Shows:
 * - Total entries to process
 * - Entries to send vs skip with breakdown
 * - Identity type distribution
 * 
 * Requirements: 2.1
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  CheckCircle as SendIcon,
  Cancel as SkipIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';

export interface SendLinksAnalysis {
  analysisId: string | null;
  totalEntries: number;
  toSend: number;
  toSkip: number;
  skipReasons: Record<string, number>;
  identityTypeBreakdown: Record<string, number>;
}

interface SendLinksConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysis: SendLinksAnalysis | null;
  loading: boolean;
  sending?: boolean; // New prop for sending state
  verificationType: string;
}

export default function SendLinksConfirmDialog({
  open,
  onClose,
  onConfirm,
  analysis,
  loading,
  sending = false, // Default to false
  verificationType,
}: SendLinksConfirmDialogProps) {
  // Format skip reason for display
  const formatSkipReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      already_verified: 'Already Verified',
      invalid_format: 'Invalid Format',
      no_identity_data: 'No Identity Data',
      invalid_email: 'Invalid Email',
    };
    return reasonMap[reason] || reason;
  };

  // Format identity type for display
  const formatIdentityType = (type: string): string => {
    return type.toUpperCase();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, bgcolor: '#800020', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon sx={{ color: 'white' }} />
          <Typography variant="h6" component="span" sx={{ color: 'white' }}>
            Confirm Send Verification Links
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" ml={2}>
              Analyzing entries...
            </Typography>
          </Box>
        ) : analysis ? (
          <Box>
            {/* Summary Alert */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Ready to send {verificationType} verification links to {analysis.toSend} {analysis.toSend === 1 ? 'entry' : 'entries'}.
                {analysis.toSkip > 0 && ` ${analysis.toSkip} ${analysis.toSkip === 1 ? 'entry' : 'entries'} will be skipped.`}
              </Typography>
            </Alert>

            {/* Total Entries */}
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Entries
              </Typography>
              <Typography variant="h4" color="primary">
                {analysis.totalEntries}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* To Send */}
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SendIcon color="success" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  To Send: {analysis.toSend} {analysis.toSend === 1 ? 'entry' : 'entries'}
                </Typography>
              </Box>

              {analysis.toSend > 0 && (
                <Box ml={4}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Identity Type Distribution:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {Object.entries(analysis.identityTypeBreakdown).map(([type, count]) => (
                      count > 0 && (
                        <Chip
                          key={type}
                          label={`${formatIdentityType(type)}: ${count}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* To Skip */}
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SkipIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  To Skip: {analysis.toSkip} {analysis.toSkip === 1 ? 'entry' : 'entries'}
                </Typography>
              </Box>

              {analysis.toSkip > 0 && (
                <Box ml={4}>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(analysis.skipReasons).map(([reason, count]) => (
                        count > 0 && (
                          <TableRow key={reason}>
                            <TableCell sx={{ border: 0, py: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {formatSkipReason(reason)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ border: 0, py: 0.5 }}>
                              <Chip label={count} size="small" />
                            </TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>

            {/* Warning for duplicates */}
            {analysis.skipReasons.already_verified > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {analysis.skipReasons.already_verified} {analysis.skipReasons.already_verified === 1 ? 'entry has' : 'entries have'} already been verified in other lists and will be skipped to avoid duplicate verifications.
                </Typography>
              </Alert>
            )}
          </Box>
        ) : (
          <Alert severity="error">
            No analysis data available. Please try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading || sending}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading || sending || !analysis || analysis.toSend === 0}
          startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : analysis && analysis.toSend === 0 ? 'Nothing to Send' : 'Confirm & Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
