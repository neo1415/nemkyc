import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridPaginationModel
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
  phoneNumber: string;
  status: string;
  createdAt: any;
  rcNumber: string;
  incorporationState: string;
  businessNature: string;
  contactPersonName: string;
  [key: string]: any;
}

const AdminCorporateCDDTable: React.FC = () => {
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
    console.log('🔍 AdminCorporateCDDTable: Starting to fetch data from cdd-forms collection');
    
    const q = query(
      collection(db, 'cdd-forms'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('🔍 AdminCorporateCDDTable: Received snapshot with', querySnapshot.docs.length, 'documents');
      
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        console.log('🔍 AdminCorporateCDDTable: Document data:', { id: doc.id, ...docData });
        return {
          id: doc.id,
          ...docData
        };
      }) as CorporateCDDData[];
      
      console.log('🔍 AdminCorporateCDDTable: Processed data array:', data);
      setRows(data);
      setLoading(false);
    }, (error) => {
      console.error('🔍 AdminCorporateCDDTable: Error fetching data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter data based on search and status
  const filteredRows = rows.filter(row => {
    // First filter by form type for corporate CDD
    const isCorporateCDD = row.formType === 'corporate-cdd';
    console.log('🔍 AdminCorporateCDDTable: Row formType:', row.formType, 'isCorporateCDD:', isCorporateCDD);
    
    if (!isCorporateCDD) return false;
    
    const matchesSearch = 
      row.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.phoneNumber?.includes(searchText) ||
      row.rcNumber?.includes(searchText) ||
      row.contactPersonName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.businessNature?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    
    console.log('🔍 AdminCorporateCDDTable: Filter results for row:', { 
      id: row.id, 
      formType: row.formType,
      matchesSearch, 
      matchesStatus, 
      finalResult: matchesSearch && matchesStatus 
    });
    
    return matchesSearch && matchesStatus;
  });

  console.log('🔍 AdminCorporateCDDTable: Total rows:', rows.length, 'Filtered rows:', filteredRows.length);

  const handleView = (id: string) => {
    navigate(`/admin/form-viewer/cdd-forms/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Corporate CDD record?')) {
      try {
        await deleteDoc(doc(db, 'cdd-forms', id));
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
      field: 'contactPersonName',
      headerName: 'Contact Person',
      width: 150
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 130
    },
    {
      field: 'rcNumber',
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
          placeholder="Search by company name, contact person, email, phone, RC number..."
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

export default AdminCorporateCDDTable;