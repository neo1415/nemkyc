import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
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
  FilterList
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
  },
});

interface FormData {
  id: string;
  status?: string;
  timestamp?: any;
  companyName?: string;
  emailAddress?: string;
  incorporationNumber?: string;
  telephoneNumber?: string;
  directors?: any[];
  [key: string]: any;
}

const CorporateCDDTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

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
      const formsRef = collection(db, 'corporate-kyc');
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const formsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: GridRowId) => {
    navigate(`/admin/corporate-cdd/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;
    
    try {
      await deleteDoc(doc(db, 'corporate-kyc', selectedFormId));
      setForms(forms.filter(form => form.id !== selectedFormId));
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
      
      toast({
        title: "Success",
        description: "Form deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive"
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'PPp');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Corporate CDD Forms Report', 20, yPosition);
    yPosition += 20;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${format(new Date(), 'PPp')}`, 20, yPosition);
    pdf.text(`Total Forms: ${filteredForms.length}`, 20, yPosition + 10);
    yPosition += 30;
    
    // Table headers
    const headers = ['Company Name', 'Email', 'Status', 'Submitted'];
    const columnWidths = [45, 45, 30, 40];
    let xPosition = 20;
    
    pdf.setFont(undefined, 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 10;
    
    // Table data
    pdf.setFont(undefined, 'normal');
    filteredForms.slice(0, 50).forEach(form => { // Limit to 50 entries
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      xPosition = 20;
      const rowData = [
        form.companyName || 'N/A',
        form.emailAddress || 'N/A',
        form.status || 'pending',
        formatDate(form.timestamp)
      ];
      
      rowData.forEach((data, index) => {
        const text = String(data).substring(0, 25); // Truncate long text
        pdf.text(text, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
    });
    
    pdf.save('Corporate_CDD_Report.pdf');
    
    toast({
      title: "Success",
      description: "Report exported successfully"
    });
  };

  const filteredForms = forms.filter(form => {
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    const matchesSearch = searchText === '' || 
      form.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      form.emailAddress?.toLowerCase().includes(searchText.toLowerCase()) ||
      form.incorporationNumber?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const columns: GridColDef[] = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 200,
      renderCell: (params) => (
        <div className="truncate">
          {params.value || 'N/A'}
        </div>
      )
    },
    {
      field: 'emailAddress',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <div className="truncate">
          {params.value || 'N/A'}
        </div>
      )
    },
    {
      field: 'incorporationNumber',
      headerName: 'Incorporation No.',
      width: 150,
      renderCell: (params) => (
        <div className="truncate">
          {params.value || 'N/A'}
        </div>
      )
    },
    {
      field: 'telephoneNumber',
      headerName: 'Phone',
      width: 130,
      renderCell: (params) => (
        <div className="truncate">
          {params.value || 'N/A'}
        </div>
      )
    },
    {
      field: 'directors',
      headerName: 'Directors Count',
      width: 120,
      renderCell: (params) => {
        const count = Array.isArray(params.value) ? params.value.length : 0;
        return <span>{count}</span>;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'pending'}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'timestamp',
      headerName: 'Submitted',
      width: 160,
      renderCell: (params) => (
        <div className="text-sm">
          {formatDate(params.value)}
        </div>
      )
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
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
      ]
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Corporate CDD Management</h1>
              <p className="text-muted-foreground">
                Manage corporate customer due diligence forms
              </p>
            </div>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportToPDF}
              sx={{ mb: 2 }}
            >
              Export Report
            </Button>
          </div>
          
          {/* Filters */}
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by company name, email, or incorporation number..."
              sx={{ minWidth: 300 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
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
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
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
            <Typography>
              Are you sure you want to delete this form? This action cannot be undone.
            </Typography>
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

export default CorporateCDDTable;