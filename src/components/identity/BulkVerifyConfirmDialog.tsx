/**
 * Bulk Verify Confirmation Dialog
 * 
 * Displays analysis results before bulk verification and requires user confirmation.
 * Shows:
 * - Total entries to process
 * - Entries to verify vs skip with breakdown
 * - Estimated cost with breakdown by identity type
 * - Identity type distribution
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5
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
  CheckCircle as VerifyIcon,
  Cancel as SkipIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';

export interface BulkVerifyAnalysis {
  analysisId: string | null;
  totalEntries: number;
  toVerify: number;
  toSkip: number;
  skipReasons: Record<string, number>;
  costEstimate: {
    totalCost: number;
    currency: string;
    breakdown: Record<string, number>;
  };
  identityTypeBreakdown: Record<string, number>;
}

interface BulkVerifyConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysis: BulkVerifyAnalysis | null;
  loading: boolean;
}

export default function BulkVerifyConfirmDialog({
  open,
  onClose,
  onConfirm,
  analysis,
  loading,
}: BulkVerifyConfirmDialogProps) {
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  // Format skip reason for display
  const formatSkipReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      already_verified: 'Already Verified',
      invalid_format: 'Invalid Format',
      no_identity_data: 'No Identity Data',
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
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatsIcon sx={{ color: '#800020' }} />
          <Typography variant="h6" component="span">
            Confirm Bulk Verification
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : analysis ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Total Entries */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Entries
              </Typography>
              <Typography variant="h4" sx={{ color: '#800020', fontWeight: 'bold' }}>
                {analysis.totalEntries}
              </Typography>
            </Box>

            <Divider />

            {/* Entries to Verify */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <VerifyIcon sx={{ color: '#2e7d32' }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  To Verify: {analysis.toVerify} entries
                </Typography>
              </Box>

              {analysis.toVerify > 0 && (
                <Box sx={{ pl: 4 }}>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(analysis.identityTypeBreakdown).map(([type, count]) => {
                        if (count > 0) {
                          return (
                            <TableRow key={type}>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                <Chip
                                  label={formatIdentityType(type)}
                                  size="small"
                                  sx={{ minWidth: 60 }}
                                />
                              </TableCell>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>

            {/* Entries to Skip */}
            {analysis.toSkip > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SkipIcon sx={{ color: '#B8860B' }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    To Skip: {analysis.toSkip} entries
                  </Typography>
                </Box>

                <Box sx={{ pl: 4 }}>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(analysis.skipReasons).map(([reason, count]) => {
                        if (count > 0) {
                          return (
                            <TableRow key={reason}>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                {formatSkipReason(reason)}
                              </TableCell>
                              <TableCell sx={{ border: 'none', py: 0.5 }}>
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}

            {/* Warning if no entries to verify */}
            {analysis.toVerify === 0 && (
              <Alert severity="warning">
                No entries to verify. All entries are either already verified, have invalid formats, or lack identity data.
              </Alert>
            )}
          </Box>
        ) : (
          <Alert severity="error">
            Failed to load analysis data. Please try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading || !analysis || analysis.toVerify === 0}
          sx={{
            bgcolor: '#800020',
            '&:hover': {
              bgcolor: '#600018',
            },
          }}
        >
          Confirm & Verify
        </Button>
      </DialogActions>
    </Dialog>
  );
}
