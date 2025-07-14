import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import { Box, Paper, Typography, TextField, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon, Search as SearchIcon } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AllRiskClaimData {
  id: string;
  createdAt: string;
  policyNumber: string;
  nameOfInsured: string;
  typeOfClaim: string;
  dateOfOccurrence: string;
  estimateOfLoss: number;
  status: string;
  propertyItems: any[];
  [key: string]: any;
}

const AdminAllRiskClaimsTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claims, setClaims] = useState<AllRiskClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/unauthorized');
      return;
    }
    fetchClaims();
  }, [isAdmin, navigate]);

  const fetchClaims = async () => {
    try {
      const claimsRef = collection(db, 'all-risk-claims');
      const q = query(claimsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const claimsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AllRiskClaimData[];
      
      setClaims(claimsData);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error",
        description: "Failed to fetch claims data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this claim?')) {
      try {
        await deleteDoc(doc(db, 'all-risk-claims', id));
        setClaims(claims.filter(claim => claim.id !== id));
        toast({
          title: "Success",
          description: "Claim deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting claim:', error);
        toast({
          title: "Error",
          description: "Failed to delete claim",
          variant: "destructive"
        });
      }
    }
  };

  const handleView = (id: string) => {
    navigate(`/admin/claims/all-risk/${id}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'processing':
        return '#fff3cd';
      case 'approved':
        return '#d4edda';
      case 'rejected':
        return '#f8d7da';
      default:
        return '#f8f9fa';
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = Object.values(claim).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<ViewIcon />}
          label="View"
          onClick={() => handleView(params.id as string)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDelete(params.id as string)}
        />
      ]
    },
    {
      field: 'createdAt',
      headerName: 'Date Created',
      width: 120,
      valueFormatter: (value) => formatDate(value)
    },
    {
      field: 'policyNumber',
      headerName: 'Policy Number',
      width: 150
    },
    {
      field: 'nameOfInsured',
      headerName: 'Name of Insured',
      width: 200
    },
    {
      field: 'typeOfClaim',
      headerName: 'Type of Claim',
      width: 150
    },
    {
      field: 'dateOfOccurrence',
      headerName: 'Date of Occurrence',
      width: 150,
      valueFormatter: (value) => formatDate(value)
    },
    {
      field: 'estimateOfLoss',
      headerName: 'Estimated Loss',
      width: 150,
      valueFormatter: (params) => params.value ? `₦${params.value.toLocaleString()}` : ''
    },
    {
      field: 'propertyItems',
      headerName: 'Property Items',
      width: 120,
      valueGetter: (params) => params.row.propertyItems?.length || 0,
      renderCell: (params) => (
        <Chip 
          label={`${params.value} items`} 
          size="small" 
          variant="outlined"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'Unknown'} 
          size="small"
          style={{
            backgroundColor: getStatusColor(params.value),
            color: '#000'
          }}
        />
      )
    }
  ];

  if (!isAdmin) {
    return null;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            color: '#8B0000',
            fontWeight: 'bold',
            marginBottom: 3
          }}
        >
          All Risk Claims Management
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, marginBottom: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ marginRight: 1, color: '#8B0000' }} />
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredClaims}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#8B0000',
                color: 'white',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
              }
            }}
            getRowClassName={(params) => {
              const status = params.row.status?.toLowerCase();
              if (status === 'processing') return 'processing-row';
              if (status === 'approved') return 'approved-row';
              if (status === 'rejected') return 'rejected-row';
              return '';
            }}
          />
        </Box>
      </Paper>

      <style>
        {`
          .processing-row {
            background-color: #fff3cd !important;
          }
          .approved-row {
            background-color: #d4edda !important;
          }
          .rejected-row {
            background-color: #f8d7da !important;
          }
        `}
      </style>
    </Box>
  );
};

export default AdminAllRiskClaimsTable;