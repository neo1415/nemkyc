import React, { useState, useEffect } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridPaginationModel
} from '@mui/x-data-grid';
import {
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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

interface KYCData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  status: string;
  createdAt: any;
  bvn: string;
  occupation: string;
  city: string;
  state: string;
  nationality: string;
  [key: string]: any;
}

const AdminIndividualKYCTable: React.FC = () => {
  const [rows, setRows] = useState<KYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<KYCData | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'Individual-kyc-form'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KYCData[];
      setRows(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter data based on search and status
  const filteredRows = rows.filter(row => {
    const matchesSearch = 
      row.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.mobileNumber?.includes(searchText) ||
      row.bvn?.includes(searchText);
    
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleView = (record: KYCData) => {
    setSelectedRecord(record);
    setShowViewer(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this KYC record?')) {
      try {
        await deleteDoc(doc(db, 'Individual-kyc-form', id));
        toast({ title: 'KYC record deleted successfully' });
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
      field: 'createdAt',
      headerName: 'Date Created',
      width: 120,
      valueFormatter: (params: any) => formatDate(params.value)
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 120
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 120
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200
    },
    {
      field: 'mobileNumber',
      headerName: 'Mobile',
      width: 130
    },
    {
      field: 'bvn',
      headerName: 'BVN',
      width: 120
    },
    {
      field: 'occupation',
      headerName: 'Occupation',
      width: 150
    },
    {
      field: 'city',
      headerName: 'City',
      width: 100
    },
    {
      field: 'state',
      headerName: 'State',
      width: 100
    },
    {
      field: 'nationality',
      headerName: 'Nationality',
      width: 100
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
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={
            <Tooltip title="View Details">
              <VisibilityIcon />
            </Tooltip>
          }
          label="View"
          onClick={() => handleView(params.row)}
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
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" className="font-bold">
          Individual KYC Records
        </Typography>
      </div>

      {/* Filters */}
      <Box className="flex gap-4 items-center">
        <TextField
          placeholder="Search by name, email, mobile, or BVN..."
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

      {/* Enhanced Form Viewer Dialog */}
      <Dialog 
        open={showViewer} 
        onClose={() => setShowViewer(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Individual KYC Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Name:</strong> {selectedRecord.firstName} {selectedRecord.middleName} {selectedRecord.lastName}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRecord.email}
                </div>
                <div>
                  <strong>Mobile:</strong> {selectedRecord.mobileNumber}
                </div>
                <div>
                  <strong>BVN:</strong> {selectedRecord.bvn}
                </div>
                <div>
                  <strong>Occupation:</strong> {selectedRecord.occupation}
                </div>
                <div>
                  <strong>City/State:</strong> {selectedRecord.city}, {selectedRecord.state}
                </div>
                <div>
                  <strong>Nationality:</strong> {selectedRecord.nationality}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Chip 
                    label={selectedRecord.status || 'Processing'} 
                    color={getStatusColor(selectedRecord.status)}
                    size="small" 
                    className="ml-2"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <strong>Contact Address:</strong>
                <p className="mt-1 text-gray-600">{selectedRecord.contactAddress}</p>
              </div>
              
              <div className="mt-4">
                <strong>Residential Address:</strong>
                <p className="mt-1 text-gray-600">{selectedRecord.residentialAddress}</p>
              </div>
              
              {selectedRecord.employersName && (
                <div className="mt-4">
                  <strong>Employer:</strong>
                  <p className="mt-1 text-gray-600">
                    {selectedRecord.employersName}
                    {selectedRecord.employersTelephone && ` - ${selectedRecord.employersTelephone}`}
                  </p>
                  {selectedRecord.employersAddress && (
                    <p className="text-gray-600">{selectedRecord.employersAddress}</p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <strong>Date of Birth:</strong> {formatDate(selectedRecord.dateOfBirth)}
                </div>
                <div>
                  <strong>Gender:</strong> {selectedRecord.gender}
                </div>
                <div>
                  <strong>ID Type:</strong> {selectedRecord.idType}
                </div>
                <div>
                  <strong>ID Number:</strong> {selectedRecord.identificationNumber}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewer(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminIndividualKYCTable;
