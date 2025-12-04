import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
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
import { format } from 'date-fns';

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
  timestamp?: any;
  createdAt?: string;
  formType?: string;
  [key: string]: any;
}

const AdminIndividualCDDTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchForms();
  }, [user, isAdmin, navigate]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsRef = collection(db, 'individual-kyc');
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const formsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormData[];

      setForms(formsData);
      generateColumns(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateColumns = (data: FormData[]) => {
    const baseColumns: GridColDef[] = [
            {
        field: 'timestamp',
        headerName: 'createdAt',
        width: 180,
        renderCell: (params) => {
          if (!params.value) return 'N/A';
          try {
            let date;
            if (typeof params.value === 'string') {
              date = new Date(params.value);
            } else if (params.value?.toDate) {
              date = params.value.toDate();
            } else if (params.value instanceof Date) {
              date = params.value;
            } else {
              return 'N/A';
            }
            
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'dd/MM/yyyy HH:mm');
          } catch (error) {
            return 'N/A';
          }
        }
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: 'Actions',
        width: 120,
        cellClassName: 'actions',
        getActions: ({ id }: { id: GridRowId }) => [
          <GridActionsCellItem
            key="view"
            icon={<Visibility />}
            label="View"
            onClick={() => navigate(`/admin/form/individual-kyc/${id}`)}
            color="inherit"
          />,
          <GridActionsCellItem
            key="delete"
            icon={<Delete />}
            label="Delete"
            onClick={() => handleDeleteClick(id as string)}
            color="inherit"
          />,
        ],
      },
      {
        field: 'title',
        headerName: 'Title',
        width: 100,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'firstName',
        headerName: 'First Name',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'lastName',
        headerName: 'Last Name',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'contactAddress',
        headerName: 'Contact Address',
        width: 200,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'gender',
        headerName: 'Gender',
        width: 100,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'country',
        headerName: 'Residence Country',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'dateOfBirth',
        headerName: 'Date of Birth',
        width: 130,
        renderCell: (params) => {
          if (!params.value) return 'N/A';
          try {
            let date;
            if (typeof params.value === 'string') {
              date = new Date(params.value);
            } else if (params.value?.toDate) {
              date = params.value.toDate();
            } else if (params.value instanceof Date) {
              date = params.value;
            } else {
              return 'N/A';
            }
            
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'dd/MM/yyyy');
          } catch (error) {
            return 'N/A';
          }
        }
      },
      {
        field: 'placeOfBirth',
        headerName: 'Place of Birth',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'emailAddress',
        headerName: 'Email',
        width: 200,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'GSMno',
        headerName: 'Mobile Number',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'residentialAddress',
        headerName: 'Residential Address',
        width: 200,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'nationality',
        headerName: 'Nationality',
        width: 130,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'occupation',
        headerName: 'Occupation',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'position',
        headerName: 'Position',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'businessType',
        headerName: 'Business Type',
        width: 150,
        renderCell: (params) => {
          if (params.value === 'other' && params.row.businessTypeOther) {
            return params.row.businessTypeOther;
          }
          return params.value || 'N/A';
        }
      },
      {
        field: 'employersEmail',
        headerName: 'Employer Email',
        width: 200,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'employersName',
        headerName: 'Employer Name',
        width: 180,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'employersTelephoneNumber',
        headerName: 'Employer Phone',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'employersAddress',
        headerName: 'Employer Address',
        width: 200,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'taxidentificationNumber',
        headerName: 'Tax ID',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'BVNNumber',
        headerName: 'BVN',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'NINNumber',
        headerName: 'NIN',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'identificationType',
        headerName: 'ID Type',
        width: 120,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'identificationNumber',
        headerName: 'ID Number',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'issuingCountry',
        headerName: 'Issuing Country',
        width: 150,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'issuedDate',
        headerName: 'Issued Date',
        width: 130,
        renderCell: (params) => {
          if (!params.value) return 'N/A';
          try {
            let date;
            if (typeof params.value === 'string') {
              date = new Date(params.value);
            } else if (params.value?.toDate) {
              date = params.value.toDate();
            } else if (params.value instanceof Date) {
              date = params.value;
            } else {
              return 'N/A';
            }
            
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'dd/MM/yyyy');
          } catch (error) {
            return 'N/A';
          }
        }
      },
      {
        field: 'expiryDate',
        headerName: 'Expiry Date',
        width: 130,
        renderCell: (params) => {
          if (!params.value) return 'N/A';
          try {
            let date;
            if (typeof params.value === 'string') {
              date = new Date(params.value);
            } else if (params.value?.toDate) {
              date = params.value.toDate();
            } else if (params.value instanceof Date) {
              date = params.value;
            } else {
              return 'N/A';
            }
            
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, 'dd/MM/yyyy');
          } catch (error) {
            return 'N/A';
          }
        }
      },
      {
        field: 'annualIncomeRange',
        headerName: 'Annual Income Range',
        width: 180,
        renderCell: (params) => params.value || 'N/A'
      },
      {
        field: 'premiumPaymentSource',
        headerName: 'Payment Source',
        width: 150,
        renderCell: (params) => {
          if (params.value === 'other' && params.row.premiumPaymentSourceOther) {
            return params.row.premiumPaymentSourceOther;
          }
          return params.value || 'N/A';
        }
      },
    ];

    setColumns(baseColumns);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedFormId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, 'individual-kyc', selectedFormId));
      
      setForms(prev => prev.filter(form => form.id !== selectedFormId));
      
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedFormId(null);
  };

  const handleExportCSV = () => {
    if (forms.length === 0) {
      toast({
        title: "No Data",
        description: "No forms available to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV headers based on columns (excluding actions)
    const headers = columns
      .filter(col => col.field !== 'actions')
      .map(col => col.headerName || col.field);

    // Create CSV rows
    const csvData = forms.map(form => {
      return columns
        .filter(col => col.field !== 'actions')
        .map(col => {
          const value = form[col.field];
          if (value === null || value === undefined) return 'N/A';
          
          // Handle dates
          if (col.field.includes('Date') || col.field === 'timestamp') {
            try {
              let date;
              if (typeof value === 'string') {
                date = new Date(value);
              } else if (value?.toDate) {
                date = value.toDate();
              } else if (value instanceof Date) {
                date = value;
              } else {
                return 'N/A';
              }
              
              if (isNaN(date.getTime())) return 'N/A';
              return col.field === 'timestamp' 
                ? format(date, 'dd/MM/yyyy HH:mm')
                : format(date, 'dd/MM/yyyy');
            } catch (error) {
              return 'N/A';
            }
          }
          
          // Handle conditional fields
          if (col.field === 'businessType' && value === 'other' && form.businessTypeOther) {
            return form.businessTypeOther;
          }
          if (col.field === 'premiumPaymentSource' && value === 'other' && form.premiumPaymentSourceOther) {
            return form.premiumPaymentSourceOther;
          }
          
          return String(value);
        });
    });

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `individual-cdd-forms-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredForms = forms.filter(form => {
    if (!filterValue) return true;
    
    const searchFields = ['firstName', 'lastName', 'emailAddress', 'nationality'];
    return searchFields.some(field => 
      form[field]?.toString().toLowerCase().includes(filterValue.toLowerCase())
    );
  });

  if (!user || !isAdmin()) {
    return <div>Unauthorized</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', width: '100%', p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: '#800020', fontWeight: 'bold' }}>
            Individual CDD Management
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<GetApp />}
            onClick={handleExportCSV}
            sx={{
              backgroundColor: '#800020',
              color: 'white',
              '&:hover': {
                backgroundColor: '#600018'
              },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Export CSV
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Search forms..."
            variant="outlined"
            size="small"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            sx={{ minWidth: 300 }}
          />
        </Box>

        <Box sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
          <DataGrid
            rows={filteredForms}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                color: '#800020',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f8f8f8',
              },
            }}
          />
        </Box>

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this form? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AdminIndividualCDDTable;