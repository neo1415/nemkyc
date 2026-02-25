/**
 * Editable Cell Component
 * 
 * Individual table cell that can be clicked and edited inline.
 * Features:
 * - View mode: displays value as text with pointer cursor
 * - Edit mode: displays TextField with auto-focus
 * - Keyboard handling: Enter (save), Escape (cancel)
 * - Click outside: saves changes
 * - Visual indicators for edited/error states
 */

import { useState, useEffect, useRef } from 'react';
import { TableCell, TextField, Box } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon } from '@mui/icons-material';

export interface EditableCellProps {
  rowIndex: number;
  column: string;
  value: any;
  isEditing: boolean;
  isEdited: boolean;
  hasError: boolean;
  isEmailColumn: boolean;
  isNameColumn: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onValueChange: (value: any) => void;
  onRowSave?: () => void; // Optional callback to save the entire row
}

export function EditableCell({
  rowIndex,
  column,
  value,
  isEditing,
  isEdited,
  hasError,
  isEmailColumn,
  isNameColumn,
  onEditStart,
  onEditEnd,
  onValueChange,
  onRowSave,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onValueChange(localValue);
      onEditEnd();
      // Trigger row save to re-validate and update validation state
      if (onRowSave) {
        onRowSave();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(value); // Reset to original
      onEditEnd();
    }
  };

  const handleBlur = () => {
    onValueChange(localValue);
    onEditEnd();
    // Trigger row save to re-validate and update validation state
    if (onRowSave) {
      onRowSave();
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      onEditStart();
    }
  };

  // Determine background color based on state
  const getBgColor = () => {
    if (hasError) return 'error.lighter';
    if (isEdited) return 'success.lighter';
    if (isEmailColumn) return 'success.light';
    if (isNameColumn) return '#f5f9ff';
    return 'inherit';
  };

  // Determine border based on state
  const getBorder = () => {
    if (hasError) return '2px solid';
    if (isEdited) return '2px solid';
    return 'none';
  };

  const getBorderColor = () => {
    if (hasError) return 'error.main';
    if (isEdited) return 'success.main';
    return 'transparent';
  };

  return (
    <TableCell
      sx={{
        bgcolor: getBgColor(),
        cursor: isEditing ? 'text' : 'pointer',
        border: getBorder(),
        borderColor: getBorderColor(),
        position: 'relative',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        '&:hover': {
          bgcolor: isEditing ? getBgColor() : 'action.hover',
        },
      }}
      onClick={handleClick}
    >
      {isEditing ? (
        <TextField
          inputRef={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          size="small"
          fullWidth
          variant="standard"
          sx={{
            '& .MuiInput-root': {
              fontSize: 'inherit',
            },
          }}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {String(value || '')}
          </span>
          {isEdited && (
            <CheckCircleIcon 
              data-testid="CheckCircleIcon"
              sx={{ 
                fontSize: 14, 
                color: 'success.main',
                flexShrink: 0,
              }} 
            />
          )}
          {hasError && (
            <ErrorIcon 
              data-testid="ErrorIcon"
              sx={{ 
                fontSize: 14, 
                color: 'error.main',
                flexShrink: 0,
              }} 
            />
          )}
        </Box>
      )}
    </TableCell>
  );
}
