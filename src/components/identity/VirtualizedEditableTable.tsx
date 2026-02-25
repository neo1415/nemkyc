/**
 * Virtualized Editable Preview Table Component
 * 
 * Performance-optimized version of EditablePreviewTable using react-window.
 * Only renders visible rows for better performance with large datasets (100+ rows).
 * 
 * Features:
 * - Virtual scrolling with FixedSizeList
 * - Sticky header
 * - Same editing capabilities as EditablePreviewTable
 * - Optimized for files with 100+ rows
 */

import { useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Table,
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
import type { EditState, ValidationState, EditingCell } from '../../types/editablePreview';
import type { NameColumns } from '../../types/remediation';

export interface VirtualizedEditableTableProps {
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

export function VirtualizedEditableTable({
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
}: VirtualizedEditableTableProps) {
  const listRef = useRef<List>(null);

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

  // Row renderer for react-window
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowIndex = index;
    
    return (
      <div style={style}>
        <TableRow
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
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
            <TableCell sx={{ width: 100, flex: '0 0 100px' }} />
          )}
        </TableRow>
      </div>
    );
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Preview ({rows.length} rows) - Virtualized
      </Typography>
      <TableContainer 
        component={Paper} 
        sx={{ 
          height: 400,
          pointerEvents: 'auto',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ display: 'flex' }}>
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
                    flex: '1 1 150px',
                    minWidth: 150,
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
                  flex: '0 0 100px',
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
        <List
          ref={listRef}
          height={350}
          itemCount={rows.length}
          itemSize={53}
          width="100%"
        >
          {Row}
        </List>
      </TableContainer>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Click on any cell to edit. Press Enter to save or Escape to cancel.
      </Typography>
    </Box>
  );
}
