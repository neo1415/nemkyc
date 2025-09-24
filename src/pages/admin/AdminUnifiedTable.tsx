import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar,
  GridActionsCellItem,
  GridRowId,
  GridFilterModel
} from '@mui/x-data-grid';
import { 
  ThemeProvider, 
  createTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Visibility, 
  Delete, 
  Download,
  CheckCircle,
  Cancel,
  FilterList,
  GetApp,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { FORM_MAPPINGS } from '@/config/formMappings';

// Custom theme with burgundy and gold
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
    background: {
      default: '#ffffff',
    },
  },
});

interface FormData {
  id: string;
  status?: string;
  timestamp?: any;
  createdAt?: string;
  formType?: string;
  [key: string]: any;
}

interface AdminUnifiedTableProps {
  collectionName: string;
  title: string;
  isClaim?: boolean;
}

const AdminUnifiedTable: React.FC<AdminUnifiedTableProps> = ({
  collectionName,
  title,
  isClaim = false
}) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalDialog, setApprovalDialog] = useState<{ 
    open: boolean; 
    action: 'approve' | 'reject' | null; 
    form: FormData | null;
    comment: string;
  }>({ open: false, action: null, form: null, comment: '' });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchForms();
  }, [user, isAdmin, navigate, collectionName]);

const fetchForms = async () => {
  try {
    setLoading(true);
    console.log(`AdminUnifiedTable: Fetching forms from collection '${collectionName}'`);

    const formsRef = collection(db, collectionName);

    let snapshot;

    // Try timestamp first
    const timestampQuery = query(formsRef, orderBy('timestamp', 'desc'));
    snapshot = await getDocs(timestampQuery);
    console.log(`AdminUnifiedTable: Fetched ${snapshot.docs.length} documents with 'timestamp'`);

    // ⛔️ Fallback manually if no docs found
   if (snapshot.docs.length === 0)  {
      console.log(`AdminUnifiedTable: No docs found with 'timestamp', trying 'submittedAt'`);
      const submittedAtQuery = query(formsRef, orderBy('submittedAt', 'desc'));
      snapshot = await getDocs(submittedAtQuery);
      console.log(`AdminUnifiedTable: Fetched ${snapshot.docs.length} documents with 'submittedAt'`);
    }

    // Still no docs? Try unordered
   if (snapshot.docs.length === 0) {
      console.log(`AdminUnifiedTable: No docs found with 'submittedAt', trying unordered`);
      snapshot = await getDocs(formsRef);
      console.log(`AdminUnifiedTable: Fetched ${snapshot.docs.length} documents without ordering`);
    }

    const formsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp || data.submittedAt || data.createdAt || new Date(),
        // Handle createdAt fallback for table display
        createdAt: data.createdAt || data.submittedAt || data.timestamp,
        status: data.status || (isClaim ? 'processing' : 'pending')
      };
    });

    console.log(`AdminUnifiedTable: Processed ${formsData.length} forms`);
    setForms(formsData);

    if (formsData.length > 0) {
      generateColumns(formsData);
    } else {
      setColumns([{
        field: 'message',
        headerName: 'Status',
        width: 300,
        renderCell: () => 'No data available in this collection'
      }]);
    }
  } catch (error) {
    console.error(`AdminUnifiedTable: Error fetching forms:`, error);
    toast({ title: 'Error fetching data', variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};

  const formatComplexValue = (value: any, fieldKey: string): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Handle arrays of objects (like witnesses, directors, etc.)
    if (Array.isArray(value)) {
      if (value.length === 0) return 'N/A';
      
      return value.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          // Format object properties into readable text
          const entries = Object.entries(item)
            .filter(([key, val]) => val !== null && val !== undefined && val !== '')
            .map(([key, val]) => `${formatFieldLabel(key)}: ${val}`)
            .join(', ');
          
          return `${formatFieldLabel(fieldKey)} ${index + 1} - ${entries}`;
        }
        return `${formatFieldLabel(fieldKey)} ${index + 1}: ${item}`;
      }).join(' | ');
    }
    
    // Handle single objects
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value)
        .filter(([key, val]) => val !== null && val !== undefined && val !== '')
        .map(([key, val]) => `${formatFieldLabel(key)}: ${val}`)
        .join(', ');
      
      return entries || 'View Details';
    }
    
    // Handle strings that are too long
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    
    return String(value);
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: any): string => {
    
    try {
      let dateObj: Date;
      
      if (date.toDate && typeof date.toDate === 'function') {
        // Firebase Timestamp
        dateObj = date.toDate();
      } else if (typeof date === 'string') {
        // Check if already formatted as dd/mm/yyyy
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
          return date;
        }
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return '';
      }

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const getFieldValue = (data: any, field: string): any => {
    if (field.includes('.')) {
      const parts = field.split('.');
      let value = data;
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return '';
        }
      }
      return value;
    }
    return data[field];
  };

  // Collection to form mapping (handles overlapping collections)
  const getFormMappingKey = (collectionName: string, formData?: FormData): string => {
    const collectionMappings: Record<string, string | ((data: FormData) => string)> = {
      'agents-kyc': 'agents-c-d-d',
      'brokers-kyc': 'brokers-c-d-d',
      'corporate-kyc': 'corporate-c-d-d',
      'individual-kyc': 'individual-c-d-d',
      'partners-kyc': 'partners-c-d-d',
      'Individual-kyc-form': 'individual-k-y-c',
      'corporate-kyc-form': 'corporate-k-y-c',
      'naicom-corporate-cdd': 'naicom-corporate-c-d-d',
      'naicom-partners-cdd': 'naicom-partners-c-d-d',
      'motor-claims': 'motor-claims',
      'fire-claims': 'fire-special-perils-claims',
      'professional-indemnity': 'professional-indemnity-claims',
      'burglary-claims': 'burglary-claims',
      'all-risk-claims': 'all-risk-claims',
      'goods-in-transit-claims': 'goods-in-transit-claims',
      'money-insurance-claims': 'money-insurance-claims',
      'public-liability-claims': 'public-liability-claims',
      'employers-liability-claims': 'employers-liability-claims',
      'group-personal-accident-claims': 'group-personal-accident-claims',
      'fidelity-guarantee-claims': 'fidelity-guarantee-claims',
      'rent-assurance-claims': 'rent-assurance-claims',
      'contractors-plant-machinery-claims': 'contractors-plant-machinery-claims',
      'combined-gpa-employers-liability-claims': 'combined-gpa-employers-liability-claims'
    };

    const mappingKey = collectionMappings[collectionName];
    if (typeof mappingKey === 'function' && formData) {
      return mappingKey(formData);
    }
    return (typeof mappingKey === 'string' ? mappingKey : collectionName);
  };

  const organizeFieldsWithMapping = (data: FormData) => {
    const mappingKey = getFormMappingKey(collectionName, data);
    const mapping = FORM_MAPPINGS[mappingKey];
    if (!mapping) return data;

    const organizedData = { ...data };

    // Normalize director data if needed
    if (mapping.sections.find(s => s.title === 'Directors Information')) {
      const directorFields = ['firstName', 'firstName2', 'middleName', 'middleName2', 'lastName', 'lastName2', 
                             'email', 'email2', 'phoneNumber', 'phoneNumber2', 'dob', 'dob2',
                             'nationality', 'nationality2', 'occupation', 'occupation2', 'residentialAddress', 'residentialAddress2',
                             'idType', 'idType2', 'idNumber', 'idNumber2', 'issuedDate', 'issuedDate2',
                             'expiryDate', 'expiryDate2', 'issuingBody', 'issuingBody2', 'placeOfBirth', 'placeOfBirth2',
                             'employersName', 'employersName2', 'employersPhoneNumber', 'employersPhoneNumber2',
                             'sourceOfIncome', 'sourceOfIncome2', 'taxIDNumber', 'taxIDNumber2', 'BVNNumber', 'BVNNumber2'];

      if (!organizedData.directors && directorFields.some(field => organizedData[field])) {
        const directors = [];
        
        // Director 1
        const director1: any = {};
        directorFields.filter(f => !f.endsWith('2')).forEach(field => {
          if (organizedData[field]) {
            director1[field] = organizedData[field];
            delete organizedData[field];
          }
        });
        if (Object.keys(director1).length > 0) directors.push(director1);

        // Director 2
        const director2: any = {};
        directorFields.filter(f => f.endsWith('2')).forEach(field => {
          const baseField = field.replace('2', '');
          if (organizedData[field]) {
            director2[baseField] = organizedData[field];
            delete organizedData[field];
          }
        });
        if (Object.keys(director2).length > 0) directors.push(director2);

        if (directors.length > 0) organizedData.directors = directors;
      }
    }

    return organizedData;
  };

  const exportToCSV = () => {
    if (forms.length === 0) return;

    const mappingKey = getFormMappingKey(collectionName, forms[0]);
    const mapping = FORM_MAPPINGS[mappingKey];
    const headers: string[] = [];
    const rows: string[][] = [];

    // Exclude system fields from CSV
    const excludedFields = ['id', 'timestamp', 'createdAt', 'updatedAt', 'submittedAt', 'formType', 'sn', 'S/N', 'serialNumber', 'rowNumber'];

    // Get headers from form mapping if available
    if (mapping) {
      mapping.sections.forEach(section => {
        // Skip system information sections
        if (section.title.toLowerCase().includes('system')) return;
        
          section.fields.forEach(field => {
            if (excludedFields.includes(field.key) ||
                field.key.toLowerCase().includes('sn') ||
                field.key.toLowerCase().includes('serial') ||
                field.label?.toLowerCase().includes('s/n') ||
                field.label?.toLowerCase().includes('serial')) return;
            
            if (field.type === 'array' && field.key === 'directors') {
            // Add director fields
            ['firstName', 'lastName', 'email', 'phoneNumber'].forEach(dirField => {
              headers.push(`Director 1 ${dirField.charAt(0).toUpperCase() + dirField.slice(1)}`);
              headers.push(`Director 2 ${dirField.charAt(0).toUpperCase() + dirField.slice(1)}`);
            });
          } else if (field.type !== 'file') {
            headers.push(field.label);
          }
        });
      });
    } else {
      // Fallback to dynamic headers
      Object.keys(forms[0]).forEach(key => {
        if (!excludedFields.includes(key)) {
          headers.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    }

    // Process rows
    forms.forEach(form => {
      const organizedForm = organizeFieldsWithMapping(form);
      const row: string[] = [];
      
      if (mapping) {
        mapping.sections.forEach(section => {
          // Skip system information sections
          if (section.title.toLowerCase().includes('system')) return;
          
            section.fields.forEach(field => {
              if (excludedFields.includes(field.key) || 
                  field.type === 'file' ||
                  field.key.toLowerCase().includes('sn') ||
                  field.key.toLowerCase().includes('serial') ||
                  field.label?.toLowerCase().includes('s/n') ||
                  field.label?.toLowerCase().includes('serial')) return;
            
            if (field.type === 'array' && field.key === 'directors') {
              ['firstName', 'lastName', 'email', 'phoneNumber'].forEach(dirField => {
                const director1 = organizedForm.directors?.[0]?.[dirField] || 'N/A';
                const director2 = organizedForm.directors?.[1]?.[dirField] || 'N/A';
                row.push(String(director1));
                row.push(String(director2));
              });
            } else {
              const value = organizedForm[field.key];
              row.push(Array.isArray(value) ? value.length.toString() : String(value || 'N/A'));
            }
          });
        });
      } else {
        Object.keys(forms[0]).forEach(key => {
          if (!excludedFields.includes(key)) {
            row.push(String(organizedForm[key] || 'N/A'));
          }
        });
      }
      
      rows.push(row);
    });

    // Create CSV content
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collectionName}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApprovalAction = async () => {
    if (!approvalDialog.form || !approvalDialog.action) return;

    const { form, action, comment } = approvalDialog;
    
    try {
      const response = await fetch('https://nem-server-rhdb.onrender.com/api/update-claim-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionName,
          documentId: form.id,
          status: action === 'approve' ? 'approved' : 'rejected',
          approverUid: user?.uid,
          comment: comment.trim() || `Claim ${action}d by administrator`,
          userEmail: form.email || form.insuredEmail,
          formType: title
        }),
      });

      if (response.ok) {
        toast({ 
          title: 'Success', 
          description: `Claim ${action}d successfully` 
        });
        
        // Update local state
        setForms(prev => prev.map(f => 
          f.id === form.id 
            ? { 
                ...f, 
                status: action === 'approve' ? 'approved' : 'rejected',
                approvedBy: user?.uid,
                approvedAt: new Date(),
                approvalComment: comment.trim() || `Claim ${action}d by administrator`
              } 
            : f
        ));
        
        setApprovalDialog({ open: false, action: null, form: null, comment: '' });
      } else {
        throw new Error('Failed to update claim status');
      }
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast({ 
        title: 'Error', 
        description: `Failed to ${action} claim`, 
        variant: 'destructive' 
      });
    }
  };

  const generateColumns = (data: FormData[]) => {
    const sampleData = data[0];
    const dynamicColumns: GridColDef[] = [];

    // Action buttons first
    dynamicColumns.push({
      field: 'actions',
      headerName: 'Actions',
      width: isClaim ? 280 : 200,
      type: 'actions',
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<Visibility />}
            label="View"
            onClick={() => navigate(`/admin/form/${collectionName}/${params.id}`)}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<Delete />}
            label="Delete"
            onClick={() => handleDeleteClick(params.id as string)}
          />
        ];

        // Add approval actions for claims with pending/processing status
        if (isClaim && params.row.status && ['pending', 'processing'].includes(params.row.status.toLowerCase())) {
          actions.push(
            <GridActionsCellItem
              key="approve"
              icon={<ThumbUp />}
              label="Approve"
              onClick={() => setApprovalDialog({ 
                open: true, 
                action: 'approve', 
                form: params.row, 
                comment: '' 
              })}
            />,
            <GridActionsCellItem
              key="reject"
              icon={<ThumbDown />}
              label="Reject"
              onClick={() => setApprovalDialog({ 
                open: true, 
                action: 'reject', 
                form: params.row, 
                comment: '' 
              })}
            />
          );
        }

        return actions;
      },
    });

    // Exclude certain fields from columns
    const excludeFields = [
      'timestamp', 'agreeToDataPrivacy', 'declarationTrue', 
      'declarationAdditionalInfo', 'declarationDocuments',
      'signature', 'submittedAt', 'formType', 'sn', 'S/N', 
      'serialNumber', 'rowNumber'
    ];

    // Include important fields first
    const priorityFields = ['status', 'createdAt'];
    
    priorityFields.forEach(field => {
      if (sampleData[field] !== undefined) {
        if (field === 'status' && isClaim) {
          dynamicColumns.push({
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
              const status = params.value || 'processing';
              const getColor = (status: string) => {
                switch (status.toLowerCase()) {
                  case 'approved': return 'success';
                  case 'rejected': return 'error';
                  default: return 'warning';
                }
              };
              return <Chip label={status} color={getColor(status)} size="small" />;
            },
          });
        } else if (field === 'createdAt') {
          dynamicColumns.push({
            field: 'createdAt',
            headerName: 'Date Created',
            width: 130,
            valueFormatter: (params) => formatDate(params),
          });
        }
      }
    });

    // Use form mappings if available - fields in correct order
    const mappingKey = getFormMappingKey(collectionName, sampleData);
    const mapping = FORM_MAPPINGS[mappingKey];
    if (mapping) {
      // Flatten all fields from all sections in the exact order they appear in form mappings
      const allFieldsInOrder: any[] = [];
      
      mapping.sections.forEach(section => {
        // Skip system information sections in admin table
        if (section.title.toLowerCase().includes('system')) return;
        
        section.fields.forEach(field => {
          // Skip file fields, excluded fields, S/N fields, and priority fields (already added)
          if (field.type !== 'file' && 
              !excludeFields.includes(field.key) && 
              !priorityFields.includes(field.key) &&
              !field.key.toLowerCase().includes('sn') &&
              !field.key.toLowerCase().includes('serial') &&
              !field.label?.toLowerCase().includes('s/n') &&
              !field.label?.toLowerCase().includes('serial')) {
            allFieldsInOrder.push(field);
          }
        });
      });

      // Create columns for each field in the exact order they appear in form mappings
      allFieldsInOrder.forEach(field => {
        if (field.type === 'array') {
          dynamicColumns.push({
            field: field.key,
            headerName: field.label,
            width: 300,
            renderCell: (params) => {
              const value = params.value;
              if (!value || (Array.isArray(value) && value.length === 0)) {
                return <span style={{ color: '#666' }}>N/A</span>;
              }
              
              const formatted = formatComplexValue(value, field.key);
              return (
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '0.8rem',
                  lineHeight: '1.2'
                }}>
                  {formatted}
                </div>
              );
            },
          });
        } else if (field.key.toLowerCase().includes('date') || 
                   field.key === 'dateOfBirth' || 
                   field.key === 'dob' ||
                   field.key.toLowerCase().includes('period') ||
                   field.key.toLowerCase().includes('from') ||
                   field.key.toLowerCase().includes('to') ||
                   field.key.toLowerCase().includes('cover') ||
                   field.key.toLowerCase().includes('start') ||
                   field.key.toLowerCase().includes('end') ||
                   field.key.toLowerCase().includes('expiry') ||
                   field.key.toLowerCase().includes('issued') ||
                   field.key.toLowerCase().includes('birth') ||
                   field.key.toLowerCase().includes('time') ||
                   field.key.toLowerCase().includes('when')) {
          dynamicColumns.push({
            field: field.key,
            headerName: field.label,
            width: 130,
            valueFormatter: (params) => formatDate(params),
          });
        } else {
          dynamicColumns.push({
            field: field.key,
            headerName: field.label,
            width: 150,
            renderCell: (params) => {
              const value = params.value;
              if (typeof value === 'object' && value !== null) {
                const formatted = formatComplexValue(value, field.key);
                return (
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontSize: '0.8rem'
                  }}>
                    {formatted}
                  </div>
                );
              }
              
              if (typeof value === 'string' && value.length > 50) {
                return value.substring(0, 50) + '...';
              }
              return value || 'N/A';
            },
          });
        }
      });
    } else {
      // Fallback to dynamic generation
      Object.keys(sampleData).forEach((key) => {
        if (excludeFields.includes(key) || priorityFields.includes(key)) return;
        
        const value = sampleData[key];
        
        // Skip URL fields
        if (typeof value === 'string' && (value.includes('firebase') || key.toLowerCase().includes('url'))) {
          return;
        }

        // Handle array fields (show detailed content instead of just count)
        if (Array.isArray(value)) {
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
          dynamicColumns.push({
            field: key,
            headerName: fieldName,
            width: 300,
            renderCell: (params) => {
              const arr = params.value;
              if (!Array.isArray(arr) || arr.length === 0) {
                return <span style={{ color: '#666' }}>N/A</span>;
              }
              
              const formatted = formatComplexValue(arr, key);
              return (
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '0.8rem',
                  lineHeight: '1.2'
                }}>
                  {formatted}
                </div>
              );
            },
          });
          return;
        }

        // Handle date fields
        if (key.toLowerCase().includes('date') || 
            key === 'dateOfBirth' ||
            key.toLowerCase().includes('period') ||
            key.toLowerCase().includes('from') ||
            key.toLowerCase().includes('to') ||
            key.toLowerCase().includes('cover') ||
            key.toLowerCase().includes('start') ||
            key.toLowerCase().includes('end') ||
            key.toLowerCase().includes('expiry') ||
            key.toLowerCase().includes('issued') ||
            key.toLowerCase().includes('birth') ||
            key.toLowerCase().includes('time') ||
            key.toLowerCase().includes('when')) {
          dynamicColumns.push({
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            width: 130,
            valueFormatter: (params) => formatDate(params),
          });
          return;
        }

        // Handle nested objects (show formatted content instead of "View Details")
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
          dynamicColumns.push({
            field: key,
            headerName: fieldName,
            width: 250,
            renderCell: (params) => {
              const obj = params.value;
              if (!obj || typeof obj !== 'object') {
                return <span style={{ color: '#666' }}>N/A</span>;
              }
              
              const formatted = formatComplexValue(obj, key);
              return (
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  fontSize: '0.8rem'
                }}>
                  {formatted}
                </div>
              );
            },
          });
          return;
        }

        // Handle regular fields
        const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        dynamicColumns.push({
          field: key,
          headerName: fieldName,
          width: 150,
          valueFormatter: (params) => {
            const value = params as any;
            if (typeof value === 'string' && value.length > 50) {
              return value.substring(0, 50) + '...';
            }
            return value || '';
          },
        });
      });
    }

    setColumns(dynamicColumns);
  };

  const handleDeleteClick = (formId: string) => {
    setSelectedFormId(formId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, collectionName, selectedFormId));
      setForms(forms.filter(form => form.id !== selectedFormId));
      toast({ title: 'Form deleted successfully' });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({ title: 'Error deleting form', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
    }
  };

  const handleStatusChange = async (formId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, collectionName, formId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setForms(forms.map(form => 
        form.id === formId ? { ...form, status: newStatus } : form
      ));
      
      toast({ title: `Status updated to ${newStatus}` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const getRowClassName = (params: any) => {
    if (!isClaim) return '';
    
    const status = params.row.status?.toLowerCase() || 'processing';
    switch (status) {
      case 'approved': return 'row-approved';
      case 'rejected': return 'row-rejected';
      default: return 'row-processing';
    }
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = Object.values(form).some(value => 
      String(value).toLowerCase().includes(filterValue.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || 
      (form.status?.toLowerCase() || 'processing') === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          
          {/* Filters and Export */}
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            
            {isClaim && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            )}
            
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
              sx={{ ml: 'auto' }}
            >
              Export CSV
            </Button>
          </Box>
        </div>

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredForms}
            columns={columns}
            loading={loading}
            getRowClassName={getRowClassName}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                csvOptions: {
                  fileName: `${collectionName}-export`,
                  delimiter: ',',
                  includeHeaders: true,
                },
              },
            }}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(128, 0, 32, 0.04)',
              },
            }}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this form? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approval/Rejection Dialog */}
        <Dialog
          open={approvalDialog.open}
          onClose={() => setApprovalDialog({ open: false, action: null, form: null, comment: '' })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {approvalDialog.action === 'approve' ? 'Approve Claim' : 'Reject Claim'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to {approvalDialog.action} this claim?
            </Typography>
            {approvalDialog.form && (
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Claimant:</strong> {approvalDialog.form.nameOfInsured || approvalDialog.form.insuredName || approvalDialog.form.companyName || 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Email:</strong> {approvalDialog.form.email || approvalDialog.form.insuredEmail || 'N/A'}
                </Typography>
              </Box>
            )}
            <TextField
              autoFocus
              margin="dense"
              label={`${approvalDialog.action === 'approve' ? 'Approval' : 'Rejection'} Comment`}
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={approvalDialog.comment}
              onChange={(e) => setApprovalDialog(prev => ({ ...prev, comment: e.target.value }))}
              placeholder={`Please provide a reason for ${approvalDialog.action}ing this claim...`}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setApprovalDialog({ open: false, action: null, form: null, comment: '' })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprovalAction}
              color={approvalDialog.action === 'approve' ? 'success' : 'error'}
              variant="contained"
              disabled={!approvalDialog.comment.trim()}
            >
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default AdminUnifiedTable;
