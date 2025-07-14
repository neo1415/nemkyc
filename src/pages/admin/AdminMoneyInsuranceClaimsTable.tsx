import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { Button, TextField, Box, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Trash2, Eye } from 'lucide-react';

interface MoneyInsuranceClaimData {
  id: string;
  policyNumber: string;
  companyName: string;
  email: string;
  phone: string;
  lossAmount: number;
  lossLocation: string;
  status: string;
  createdAt: string;
  timestamp: any;
  [key: string]: any;
}

const AdminMoneyInsuranceClaimsTable: React.FC = () => {
  const [data, setData] = useState<MoneyInsuranceClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(query(collection(db, 'money-insurance-claims'), orderBy('timestamp', 'desc')));
      
      const fetchedData: MoneyInsuranceClaimData[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        fetchedData.push({
          id: doc.id,
          ...docData,
          // Format dates
          createdAt: docData.createdAt || formatDate(docData.timestamp?.toDate()),
        } as MoneyInsuranceClaimData);
      });

      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear())}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteDoc(doc(db, 'money-insurance-claims', id));
        await fetchData();
        toast({
          title: 'Success',
          description: 'Entry deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete entry',
          variant: 'destructive',
        });
      }
    }
  };

  const handleView = (id: string) => {
    navigate(`/admin/form-viewer/money-insurance-claims/${id}`);
  };

  const filteredData = data.filter((row) => {
    const matchesSearch = 
      row.policyNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.lossLocation?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getRowClassName = (params: GridRowParams) => {
    if (params.row.status === 'processing') {
      return 'processing-row';
    }
    return '';
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleView(params.row.id)}
            sx={{ 
              minWidth: 'auto', 
              p: 0.5,
              color: '#8B5A3C',
              borderColor: '#8B5A3C',
              '&:hover': {
                backgroundColor: '#8B5A3C',
                color: 'white'
              }
            }}
          >
            <Eye size={16} />
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <Trash2 size={16} />
          </Button>
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date Created',
      width: 120,
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 200,
    },
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 150,
    },
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 180,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'lossLocation',
      headerName: 'Loss Location',
      width: 150,
    },
    {
      field: 'lossAmount',
      headerName: 'Loss Amount',
      width: 140,
      valueFormatter: (value: any) => 
        typeof value === 'number' ? `₦${value.toLocaleString()}` : String(value),
    },
    {
      field: 'policeNotified',
      headerName: 'Police Notified',
      width: 130,
      valueFormatter: (value: any) => value === 'yes' ? 'Yes' : 'No',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'medium',
            backgroundColor: 
              params.value === 'processing' ? '#FEF3C7' :
              params.value === 'approved' ? '#D1FAE5' :
              params.value === 'rejected' ? '#FEE2E2' : '#F3F4F6',
            color:
              params.value === 'processing' ? '#92400E' :
              params.value === 'approved' ? '#047857' :
              params.value === 'rejected' ? '#DC2626' : '#374151',
          }}
        >
          {params.value}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#8B5A3C', fontWeight: 'bold' }}>
        Money Insurance Claims Management
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by policy, company, email..."
          sx={{ minWidth: 300 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
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
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          loading={loading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          disableRowSelectionOnClick
          getRowClassName={getRowClassName}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#8B5A3C',
              color: 'white',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#FEF3C7',
            },
            '& .processing-row': {
              backgroundColor: '#FEF3C7 !important',
            },
            '& .processing-row:hover': {
              backgroundColor: '#FDE68A !important',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminMoneyInsuranceClaimsTable;