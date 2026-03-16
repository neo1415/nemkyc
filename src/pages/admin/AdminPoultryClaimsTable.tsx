import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar,
  GridActionsCellItem,
  GridRowId
} from '@mui/x-data-grid';
import { 
  ThemeProvider, 
  createTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  updateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';

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
  submittedAt?: any;
  // Policy & Insured Details
  policyNumber?: string;
  nameOfInsured?: string;
  farmNameAndAddress?: string;
  phoneNumber?: string;
  dateAndPeriodOfLoss?: string;
  // Cause of Loss
  causeOfDeath?: string;
  diseaseSpecification?: string;
  otherCauseExplanation?: string;
  // Claim Details
  vetSurgeonDetails?: string;
  numberOfBirdsDied?: number;
  ageOfBirdsAtMortality?: string;
  claimEstimate?: string;
  previousLossParticulars?: string;
  contactDetailsAtLossPremises?: string;
  // Declaration & Signature
  agreeToDataPrivacy?: boolean;
  declarationTrue?: boolean;
  signature?: string;
  // System Information
  submittedBy?: string;
  formType?: string;
  [key: string]: any;
}

const AdminPoultryClaimsTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      const formsRef = collection(db, 'poultry-claims');
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const formsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp || data.submittedAt || data.createdAt || new Date(),
          createdAt: data.createdAt || data.submittedAt || data.timestamp
        };
      });

      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({ title: 'Error fetching data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: GridRowId) => {
    navigate(`/admin/form/poultry-claims/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, 'poultry-claims', selectedFormId));
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

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'poultry-claims', id), {
        status: newStatus
      });
      setForms(forms.map(form => 
        form.id === id ? { ...form, status: newStatus } : form
      ));
      toast({ title: 'Status updated successfully' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      let dateObj: Date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(timestamp)) {
          return timestamp;
        }
        dateObj = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        dateObj = timestamp;
      } else {
        return 'N/A';
      }

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const getValue = (form: FormData, field: string): string => {
    const value = form[field];
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return String(value);
  };

  const exportToCSV = () => {
    // CSV headers - all fields in logical order
    const headers = [
      'ID', 'Created At', 'Policy Number', 'Name of Insured', 'Farm Name and Address', 'Phone Number',
      'Date and Period of Loss', 'Cause of Death', 'Disease Specification', 'Other Cause Explanation',
      'Vet Surgeon Details', 'Number of Birds Died', 'Age of Birds at Mortality', 'Claim Estimate', 
      'Previous Loss Particulars', 'Contact Details at Loss Premises',
      'Status', 'Submitted At', 'Submitted By'
    ];

    // CSV rows - all data
    const rows = filteredForms.map(form => [
      form.id || 'N/A',
      formatDate(form.createdAt || form.timestamp || form.submittedAt),
      getValue(form, 'policyNumber'),
      getValue(form, 'nameOfInsured'),
      getValue(form, 'farmNameAndAddress'),
      getValue(form, 'phoneNumber'),
      getValue(form, 'dateAndPeriodOfLoss'),
      getValue(form, 'causeOfDeath'),
      getValue(form, 'diseaseSpecification'),
      getValue(form, 'otherCauseExplanation'),
      getValue(form, 'vetSurgeonDetails'),
      getValue(form, 'numberOfBirdsDied'),
      getValue(form, 'ageOfBirdsAtMortality'),
      getValue(form, 'claimEstimate'),
      getValue(form, 'previousLossParticulars'),
      getValue(form, 'contactDetailsAtLossPremises'),
      getValue(form, 'status'),
      formatDate(form.submittedAt),
      getValue(form, 'submittedBy')
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `poultry-claims-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({ title: 'CSV exported successfully' });
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = 
      (form.policyNumber && form.policyNumber.toLowerCase().includes(searchText.toLowerCase())) ||
      (form.nameOfInsured && form.nameOfInsured.toLowerCase().includes(searchText.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={() => handleView(params.id)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => {
            setSelectedFormId(params.id as string);
            setDeleteDialogOpen(true);
          }}
        />
      ],
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.createdAt || params.row.timestamp || params.row.submittedAt),
    },
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'policyNumber'),
    },
    {
      field: 'nameOfInsured',
      headerName: 'Name of Insured',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'nameOfInsured'),
    },
    {
      field: 'farmNameAndAddress',
      headerName: 'Farm Name & Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'farmNameAndAddress'),
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone Number',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'phoneNumber'),
    },
    {
      field: 'dateAndPeriodOfLoss',
      headerName: 'Date & Period of Loss',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'dateAndPeriodOfLoss'),
    },
    {
      field: 'causeOfDeath',
      headerName: 'Cause of Death',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'causeOfDeath'),
    },
    {
      field: 'diseaseSpecification',
      headerName: 'Disease Specification',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'diseaseSpecification'),
    },
    {
      field: 'otherCauseExplanation',
      headerName: 'Other Cause Explanation',
      width: 250,
      renderCell: (params: any) => getValue(params.row, 'otherCauseExplanation'),
    },
    {
      field: 'vetSurgeonDetails',
      headerName: 'Vet Surgeon Details',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'vetSurgeonDetails'),
    },
    {
      field: 'numberOfBirdsDied',
      headerName: 'No of Birds Died',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'numberOfBirdsDied'),
    },
    {
      field: 'ageOfBirdsAtMortality',
      headerName: 'Age of Birds at Mortality',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'ageOfBirdsAtMortality'),
    },
    {
      field: 'claimEstimate',
      headerName: 'Claim Estimate',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'claimEstimate'),
    },
    {
      field: 'previousLossParticulars',
      headerName: 'Previous Loss Particulars',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'previousLossParticulars'),
    },
    {
      field: 'contactDetailsAtLossPremises',
      headerName: 'Contact at Loss Premises',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'contactDetailsAtLossPremises'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: any) => {
        const status = params.row.status || 'pending';
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'processing': return 'info';
            default: return 'warning';
          }
        };
        return (
          <FormControl size="small" fullWidth>
            <Select
              value={status}
              onChange={(e) => handleStatusUpdate(params.row.id, e.target.value)}
              sx={{
                backgroundColor: getStatusColor(status) === 'success' ? '#e8f5e8' : 
                                getStatusColor(status) === 'error' ? '#ffeaea' : 
                                getStatusColor(status) === 'info' ? '#e3f2fd' : '#fff3cd',
                color: getStatusColor(status) === 'success' ? '#2e7d32' : 
                       getStatusColor(status) === 'error' ? '#d32f2f' : 
                       getStatusColor(status) === 'info' ? '#1976d2' : '#ed6c02',
                fontSize: '0.875rem',
                fontWeight: 500,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        );
      },
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted At',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.submittedAt || params.row.timestamp),
    },
    {
      field: 'submittedBy',
      headerName: 'Submitted By',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'submittedBy'),
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h4" component="h1" gutterBottom>
              Poultry Claims Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </div>
          
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search (Policy Number, Name)"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </div>

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredForms}
            columns={columns}
            loading={loading}
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
                paginationModel: { page: 0, pageSize: 50 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(128, 0, 32, 0.04)',
              },
            }}
          />
        </div>

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
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default AdminPoultryClaimsTable;
