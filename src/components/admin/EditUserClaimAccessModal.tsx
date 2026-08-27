import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { toast } from 'sonner';
import { ClaimAccessSelector } from './ClaimAccessSelector';
import { updateUserClaimAccess } from '../../services/userManagementService';

interface EditUserClaimAccessModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    assignedClaimCollections?: string[] | null;
    claimAccessAll?: boolean;
  } | null;
}

export function EditUserClaimAccessModal({
  open,
  onClose,
  onSuccess,
  user
}: EditUserClaimAccessModalProps) {
  const [claimAccessAll, setClaimAccessAll] = useState(true);
  const [assignedClaimCollections, setAssignedClaimCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !user) return;

    const hasScopedAccess = Array.isArray(user.assignedClaimCollections) && user.assignedClaimCollections.length > 0;
    setClaimAccessAll(user.claimAccessAll === true || !hasScopedAccess);
    setAssignedClaimCollections(user.assignedClaimCollections || []);
    setError(undefined);
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;

    if (!claimAccessAll && assignedClaimCollections.length === 0) {
      setError('Select at least one claim type or enable full claim access.');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const response = await updateUserClaimAccess(user.id, {
        claimAccessAll,
        assignedClaimCollections
      });

      if (!response.success) {
        setError(response.error || 'Failed to update claim access');
        return;
      }

      toast.success(`Claim access updated for ${user.name}`);
      onSuccess();
      onClose();
    } catch (submitError) {
      console.error('Error updating claim access:', submitError);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>
        Edit Claim Access
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {user && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure which claim types <strong>{user.name}</strong> ({user.email}) can access in the admin dashboard.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <ClaimAccessSelector
              claimAccessAll={claimAccessAll}
              assignedClaimCollections={assignedClaimCollections}
              onClaimAccessAllChange={setClaimAccessAll}
              onAssignedCollectionsChange={setAssignedClaimCollections}
              disabled={loading}
              error={error}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ bgcolor: '#800020', '&:hover': { bgcolor: '#600018' } }}
        >
          {loading ? 'Saving...' : 'Save Claim Access'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditUserClaimAccessModal;
