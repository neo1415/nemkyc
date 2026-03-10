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

const AdminCorporateNFIUTable: React.FC = () => {
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
      // Query both collections to get all Corporate NFIU forms (old and new)
      const nfiuCollectionQuery = query(collection(db, 'corporate-nfiu-form'), orderBy('submittedAt', 'desc'));
      const nfiuSnapshot = await getDocs(nfiuCollectionQuery);
      
      // Query formSubmissions collection for old Corporate NFIU forms
      const formSubmissionsQuery = query(collection(db, 'formSubmissions'), orderBy('submittedAt', 'desc'));
      const formSubmissionsSnapshot = await getDocs(formSubmissionsQuery);
      
      // Process corporate-nfiu-form collection
      const nfiuForms = nfiuSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : data.submittedAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          formType: 'NFIU',
          _sourceCollection: 'corporate-nfiu-form', // Track source collection for routing
        };
      });
      
      // Process formSubmissions collection - filter for Corporate NFIU forms only
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
        .filter((form: any) => {
          // Filter for Corporate NFIU forms based on formType field or presence of corporate-specific fields
          const formType = form.formType?.toLowerCase() || '';
          const formVariant = form.formVariant?.toLowerCase() || '';
          return (
            (formType.includes('corporate') && formType.includes('nfiu')) ||
            (formVariant === 'corporate' && formType.includes('nfiu')) ||
            // Check for corporate-specific fields as fallback
            (form.incorporationNumber && form.insured && !form.firstName)
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
      console.error('Error fetching Corporate NFIU forms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Corporate NFIU forms data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    
    try {
      // Try to delete from corporate-nfiu-form collection first
      try {
        await deleteDoc(doc(db, 'corporate-nfiu-form', deleteDialog.id));
      } catch (error: any) {
        // If not found in corporate-nfiu-form, try formSubmissions
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
        formVariant: 'corporate',
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

  const getValue = (form: any, field: string): string => {
    const value = form[field];
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return String(value);
  };

  const getDirectorValue = (form: any, directorIndex: number, field: string): string => {
    // Handle both array format and flat object format
    if (form.directors && Array.isArray(form.directors) && form.directors[directorIndex]) {
      const value = form.directors[directorIndex][field];
      return value !== null && value !== undefined && value !== '' ? String(value) : 'N/A';
    }
    
    // Handle flat object format (legacy)
    const flatFieldName = directorIndex === 0 ? field : `${field}2`;
    const value = form[flatFieldName];
    return value !== null && value !== undefined && value !== '' ? String(value) : 'N/A';
  };

  // Removed shouldShowConditionalField - no longer needed with simplified logic

  const exportToCSV = () => {
    // CSV headers - matching actual form fields only (NO cacNumber, BVNNumber, NINNumber at company level, NO employersName/Phone)
    const headers = [
      'ID', 'Created At',
      // Company Information
      'Company Name', 'Office Address', 'Ownership of Company', 'Website',
      'Incorporation Number', 'Incorporation State', 'Date of Incorporation',
      'Contact Person Mobile', 'Business Type', 'Tax ID Number', 'Email Address',
      'Premium Payment Source',
      // Director 1
      'Director 1 First Name', 'Director 1 Middle Name', 'Director 1 Last Name', 'Director 1 DOB',
      'Director 1 Place of Birth', 'Director 1 Nationality', 'Director 1 Country', 'Director 1 Occupation',
      'Director 1 Email', 'Director 1 Phone', 'Director 1 BVN', 'Director 1 NIN',
      'Director 1 Residential Address', 'Director 1 Tax ID', 'Director 1 ID Type', 'Director 1 ID Number',
      'Director 1 Issuing Body', 'Director 1 Issued Date', 'Director 1 Expiry Date', 'Director 1 Source of Income',
      // Director 2
      'Director 2 First Name', 'Director 2 Middle Name', 'Director 2 Last Name', 'Director 2 DOB',
      'Director 2 Place of Birth', 'Director 2 Nationality', 'Director 2 Country', 'Director 2 Occupation',
      'Director 2 Email', 'Director 2 Phone', 'Director 2 BVN', 'Director 2 NIN',
      'Director 2 Residential Address', 'Director 2 Tax ID', 'Director 2 ID Type', 'Director 2 ID Number',
      'Director 2 Issuing Body', 'Director 2 Issued Date', 'Director 2 Expiry Date', 'Director 2 Source of Income',
      // Account Details
      'Local Bank Name', 'Local Account Number', 'Local Bank Branch', 'Local Account Opening Date',
      'Foreign Bank Name', 'Foreign Account Number', 'Foreign Bank Branch', 'Foreign Account Opening Date',
      // Verification & Declaration
      'Verification Document', 'Signature'
    ];

    // CSV rows - all data matching actual form fields
    const rows = nfiuForms.map(form => {
      const getDir1 = (field: string) => getDirectorValue(form, 0, field);
      const getDir2 = (field: string) => getDirectorValue(form, 1, field);
      const getDir1Date = (field: string) => {
        if (form.directors && Array.isArray(form.directors) && form.directors[0]) {
          return formatDate(form.directors[0][field]);
        }
        return formatDate(form[field]);
      };
      const getDir2Date = (field: string) => {
        if (form.directors && Array.isArray(form.directors) && form.directors[1]) {
          return formatDate(form.directors[1][field]);
        }
        return formatDate(form[field + '2']);
      };
      const getDir1Income = () => {
        if (form.directors && Array.isArray(form.directors) && form.directors[0]) {
          const dir = form.directors[0];
          return dir.sourceOfIncome === 'Other' && dir.sourceOfIncomeOther ? dir.sourceOfIncomeOther : (dir.sourceOfIncome || 'N/A');
        }
        return form.sourceOfIncome === 'Other' && form.sourceOfIncomeOther ? form.sourceOfIncomeOther : (getValue(form, 'sourceOfIncome'));
      };
      const getDir2Income = () => {
        if (form.directors && Array.isArray(form.directors) && form.directors[1]) {
          const dir = form.directors[1];
          return dir.sourceOfIncome === 'Other' && dir.sourceOfIncomeOther ? dir.sourceOfIncomeOther : (dir.sourceOfIncome || 'N/A');
        }
        return form.sourceOfIncome2 === 'Other' && form.sourceOfIncomeOther2 ? form.sourceOfIncomeOther2 : (getValue(form, 'sourceOfIncome2'));
      };
      const getPremiumSource = () => {
        return form.premiumPaymentSource === 'Other' && form.premiumPaymentSourceOther
          ? getValue(form, 'premiumPaymentSourceOther')
          : getValue(form, 'premiumPaymentSource');
      };

      return [
        form.id || 'N/A',
        formatDate(form.submittedAt),
        // Company Information
        getValue(form, 'insured'), getValue(form, 'officeAddress'),
        getValue(form, 'ownershipOfCompany'), getValue(form, 'website'),
        getValue(form, 'incorporationNumber'), getValue(form, 'incorporationState'),
        formatDate(form.dateOfIncorporationRegistration),
        getValue(form, 'contactPersonNo'), getValue(form, 'businessTypeOccupation'),
        getValue(form, 'taxIDNo'), getValue(form, 'emailAddress'),
        getPremiumSource(),
        // Director 1
        getDir1('firstName'), getDir1('middleName'), getDir1('lastName'), getDir1Date('dob'),
        getDir1('placeOfBirth'), getDir1('nationality'), getDir1('country'), getDir1('occupation'),
        getDir1('email'), getDir1('phoneNumber'), getDir1('BVNNumber'), getDir1('NINNumber'),
        getDir1('residentialAddress'), getDir1('taxIDNumber'), getDir1('idType'), getDir1('idNumber'),
        getDir1('issuingBody'), getDir1Date('issuedDate'), getDir1Date('expiryDate'), getDir1Income(),
        // Director 2
        getDir2('firstName'), getDir2('middleName'), getDir2('lastName'), getDir2Date('dob'),
        getDir2('placeOfBirth'), getDir2('nationality'), getDir2('country'), getDir2('occupation'),
        getDir2('email'), getDir2('phoneNumber'), getDir2('BVNNumber'), getDir2('NINNumber'),
        getDir2('residentialAddress'), getDir2('taxIDNumber'), getDir2('idType'), getDir2('idNumber'),
        getDir2('issuingBody'), getDir2Date('issuedDate'), getDir2Date('expiryDate'), getDir2Income(),
        // Account Details
        getValue(form, 'localBankName'), getValue(form, 'localAccountNumber'),
        getValue(form, 'localBankBranch'), formatDate(form.localAccountOpeningDate),
        getValue(form, 'foreignBankName'), getValue(form, 'foreignAccountNumber'),
        getValue(form, 'foreignBankBranch'), formatDate(form.foreignAccountOpeningDate),
        // Verification & Declaration
        getValue(form, 'verificationDocUrl'), getValue(form, 'signature')
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `corporate-nfiu-forms-${new Date().toISOString().split('T')[0]}.csv`;
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
              formVariant: 'corporate',
              submissionId: params.row.id as string,
              action: 'view'
            });
            // Route to the correct collection based on source
            const sourceCollection = params.row._sourceCollection || 'corporate-nfiu-form';
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
      field: 'submittedAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.submittedAt),
    },
    // Company Information - in exact form order
    {
      field: 'insured',
      headerName: 'Company Name',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'insured'),
    },
    {
      field: 'officeAddress',
      headerName: 'Office Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'officeAddress'),
    },
    {
      field: 'ownershipOfCompany',
      headerName: 'Ownership of Company',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'ownershipOfCompany'),
    },
    {
      field: 'website',
      headerName: 'Website',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'website'),
    },
    {
      field: 'incorporationNumber',
      headerName: 'Incorporation Number',
      width: 160,
      renderCell: (params: any) => getValue(params.row, 'incorporationNumber'),
    },
    {
      field: 'incorporationState',
      headerName: 'Incorporation State',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'incorporationState'),
    },
    {
      field: 'dateOfIncorporationRegistration',
      headerName: 'Date of Incorporation',
      width: 150,
      renderCell: (params: any) => formatDate(params.row.dateOfIncorporationRegistration),
    },
    {
      field: 'contactPersonNo',
      headerName: 'Contact Person Mobile',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'contactPersonNo'),
    },
    {
      field: 'taxIDNo',
      headerName: 'Tax ID Number',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'taxIDNo'),
    },
    {
      field: 'emailAddress',
      headerName: 'Email Address',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'emailAddress'),
    },
    {
      field: 'businessTypeOccupation',
      headerName: 'Business Type',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'businessTypeOccupation'),
    },
    {
      field: 'premiumPaymentSource',
      headerName: 'Premium Payment Source',
      width: 180,
      renderCell: (params: any) => {
        const form = params.row;
        if (form.premiumPaymentSource === 'Other' && form.premiumPaymentSourceOther) {
          return getValue(form, 'premiumPaymentSourceOther');
        }
        return getValue(form, 'premiumPaymentSource');
      },
    },
    // Directors Information - Director 1
    {
      field: 'director1FirstName',
      headerName: 'Director 1 First Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'firstName'),
    },
    {
      field: 'director1MiddleName',
      headerName: 'Director 1 Middle Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'middleName'),
    },
    {
      field: 'director1LastName',
      headerName: 'Director 1 Last Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'lastName'),
    },
    {
      field: 'director1DOB',
      headerName: 'Director 1 Date of Birth',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
          return formatDate(params.row.directors[0].dob);
        }
        return formatDate(params.row.dob);
      },
    },
    {
      field: 'director1PlaceOfBirth',
      headerName: 'Director 1 Place of Birth',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'placeOfBirth'),
    },
    {
      field: 'director1Nationality',
      headerName: 'Director 1 Nationality',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'nationality'),
    },
    {
      field: 'director1Country',
      headerName: 'Director 1 Country',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'country'),
    },
    {
      field: 'director1Occupation',
      headerName: 'Director 1 Occupation',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'occupation'),
    },
    {
      field: 'director1Email',
      headerName: 'Director 1 Email',
      width: 200,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'email'),
    },
    {
      field: 'director1PhoneNumber',
      headerName: 'Director 1 Phone Number',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'phoneNumber'),
    },
    {
      field: 'director1BVN',
      headerName: 'Director 1 BVN',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'BVNNumber'),
    },
    {
      field: 'director1NIN',
      headerName: 'Director 1 NIN',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'NINNumber'),
    },
    {
      field: 'director1ResidentialAddress',
      headerName: 'Director 1 Residential Address',
      width: 200,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'residentialAddress'),
    },
    {
      field: 'director1TaxID',
      headerName: 'Director 1 Tax ID',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'taxIDNumber'),
    },
    {
      field: 'director1IDType',
      headerName: 'Director 1 ID Type',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'idType'),
    },
    {
      field: 'director1IDNumber',
      headerName: 'Director 1 ID Number',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'idNumber'),
    },
    {
      field: 'director1IssuingBody',
      headerName: 'Director 1 Issuing Body',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'issuingBody'),
    },
    {
      field: 'director1IssuedDate',
      headerName: 'Director 1 Issued Date',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
          return formatDate(params.row.directors[0].issuedDate);
        }
        return formatDate(params.row.issuedDate);
      },
    },
    {
      field: 'director1ExpiryDate',
      headerName: 'Director 1 Expiry Date',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
          return formatDate(params.row.directors[0].expiryDate);
        }
        return formatDate(params.row.expiryDate);
      },
    },
    {
      field: 'director1SourceOfIncome',
      headerName: 'Director 1 Source of Income',
      width: 180,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[0]) {
          const director = params.row.directors[0];
          if (director.sourceOfIncome === 'Other' && director.sourceOfIncomeOther) {
            return director.sourceOfIncomeOther;
          }
          return director.sourceOfIncome || 'N/A';
        }
        // Handle flat format
        if (params.row.sourceOfIncome === 'Other' && params.row.sourceOfIncomeOther) {
          return params.row.sourceOfIncomeOther;
        }
        return getValue(params.row, 'sourceOfIncome');
      },
    },
    // Directors Information - Director 2 (if exists)
    {
      field: 'director2FirstName',
      headerName: 'Director 2 First Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'firstName'),
    },
    {
      field: 'director2MiddleName',
      headerName: 'Director 2 Middle Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'middleName'),
    },
    {
      field: 'director2LastName',
      headerName: 'Director 2 Last Name',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'lastName'),
    },
    {
      field: 'director2DOB',
      headerName: 'Director 2 Date of Birth',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
          return formatDate(params.row.directors[1].dob);
        }
        return formatDate(params.row.dob2);
      },
    },
    {
      field: 'director2PlaceOfBirth',
      headerName: 'Director 2 Place of Birth',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'placeOfBirth'),
    },
    {
      field: 'director2Nationality',
      headerName: 'Director 2 Nationality',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'nationality'),
    },
    {
      field: 'director2Country',
      headerName: 'Director 2 Country',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'country'),
    },
    {
      field: 'director2Occupation',
      headerName: 'Director 2 Occupation',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'occupation'),
    },
    {
      field: 'director2Email',
      headerName: 'Director 2 Email',
      width: 200,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'email'),
    },
    {
      field: 'director2PhoneNumber',
      headerName: 'Director 2 Phone Number',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'phoneNumber'),
    },
    {
      field: 'director2BVN',
      headerName: 'Director 2 BVN',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'BVNNumber'),
    },
    {
      field: 'director2NIN',
      headerName: 'Director 2 NIN',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'NINNumber'),
    },
    {
      field: 'director2ResidentialAddress',
      headerName: 'Director 2 Residential Address',
      width: 200,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'residentialAddress'),
    },
    {
      field: 'director2TaxID',
      headerName: 'Director 2 Tax ID',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'taxIDNumber'),
    },
    {
      field: 'director2IDType',
      headerName: 'Director 2 ID Type',
      width: 130,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'idType'),
    },
    {
      field: 'director2IDNumber',
      headerName: 'Director 2 ID Number',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'idNumber'),
    },
    {
      field: 'director2IssuingBody',
      headerName: 'Director 2 Issuing Body',
      width: 150,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'issuingBody'),
    },
    {
      field: 'director2IssuedDate',
      headerName: 'Director 2 Issued Date',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
          return formatDate(params.row.directors[1].issuedDate);
        }
        return formatDate(params.row.issuedDate2);
      },
    },
    {
      field: 'director2ExpiryDate',
      headerName: 'Director 2 Expiry Date',
      width: 150,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
          return formatDate(params.row.directors[1].expiryDate);
        }
        return formatDate(params.row.expiryDate2);
      },
    },
    {
      field: 'director2SourceOfIncome',
      headerName: 'Director 2 Source of Income',
      width: 180,
      renderCell: (params: any) => {
        if (params.row.directors && Array.isArray(params.row.directors) && params.row.directors[1]) {
          const director = params.row.directors[1];
          if (director.sourceOfIncome === 'Other' && director.sourceOfIncomeOther) {
            return director.sourceOfIncomeOther;
          }
          return director.sourceOfIncome || 'N/A';
        }
        // Handle flat format
        if (params.row.sourceOfIncome2 === 'Other' && params.row.sourceOfIncomeOther2) {
          return params.row.sourceOfIncomeOther2;
        }
        return getValue(params.row, 'sourceOfIncome2');
      },
    },
    
    // Account Details - Local/Naira Account
    {
      field: 'localBankName',
      headerName: 'Local Bank Name',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'localBankName'),
    },
    {
      field: 'localAccountNumber',
      headerName: 'Local Account Number',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'localAccountNumber'),
    },
    {
      field: 'localBankBranch',
      headerName: 'Local Bank Branch',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'localBankBranch'),
    },
    {
      field: 'localAccountOpeningDate',
      headerName: 'Local Account Opening Date',
      width: 180,
      renderCell: (params: any) => formatDate(params.row.localAccountOpeningDate),
    },
    // Account Details - Foreign/Domiciliary Account
    {
      field: 'foreignBankName',
      headerName: 'Foreign Bank Name',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'foreignBankName'),
    },
    {
      field: 'foreignAccountNumber',
      headerName: 'Foreign Account Number',
      width: 180,
      renderCell: (params: any) => getValue(params.row, 'foreignAccountNumber'),
    },
    {
      field: 'foreignBankBranch',
      headerName: 'Foreign Bank Branch',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'foreignBankBranch'),
    },
    {
      field: 'foreignAccountOpeningDate',
      headerName: 'Foreign Account Opening Date',
      width: 200,
      renderCell: (params: any) => formatDate(params.row.foreignAccountOpeningDate),
    },
    
    // Verification & Declaration
    {
      field: 'verificationDocUrl',
      headerName: 'Verification Document',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'verificationDocUrl'),
    },
    // Declaration
    {
      field: 'signature',
      headerName: 'Signature',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'signature'),
    }
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
              Corporate NFIU Management
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
              Are you sure you want to delete this Corporate NFIU form? This action cannot be undone.
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

export default AdminCorporateNFIUTable;
