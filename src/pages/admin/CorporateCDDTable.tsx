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
import { format } from 'date-fns';
import jsPDF from 'jspdf';

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

const CorporateCDDTable: React.FC = () => {
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
      const formsRef = collection(db, 'corporate-kyc');
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
    navigate(`/admin/corporate-cdd/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedFormId) return;
    
    try {
      await deleteDoc(doc(db, 'corporate-kyc', selectedFormId));
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    let yPosition = 20;
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Corporate CDD Forms Report', 20, yPosition);
    yPosition += 20;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated on: ${format(new Date(), 'PPp')}`, 20, yPosition);
    pdf.text(`Total Forms: ${filteredForms.length}`, 20, yPosition + 10);
    yPosition += 30;
    
    // Table headers
    const headers = ['Company Name', 'Email', 'Status', 'Submitted'];
    const columnWidths = [45, 45, 30, 40];
    let xPosition = 20;
    
    pdf.setFont(undefined, 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 10;
    
    // Table data
    pdf.setFont(undefined, 'normal');
    filteredForms.slice(0, 50).forEach(form => { // Limit to 50 entries
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      xPosition = 20;
      const rowData = [
        form.companyName || 'N/A',
        form.emailAddress || 'N/A',
        form.status || 'pending',
        formatDate(form.timestamp)
      ];
      
      rowData.forEach((data, index) => {
        const text = String(data).substring(0, 25); // Truncate long text
        pdf.text(text, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
    });
    
    pdf.save('Corporate_CDD_Report.pdf');
    
    toast({
      title: "Success",
      description: "Report exported successfully"
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
      field: 'registeredCompanyAddress',
      headerName: 'Registered Company Address',
      width: 200,
      renderCell: (params) => params.row.registeredCompanyAddress || 'N/A',
    },
    {
      field: 'incorporationNumber',
      headerName: 'Incorporation Number',
      width: 160,
      renderCell: (params) => params.row.incorporationNumber || 'N/A',
    },
    {
      field: 'incorporationState',
      headerName: 'Incorporation State',
      width: 150,
      renderCell: (params) => params.row.incorporationState || 'N/A',
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
      field: 'companyLegalForm',
      headerName: 'Company Legal Form',
      width: 140,
      renderCell: (params) => {
        return params.row.companyLegalForm || params.row.companyLegalFormOther || 'N/A';
      },
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
      field: 'director1Country',
      headerName: 'Director 1 Country',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].country || 'N/A';
        }
        return params.row.country || 'N/A';
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
      field: 'director1ResidentialAddress',
      headerName: 'Director 1 Residential Address',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].residentialAddress || 'N/A';
        }
        return params.row.residentialAddress || 'N/A';
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
      field: 'director1IssuingBody',
      headerName: 'Director 1 Issuing Body',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[0]) {
          return directors[0].issuingBody || 'N/A';
        }
        return params.row.issuingBody || 'N/A';
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
      field: 'director2Country',
      headerName: 'Director 2 Country',
      width: 140,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].country || 'N/A';
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
      field: 'director2ResidentialAddress',
      headerName: 'Director 2 Residential Address',
      width: 200,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].residentialAddress || 'N/A';
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
      field: 'director2IssuingBody',
      headerName: 'Director 2 Issuing Body',
      width: 160,
      renderCell: (params) => {
        const directors = params.row.directors;
        if (Array.isArray(directors) && directors[1]) {
          return directors[1].issuingBody || 'N/A';
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
      field: 'bankName',
      headerName: 'Bank Name',
      width: 150,
      renderCell: (params) => params.row.bankName || 'N/A',
    },
    {
      field: 'accountNumber',
      headerName: 'Account Number',
      width: 150,
      renderCell: (params) => params.row.accountNumber || 'N/A',
    },
    {
      field: 'bankBranch',
      headerName: 'Bank Branch',
      width: 150,
      renderCell: (params) => params.row.bankBranch || 'N/A',
    },
    {
      field: 'accountOpeningDate',
      headerName: 'Account Opening Date',
      width: 160,
      renderCell: (params) => formatDate(params.row.accountOpeningDate),
    },
    
    // Foreign Account Details
    {
      field: 'bankName2',
      headerName: 'Foreign Bank Name',
      width: 150,
      renderCell: (params) => params.row.bankName2 || 'N/A',
    },
    {
      field: 'accountNumber2',
      headerName: 'Foreign Account Number',
      width: 150,
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
              Corporate CDD Management
            </Typography>
            <Button
              variant="outlined"
              startIcon={<GetApp />}
              onClick={exportToPDF}
            >
              Export PDF
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
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

export default CorporateCDDTable;