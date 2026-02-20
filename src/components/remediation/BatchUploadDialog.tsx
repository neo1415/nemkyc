import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { CloudUpload, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { ParsedUploadRow, IdentityType } from '@/types/remediation';
import { formatDate } from '../../utils/dateFormatter';

interface BatchUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (batchId: string) => void;
}

const REQUIRED_COLUMNS = [
  'customerName',
  'email',
  'policyNumber',
  'brokerName',
  'identityType',
];

const COLUMN_MAPPINGS: Record<string, string[]> = {
  customerName: ['customer name', 'customername', 'name', 'customer_name', 'full name', 'fullname'],
  email: ['email', 'email address', 'emailaddress', 'e-mail'],
  phone: ['phone', 'phone number', 'phonenumber', 'telephone', 'mobile', 'phone_number'],
  policyNumber: ['policy number', 'policynumber', 'policy_number', 'policy no', 'policy'],
  brokerName: ['broker name', 'brokername', 'broker_name', 'broker', 'agent name'],
  identityType: ['identity type', 'identitytype', 'identity_type', 'type', 'customer type'],
  existingName: ['existing name', 'existingname', 'existing_name', 'registered name'],
  existingDob: ['existing dob', 'existingdob', 'existing_dob', 'date of birth', 'dob'],
};

const steps = ['Upload File', 'Review Data', 'Configure Batch'];

const BatchUploadDialog: React.FC<BatchUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUploadRow[]>([]);
  const [validRows, setValidRows] = useState<ParsedUploadRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<ParsedUploadRow[]>([]);
  const [batchName, setBatchName] = useState('');
  const [description, setDescription] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const resetState = () => {
    setActiveStep(0);
    setFile(null);
    setParsedRows([]);
    setValidRows([]);
    setInvalidRows([]);
    setBatchName('');
    setDescription('');
    setExpirationDays(7);
    setError(null);
    setColumnMapping({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const normalizeColumnName = (name: string): string => {
    return name.toLowerCase().trim().replace(/[_\s]+/g, ' ');
  };

  const findColumnMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    
    headers.forEach((header) => {
      const normalizedHeader = normalizeColumnName(header);
      
      for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
        if (aliases.includes(normalizedHeader) || normalizedHeader === field.toLowerCase()) {
          mapping[field] = header;
          break;
        }
      }
    });
    
    return mapping;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdentityType = (type: string): type is IdentityType => {
    const normalized = type?.toLowerCase().trim();
    return normalized === 'individual' || normalized === 'corporate';
  };

  const normalizeIdentityType = (type: string): IdentityType => {
    const normalized = type?.toLowerCase().trim();
    if (normalized === 'corporate' || normalized === 'company' || normalized === 'business') {
      return 'corporate';
    }
    return 'individual';
  };

  const validateRow = (row: Record<string, any>, mapping: Record<string, string>, rowNumber: number): ParsedUploadRow => {
    const errors: string[] = [];
    
    const customerName = row[mapping.customerName]?.toString().trim() || '';
    const email = row[mapping.email]?.toString().trim() || '';
    const phone = row[mapping.phone]?.toString().trim() || '';
    const policyNumber = row[mapping.policyNumber]?.toString().trim() || '';
    const brokerName = row[mapping.brokerName]?.toString().trim() || '';
    const identityTypeRaw = row[mapping.identityType]?.toString().trim() || 'individual';
    const existingName = row[mapping.existingName]?.toString().trim() || '';
    const existingDob = row[mapping.existingDob]?.toString().trim() || '';

    // Validate required fields
    if (!customerName) errors.push('Customer name is required');
    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Invalid email format');
    if (!policyNumber) errors.push('Policy number is required');
    if (!brokerName) errors.push('Broker name is required');
    
    const identityType = normalizeIdentityType(identityTypeRaw);

    return {
      customerName,
      email,
      phone: phone || undefined,
      policyNumber,
      brokerName,
      identityType,
      existingName: existingName || undefined,
      existingDob: existingDob || undefined,
      isValid: errors.length === 0,
      errors,
      rowNumber,
    };
  };

  const parseFile = async (file: File): Promise<Record<string, any>[]> => {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            resolve(results.data as Record<string, any>[]);
          },
          error: (error) => {
            reject(new Error(`CSV parsing error: ${error.message}`));
          },
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            resolve(jsonData as Record<string, any>[]);
          } catch (err) {
            reject(new Error('Failed to parse Excel file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please upload CSV or Excel file.'));
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    setLoading(true);
    setError(null);

    try {
      const data = await parseFile(uploadedFile);
      
      if (data.length === 0) {
        throw new Error('The uploaded file contains no data');
      }

      // Get headers and find column mapping
      const headers = Object.keys(data[0]);
      const mapping = findColumnMapping(headers);
      setColumnMapping(mapping);

      // Check for missing required columns
      const missingColumns = REQUIRED_COLUMNS.filter(
        (col) => !mapping[col]
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(', ')}. ` +
          `Found columns: ${headers.join(', ')}`
        );
      }

      // Validate each row
      const validated = data.map((row, index) => 
        validateRow(row, mapping, index + 2) // +2 for 1-based index and header row
      );

      setParsedRows(validated);
      setValidRows(validated.filter((r) => r.isValid));
      setInvalidRows(validated.filter((r) => !r.isValid));
      
      // Auto-generate batch name from file name
      const baseName = uploadedFile.name.replace(/\.[^/.]+$/, '');
      setBatchName(`${baseName} - ${formatDate(new Date())}`);
      
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
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
    disabled: loading,
  });

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      setError('No valid rows to submit');
      return;
    }

    if (!batchName.trim()) {
      setError('Batch name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/remediation/batches`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: batchName.trim(),
          description: description.trim() || undefined,
          expirationDays,
          records: validRows.map(({ isValid, errors, rowNumber, ...record }) => record),
          originalFileName: file?.name || 'unknown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create batch');
      }

      const result = await response.json();
      onSuccess(result.batchId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.400',
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
              <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag & drop a file here, or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Required columns:
              </Typography>
              <Typography variant="body2">
                Customer Name, Email, Policy Number, Broker Name, Identity Type
                (individual/corporate)
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Optional columns: Phone, Existing Name, Existing DOB
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Summary */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                icon={<CheckCircle />}
                label={`${validRows.length} Valid Rows`}
                color="success"
                variant="outlined"
              />
              {invalidRows.length > 0 && (
                <Chip
                  icon={<ErrorIcon />}
                  label={`${invalidRows.length} Invalid Rows`}
                  color="error"
                  variant="outlined"
                />
              )}
            </Box>

            {/* Invalid Rows Warning */}
            {invalidRows.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {invalidRows.length} row(s) have validation errors and will be
                  skipped. You can proceed with the {validRows.length} valid
                  row(s).
                </Typography>
              </Alert>
            )}

            {/* Preview Table */}
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Policy Number</TableCell>
                    <TableCell>Broker</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Errors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedRows.slice(0, 50).map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      sx={{
                        bgcolor: row.isValid ? 'inherit' : 'error.light',
                        '&:hover': { bgcolor: row.isValid ? 'action.hover' : 'error.main' },
                      }}
                    >
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell>{row.customerName || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>{row.policyNumber || '-'}</TableCell>
                      <TableCell>{row.brokerName || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.identityType}
                          size="small"
                          color={row.identityType === 'corporate' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <Typography variant="caption" color="error">
                            {row.errors.join('; ')}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {parsedRows.length > 50 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 50 of {parsedRows.length} rows
              </Typography>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Batch Name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              fullWidth
              required
              helperText="A descriptive name for this remediation batch"
            />

            <TextField
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              helperText="Additional notes about this batch"
            />

            <FormControl fullWidth>
              <InputLabel>Link Expiration</InputLabel>
              <Select
                value={expirationDays}
                label="Link Expiration"
                onChange={(e) => setExpirationDays(Number(e.target.value))}
              >
                <MenuItem value={3}>3 days</MenuItem>
                <MenuItem value={7}>7 days</MenuItem>
                <MenuItem value={14}>14 days</MenuItem>
                <MenuItem value={30}>30 days</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>{validRows.length}</strong> records will be created.
                Verification links will expire after{' '}
                <strong>{expirationDays} days</strong>.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh' } }}
    >
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>Create Remediation Batch</Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent()
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button
            onClick={() => setActiveStep((prev) => prev - 1)}
            disabled={loading}
          >
            Back
          </Button>
        )}

        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={() => setActiveStep((prev) => prev + 1)}
            disabled={loading || (activeStep === 1 && validRows.length === 0)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || validRows.length === 0 || !batchName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Batch'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchUploadDialog;
