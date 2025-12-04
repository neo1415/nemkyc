import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Button, Box, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useNavigate } from 'react-router-dom';
import { useAdminTable } from '../../hooks/useAdminTable';

const AdminCorporateKYCTable: React.FC = () => {
  const navigate = useNavigate();
  const {
    filteredForms,
    loading,
    filterValue,
    setFilterValue,
    handleExportCSV,
    formatDate,
  } = useAdminTable({
    collectionName: 'corporate-kyc',
    title: 'Corporate KYC Management',
    searchFields: ['companyName', 'rcNumber', 'email', 'phoneNumber'],
    viewRoute: '/admin/form/corporate-kyc',
  });

  const columns: GridColDef[] = [
    { field: 'companyName', headerName: 'Company Name', flex: 1, minWidth: 200 },
    { field: 'rcNumber', headerName: 'RC Number', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'phoneNumber', headerName: 'Phone', flex: 1, minWidth: 150 },
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 120 },
    { 
      field: 'submittedAt', 
      headerName: 'Submitted At', 
      flex: 1, 
      minWidth: 180,
      renderCell: (params) => formatDate(params.row.timestamp || params.row.submittedAt, true)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate(`/admin/form/corporate-kyc/${params.row.id}`)}
          sx={{
            borderColor: '#8B0000',
            color: '#8B0000',
            '&:hover': {
              borderColor: '#660000',
              backgroundColor: 'rgba(139, 0, 0, 0.04)',
            },
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ color: '#8B0000', fontWeight: 600 }}>
          Corporate KYC Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={() => handleExportCSV(columns)}
          sx={{
            backgroundColor: '#8B0000',
            '&:hover': { backgroundColor: '#660000' },
          }}
        >
          Export CSV
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by company name, RC number, email, or phone..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8B0000' }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredForms}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#8B0000',
              color: '#FFD700',
              fontWeight: 600,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(139, 0, 0, 0.04)',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AdminCorporateKYCTable;
