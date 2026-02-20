/**
 * Send Confirmation Dialog
 * 
 * Shows a confirmation dialog before sending verification links.
 * Displays the list of emails that will receive links.
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import type { IdentityEntry, VerificationType } from '../../types/remediation';

interface SendConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entries: IdentityEntry[];
  verificationType: VerificationType;
  loading?: boolean;
}

export function SendConfirmDialog({
  open,
  onClose,
  onConfirm,
  entries,
  verificationType,
  loading = false,
}: SendConfirmDialogProps) {
  // Extract unique emails
  const emails = [...new Set(entries.map((e) => e.email).filter(Boolean))];
  
  // Check for entries without valid emails
  const invalidCount = entries.filter((e) => !e.email || !e.email.includes('@')).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>
        Send Verification Links
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            You are about to send <strong>{verificationType}</strong> verification links to{' '}
            <strong>{entries.length}</strong> selected entries.
          </Typography>
          
          <Chip
            label={verificationType === 'NIN' ? 'NIN Verification' : 'CAC Verification'}
            color={verificationType === 'NIN' ? 'primary' : 'secondary'}
            sx={{ mt: 1 }}
          />
        </Box>

        {invalidCount > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {invalidCount} entries have invalid or missing email addresses and will be skipped.
          </Alert>
        )}

        <Typography variant="subtitle2" gutterBottom>
          Emails that will receive links ({emails.length}):
        </Typography>
        
        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default',
          }}
        >
          <List dense>
            {emails.map((email, idx) => (
              <ListItem key={idx}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <EmailIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText primary={email} />
              </ListItem>
            ))}
          </List>
        </Box>

        {emails.length === 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            No valid email addresses found in selected entries.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={loading || emails.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Sending...' : `Send ${emails.length} Links`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
