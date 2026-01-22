/**
 * Upload Dialog Component
 * 
 * Modal dialog for uploading CSV/Excel files and creating customer lists.
 * Features:
 * - Template Mode / Flexible Mode selector
 * - Drag & drop file upload
 * - Template validation with error display
 * - Preview of first 10 rows
 * - Auto-detection of email column (highlighted)
 * - Auto-detection of name columns (highlighted)
 * - Manual email column selection if not detected
 * - List name input
 */

import { useState, useCallback } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as TemplateIcon,
  DynamicFeed as FlexibleIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { 
  parseFile, 
  isValidFileType, 
  isFileSizeValid, 
  formatFileSize,
  validateTemplate,
  INDIVIDUAL_TEMPLATE,
  CORPORATE_TEMPLATE,
} from '../../utils/fileParser';
import { downloadTemplate } from '../../utils/templateGenerator';
import { useBrokerTourV2 } from '../../hooks/useBrokerTourV2';
import type { FileParseResult, UploadMode, ListType, TemplateValidationResult } from '../../types/remediation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

export function UploadDialog({ open, onClose, onSuccess }: UploadDialogProps) {
  // Tour integration
  const { advanceTour } = useBrokerTourV2();
  
  // Default to template mode (flexible mode hidden but available in code)
  const [uploadMode, setUploadMode] = useState<UploadMode>('template');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [templateValidation, setTemplateValidation] = useState<TemplateValidationResult | null>(null);
  const [listName, setListName] = useState('');
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setTemplateValidation(null);
    setListName('');
    setEmailColumn('');
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: UploadMode | null) => {
    if (newMode !== null) {
      setUploadMode(newMode);
      // Reset file when changing modes
      if (file) {
        resetState();
      }
    }
  };

  const handleDownloadTemplate = (type: 'individual' | 'corporate') => {
    downloadTemplate(type);
    setShowTemplateMenu(false);
    
    // Advance tour when template is downloaded
    advanceTour();
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

      // Validate template if in template mode
      if (uploadMode === 'template') {
        const validation = validateTemplate(result.columns);
        setTemplateValidation(validation);
        
        if (!validation.valid) {
          setError(`Template validation failed: ${validation.errors.join(', ')}`);
        }
      } else {
        setTemplateValidation(null);
      }
      
      // Advance tour to show "Create List" step
      advanceTour();
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, [uploadMode]);

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

    // In template mode, check validation
    if (uploadMode === 'template' && templateValidation && !templateValidation.valid) {
      setError('Cannot create list: template validation failed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine list type
      let listType: ListType = 'flexible';
      if (uploadMode === 'template' && templateValidation?.detectedType) {
        listType = templateValidation.detectedType;
      }

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
          nameColumns: parseResult.detectedNameColumns || null,
          policyColumn: parseResult.detectedPolicyColumn || null,
          fileType: parseResult.detectedFileType || 'unknown',
          entries: parseResult.rows,
          originalFileName: file?.name || 'unknown',
          listType,
          uploadMode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create list');
      }

      const data = await response.json();
      
      // Advance tour to list detail page step
      advanceTour();
      
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

  // Helper to check if a column is a detected name column
  const isNameColumn = (col: string): boolean => {
    if (!parseResult?.detectedNameColumns) return false;
    const nameCols = parseResult.detectedNameColumns;
    return col === nameCols.firstName || 
           col === nameCols.middleName || 
           col === nameCols.lastName || 
           col === nameCols.fullName || 
           col === nameCols.insured ||
           col === nameCols.companyName;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth sx={{ zIndex: 1300 }}>
      <DialogTitle>Upload Customer List</DialogTitle>
      <DialogContent sx={{ overflowY: 'auto' }}>
        {/* Upload Mode Selector */}
        {/* NOTE: Flexible Mode is hidden from UI but code remains available for future use */}
        <Box sx={{ mb: 3, display: 'none' }}>
          <Typography variant="subtitle2" gutterBottom>
            Upload Mode
          </Typography>
          <ToggleButtonGroup
            value={uploadMode}
            exclusive
            onChange={handleModeChange}
            aria-label="upload mode"
            fullWidth
            sx={{ mb: 1 }}
          >
            {/* Flexible Mode - Hidden but available in code */}
            <ToggleButton value="flexible" aria-label="flexible mode">
              <FlexibleIcon sx={{ mr: 1 }} />
              Flexible Mode
            </ToggleButton>
            <ToggleButton value="template" aria-label="template mode">
              <TemplateIcon sx={{ mr: 1 }} />
              Template Mode
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="textSecondary">
            {uploadMode === 'flexible' 
              ? 'Accepts any column structure. Email and name columns will be auto-detected.'
              : 'Validates file against Individual or Corporate template requirements.'}
          </Typography>
        </Box>

        {/* NAICOM Compliance Message */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, bgcolor: '#f0f7ff' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            📋 NAICOM/NAIIRA Regulatory Compliance
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            As a registered insurance broker, you are required to maintain accurate Know Your Customer (KYC) records 
            for all clients in accordance with NAICOM and NAIIRA regulations.
          </Typography>
          <Typography variant="body2">
            This system helps you collect and verify National Identity Numbers (NIN) for individual clients and 
            Corporate Affairs Commission (CAC) registration details for corporate clients, ensuring compliance with 
            regulatory requirements for customer identification and verification.
          </Typography>
        </Alert>

        {/* Template Requirements (shown in template mode) */}
        {uploadMode === 'template' && !parseResult && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Template Requirements
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Individual Template
                  </Typography>
                  <Typography variant="caption" component="div">
                    <strong>Required:</strong> {INDIVIDUAL_TEMPLATE.required.join(', ')}
                  </Typography>
                  <Typography variant="caption" component="div" color="textSecondary">
                    <strong>Optional:</strong> {INDIVIDUAL_TEMPLATE.optional.join(', ')}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Corporate Template
                  </Typography>
                  <Typography variant="caption" component="div">
                    <strong>Required:</strong> {CORPORATE_TEMPLATE.required.join(', ')}
                  </Typography>
                </Box>
              </Box>
            </Alert>

            {/* Download Template Buttons */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }} data-tour="download-template">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadTemplate('individual')}
                fullWidth
                sx={{ 
                  borderColor: 'primary.main',
                  '&:hover': { 
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.lighter' 
                  }
                }}
              >
                Download Individual Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownloadTemplate('corporate')}
                fullWidth
                sx={{ 
                  borderColor: 'warning.main',
                  color: 'warning.main',
                  '&:hover': { 
                    borderColor: 'warning.dark',
                    bgcolor: 'warning.lighter',
                    color: 'warning.dark'
                  }
                }}
              >
                Download Corporate Template
              </Button>
            </Box>
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Template Validation Results */}
        {uploadMode === 'template' && templateValidation && parseResult && (
          <>
            {templateValidation.valid ? (
              <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {templateValidation.detectedType === 'individual' ? '👤 Individual' : '🏢 Corporate'} Template Validated
                </Typography>
                <Typography variant="caption">
                  All required columns are present. List type: {templateValidation.detectedType}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }} icon={<WarningIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Template Validation Failed
                </Typography>
                <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                  Detected type: {templateValidation.detectedType}
                </Typography>
                {templateValidation.missingColumns.length > 0 && (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Missing required columns:
                    </Typography>
                    <List dense sx={{ py: 0 }}>
                      {templateValidation.missingColumns.map((col) => (
                        <ListItem key={col} sx={{ py: 0, px: 1 }}>
                          <ListItemText 
                            primary={col} 
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Alert>
            )}
          </>
        )}

        {!parseResult ? (
          // File Upload Zone
          <Box
            {...getRootProps()}
            data-tour="upload-area"
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
              // Ensure dropzone works during tour
              pointerEvents: 'auto !important',
              position: 'relative',
              zIndex: 1,
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

            {/* File Type Detection Info (only in flexible mode) */}
            {uploadMode === 'flexible' && parseResult.detectedFileType && parseResult.detectedFileType !== 'unknown' && (
              <Alert 
                severity={parseResult.detectedFileType === 'corporate' ? 'warning' : 'info'} 
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {parseResult.detectedFileType === 'corporate' 
                    ? '🏢 Corporate file detected' 
                    : '👤 Individual file detected'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {parseResult.detectedFileType === 'corporate'
                    ? 'This file appears to contain corporate/company data. Company names will be used for identification.'
                    : 'This file appears to contain individual customer data. Personal names will be used for identification.'}
                </Typography>
              </Alert>
            )}

            {/* Name Columns Detection Info */}
            {parseResult.detectedNameColumns && Object.keys(parseResult.detectedNameColumns).length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }} icon={<PersonIcon />}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  Name columns auto-detected:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {parseResult.detectedNameColumns.companyName && (
                    <Chip label={`Company Name: ${parseResult.detectedNameColumns.companyName}`} size="small" color="warning" variant="outlined" />
                  )}
                  {parseResult.detectedNameColumns.firstName && (
                    <Chip label={`First Name: ${parseResult.detectedNameColumns.firstName}`} size="small" color="primary" variant="outlined" />
                  )}
                  {parseResult.detectedNameColumns.middleName && (
                    <Chip label={`Middle Name: ${parseResult.detectedNameColumns.middleName}`} size="small" color="primary" variant="outlined" />
                  )}
                  {parseResult.detectedNameColumns.lastName && (
                    <Chip label={`Last Name: ${parseResult.detectedNameColumns.lastName}`} size="small" color="primary" variant="outlined" />
                  )}
                  {parseResult.detectedNameColumns.fullName && (
                    <Chip label={`Full Name: ${parseResult.detectedNameColumns.fullName}`} size="small" color="primary" variant="outlined" />
                  )}
                  {parseResult.detectedNameColumns.insured && !parseResult.detectedNameColumns.companyName && (
                    <Chip label={`Insured: ${parseResult.detectedNameColumns.insured}`} size="small" color="primary" variant="outlined" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {parseResult.detectedFileType === 'corporate'
                    ? 'Company names will be displayed on the verification page for identity confirmation.'
                    : 'Customer names will be displayed on the verification page for identity confirmation.'}
                </Typography>
              </Alert>
            )}

            {/* Policy Column Detection Info */}
            {parseResult.detectedPolicyColumn && (
              <Typography variant="caption" color="info.main" sx={{ mb: 2, display: 'block' }}>
                📋 Policy column auto-detected: "{parseResult.detectedPolicyColumn}"
              </Typography>
            )}

            {/* Preview Table */}
            <Typography variant="subtitle2" gutterBottom>
              Preview (first {previewRows.length} rows)
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 300, overflowY: 'auto', pointerEvents: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {parseResult.columns.map((col) => (
                      <TableCell
                        key={col}
                        sx={{
                          bgcolor: col === emailColumn 
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
                          <PersonIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle', color: '#1976d2' }} />
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
                            bgcolor: col === emailColumn 
                              ? 'success.lighter' 
                              : isNameColumn(col) 
                                ? '#f5f9ff' 
                                : 'inherit',
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
          data-tour="create-list-button"
          onClick={handleSubmit}
          variant="contained"
          disabled={
            !parseResult || 
            !listName.trim() || 
            !emailColumn || 
            loading ||
            (uploadMode === 'template' && templateValidation && !templateValidation.valid)
          }
        >
          {loading ? 'Creating...' : 'Create List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
