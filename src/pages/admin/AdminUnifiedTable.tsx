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
  GetApp
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

  const formatDate = (date: any): string => {
    if (!date) return '';
    
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

  const organizeFieldsWithMapping = (data: FormData) => {
    const mapping = FORM_MAPPINGS[collectionName];
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

    const mapping = FORM_MAPPINGS[collectionName];
    const headers: string[] = [];
    const rows: string[][] = [];

    // Get headers from form mapping if available
    if (mapping) {
      mapping.sections.forEach(section => {
        section.fields.forEach(field => {
          if (field.type === 'array' && field.key === 'directors') {
            // Add director fields
            ['firstName', 'lastName', 'email', 'phoneNumber'].forEach(dirField => {
              headers.push(`Director 1 ${dirField.charAt(0).toUpperCase() + dirField.slice(1)}`);
              headers.push(`Director 2 ${dirField.charAt(0).toUpperCase() + dirField.slice(1)}`);
            });
          } else {
            headers.push(field.label);
          }
        });
      });
    } else {
      // Fallback to dynamic headers
      Object.keys(forms[0]).forEach(key => {
        if (key !== 'id' && key !== 'timestamp') {
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
          section.fields.forEach(field => {
            if (field.type === 'array' && field.key === 'directors') {
              ['firstName', 'lastName', 'email', 'phoneNumber'].forEach(dirField => {
                const director1 = organizedForm.directors?.[0]?.[dirField] || '';
                const director2 = organizedForm.directors?.[1]?.[dirField] || '';
                row.push(String(director1));
                row.push(String(director2));
              });
            } else {
              const value = organizedForm[field.key];
              row.push(Array.isArray(value) ? value.length.toString() : String(value || ''));
            }
          });
        });
      } else {
        Object.keys(forms[0]).forEach(key => {
          if (key !== 'id' && key !== 'timestamp') {
            row.push(String(organizedForm[key] || ''));
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

  const generateColumns = (data: FormData[]) => {
    const sampleData = data[0];
    const dynamicColumns: GridColDef[] = [];

    // Action buttons first
    dynamicColumns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      type: 'actions',
      getActions: (params) => [
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
      ],
    });

    // Exclude certain fields from columns
    const excludeFields = [
      'timestamp', 'agreeToDataPrivacy', 'declarationTrue', 
      'declarationAdditionalInfo', 'declarationDocuments',
      'signature', 'submittedAt', 'formType'
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

    // Use form mappings if available
    const mapping = FORM_MAPPINGS[collectionName];
    if (mapping) {
      mapping.sections.forEach(section => {
        section.fields.forEach(field => {
          if (excludeFields.includes(field.key) || priorityFields.includes(field.key)) return;

          if (field.type === 'array' && field.key === 'directors') {
            dynamicColumns.push({
              field: 'directors',
              headerName: 'Directors Count',
              width: 130,
              valueFormatter: (params) => {
                const arr = params as any[];
                return Array.isArray(arr) ? `${arr.length} director(s)` : '0 directors';
              },
            });
          } else if (field.key.toLowerCase().includes('date') || field.key === 'dateOfBirth') {
            dynamicColumns.push({
              field: field.key,
              headerName: field.label,
              width: 130,
              valueFormatter: (params) => formatDate(params),
            });
          } else if (field.type === 'file') {
            dynamicColumns.push({
              field: field.key,
              headerName: field.label,
              width: 150,
              valueFormatter: (params) => params ? 'File Available' : 'No File',
            });
          } else {
            dynamicColumns.push({
              field: field.key,
              headerName: field.label,
              width: 150,
              valueFormatter: (params) => {
                const value = params as any;
                if (typeof value === 'string' && value.length > 50) {
                  return value.substring(0, 50) + '...';
                }
                return value || '';
              },
            });
          }
        });
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

        // Handle array fields (show count)
        if (Array.isArray(value)) {
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
          dynamicColumns.push({
            field: key,
            headerName: `${fieldName} Count`,
            width: 130,
            valueFormatter: (params) => {
              const arr = params as any[];
              return Array.isArray(arr) ? `${arr.length} item(s)` : '0 items';
            },
          });
          return;
        }

        // Handle date fields
        if (key.toLowerCase().includes('date') || key === 'dateOfBirth') {
          dynamicColumns.push({
            field: key,
            headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            width: 130,
            valueFormatter: (params) => formatDate(params),
          });
          return;
        }

        // Handle nested objects (show summary)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
          dynamicColumns.push({
            field: key,
            headerName: fieldName,
            width: 150,
            valueFormatter: () => 'View Details',
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
      </div>
    </ThemeProvider>
  );
};

export default AdminUnifiedTable;
