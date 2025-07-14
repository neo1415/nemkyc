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

interface CorporateKYCData {
  id: string;
  insured: string;
  contactPerson: string;
  emailAddress: string;
  phoneNumber: string;
  status: string;
  createdAt: any;
  ownershipOfCompany: string;
  website: string;
  companyRegNumber: string;
  taxIdentificationNumber: string;
  directors: any[];
  [key: string]: any;
}

const AdminCorporateKYCTable: React.FC = () => {
  const [rows, setRows] = useState<CorporateKYCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<CorporateKYCData | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'corporate-kyc-form'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CorporateKYCData[];
      setRows(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter data based on search and status
  const filteredRows = rows.filter(row => {
    const matchesSearch = 
      row.insured?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.contactPerson?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.emailAddress?.toLowerCase().includes(searchText.toLowerCase()) ||
      row.phoneNumber?.includes(searchText) ||
      row.companyRegNumber?.includes(searchText) ||
      row.taxIdentificationNumber?.includes(searchText);
    
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleView = (record: CorporateKYCData) => {
    setSelectedRecord(record);
    setShowViewer(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Corporate KYC record?')) {
      try {
        await deleteDoc(doc(db, 'corporate-kyc-form', id));
        toast({ title: 'Corporate KYC record deleted successfully' });
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
      field: 'insured',
      headerName: 'Company Name',
      width: 200
    },
    {
      field: 'contactPerson',
      headerName: 'Contact Person',
      width: 150
    },
    {
      field: 'emailAddress',
      headerName: 'Email',
      width: 200
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      width: 130
    },
    {
      field: 'ownershipOfCompany',
      headerName: 'Ownership',
      width: 120
    },
    {
      field: 'companyRegNumber',
      headerName: 'Reg Number',
      width: 130
    },
    {
      field: 'taxIdentificationNumber',
      headerName: 'Tax ID',
      width: 130
    },
    {
      field: 'directors',
      headerName: 'Directors',
      width: 100,
      valueGetter: (params: any) => params.row.directors?.length || 0,
      renderCell: (params: any) => (
        <Chip 
          label={`${params.value} directors`} 
          size="small" 
          variant="outlined"
        />
      )
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
          Corporate KYC Records
        </Typography>
      </div>

      {/* Filters */}
      <Box className="flex gap-4 items-center">
        <TextField
          placeholder="Search by company, contact, email, or registration..."
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="mr-2 text-gray-400" />
          }}
          className="min-w-[350px]"
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
        <DialogTitle>Corporate KYC Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Company Name:</strong> {selectedRecord.insured}
                </div>
                <div>
                  <strong>Contact Person:</strong> {selectedRecord.contactPerson}
                </div>
                <div>
                  <strong>Email:</strong> {selectedRecord.emailAddress}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedRecord.phoneNumber}
                </div>
                <div>
                  <strong>Ownership:</strong> {selectedRecord.ownershipOfCompany}
                </div>
                <div>
                  <strong>Registration Number:</strong> {selectedRecord.companyRegNumber}
                </div>
                <div>
                  <strong>Tax ID:</strong> {selectedRecord.taxIdentificationNumber}
                </div>
                <div>
                  <strong>Website:</strong> {selectedRecord.website}
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
                <strong>Office Address:</strong>
                <p className="mt-1 text-gray-600">{selectedRecord.officeAddress}</p>
              </div>
              
              <div className="mt-4">
                <strong>Nature of Business:</strong>
                <p className="mt-1 text-gray-600">{selectedRecord.natureOfBusiness}</p>
              </div>
              
              {selectedRecord.directors && selectedRecord.directors.length > 0 && (
                <div className="mt-4">
                  <strong>Directors ({selectedRecord.directors.length}):</strong>
                  <div className="mt-2 space-y-2">
                    {selectedRecord.directors.map((director: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <p><strong>Name:</strong> {director.firstName} {director.lastName}</p>
                        <p><strong>Position:</strong> {director.position}</p>
                        {director.email && <p><strong>Email:</strong> {director.email}</p>}
                        {director.phone && <p><strong>Phone:</strong> {director.phone}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <strong>Year Incorporated:</strong> {selectedRecord.yearIncorporated}
                </div>
                <div>
                  <strong>Annual Turnover:</strong> {selectedRecord.annualTurnover}
                </div>
                <div>
                  <strong>Number of Employees:</strong> {selectedRecord.averageNoOfEmployees}
                </div>
                <div>
                  <strong>Anticipated Premium:</strong> {selectedRecord.anticipatedAnnualPremium}
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

export default AdminCorporateKYCTable;
