/**
 * Row Actions Component
 * 
 * Save and cancel buttons for edited rows.
 * Features:
 * - Displays as an additional column at the end of the row
 * - Shows two icon buttons: Save (check icon) and Cancel (X icon)
 * - Only visible for rows with pending edits
 * - Compact design to minimize space usage
 */

import { TableCell, IconButton, Tooltip } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';

export interface RowActionsProps {
  rowIndex: number;
  onSave: () => void;
  onCancel: () => void;
}

export function RowActions({ rowIndex, onSave, onCancel }: RowActionsProps) {
  return (
    <TableCell 
      sx={{ 
        width: 100, 
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <Tooltip title="Save changes">
        <IconButton
          size="small"
          color="success"
          onClick={onSave}
          aria-label={`Save changes for row ${rowIndex + 1}`}
          sx={{
            '&:hover': {
              bgcolor: 'success.lighter',
            },
          }}
        >
          <CheckIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancel changes">
        <IconButton
          size="small"
          color="error"
          onClick={onCancel}
          aria-label={`Cancel changes for row ${rowIndex + 1}`}
          sx={{
            ml: 0.5,
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
    </TableCell>
  );
}
