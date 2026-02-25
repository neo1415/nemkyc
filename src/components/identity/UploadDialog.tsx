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
import { useAuth } from '../../contexts/AuthContext';
import { validateIdentityData } from '../../utils/validation/identityValidation';
import { validateRow } from '../../utils/validation/rowValidation';
import { ValidationErrorDisplay } from './ValidationErrorDisplay';
import { EditablePreviewTable } from './EditablePreviewTable';
import { 
  getMergedRowData, 
  updateEditState as updateEditStateHelper,
  clearRowEditState,
  getAllMergedData,
  type EditState,
  type ValidationState,
  type EditingCell,
} from '../../types/editablePreview';
import type { FileParseResult, UploadMode, ListType, TemplateValidationResult } from '../../types/remediation';
import type { ValidationResult } from '../../utils/validation/identityValidation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (listId: string) => void;
}

export function UploadDialog({ open, onClose, onSuccess }: UploadDialogProps) {
  // Tour integration
  const { advanceTour } = useBrokerTourV2();
  const { user } = useAuth();
  
  // Default to template mode (flexible mode hidden but available in code)
  const [uploadMode, setUploadMode] = useState<UploadMode>('template');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [templateValidation, setTemplateValidation] = useState<TemplateValidationResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [listName, setListName] = useState('');
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  // Edit state management
  const [editState, setEditState] = useState<EditState>(new Map());
  const [validationState, setValidationState] = useState<ValidationState>(new Map());
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setTemplateValidation(null);
    setValidationResult(null);
    setListName('');
    setEmailColumn('');
    setError(null);
    // Clear edit state
    setEditState(new Map());
    setValidationState(new Map());
    setEditingCell(null);
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

  // Edit state handlers
  const handleCellEdit = (rowIndex: number, column: string, value: any) => {
    setEditState((prev) => updateEditStateHelper(prev, rowIndex, column, value));
  };

  const handleCellEditStart = (rowIndex: number, column: string) => {
    setEditingCell({ rowIndex, column });
  };

  const handleCellEditEnd = () => {
    setEditingCell(null);
  };

  const handleRowSave = (rowIndex: number) => {
    if (!parseResult) return;

    // Get merged row data (original + edits)
    const mergedRow = getMergedRowData(parseResult.rows[rowIndex], rowIndex, editState);

    // Determine template type for validation
    const templateType = uploadMode === 'template' && templateValidation?.detectedType
      ? templateValidation.detectedType
      : 'flexible';

    // Re-validate the row
    const rowErrors = validateRow(mergedRow, rowIndex, parseResult.columns, { templateType });

    // Update validation state for this row
    setValidationState((prev) => {
      const newState = new Map(prev);
      if (rowErrors.length > 0) {
        newState.set(rowIndex, rowErrors);
      } else {
        newState.delete(rowIndex);
      }
      return newState;
    });

    // Update overall validation result
    if (validationResult) {
      // Remove old errors for this row
      const otherErrors = validationResult.errors.filter((e) => e.rowIndex !== rowIndex);
      // Add new errors for this row
      const allErrors = [...otherErrors, ...rowErrors];
      const affectedRows = new Set(allErrors.map((e) => e.rowIndex)).size;

      setValidationResult({
        valid: allErrors.length === 0,
        errors: allErrors,
        errorSummary: {
          totalErrors: allErrors.length,
          affectedRows,
        },
      });

      // Update error message
      if (allErrors.length > 0) {
        setError(`Validation failed: ${allErrors.length} error(s) found`);
      } else {
        setError(null);
      }
    }

    // Clear editing cell
    setEditingCell(null);
  };

  const handleRowCancel = (rowIndex: number) => {
    // Clear edits for this row
    setEditState((prev) => clearRowEditState(prev, rowIndex));
    // Clear editing cell
    setEditingCell(null);
  };

  const handleDownloadTemplate = (type: 'individual' | 'corporate') => {
    // Pass user name to template generator for filename
    const userName = user?.email?.split('@')[0] || 'User';
    downloadTemplate(type, userName);
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
      let validation: TemplateValidationResult | null = null;
      if (uploadMode === 'template') {
        validation = validateTemplate(result.columns);
        setTemplateValidation(validation);
        
        if (!validation.valid) {
          setError(`Template validation failed: ${validation.errors.join(', ')}`);
        }
      } else {
        setTemplateValidation(null);
      }

      // Trigger identity data validation
      setValidating(true);
      try {
        const templateType = uploadMode === 'template' && validation?.detectedType
          ? validation.detectedType
          : 'flexible';

        const identityValidation = validateIdentityData(
          result.rows,
          result.columns,
          { templateType }
        );

        setValidationResult(identityValidation);

        if (!identityValidation.valid) {
          setError(`Validation failed: ${identityValidation.errorSummary.totalErrors} error(s) found`);
        }
      } catch (validationErr) {
        console.error('Validation error:', validationErr);
        setError('Failed to validate data. Please check your file format.');
      } finally {
        setValidating(false);
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
  }, [uploadMode, advanceTour]);

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

    // Check identity validation
    if (validationResult && !validationResult.valid) {
      setError('Cannot create list: validation errors must be fixed first');
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

      // Get merged data (original + edits)
      const mergedEntries = getAllMergedData(parseResult.rows, editState);

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
          entries: mergedEntries, // Use merged data instead of original
          originalFileName: file?.name || 'unknown',
          listType,
          uploadMode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Check if this is a server-side validation error (Requirements: 7.3, 8.1)
        if (response.status === 400 && data.validationErrors && data.errorSummary) {
          console.warn('Server detected validation errors:', data.errorSummary);
          
          // Convert server validation errors to client format
          const serverValidationResult: ValidationResult = {
            valid: false,
            errors: data.validationErrors,
            errorSummary: data.errorSummary,
          };
          
          setValidationResult(serverValidationResult);
          setError(`Server validation failed: ${data.errorSummary.totalErrors} error(s) found. Please download the error report and fix the issues.`);
          return;
        }
        
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth sx={{ zIndex: 1300 }}>
      <DialogTitle sx={{ bgcolor: '#800020', color: 'white', py: 2 }}>Upload Customer List</DialogTitle>
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
            📋 NAICOM/NIIRA Regulatory Compliance
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Pursuant to Section 64(4) of the Nigeria Insurance Industry Reform Act (NIIRA) 2025 and NAICOM's 
            circular on the mandatory submission of the National Identification Number (NIN) and Certificate of 
            Incorporation as material information for insurance contracts, this system has been implemented to 
            ensure the collection and verification of NIN for individual policyholders and Corporate Affairs 
            Commission (CAC) registration details for corporate entities.
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

        {/* Validation Loading Indicator */}
        {validating && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<CircularProgress size={20} />}>
            <Typography variant="body2">
              Validating data... Please wait.
            </Typography>
          </Alert>
        )}

        {/* Validation Error Display */}
        {validationResult && !validationResult.valid && !validating && (
          <ValidationErrorDisplay
            validationResult={validationResult}
          />
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

        {/* Data Quality Warnings - Removed per user request */}
        {/* Data formatting corrections are still applied silently in the background */}

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
            <EditablePreviewTable
              columns={parseResult.columns}
              rows={parseResult.rows}
              emailColumn={emailColumn}
              nameColumns={parseResult.detectedNameColumns}
              editState={editState}
              validationState={validationState}
              editingCell={editingCell}
              onCellEdit={handleCellEdit}
              onRowSave={handleRowSave}
              onRowCancel={handleRowCancel}
              onCellEditStart={handleCellEditStart}
              onCellEditEnd={handleCellEditEnd}
            />
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
            validating ||
            (uploadMode === 'template' && templateValidation && !templateValidation.valid) ||
            (validationResult && !validationResult.valid)
          }
        >
          {loading ? 'Creating...' : 'Create List'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
