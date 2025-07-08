import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Button, Typography, Chip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Eye, Download } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

interface AdminKYCTableProps {
  formType?: string;
}

const AdminKYCTable: React.FC<AdminKYCTableProps> = ({ formType }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kycForms, setKycForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchKYCForms();
  }, [user, isAdmin, navigate]);

  const fetchKYCForms = async () => {
    try {
      const kycCollections = formType ? 
        [`${formType}-kyc`] : 
        [
          'individual-kyc',
          'corporate-kyc'
        ];

      const allForms: any[] = [];
      
      for (const collectionName of kycCollections) {
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          allForms.push({
            id: doc.id,
            collection: collectionName,
            type: collectionName.replace('-kyc', '').replace('-', ' '),
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          });
        });
      }

      setKycForms(allForms);
    } catch (error) {
      console.error('Error fetching KYC forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch KYC forms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'type', headerName: 'KYC Type', width: 150 },
    { field: 'firstName', headerName: 'First Name', width: 150 },
    { field: 'lastName', headerName: 'Last Name', width: 150 },
    { field: 'companyName', headerName: 'Company', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <Chip 
          label={params.value || 'completed'} 
          color={params.value === 'completed' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Submitted',
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleDateString() || 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Eye size={16} />}
            onClick={() => navigate(`/admin/form/${params.row.collection}/${params.row.id}`)}
          >
            View
          </Button>
        </Box>
      ),
    },
  ];

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {formType ? `${formType} KYC Management` : 'KYC Forms Management'}
        </Typography>
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={kycForms}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AdminKYCTable;