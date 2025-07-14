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
  FilterList
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
      const formsRef = collection(db, collectionName);
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const formsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setForms(formsData);
      if (formsData.length > 0) {
        generateColumns(formsData);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
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

  const generateColumns = (data: FormData[]) => {
    const sampleData = data[0];
    const dynamicColumns: GridColDef[] = [];

    // Action buttons first
    dynamicColumns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={() => navigate(`/admin/form-viewer/${collectionName}/${params.id}`)}
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

    // Add other important fields
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
          
          {/* Filters */}
          <Box display="flex" gap={2} mb={3} alignItems="center">
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