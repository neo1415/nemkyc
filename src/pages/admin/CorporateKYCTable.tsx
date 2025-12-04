import React, { useState, useEffect } from 'react';
import { 
  DataGrid, 
  GridColDef, 
  GridToolbar,
  GridActionsCellItem,
  GridRowId
} from '@mui/x-data-grid';
import { 
  ThemeProvider, 
  createTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  Visibility, 
  Delete, 
  GetApp
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Custom theme with burgundy and gold
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

interface FormData {
  id: string;
  status?: string;
  timestamp?: any;
  createdAt?: string;
  submittedAt?: any;
  branchOffice?: string;
  insured?: string;
  officeAddress?: string;
  ownershipOfCompany?: string;
  contactPerson?: string;
  website?: string;
  incorporationNumber?: string;
  incorporationState?: string;
  dateOfIncorporationRegistration?: any;
  BVNNumber?: string;
  contactPersonNo?: string;
  taxIDNo?: string;
  emailAddress?: string;
  natureOfBusiness?: string;
  estimatedTurnover?: string;
  premiumPaymentSource?: string;
  premiumPaymentSourceOther?: string;
  directors?: any[];
  companyNameVerificationDoc?: string;
  signature?: string;
  [key: string]: any;
}

const CorporateKYCTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchForms();
  }, [user, isAdmin, navigate]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsRef = collection(db, 'corporate-kyc-form');
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const formsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp || data.submittedAt || data.createdAt || new Date(),
          createdAt: data.createdAt || data.submittedAt || data.timestamp
        };
      });

      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({ title: 'Error fetching data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: GridRowId) => {
    navigate(`/admin/form/corporate-kyc-form/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, 'corporate-kyc-form', selectedFormId));
      setForms(forms.filter(form => form.id !== selectedFormId));
      toast({ title: 'Form deleted successfully' });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({ title: 'Error deleting form', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF('landscape');
    
    pdf.setFontSize(18);
    pdf.text('Corporate KYC Forms Report', 14, 22);
    
    const tableData = filteredForms.slice(0, 50).map(form => [
      form.id || 'N/A',
      formatDate(form.timestamp),
      form.status || 'N/A',
      form.branchOffice || 'N/A',
      form.insured || 'N/A',
      form.contactPerson || 'N/A',
      form.emailAddress || 'N/A'
    ]);

    (pdf as any).autoTable({
      head: [['ID', 'Date Created', 'Status', 'Branch Office', 'Insured', 'Contact Person', 'Email']],
      body: tableData,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [128, 0, 32] },
    });

    pdf.save('corporate-kyc-forms.pdf');
  };

  const filteredForms = forms.filter(form => {
    const matchesSearch = Object.values(form).some(value => 
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getValue = (form: FormData, field: string): string => {
    const value = form[field];
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return String(value);
  };

  const getDirectorValue = (form: FormData, directorIndex: number, field: string): string => {
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

  const shouldShowConditionalField = (form: FormData, mainField: string, conditionalField: string): boolean => {
    const mainValue = form[mainField];
    const conditionalValue = form[conditionalField];
    
    // Show conditional field only if main field is 'Other' and conditional field has value
    return mainValue === 'Other' && conditionalValue;
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
          onClick={() => handleView(params.id)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Delete"
          onClick={() => {
            setSelectedFormId(params.id as string);
            setDeleteDialogOpen(true);
          }}
        />
      ],
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params: any) => formatDate(params.row.createdAt || params.row.timestamp || params.row.submittedAt),
    },
    // Company Information - in exact form order
    {
      field: 'branchOffice',
      headerName: 'NEM Branch Office',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'branchOffice'),
    },
    {
      field: 'insured',
      headerName: 'Insured',
      width: 150,
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
      field: 'contactPerson',
      headerName: 'Contact Person',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'contactPerson'),
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
      width: 150,
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
      field: 'BVNNumber',
      headerName: 'BVN Number',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'BVNNumber'),
    },
    {
      field: 'NINNumber',
      headerName: 'NIN Number',
      width: 130,
      renderCell: (params: any) => getValue(params.row, 'NINNumber'),
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
      field: 'natureOfBusiness',
      headerName: 'Nature of Business',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'natureOfBusiness'),
    },
    {
      field: 'estimatedTurnover',
      headerName: 'Estimated Turnover',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'estimatedTurnover'),
    },
    // Conditional Premium Payment Source
    {
      field: 'premiumPaymentSource',
      headerName: 'Premium Payment Source',
      width: 180,
      renderCell: (params: any) => {
        const form = params.row;
        if (shouldShowConditionalField(form, 'premiumPaymentSource', 'premiumPaymentSourceOther')) {
          return getValue(form, 'premiumPaymentSourceOther');
        }
        return getValue(form, 'premiumPaymentSource');
      },
    },
    // Account Details - Local
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
    // Account Details - Foreign (if provided)
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
      field: 'director1EmployersName',
      headerName: 'Director 1 Employers Name',
      width: 180,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'employersName'),
    },
    {
      field: 'director1EmployersPhone',
      headerName: 'Director 1 Employers Phone',
      width: 180,
      renderCell: (params: any) => getDirectorValue(params.row, 0, 'employersPhoneNumber'),
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
      field: 'director2EmployersName',
      headerName: 'Director 2 Employers Name',
      width: 180,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'employersName'),
    },
    {
      field: 'director2EmployersPhone',
      headerName: 'Director 2 Employers Phone',
      width: 180,
      renderCell: (params: any) => getDirectorValue(params.row, 1, 'employersPhoneNumber'),
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
    // Verification
    {
      field: 'companyNameVerificationDoc',
      headerName: 'Verification Document Type',
      width: 200,
      renderCell: (params: any) => getValue(params.row, 'companyNameVerificationDoc'),
    },
    // Declaration
    {
      field: 'signature',
      headerName: 'Signature',
      width: 150,
      renderCell: (params: any) => getValue(params.row, 'signature'),
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h4" component="h1" gutterBottom>
              Corporate KYC Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToPDF}
            >
              Export PDF
            </Button>
          </div>
          
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </div>

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredForms}
            columns={columns}
            loading={loading}
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(128, 0, 32, 0.04)',
              },
            }}
          />
        </div>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this form? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
};

export default CorporateKYCTable;
