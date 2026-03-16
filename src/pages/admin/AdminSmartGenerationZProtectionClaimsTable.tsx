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
  deleteDoc
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
  // Policy Information
  policyNumber?: string;
  periodOfCoverFrom?: any;
  periodOfCoverTo?: any;
  // Insured Details
  nameOfInsured?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Details of Loss
  accidentDate?: any;
  accidentTime?: string;
  accidentLocation?: string;
  accidentDescription?: string;
  injuryDescription?: string;
  doctorNameAddress?: string;
  isUsualDoctor?: string;
  totalIncapacityFrom?: any;
  totalIncapacityTo?: any;
  partialIncapacityFrom?: any;
  partialIncapacityTo?: any;
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;
  // Witnesses
  witnesses?: any[];
  // Declaration & Signature
  agreeToDataPrivacy?: boolean;
  signature?: string;
  supportingDocuments?: string;
  // System Information
  submittedBy?: string;
  formType?: string;
  [key: string]: any;
}

const AdminSmartGenerationZProtectionClaimsTable: React.FC = () => {
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
      const formsRef = collection(db, 'smart-generation-z-protection-claims');
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
    navigate(`/admin/form/smart-generation-z-protection-claims/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, 'smart-generation-z-protection-claims', selectedFormId));
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

  const formatWitnesses = (witnesses: any[]): string => {
    if (!witnesses || !Array.isArray(witnesses) || witnesses.length === 0) {
      return 'N/A';
    }
    
    return witnesses.map((witness, index) => 
      `Witness ${index + 1}: ${witness.name || 'N/A'} - ${witness.address || 'N/A'}`
    ).join('; ');
  };

  const exportToCSV = () => {
    // CSV headers - all fields in logical order
    const headers = [
      'ID', 'Created At', 'Policy Number', 'Cover From', 'Cover To',
      'Name of Insured', 'Address', 'Phone', 'Email',
      'Accident Date', 'Accident Time', 'Accident Location', 'Accident Description', 'Injury Description',
      'Doctor Name and Address', 'Is Usual Doctor',
      'Total Incapacity From', 'Total Incapacity To', 'Partial Incapacity From', 'Partial Incapacity To',
      'Other Insurer Name', 'Other Insurer Address', 'Other Insurer Policy',
      'Witnesses', 'Status', 'Submitted At', 'Submitted By'
    ];

    // CSV rows - all data
    const rows = filteredForms.map(form => [
      form.id || 'N/A',
      formatDate(form.createdAt || form.timestamp || form.submittedAt),
      getValue(form, 'policyNumber'),
      formatDate(form.periodOfCoverFrom),
      formatDate(form.periodOfCoverTo),
      getValue(form, 'nameOfInsured'),
      getValue(form, 'address'),
      getValue(form, 'phone'),
      getValue(form, 'email'),
      formatDate(form.accidentDate),
      getValue(form, 'accidentTime'),
      getValue(form, 'accidentLocation'),
      getValue(form, 'accidentDescription'),
      getValue(form, 'injuryDescription'),
      getValue(form, 'doctorNameAddress'),
      getValue(form, 'isUsualDoctor'),
      formatDate(form.totalIncapacityFrom),
      formatDate(form.totalIncapacityTo),
      formatDate(form.partialIncapacityFrom),
      formatDate(form.partialIncapacityTo),
      getValue(form, 'otherInsurerName'),
      getValue(form, 'otherInsurerAddress'),
      getValue(form, 'otherInsurerPolicyNumber'),
      formatWitnesses(form.witnesses),
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
    link.download = `smart-generation-z-protection-claims-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({ title: 'CSV exported successfully' });
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = Object.values(form).some(value => 
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
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
    // Policy Information
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'policyNumber'),
    },
    {
      field: 'periodOfCoverFrom',
      headerName: 'Cover From',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.periodOfCoverFrom),
    },
    {
      field: 'periodOfCoverTo',
      headerName: 'Cover To',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.periodOfCoverTo),
    },
    // Insured Details
    {
      field: 'nameOfInsured',
      headerName: 'Name of Insured',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'nameOfInsured'),
    },
    {
      field: 'address',
      headerName: 'Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'address'),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'phone'),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'email'),
    },
    // Details of Loss
    {
      field: 'accidentDate',
      headerName: 'Accident Date',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.accidentDate),
    },
    {
      field: 'accidentTime',
      headerName: 'Accident Time',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'accidentTime'),
    },
    {
      field: 'accidentLocation',
      headerName: 'Accident Location',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'accidentLocation'),
    },
    {
      field: 'accidentDescription',
      headerName: 'Accident Description',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'accidentDescription'),
    },
    {
      field: 'injuryDescription',
      headerName: 'Injury Description',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'injuryDescription'),
    },
    {
      field: 'doctorNameAddress',
      headerName: 'Doctor Name & Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'doctorNameAddress'),
    },
    {
      field: 'isUsualDoctor',
      headerName: 'Is Usual Doctor',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'isUsualDoctor'),
    },
    {
      field: 'totalIncapacityFrom',
      headerName: 'Total Incapacity From',
      width: 150,
      renderCell: (params: any) => formatDate(params.row.totalIncapacityFrom),
    },
    {
      field: 'totalIncapacityTo',
      headerName: 'Total Incapacity To',
      width: 150,
      renderCell: (params: any) => formatDate(params.row.totalIncapacityTo),
    },
    {
      field: 'partialIncapacityFrom',
      headerName: 'Partial Incapacity From',
      width: 160,
      renderCell: (params: any) => formatDate(params.row.partialIncapacityFrom),
    },
    {
      field: 'partialIncapacityTo',
      headerName: 'Partial Incapacity To',
      width: 160,
      renderCell: (params: any) => formatDate(params.row.partialIncapacityTo),
    },
    {
      field: 'otherInsurerName',
      headerName: 'Other Insurer Name',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'otherInsurerName'),
    },
    {
      field: 'otherInsurerAddress',
      headerName: 'Other Insurer Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'otherInsurerAddress'),
    },
    {
      field: 'otherInsurerPolicyNumber',
      headerName: 'Other Insurer Policy',
      width: 160,
      renderCell: (params: any) => getValue(params.row, 'otherInsurerPolicyNumber'),
    },
    // Witnesses
    {
      field: 'witnesses',
      headerName: 'Witnesses',
      width: 250,
      renderCell: (params: any) => formatWitnesses(params.row.witnesses),
    },
    // System Information
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => {
        const status = params.row.status || 'pending';
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            default: return 'warning';
          }
        };
        return (
          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: getStatusColor(status) === 'success' ? '#e8f5e8' : 
                              getStatusColor(status) === 'error' ? '#ffeaea' : '#fff3cd',
              color: getStatusColor(status) === 'success' ? '#2e7d32' : 
                     getStatusColor(status) === 'error' ? '#d32f2f' : '#ed6c02',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            {status}
          </Box>
        );
      },
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted At',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.submittedAt),
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
              Smart Generation Z Protection Claims Management
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
              label="Search"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 200 }}
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

export default AdminSmartGenerationZProtectionClaimsTable;