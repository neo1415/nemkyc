/**
 * Editable Preview Table Component
 * 
 * Replaces the read-only preview table with an editable version.
 * Features:
 * - Renders table with sticky header
 * - Maps over rows and columns to create EditableCell instances
 * - Passes cell-specific props (isEdited, hasError, isEmailColumn, isNameColumn)
 * - Conditionally renders RowActions for rows with pending edits
 * - Displays row count indicator
 * - Implements scrollable container with max height
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { Email as EmailIcon, Person as PersonIcon } from '@mui/icons-material';
import { EditableCell } from './EditableCell';
import { RowActions } from './RowActions';
import { VirtualizedEditableTable } from './VirtualizedEditableTable';
import type { EditState, ValidationState, EditingCell } from '../../types/editablePreview';
import type { NameColumns } from '../../types/remediation';

// Threshold for switching to virtualized rendering
const VIRTUALIZATION_THRESHOLD = 100;

export interface EditablePreviewTableProps {
  columns: string[];
  rows: Record<string, any>[];
  emailColumn: string;
  nameColumns?: NameColumns;
  editState: EditState;
  validationState: ValidationState;
  editingCell: EditingCell | null;
  onCellEdit: (rowIndex: number, column: string, value: any) => void;
  onRowSave: (rowIndex: number) => void;
  onRowCancel: (rowIndex: number) => void;
  onCellEditStart: (rowIndex: number, column: string) => void;
  onCellEditEnd: () => void;
}

export function EditablePreviewTable({
  columns,
  rows,
  emailColumn,
  nameColumns,
  editState,
  validationState,
  editingCell,
  onCellEdit,
  onRowSave,
  onRowCancel,
  onCellEditStart,
  onCellEditEnd,
}: EditablePreviewTableProps) {
  // Use virtualized table for large datasets
  if (rows.length >= VIRTUALIZATION_THRESHOLD) {
    return (
      <VirtualizedEditableTable
        columns={columns}
        rows={rows}
        emailColumn={emailColumn}
        nameColumns={nameColumns}
        editState={editState}
        validationState={validationState}
        editingCell={editingCell}
        onCellEdit={onCellEdit}
        onRowSave={onRowSave}
        onRowCancel={onRowCancel}
        onCellEditStart={onCellEditStart}
        onCellEditEnd={onCellEditEnd}
      />
    );
  }

  // Helper to check if a column is a detected name column
  const isNameColumn = (col: string): boolean => {
    if (!nameColumns) return false;
    return (
      col === nameColumns.firstName ||
      col === nameColumns.middleName ||
      col === nameColumns.lastName ||
      col === nameColumns.fullName ||
      col === nameColumns.insured ||
      col === nameColumns.companyName
    );
  };

  // Helper to check if a cell has been edited
  const isCellEdited = (rowIndex: number, column: string): boolean => {
    const rowEdits = editState.get(rowIndex);
    return rowEdits !== undefined && rowEdits.has(column);
  };

  // Helper to check if a cell has validation errors
  const cellHasError = (rowIndex: number, column: string): boolean => {
    const rowErrors = validationState.get(rowIndex);
    if (!rowErrors) return false;
    return rowErrors.some((error) => error.column === column);
  };

  // Helper to check if a row has pending edits
  const hasRowEdits = (rowIndex: number): boolean => {
    const rowEdits = editState.get(rowIndex);
    return rowEdits !== undefined && rowEdits.size > 0;
  };

  // Helper to get cell value (edited or original)
  const getCellValue = (rowIndex: number, column: string): any => {
    const rowEdits = editState.get(rowIndex);
    if (rowEdits && rowEdits.has(column)) {
      return rowEdits.get(column);
    }
    return rows[rowIndex][column];
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Preview ({rows.length} rows)
      </Typography>
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 400, 
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    bgcolor:
                      col === emailColumn
                        ? 'success.light'
                        : isNameColumn(col)
                        ? '#e3f2fd'
                        : 'background.paper',
                    fontWeight: 'bold',
                  }}
                >
                  {col}
                  {col === emailColumn && (
                    <EmailIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                  )}
                  {isNameColumn(col) && (
                    <PersonIcon
                      sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle', color: '#1976d2' }}
                    />
                  )}
                </TableCell>
              ))}
              <TableCell
                sx={{
                  bgcolor: 'background.paper',
                  fontWeight: 'bold',
                  width: 100,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <EditableCell
                    key={col}
                    rowIndex={rowIndex}
                    column={col}
                    value={getCellValue(rowIndex, col)}
                    isEditing={
                      editingCell !== null &&
                      editingCell.rowIndex === rowIndex &&
                      editingCell.column === col
                    }
                    isEdited={isCellEdited(rowIndex, col)}
                    hasError={cellHasError(rowIndex, col)}
                    isEmailColumn={col === emailColumn}
                    isNameColumn={isNameColumn(col)}
                    onEditStart={() => onCellEditStart(rowIndex, col)}
                    onEditEnd={onCellEditEnd}
                    onValueChange={(value) => onCellEdit(rowIndex, col, value)}
                    onRowSave={() => onRowSave(rowIndex)}
                  />
                ))}
                {hasRowEdits(rowIndex) ? (
                  <RowActions
                    rowIndex={rowIndex}
                    onSave={() => onRowSave(rowIndex)}
                    onCancel={() => onRowCancel(rowIndex)}
                  />
                ) : (
                  <TableCell sx={{ width: 100 }} />
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Click any cell to edit. Press Enter to save changes or Escape to cancel. Changes are validated automatically.
      </Typography>
    </Box>
  );
}
