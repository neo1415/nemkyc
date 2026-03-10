import React, { useState, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Button, Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Visibility, Delete, GetApp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../hooks/use-toast';
import { auditService } from '../../services/auditService';

const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
    background: {
      default: '#ffffff',
    },
  },
});

const AdminIndividualNFIUTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nfiuForms, setNfiuForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchNFIUForms();
  }, [user, isAdmin, navigate]);

  const fetchNFIUForms = async () => {
    try {
      // Query both collections to get all Individual NFIU forms (old and new)
      const nfiuCollectionQuery = query(collection(db, 'individual-nfiu-form'), orderBy('submittedAt', 'desc'));
      const nfiuSnapshot = await getDocs(nfiuCollectionQuery);
      
      // Query formSubmissions collection for old Individual NFIU forms
      const formSubmissionsQuery = query(collection(db, 'formSubmissions'), orderBy('submittedAt', 'desc'));
      const formSubmissionsSnapshot = await getDocs(formSubmissionsQuery);
      
      // Process individual-nfiu-form collection
      const nfiuForms = nfiuSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : data.submittedAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          formType: 'NFIU',
          _sourceCollection: 'individual-nfiu-form', // Track source collection for routing
        };
      });
      
      // Process formSubmissions collection - filter for Individual NFIU forms only
      const oldNfiuForms = formSubmissionsSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : data.submittedAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
            formType: 'NFIU',
            _sourceCollection: 'formSubmissions', // Track source collection for routing
          };
        })
        .filter((form) => {
          // Filter for Individual NFIU forms based on formType field or presence of individual-specific fields
          const formType = form.formType?.toLowerCase() || '';
          const formVariant = form.formVariant?.toLowerCase() || '';
          return (
            formType.includes('individual') && formType.includes('nfiu') ||
            formVariant === 'individual' && formType.includes('nfiu') ||
            // Check for individual-specific fields as fallback
            (form.firstName && form.lastName && form.NIN && !form.incorporationNumber)
          );
        });
      
      // Combine both arrays and sort by submittedAt
      const allForms = [...nfiuForms, ...oldNfiuForms].sort((a, b) => {
        const dateA = a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt || 0);
        const dateB = b.submittedAt instanceof Date ? b.submittedAt : new Date(b.submittedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setNfiuForms(allForms);
    } catch (error) {
      console.error('Error fetching Individual NFIU forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Individual NFIU forms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      // Try to delete from individual-nfiu-form collection first
      try {
        await deleteDoc(doc(db, 'individual-nfiu-form', deleteDialog.id));
      } catch (error: any) {
        // If not found in individual-nfiu-form, try formSubmissions
        if (error.code === 'not-found') {
          await deleteDoc(doc(db, 'formSubmissions', deleteDialog.id));
        } else {
          throw error;
        }
      }
      
      setNfiuForms(prev => prev.filter(form => form.id !== deleteDialog.id));
      
      // Log admin action
      await auditService.logAdminAction({
        adminUserId: user?.uid || 'unknown',
        adminRole: user?.role,
        adminEmail: user?.email,
        formType: 'nfiu',
        formVariant: 'individual',
        submissionId: deleteDialog.id,
        action: 'delete'
      });
      
      toast({
        title: 'Success',
        description: 'Form deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete form',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      let dateObj: Date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(timestamp)) {
          return timestamp;
        }
        dateObj = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        dateObj = timestamp;
      } else {
        return 'N/A';
      }

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Form Type', 'Submitted At', 'Status', 'First Name', 'Middle Name', 'Last Name',
      'Date of Birth', 'Place of Birth', 'Nationality', 'Occupation',
      'NIN', 'BVN', 'Tax ID', 'ID Type', 'ID Number', 'Issuing Body',
      'Issued Date', 'Expiry Date', 'Email', 'Phone', 'Source of Income'
    ];

    const rows = nfiuForms.map(form => [
      form.id || 'N/A',
      form.formType || 'NFIU',
      form.submittedAt?.toLocaleDateString() || formatDate(form.submittedAt),
      form.status || 'N/A',
      form.firstName || 'N/A',
      form.middleName || 'N/A',
      form.lastName || 'N/A',
      form.dateOfBirth || 'N/A',
      form.placeOfBirth || 'N/A',
      form.nationality || 'N/A',
      form.occupation || 'N/A',
      form.NIN || 'N/A',
      form.BVN || 'N/A',
      form.taxIDNo || 'N/A',
      form.identificationType || 'N/A',
      form.idNumber || 'N/A',
      form.issuingBody || 'N/A',
      form.issuedDate || 'N/A',
      form.expiryDate || 'N/A',
      form.emailAddress || 'N/A',
      form.GSMno || 'N/A',
      form.sourceOfIncome || form.sourceOfIncomeOther || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `individual-nfiu-forms-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: 'Success',
      description: 'CSV exported successfully',
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      type: 'actions',
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="View"
          onClick={async () => {
            // Log admin action
            await auditService.logAdminAction({
              adminUserId: user?.uid || 'unknown',
              adminRole: user?.role,
              adminEmail: user?.email,
              formType: 'nfiu',
              formVariant: 'individual',
              submissionId: params.row.id as string,
              action: 'view'
            });
            // Route to the correct collection based on source
            const sourceCollection = params.row._sourceCollection || 'individual-nfiu-form';
            navigate(`/admin/form/${sourceCollection}/${params.row.id}`);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => setDeleteDialog({ open: true, id: params.row.id as string })}
        />,
      ],
    },
    {
      field: 'formType',
      headerName: 'Form Type',
      width: 100,
      renderCell: (params) => (
        <Chip label="NFIU" color="primary" size="small" />
      ),
    },
    {
      field: 'submittedAt',
      headerName: 'Submitted At',
      width: 130,
      renderCell: (params) => formatDate(params.row.submittedAt),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = params.row.status || 'processing';
        const color = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning';
        return <Chip label={status} color={color} size="small" />;
      },
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 130,
      renderCell: (params) => params.row.firstName || 'N/A',
    },
    {
      field: 'middleName',
      headerName: 'Middle Name',
      width: 130,
      renderCell: (params) => params.row.middleName || 'N/A',
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 130,
      renderCell: (params) => params.row.lastName || 'N/A',
    },
    {
      field: 'dateOfBirth',
      headerName: 'Date of Birth',
      width: 130,
      renderCell: (params) => formatDate(params.row.dateOfBirth),
    },
    {
      field: 'placeOfBirth',
      headerName: 'Place of Birth',
      width: 150,
      renderCell: (params) => params.row.placeOfBirth || 'N/A',
    },
    {
      field: 'nationality',
      headerName: 'Nationality',
      width: 120,
      renderCell: (params) => params.row.nationality || 'N/A',
    },
    {
      field: 'occupation',
      headerName: 'Occupation',
      width: 130,
      renderCell: (params) => params.row.occupation || 'N/A',
    },
    {
      field: 'NIN',
      headerName: 'NIN',
      width: 130,
      renderCell: (params) => params.row.NIN || 'N/A',
    },
    {
      field: 'BVN',
      headerName: 'BVN',
      width: 130,
      renderCell: (params) => params.row.BVN || 'N/A',
    },
    {
      field: 'taxIDNo',
      headerName: 'Tax ID',
      width: 130,
      renderCell: (params) => params.row.taxIDNo || 'N/A',
    },
    {
      field: 'identificationType',
      headerName: 'ID Type',
      width: 130,
      renderCell: (params) => params.row.identificationType || 'N/A',
    },
    {
      field: 'idNumber',
      headerName: 'ID Number',
      width: 130,
      renderCell: (params) => params.row.idNumber || 'N/A',
    },
    {
      field: 'issuingBody',
      headerName: 'Issuing Body',
      width: 130,
      renderCell: (params) => params.row.issuingBody || 'N/A',
    },
    {
      field: 'issuedDate',
      headerName: 'Issued Date',
      width: 120,
      renderCell: (params) => formatDate(params.row.issuedDate),
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 120,
      renderCell: (params) => formatDate(params.row.expiryDate),
    },
    {
      field: 'emailAddress',
      headerName: 'Email',
      width: 180,
      renderCell: (params) => params.row.emailAddress || 'N/A',
    },
    {
      field: 'GSMno',
      headerName: 'Phone',
      width: 140,
      renderCell: (params) => params.row.GSMno || 'N/A',
    },
    {
      field: 'sourceOfIncome',
      headerName: 'Source of Income',
      width: 150,
      renderCell: (params) => params.row.sourceOfIncome || params.row.sourceOfIncomeOther || 'N/A',
    },
  ];

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h4" component="h1" gutterBottom>
              Individual NFIU Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </div>
        </div>
        
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={nfiuForms}
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
        </div>

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this Individual NFIU form? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default AdminIndividualNFIUTable;
