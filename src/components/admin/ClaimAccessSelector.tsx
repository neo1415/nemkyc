import React from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  Divider
} from '@mui/material';
import {
  CLAIM_UNIT_GROUPS,
  getClaimTypeLabel
} from '../../config/claimAccessPolicy';

export interface ClaimAccessSelectorProps {
  claimAccessAll: boolean;
  assignedClaimCollections: string[];
  onClaimAccessAllChange: (value: boolean) => void;
  onAssignedCollectionsChange: (collections: string[]) => void;
  disabled?: boolean;
  error?: string;
}

export function ClaimAccessSelector({
  claimAccessAll,
  assignedClaimCollections,
  onClaimAccessAllChange,
  onAssignedCollectionsChange,
  disabled = false,
  error
}: ClaimAccessSelectorProps) {
  const toggleCollection = (collection: string, checked: boolean) => {
    if (checked) {
      onAssignedCollectionsChange([...new Set([...assignedClaimCollections, collection])]);
      return;
    }

    onAssignedCollectionsChange(assignedClaimCollections.filter((item) => item !== collection));
  };

  const toggleUnit = (collections: string[], checked: boolean) => {
    if (checked) {
      onAssignedCollectionsChange([...new Set([...assignedClaimCollections, ...collections])]);
      return;
    }

    onAssignedCollectionsChange(
      assignedClaimCollections.filter((collection) => !collections.includes(collection))
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={claimAccessAll}
            onChange={(event) => onClaimAccessAllChange(event.target.checked)}
            disabled={disabled}
          />
        }
        label="Full access to all claim types"
      />

      {!claimAccessAll && (
        <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 2, maxHeight: 320, overflowY: 'auto' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#800020', fontWeight: 700 }}>
            Assign specific claim types
          </Typography>

          {CLAIM_UNIT_GROUPS.map((group, index) => {
            const allSelected = group.collections.every((collection) =>
              assignedClaimCollections.includes(collection)
            );
            const someSelected = group.collections.some((collection) =>
              assignedClaimCollections.includes(collection)
            );

            return (
              <Box key={group.id} sx={{ mb: index === CLAIM_UNIT_GROUPS.length - 1 ? 0 : 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allSelected}
                      indeterminate={!allSelected && someSelected}
                      onChange={(event) => toggleUnit([...group.collections], event.target.checked)}
                      disabled={disabled}
                    />
                  }
                  label={<Typography sx={{ fontWeight: 600 }}>{group.label}</Typography>}
                />

                <FormGroup sx={{ pl: 3 }}>
                  {group.collections.map((collection) => (
                    <FormControlLabel
                      key={collection}
                      control={
                        <Checkbox
                          checked={assignedClaimCollections.includes(collection)}
                          onChange={(event) => toggleCollection(collection, event.target.checked)}
                          disabled={disabled}
                        />
                      }
                      label={getClaimTypeLabel(collection)}
                    />
                  ))}
                </FormGroup>

                {index < CLAIM_UNIT_GROUPS.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            );
          })}
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default ClaimAccessSelector;
