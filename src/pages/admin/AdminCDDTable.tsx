import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Box, Button, Typography, Chip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Eye } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

interface AdminCDDTableProps {
  formType?: string;
}

const AdminCDDTable: React.FC<AdminCDDTableProps> = ({ formType }) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cddForms, setCddForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<GridColDef[]>([]);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchCDDForms();
  }, [user, isAdmin, navigate]);

  const fetchCDDForms = async () => {
    try {
      const cddCollections = formType ? 
        [`${formType}-cdd`] : 
        [
          'corporate-kyc',
          'corporate-kyc-form',
          'partners-kyc',
          'naicom-partners-cdd',
          'individual-kyc',
          'individual-kyc-form',
          'agents-kyc',
          'brokers-kyc'
        ];

      const allForms: any[] = [];
      
      for (const collectionName of cddCollections) {
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          allForms.push({
            id: doc.id,
            collection: collectionName,
            type: collectionName.replace('-cdd', '').replace('-', ' '),
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() ?? null,
            updatedAt: doc.data().updatedAt?.toDate?.() ?? null,
          });
        });
      }

      setCddForms(allForms);
      generateColumns(allForms);
    } catch (error) {
      console.error('Error fetching CDD forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch CDD forms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateColumns = (data: any[]) => {
    if (!data.length) return;

    const sample = data[0];
    const excludedFields = ['id', 'collection', 'type', 'createdAt', 'updatedAt'];
    const dynamicFields = Object.keys(sample).filter((key) => !excludedFields.includes(key));

    const dynamicColumns: GridColDef[] = dynamicFields.map((field) => ({
      field,
      headerName: field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      width: 180,
      renderCell: (params) => {
        const value = params.value;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object' && value?.name) return value.name;
        if (Array.isArray(value)) return `(${value.length}) items`;
        return value?.toString() || '—';
      },
    }));

    const defaultColumns: GridColDef[] = [
      { field: 'id', headerName: 'ID', width: 200 },
      { field: 'type', headerName: 'CDD Type', width: 150 },
      ...dynamicColumns,
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
        valueFormatter: (params: any) => 
          params.value instanceof Date ? params.value.toLocaleDateString() : 'N/A',
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

    setColumns(defaultColumns);
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {formType ? `${formType.replace('-', ' ')} CDD Management` : 'CDD Forms Management'}
        </Typography>
        
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={cddForms}
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

export default AdminCDDTable;
