/**
 * Upload Dialog Component
 * 
 * Modal dialog for uploading CSV/Excel files and creating customer lists.
 * Features:
 * - Drag & drop file upload
 * - Preview of first 10 rows
 * - Auto-detection of email column (highlighted)
 * - Manual email column selection if not detected
 * - List name input
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { parseFile, isValidFileType, isFileSizeValid, formatFileSize } from '../../utils/fileParser';
import type { FileParseResult } from '../../types/remediation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

export function UploadDialog({ open, onClose, onSuccess }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [listName, setListName] = useState('');
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setListName('');
    setEmailColumn('');
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    // Validate file type
    if (!isValidFileType(uploadedFile)) {
      setError('Please upload a CSV or Excel (.xlsx) file');
      return;
    }

    // Validate file size
    if (!isFileSizeValid(uploadedFile)) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setParsing(true);

    try {
      const result = await parseFile(uploadedFile);
      setParseResult(result);
      
      // Set default list name from filename
      const nameWithoutExt = uploadedFile.name.replace(/\.(csv|xlsx|xls)$/i, '');
      setListName(nameWithoutExt);

      // Set detected email column or empty for manual selection
      if (result.detectedEmailColumn) {
        setEmailColumn(result.detectedEmailColumn);
      } else {
        setEmailColumn('');
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: loading || parsing,
  });

  const handleSubmit = async () => {
    if (!parseResult || !listName.trim() || !emailColumn) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/identity/lists`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: listName.trim(),
          columns: parseResult.columns,
          emailColumn,
          entries: parseResult.rows,
          originalFileName: file?.name || 'unknown',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create list');
      }

      const data = await response.json();
      onSuccess(data.listId);
      handleClose();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create list');
    } finally {
      setLoading(false);
    }
  };

  // Get preview rows (first 10)
  const previewRows = parseResult?.rows.slice(0, 10) || [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Upload Customer List</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!parseResult ? (
          // File Upload Zone
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            {parsing ? (
              <CircularProgress />
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                </Typography>
                <Typography color="textSecondary">
                  or click to select a CSV or Excel file
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Maximum file size: 10MB
                </Typography>
              </>
            )}
          </Box>
        ) : (
          // Preview and Configuration
          <Box>
            {/* File Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckIcon color="success" />
              <Typography>
                <strong>{file?.name}</strong> ({formatFileSize(file?.size || 0)}) - {parseResult.totalRows} rows
              </Typography>
              <Button size="small" onClick={resetState}>
                Change File
              </Button>
            </Box>

            {/* List Name */}
            <TextField
              label="List Name"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
              helperText="Give this list a descriptive name"
            />

            {/* Email Column Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Email Column *</InputLabel>
              <Select
                value={emailColumn}
                onChange={(e) => setEmailColumn(e.target.value)}
                label="Email Column *"
                required
              >
                {parseResult.columns.map((col) => (
                  <MenuItem key={col} value={col}>
                    {col}
                    {col === parseResult.detectedEmailColumn && (
                      <Chip
                        label="Auto-detected"
                        size="small"
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
              {parseResult.detectedEmailColumn ? (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Email column auto-detected: "{parseResult.detectedEmailColumn}"
                </Typography>
              ) : (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                  No email column detected. Please select the column containing email addresses.
                </Typography>
              )}
            </FormControl>

            {/* Preview Table */}
            <Typography variant="subtitle2" gutterBottom>
              Preview (first {previewRows.length} rows)
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {parseResult.columns.map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          bgcolor: col === emailColumn ? 'success.light' : 'background.paper',
                          fontWeight: 'bold',
                        }}
                      >
                        {col}
                        {col === emailColumn && (
                          <EmailIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row, idx) => (
                    <TableRow key={idx}>
                      {parseResult.columns.map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            bgcolor: col === emailColumn ? 'success.lighter' : 'inherit',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {String(row[col] || '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {parseResult.totalRows > 10 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Showing 10 of {parseResult.totalRows} rows
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!parseResult || !listName.trim() || !emailColumn || loading}
        >
          {loading ? 'Creating...' : 'Create List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
