
import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridPaginationModel,
  GridToolbar
} from '@mui/x-data-grid';
import {
  Chip,
  Tooltip,
  TextField,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CorporateCDDData {
  id: string;
  companyName: string;
  email: string;
  telephone: string;
  status: string;
  createdAt: any;
  incorporationNumber: string;
  incorporationState: string;
  businessNature: string;
  taxId: string;
  [key: string]: any;
}

const AdminCorporateKYCTable: React.FC = () => {
  const [rows, setRows] = useState<CorporateCDDData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Fetch data from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'corporate-kyc'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CorporateCDDData[];
      setRows(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter data based on search and status
  const filteredRows = rows.filter(row => {
    const matchesSearch = 
      row.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.telephone?.includes(searchText) ||
      row.incorporationNumber?.includes(searchText) ||
      row.taxId?.includes(searchText) ||
      row.businessNature?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleView = (id: string) => {
    navigate(`/admin/form/corporate-kyc/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Corporate CDD record?')) {
      try {
        await deleteDoc(doc(db, 'corporate-kyc', id));
        toast({ title: 'Corporate CDD record deleted successfully' });
      } catch (error) {
        console.error('Error deleting record:', error);
        toast({ title: 'Failed to delete record', variant: 'destructive' });
      }
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') return dateValue;
    if (dateValue.toDate) return dateValue.toDate().toLocaleDateString('en-GB');
    if (dateValue instanceof Date) return dateValue.toLocaleDateString('en-GB');
    return '';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={
            <Tooltip title="View Details">
              <VisibilityIcon />
            </Tooltip>
          }
          label="View"
          onClick={() => handleView(params.id.toString())}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <Tooltip title="Delete">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDelete(params.id.toString())}
        />
      ]
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: any) => (
        <Chip 
          label={params.value || 'Processing'} 
          color={getStatusColor(params.value)}
          size="small" 
        />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Date Created',
      width: 120,
      valueFormatter: (params: any) => formatDate(params.value)
    },
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 200
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200
    },
    {
      field: 'telephone',
      headerName: 'Telephone',
      width: 130
    },
    {
      field: 'incorporationNumber',
      headerName: 'RC Number',
      width: 130
    },
    {
      field: 'incorporationState',
      headerName: 'State',
      width: 100
    },
    {
      field: 'businessNature',
      headerName: 'Business Nature',
      width: 150
    },
    {
      field: 'taxId',
      headerName: 'Tax ID',
      width: 120
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" className="font-bold">
          Corporate CDD Records
        </Typography>
      </div>

      {/* Filters */}
      <Box className="flex gap-4 items-center">
        <TextField
          placeholder="Search by company name, email, phone, RC number, tax ID..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="mr-2 text-gray-400" />
          }}
          className="min-w-[300px]"
        />
        <TextField
          select
          label="Status"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[120px]"
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="processing">Processing</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      {/* Data Grid */}
      <Box className="h-[600px] w-full">
        <DataGrid
          rows={filteredRows}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          loading={loading}
          disableRowSelectionOnClick
          className="border-0"
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              csvOptions: {
                fileName: 'corporate-kyc-data',
                delimiter: ',',
                includeHeaders: true,
              },
            },
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e9ecef',
            },
          }}
        />
      </Box>
    </div>
  );
};

export default AdminCorporateKYCTable;
