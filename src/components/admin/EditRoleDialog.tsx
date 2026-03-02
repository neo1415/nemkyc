/**
 * Edit Role Dialog Component
 * 
 * Dialog for changing user roles.
 * Displays current role and allows selection of new role.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { toast } from 'sonner';
import { updateUserRole, type User, type UserRole } from '../../services/userManagementService';

interface EditRoleDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSuccess: () => void;
}

const AVAILABLE_ROLES: UserRole[] = [
  'default',
  'broker',
  'admin',
  'compliance',
  'claims',
  'super admin',
];

export function EditRoleDialog({ open, onClose, user, onSuccess }: EditRoleDialogProps) {
  const [newRole, setNewRole] = useState<UserRole>(user.role as UserRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens with new user
  useEffect(() => {
    if (open) {
      setNewRole(user.role as UserRole);
      setError(null);
    }
  }, [open, user]);

  // Handle role change
  const handleSubmit = async () => {
    // Check if role actually changed
    if (newRole === user.role) {
      toast.info('No changes made');
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await updateUserRole(user.uid, newRole);

      if (response.success) {
        toast.success(`Role updated to ${newRole}`);
        onSuccess();
        onClose();
      } else {
        setError(response.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>
        Edit User Role
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {/* User Info */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              User
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>

          {/* Current Role */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Role
            </Typography>
            <Chip
              label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              color="primary"
              variant="outlined"
            />
          </Box>

          {/* New Role Selection */}
          <TextField
            select
            label="New Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            fullWidth
            required
            disabled={loading}
          >
            {AVAILABLE_ROLES.map((roleOption) => (
              <MenuItem key={roleOption} value={roleOption}>
                {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          {/* Warning Message */}
          {newRole !== user.role && (
            <Alert severity="warning">
              Changing the user's role will affect their access permissions immediately.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || newRole === user.role}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{
            bgcolor: '#800020',
            '&:hover': {
              bgcolor: '#600018',
            },
          }}
        >
          {loading ? 'Updating...' : 'Update Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditRoleDialog;
