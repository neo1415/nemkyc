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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

const AdminIndividualKYCTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [kycForms, setKycForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchKYCForms();
  }, [user, isAdmin, navigate]);

  const fetchKYCForms = async () => {
    try {
      const q = query(collection(db, 'Individual-kyc-form'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const forms = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle createdAt safely - check if it has toDate method before calling it
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || data.submittedAt || data.timestamp),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        };
      });

      setKycForms(forms);
    } catch (error) {
      console.error('Error fetching Individual KYC forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Individual KYC forms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      await deleteDoc(doc(db, 'Individual-kyc-form', deleteDialog.id));
      setKycForms(prev => prev.filter(form => form.id !== deleteDialog.id));
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

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text('Individual KYC Forms Report', 14, 22);
    
    const tableColumn = [
      'Created At', 'Office Location', 'Title', 'First Name', 'Middle Name', 'Last Name',
      'Contact Address', 'Occupation', 'Gender', 'Date of Birth', 'Mothers Maiden Name',
      'City', 'State', 'Country', 'Nationality', 'Residential Address', 'Mobile Number',
      'Email', 'BVN', 'ID Type', 'ID Number', 'Issuing Country', 'Source of Income',
      'Annual Income Range', 'Premium Payment Source', 'Bank Name', 'Account Number',
      'Bank Branch', 'Account Opening Date'
    ];
    
    const tableRows = kycForms.map(form => [
      form.createdAt?.toLocaleDateString() || 'N/A',
      form.officeLocation || 'N/A',
      form.title || 'N/A',
      form.firstName || 'N/A',
      form.middleName || 'N/A',
      form.lastName || 'N/A',
      form.contactAddress || 'N/A',
      form.occupation || 'N/A',
      form.gender || 'N/A',
      form.dateOfBirth || 'N/A',
      form.mothersMaidenName || 'N/A',
      form.city || 'N/A',
      form.state || 'N/A',
      form.country || 'N/A',
      form.nationality || 'N/A',
      form.residentialAddress || 'N/A',
      form.GSMno || 'N/A',
      form.emailAddress || 'N/A',
      form.BVN || 'N/A',
      form.identificationType || 'N/A',
      form.idNumber || 'N/A',
      form.issuingCountry || 'N/A',
      form.sourceOfIncome || form.sourceOfIncomeOther || 'N/A',
      form.annualIncomeRange || 'N/A',
      form.premiumPaymentSource || form.premiumPaymentSourceOther || 'N/A',
      form.bankName || 'N/A',
      form.accountNumber || 'N/A',
      form.bankBranch || 'N/A',
      form.accountOpeningDate || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save('individual-kyc-forms.pdf');
  };

  // Column definitions in exact form order - following the changelog methodology
  const columns: GridColDef[] = [
    // Action columns first (as per changelog)
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
          onClick={() => navigate(`/admin/form/Individual-kyc-form/${params.id}`)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => setDeleteDialog({ open: true, id: params.id as string })}
        />,
      ],
    },
    // Created At column second (as per changelog)
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params) => formatDate(params.row.createdAt || params.row.timestamp || params.row.submittedAt),
    },
    // All form fields in exact order they appear in the form (using renderCell as per changelog)
    {
      field: 'officeLocation',
      headerName: 'Office Location',
      width: 150,
      renderCell: (params) => params.row.officeLocation || 'N/A',
    },
    {
      field: 'title',
      headerName: 'Title',
      width: 100,
      renderCell: (params) => params.row.title || 'N/A',
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
      field: 'contactAddress',
      headerName: 'Contact Address',
      width: 180,
      renderCell: (params) => params.row.contactAddress || 'N/A',
    },
    {
      field: 'occupation',
      headerName: 'Occupation',
      width: 130,
      renderCell: (params) => params.row.occupation || 'N/A',
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 100,
      renderCell: (params) => params.row.gender || 'N/A',
    },
    {
      field: 'dateOfBirth',
      headerName: 'Date of Birth',
      width: 130,
      renderCell: (params) => params.row.dateOfBirth || 'N/A',
    },
    {
      field: 'mothersMaidenName',
      headerName: 'Mothers Maiden Name',
      width: 160,
      renderCell: (params) => params.row.mothersMaidenName || 'N/A',
    },
    {
      field: 'employersName',
      headerName: 'Employers Name',
      width: 150,
      renderCell: (params) => params.row.employersName || 'N/A',
    },
    {
      field: 'employersTelephoneNumber',
      headerName: 'Employers Telephone',
      width: 150,
      renderCell: (params) => params.row.employersTelephoneNumber || 'N/A',
    },
    {
      field: 'employersAddress',
      headerName: 'Employers Address',
      width: 180,
      renderCell: (params) => params.row.employersAddress || 'N/A',
    },
    {
      field: 'city',
      headerName: 'City',
      width: 120,
      renderCell: (params) => params.row.city || 'N/A',
    },
    {
      field: 'state',
      headerName: 'State',
      width: 120,
      renderCell: (params) => params.row.state || 'N/A',
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
      renderCell: (params) => params.row.country || 'N/A',
    },
    {
      field: 'nationality',
      headerName: 'Nationality',
      width: 120,
      renderCell: (params) => params.row.nationality || 'N/A',
    },
    {
      field: 'residentialAddress',
      headerName: 'Residential Address',
      width: 180,
      renderCell: (params) => params.row.residentialAddress || 'N/A',
    },
    {
      field: 'GSMno',
      headerName: 'Mobile Number',
      width: 140,
      renderCell: (params) => params.row.GSMno || 'N/A',
    },
    {
      field: 'emailAddress',
      headerName: 'Email Address',
      width: 180,
      renderCell: (params) => params.row.emailAddress || 'N/A',
    },
    {
      field: 'taxIDNo',
      headerName: 'Tax ID Number',
      width: 130,
      renderCell: (params) => params.row.taxIDNo || 'N/A',
    },
    {
      field: 'BVN',
      headerName: 'BVN',
      width: 130,
      renderCell: (params) => params.row.BVN || 'N/A',
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
      field: 'issuingCountry',
      headerName: 'Issuing Country',
      width: 130,
      renderCell: (params) => params.row.issuingCountry || 'N/A',
    },
    {
      field: 'issuedDate',
      headerName: 'Issued Date',
      width: 120,
      renderCell: (params) => params.row.issuedDate || 'N/A',
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 120,
      renderCell: (params) => params.row.expiryDate || 'N/A',
    },
    // Handle conditional fields properly (as per changelog methodology)
    {
      field: 'sourceOfIncome',
      headerName: 'Source of Income',
      width: 150,
      renderCell: (params) => {
        return params.row.sourceOfIncome || params.row.sourceOfIncomeOther || 'N/A';
      }
    },
    {
      field: 'annualIncomeRange',
      headerName: 'Annual Income Range',
      width: 160,
      renderCell: (params) => params.row.annualIncomeRange || 'N/A',
    },
    {
      field: 'premiumPaymentSource',
      headerName: 'Premium Payment Source',
      width: 180,
      renderCell: (params) => {
        return params.row.premiumPaymentSource || params.row.premiumPaymentSourceOther || 'N/A';
      }
    },
    // Account Details
    {
      field: 'bankName',
      headerName: 'Bank Name',
      width: 150,
      renderCell: (params) => params.row.bankName || 'N/A',
    },
    {
      field: 'accountNumber',
      headerName: 'Account Number',
      width: 140,
      renderCell: (params) => params.row.accountNumber || 'N/A',
    },
    {
      field: 'bankBranch',
      headerName: 'Bank Branch',
      width: 130,
      renderCell: (params) => params.row.bankBranch || 'N/A',
    },
    {
      field: 'accountOpeningDate',
      headerName: 'Account Opening Date',
      width: 160,
      renderCell: (params) => params.row.accountOpeningDate || 'N/A',
    },
    // Foreign Account Details (Optional)
    {
      field: 'bankName2',
      headerName: 'Foreign Bank Name',
      width: 150,
      renderCell: (params) => params.row.bankName2 || 'N/A',
    },
    {
      field: 'accountNumber2',
      headerName: 'Foreign Account Number',
      width: 160,
      renderCell: (params) => params.row.accountNumber2 || 'N/A',
    },
    {
      field: 'bankBranch2',
      headerName: 'Foreign Bank Branch',
      width: 150,
      renderCell: (params) => params.row.bankBranch2 || 'N/A',
    },
    {
      field: 'accountOpeningDate2',
      headerName: 'Foreign Account Opening Date',
      width: 190,
      renderCell: (params) => params.row.accountOpeningDate2 || 'N/A',
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
              Individual KYC Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToPDF}
            >
              Export PDF
            </Button>
          </div>
        </div>
        
        <div style={{ height: 600, width: '100%' }}>
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
        </div>

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this Individual KYC form? This action cannot be undone.
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

export default AdminIndividualKYCTable;
