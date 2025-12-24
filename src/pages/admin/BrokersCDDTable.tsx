import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from '@/hooks/use-toast';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc,
  where
} from 'firebase/firestore';
import { db } from '@/firebase/config';
// CSV export - no PDF library needed
import { format } from 'date-fns';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
  },
});

interface FormData {
  id: string;
  status?: string;
  timestamp?: any;
  companyName?: string;
  emailAddress?: string;
  incorporationNumber?: string;
  telephoneNumber?: string;
  directors?: any[];
  [key: string]: any;
}

const BrokersCDDTable: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

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
      const formsRef = collection(db, 'brokers-kyc');
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const formsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: GridRowId) => {
    navigate(`/admin/form/brokers-kyc/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;
    
    try {
      await deleteDoc(doc(db, 'brokers-kyc', selectedFormId));
      setForms(forms.filter(form => form.id !== selectedFormId));
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
      
      toast({
        title: "Success",
        description: "Form deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive"
      });
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
    // CSV headers - all fields matching BrokersCDDViewer exactly
    const headers = [
      'ID', 'Created At', 'Company Name', 'Company Address', 'City', 'State', 'Country',
      'Email Address', 'Website', 'Incorporation Number', 'Registration Number', 'Incorporation State',
      'Company Legal Form', 'Date of Incorporation/Registration', 'Nature of Business',
      'Tax Identification Number', 'Telephone Number',
      'Director 1 Title', 'Director 1 Gender', 'Director 1 First Name', 'Director 1 Middle Name', 'Director 1 Last Name', 'Director 1 DOB',
      'Director 1 Place of Birth', 'Director 1 Nationality', 'Director 1 Residence Country', 'Director 1 Occupation',
      'Director 1 Email', 'Director 1 Phone', 'Director 1 BVN', 'Director 1 NIN',
      'Director 1 Address', 'Director 1 Employers Name', 'Director 1 Tax ID',
      'Director 1 International Passport Number', 'Director 1 Passport Issued Country',
      'Director 1 ID Type', 'Director 1 ID Number', 'Director 1 Issued By',
      'Director 1 Issued Date', 'Director 1 Expiry Date', 'Director 1 Source of Income',
      'Director 2 Title', 'Director 2 Gender', 'Director 2 First Name', 'Director 2 Middle Name', 'Director 2 Last Name', 'Director 2 DOB',
      'Director 2 Place of Birth', 'Director 2 Nationality', 'Director 2 Residence Country', 'Director 2 Occupation',
      'Director 2 Email', 'Director 2 Phone', 'Director 2 BVN', 'Director 2 NIN',
      'Director 2 Address', 'Director 2 Employers Name', 'Director 2 Tax ID',
      'Director 2 International Passport Number', 'Director 2 Passport Issued Country',
      'Director 2 ID Type', 'Director 2 ID Number', 'Director 2 Issued By',
      'Director 2 Issued Date', 'Director 2 Expiry Date', 'Director 2 Source of Income',
      'Local Bank Name', 'Bank Branch', 'Current Account Number', 'Account Opening Date',
      'Domicilliary Account Number', 'Foreign Bank Name', 'Bank Branch Name', 'Currency', 'Foreign Account Opening Date'
    ];

    // CSV rows - all data matching viewer field names
    const rows = filteredForms.map(form => {
      const getDir = (index: number, field: string) => {
        const directors = form.directors;
        if (Array.isArray(directors) && directors[index]) {
          return directors[index][field] || 'N/A';
        }
        return index === 0 ? (form[field] || 'N/A') : 'N/A';
      };
      const getDirDate = (index: number, field: string) => {
        const directors = form.directors;
        if (Array.isArray(directors) && directors[index]) {
          return formatDate(directors[index][field]) || 'N/A';
        }
        return index === 0 ? (formatDate(form[field]) || 'N/A') : 'N/A';
      };
      const getDirIncome = (index: number) => {
        const directors = form.directors;
        if (Array.isArray(directors) && directors[index]) {
          const dir = directors[index];
          return dir.sourceOfIncome || dir.sourceOfIncomeOther || 'N/A';
        }
        return index === 0 ? (form.sourceOfIncome || form.sourceOfIncomeOther || 'N/A') : 'N/A';
      };

      return [
        form.id || 'N/A',
        formatDate(form.createdAt || form.timestamp || form.submittedAt),
        form.companyName || 'N/A',
        form.companyAddress || 'N/A',
        form.city || 'N/A',
        form.state || 'N/A',
        form.country || 'N/A',
        form.emailAddress || 'N/A',
        form.website || 'N/A',
        form.incorporationNumber || 'N/A',
        form.registrationNumber || 'N/A',
        form.incorporationState || 'N/A',
        form.companyLegalForm || form.companyLegalFormOther || 'N/A',
        formatDate(form.dateOfIncorporationRegistration),
        form.natureOfBusiness || 'N/A',
        form.taxIdentificationNumber || 'N/A',
        form.telephoneNumber || 'N/A',
        // Director 1 - using exact field names from viewer
        getDir(0, 'title'), getDir(0, 'gender'),
        getDir(0, 'firstName'), getDir(0, 'middleName'), getDir(0, 'lastName'), getDirDate(0, 'dob'),
        getDir(0, 'placeOfBirth'), getDir(0, 'nationality'), getDir(0, 'residenceCountry'), getDir(0, 'occupation'),
        getDir(0, 'email'), getDir(0, 'phoneNumber'), getDir(0, 'BVNNumber'), getDir(0, 'NINNumber'),
        getDir(0, 'address'), getDir(0, 'employersName'), getDir(0, 'taxIDNumber'),
        getDir(0, 'intPassNo'), getDir(0, 'passIssuedCountry'),
        getDir(0, 'idType'), getDir(0, 'idNumber'), getDir(0, 'issuedBy'),
        getDirDate(0, 'issuedDate'), getDirDate(0, 'expiryDate'), getDirIncome(0),
        // Director 2 - using exact field names from viewer
        getDir(1, 'title'), getDir(1, 'gender'),
        getDir(1, 'firstName'), getDir(1, 'middleName'), getDir(1, 'lastName'), getDirDate(1, 'dob'),
        getDir(1, 'placeOfBirth'), getDir(1, 'nationality'), getDir(1, 'residenceCountry'), getDir(1, 'occupation'),
        getDir(1, 'email'), getDir(1, 'phoneNumber'), getDir(1, 'BVNNumber'), getDir(1, 'NINNumber'),
        getDir(1, 'address'), getDir(1, 'employersName'), getDir(1, 'taxIDNumber'),
        getDir(1, 'intPassNo'), getDir(1, 'passIssuedCountry'),
        getDir(1, 'idType'), getDir(1, 'idNumber'), getDir(1, 'issuedBy'),
        getDirDate(1, 'issuedDate'), getDirDate(1, 'expiryDate'), getDirIncome(1),
        // Account details - using exact field names from viewer
        form.localBankName || 'N/A',
        form.bankBranch || 'N/A',
        form.currentAccountNumber || 'N/A',
        formatDate(form.accountOpeningDate),
        form.domAccountNumber2 || 'N/A',
        form.foreignBankName2 || 'N/A',
        form.bankBranchName2 || 'N/A',
        form.currency || 'N/A',
        formatDate(form.accountOpeningDate2)
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
    link.download = `brokers-cdd-forms-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Success",
      description: "CSV exported successfully"
    });
  };

  const filteredForms = forms.filter(form => {
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    const matchesSearch = searchText === '' || 
      form.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      form.emailAddress?.toLowerCase().includes(searchText.toLowerCase()) ||
      form.incorporationNumber?.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const columns: GridColDef[] = [
    // Actions column first
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
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
      ]
    },
    // Created At column
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params) => formatDate(params.row.createdAt || params.row.timestamp || params.row.submittedAt),
    },
    // All form fields in exact order they appear in the form (using renderCell as per changelog)
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 200,
      renderCell: (params) => params.row.companyName || 'N/A',
    },
    {
      field: 'companyAddress',
      headerName: 'Company Address',
      width: 200,
      renderCell: (params) => params.row.companyAddress || 'N/A',
    },
    {
      field: 'city',
      headerName: 'City',
      width: 180,
      renderCell: (params) => params.row.city || 'N/A',
    },
    {
      field: 'state',
      headerName:'State',
      width: 180,
      renderCell: (params) => params.row.state || 'N/A',
    },
    {
      field: 'country',
      headerName:'Country',
      width: 180,
      renderCell: (params) => params.row.country || 'N/A',
    },
    {
      field: 'emailAddress',
      headerName: 'Email Address',
      width: 200,
      renderCell: (params) => params.row.emailAddress || 'N/A',
    },
    {
      field: 'website',
      headerName: 'Website',
      width: 180,
      renderCell: (params) => params.row.website || 'N/A',
    },
    {
      field: 'incorporationNumber',
      headerName: 'Incorporation Number',
      width: 160,
      renderCell: (params) => params.row.incorporationNumber || 'N/A',
    },
    {
      field: 'registrationNumber',
      headerName: 'Registration Number',
      width: 160,
      renderCell: (params) => params.row.registrationNumber || 'N/A',
    },
    {
      field: 'incorporationState',
      headerName: 'Incorporation State',
      width: 150,
      renderCell: (params) => params.row.incorporationState || 'N/A',
    },
    {
      field: 'companyLegalForm',
      headerName: 'Company Legal Form',
      width: 140,
      renderCell: (params) => {
        return params.row.companyLegalForm || params.row.companyLegalFormOther || 'N/A';
      },
    },
    {
      field: 'dateOfIncorporationRegistration',
      headerName: 'Date of Incorporation/Registration',
      width: 160,
      renderCell: (params) => formatDate(params.row.dateOfIncorporationRegistration),
    },
    {
      field: 'natureOfBusiness',
      headerName: 'Nature of Business',
      width: 160,
      renderCell: (params) => params.row.natureOfBusiness || 'N/A',
    },

    {
      field: 'taxIdentificationNumber',
      headerName: 'Tax Identification Number',
      width: 140,
      renderCell: (params) => params.row.taxIdentificationNumber || 'N/A',
    },
    {
      field: 'telephoneNumber',
      headerName: 'Telephone Number',
      width: 150,
      renderCell: (params) => params.row.telephoneNumber || 'N/A',
    },
    
    // Directors Information - Director 1 (using renderCell as per changelog)
    {
      field: 'director1Title',
      headerName: 'Director 1 Title',
      width: 100,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].title || 'N/A';
        }
        return params.row.title || 'N/A';
      }
    },
    {
      field: 'director1Gender',
      headerName: 'Director 1 Gender',
      width: 100,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].gender || 'N/A';
        }
        return params.row.gender || 'N/A';
      }
    },
    {
      field: 'director1FirstName',
      headerName: 'Director 1 First Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].firstName || 'N/A';
        }
        return params.row.firstName || 'N/A';
      }
    },
    {
      field: 'director1MiddleName',
      headerName: 'Director 1 Middle Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].middleName || 'N/A';
        }
        return params.row.middleName || 'N/A';
      }
    },
    {
      field: 'director1LastName',
      headerName: 'Director 1 Last Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].lastName || 'N/A';
        }
        return params.row.lastName || 'N/A';
      }
    },
    {
      field: 'director1DOB',
      headerName: 'Director 1 DOB',
      width: 130,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return formatDate(directors[0].dob) || 'N/A';
        }
        return formatDate(params.row.dob) || 'N/A';
      }
    },
    {
      field: 'director1PlaceOfBirth',
      headerName: 'Director 1 Place of Birth',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].placeOfBirth || 'N/A';
        }
        return params.row.placeOfBirth || 'N/A';
      }
    },
    {
      field: 'director1Nationality',
      headerName: 'Director 1 Nationality',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].nationality || 'N/A';
        }
        return params.row.nationality || 'N/A';
      }
    },
    {
      field: 'director1ResidenceCountry',
      headerName: 'Director 1 Residence Country',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].residenceCountry || 'N/A';
        }
        return params.row.residenceCountry || 'N/A';
      }
    },
    {
      field: 'director1Occupation',
      headerName: 'Director 1 Occupation',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].occupation || 'N/A';
        }
        return params.row.occupation || 'N/A';
      }
    },
    {
      field: 'director1Email',
      headerName: 'Director 1 Email',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].email || 'N/A';
        }
        return params.row.email || 'N/A';
      }
    },
    {
      field: 'director1Phone',
      headerName: 'Director 1 Phone',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].phoneNumber || 'N/A';
        }
        return params.row.phoneNumber || 'N/A';
      }
    },
    {
      field: 'director1BVN',
      headerName: 'Director 1 BVN',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].BVNNumber || 'N/A';
        }
        return params.row.BVNNumber || 'N/A';
      }
    },
    {
      field: 'director1NIN',
      headerName: 'Director 1 NIN',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].NINNumber || 'N/A';
        }
        return params.row.NINNumber || 'N/A';
      }
    },
    {
      field: 'director1EmployersName',
      headerName: 'Director 1 Employers Name',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].employersName || 'N/A';
        }
        return params.row.employersName || 'N/A';
      }
    },
    {
      field: 'director1EmployersPhone',
      headerName: 'Director 1 Employers Phone',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].employersPhoneNumber || 'N/A';
        }
        return params.row.employersPhoneNumber || 'N/A';
      }
    },
    {
      field: 'director1Address',
      headerName: 'Director 1 Address',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].address || 'N/A';
        }
        return params.row.address || 'N/A';
      }
    },
    {
      field: 'director1TaxID',
      headerName: 'Director 1 Tax ID',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].taxIDNumber || 'N/A';
        }
        return params.row.taxIDNumber || 'N/A';
      }
    },
    {
      field: 'director1IntPassNo',
      headerName: 'Director 1 International Passport Number',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].intPassNo || 'N/A';
        }
        return params.row.intPassNo || 'N/A';
      }
    },
    {
      field: 'director1PassIssuedCountry',
      headerName: 'Director 1 Passport Issued Country',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].passIssuedCountry || 'N/A';
        }
        return params.row.passIssuedCountry || 'N/A';
      }
    },
    {
      field: 'director1IDType',
      headerName: 'Director 1 ID Type',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].idType || 'N/A';
        }
        return params.row.idType || 'N/A';
      }
    },
    {
      field: 'director1IDNumber',
      headerName: 'Director 1 ID Number',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].idNumber || 'N/A';
        }
        return params.row.idNumber || 'N/A';
      }
    },
    {
      field: 'director1IssuedBy',
      headerName: 'Director 1 Issued By',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].issuedBy || 'N/A';
        }
        return params.row.issuedBy || 'N/A';
      }
    },
    {
      field: 'director1IssuedDate',
      headerName: 'Director 1 Issued Date',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return formatDate(directors[0].issuedDate) || 'N/A';
        }
        return formatDate(params.row.issuedDate) || 'N/A';
      }
    },
    {
      field: 'director1ExpiryDate',
      headerName: 'Director 1 Expiry Date',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return formatDate(directors[0].expiryDate) || 'N/A';
        }
        return formatDate(params.row.expiryDate) || 'N/A';
      }
    },
    {
      field: 'director1SourceOfIncome',
      headerName: 'Director 1 Source of Income',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].sourceOfIncome || directors[0].sourceOfIncomeOther || 'N/A';
        }
        return params.row.sourceOfIncome || params.row.sourceOfIncomeOther || 'N/A';
      }
    },
    
    // Directors Information - Director 2 (using renderCell as per changelog)
    {
      field: 'director2Title',
      headerName: 'Director 2 Title',
      width: 100,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].title || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Gender',
      headerName: 'Director 2 Gender',
      width: 100,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].gender || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2FirstName',
      headerName: 'Director 2 First Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].firstName || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2MiddleName',
      headerName: 'Director 2 Middle Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].middleName || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2LastName',
      headerName: 'Director 2 Last Name',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].lastName || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2DOB',
      headerName: 'Director 2 DOB',
      width: 130,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return formatDate(directors[1].dob) || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2PlaceOfBirth',
      headerName: 'Director 2 Place of Birth',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].placeOfBirth || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Nationality',
      headerName: 'Director 2 Nationality',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].nationality || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2ResidenceCountry',
      headerName: 'Director 2 Residence Country',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].residenceCountry || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Occupation',
      headerName: 'Director 2 Occupation',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].occupation || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Email',
      headerName: 'Director 2 Email',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].email || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Phone',
      headerName: 'Director 2 Phone',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].phoneNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2BVN',
      headerName: 'Director 2 BVN',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].BVNNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2NIN',
      headerName: 'Director 2 NIN',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].NINNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2EmployersName',
      headerName: 'Director 2 Employers Name',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].employersName || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2EmployersPhone',
      headerName: 'Director 2 Employers Phone',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].employersPhoneNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2Address',
      headerName: 'Director 2 Address',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].address || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2TaxID',
      headerName: 'Director 2 Tax ID',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].taxIDNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2IntPassNo',
      headerName: 'Director 2 International Passport Number',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].intPassNo || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2PassIssuedCountry',
      headerName: 'Director 2 Passport Issued Country',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].passIssuedCountry || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2IDType',
      headerName: 'Director 2 ID Type',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].idType || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2IDNumber',
      headerName: 'Director 2 ID Number',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].idNumber || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2IssuedBy',
      headerName: 'Director 2 Issued By',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].issuedBy || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2IssuedDate',
      headerName: 'Director 2 Issued Date',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return formatDate(directors[1].issuedDate) || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2ExpiryDate',
      headerName: 'Director 2 Expiry Date',
      width: 150,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return formatDate(directors[1].expiryDate) || 'N/A';
        }
        return 'N/A';
      }
    },
    {
      field: 'director2SourceOfIncome',
      headerName: 'Director 2 Source of Income',
      width: 180,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].sourceOfIncome || directors[1].sourceOfIncomeOther || 'N/A';
        }
        return 'N/A';
      }
    },
    
    // Bank Account Details
    {
      field: 'localBankName',
      headerName: 'Local Bank Name',
      width: 150,
      renderCell: (params) => params.row.localBankName || 'N/A',
    },
    {
      field: 'bankBranch',
      headerName: 'Bank Branch',
      width: 150,
      renderCell: (params) => params.row.bankBranch || 'N/A',
    },
    {
      field: 'currentAccountNumber',
      headerName: 'Account Number',
      width: 150,
      renderCell: (params) => params.row.currentAccountNumber || 'N/A',
    },
    {
      field: 'accountOpeningDate',
      headerName: 'Account Opening Date',
      width: 160,
      renderCell: (params) => formatDate(params.row.accountOpeningDate),
    },
    
    // Foreign Account Details
    {
      field: 'foreignBankName2',
      headerName: 'Foreign Bank Name',
      width: 150,
      renderCell: (params) => params.row.foreignBankName2 || 'N/A',
    },
    {
      field: 'domAccountNumber2',
      headerName: 'Domicilliary Account Number',
      width: 150,
      renderCell: (params) => params.row.domAccountNumber2 || 'N/A',
    },
    {
      field: 'bankBranchName2',
      headerName: 'Foreign Bank Branch',
      width: 150,
      renderCell: (params) => params.row.bankBranchName2 || 'N/A',
    },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 150,
      renderCell: (params) => params.row.currency || 'N/A',
    },
    {
      field: 'accountOpeningDate2',
      headerName: 'Foreign Account Opening Date',
      width: 160,
      renderCell: (params) => formatDate(params.row.accountOpeningDate2),
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h4" component="h1" gutterBottom>
             Brokers CDD Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </div>
          
          {/* Filters */}
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by company name, email, or incorporation number..."
              sx={{ minWidth: 300 }}
            />
           
          </Box>
        </div>

        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredForms}
            columns={columns}
            loading={loading}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            checkboxSelection
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
              },
            }}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this form? This action cannot be undone.
            </Typography>
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

export default BrokersCDDTable;
