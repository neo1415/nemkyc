/**
 * Validation Error Display Component
 * 
 * Displays validation errors in the UploadDialog with error summary,
 * detailed error table, and download error report button.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1
 */

import {
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import type { ValidationResult } from '../../utils/validation/identityValidation';

interface ValidationErrorDisplayProps {
  validationResult: ValidationResult;
}

export function ValidationErrorDisplay({
  validationResult,
}: ValidationErrorDisplayProps) {
  const { errors, errorSummary } = validationResult;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        ⚠️ Validation Failed
      </Typography>

      <Typography variant="body2" sx={{ mb: 2 }}>
        Found {errorSummary.totalErrors} validation error
        {errorSummary.totalErrors !== 1 ? 's' : ''} in {errorSummary.affectedRows} row
        {errorSummary.affectedRows !== 1 ? 's' : ''}. Fix errors directly in the table below.
      </Typography>

      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Error Details:
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Row</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Error</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((error, idx) => (
              <TableRow key={idx}>
                <TableCell>{error.rowNumber}</TableCell>
                <TableCell>{error.column}</TableCell>
                <TableCell>{error.message}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>
                  {String(error.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Click on any cell in the table below to edit and fix errors.
      </Typography>
    </Alert>
  );
}
