import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  doc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface AdminTableConfig {
  collectionName: string;
  title: string;
  searchFields: string[];
  viewRoute: string; // e.g., '/admin/form/individual-kyc'
}

export interface FormData {
  id: string;
  timestamp?: any;
  createdAt?: string;
  formType?: string;
  [key: string]: any;
}

export const useAdminTable = (config: AdminTableConfig) => {
  const [forms, setForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsRef = collection(db, config.collectionName);
      const q = query(formsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const formsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormData[];

      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch forms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [config.collectionName]);

  const filteredForms = forms.filter(form => {
    if (!filterValue) return true;
    
    return config.searchFields.some(field => 
      form[field]?.toString().toLowerCase().includes(filterValue.toLowerCase())
    );
  });

  const handleDeleteClick = (id: string) => {
    setSelectedFormId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFormId) return;

    try {
      await deleteDoc(doc(db, config.collectionName, selectedFormId));
      
      setForms(prev => prev.filter(form => form.id !== selectedFormId));
      
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFormId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedFormId(null);
  };

  const handleExportCSV = (columns: any[]) => {
    if (forms.length === 0) {
      toast({
        title: "No Data",
        description: "No forms available to export",
        variant: "destructive",
      });
      return;
    }

    // Create CSV headers based on columns (excluding actions)
    const headers = columns
      .filter(col => col.field !== 'actions')
      .map(col => col.headerName || col.field);

    // Create CSV rows
    const csvData = forms.map(form => {
      return columns
        .filter(col => col.field !== 'actions')
        .map(col => {
          const value = form[col.field];
          if (value === null || value === undefined) return 'N/A';
          
          // Handle dates
          if (col.field.includes('Date') || col.field === 'timestamp') {
            try {
              let date;
              if (typeof value === 'string') {
                date = new Date(value);
              } else if (value?.toDate) {
                date = value.toDate();
              } else if (value instanceof Date) {
                date = value;
              } else {
                return 'N/A';
              }
              
              if (isNaN(date.getTime())) return 'N/A';
              return col.field === 'timestamp' 
                ? format(date, 'dd/MM/yyyy HH:mm')
                : format(date, 'dd/MM/yyyy');
            } catch (error) {
              return 'N/A';
            }
          }
          
          return String(value);
        });
    });

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${config.collectionName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utility function to format dates consistently
  const formatDate = (value: any, includeTime: boolean = false): string => {
    if (!value) return 'N/A';
    try {
      let date;
      if (typeof value === 'string') {
        date = new Date(value);
      } else if (value?.toDate) {
        date = value.toDate();
      } else if (value instanceof Date) {
        date = value;
      } else {
        return 'N/A';
      }
      
      if (isNaN(date.getTime())) return 'N/A';
      return includeTime 
        ? format(date, 'dd/MM/yyyy HH:mm')
        : format(date, 'dd/MM/yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  return {
    forms,
    filteredForms,
    loading,
    filterValue,
    setFilterValue,
    deleteDialogOpen,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleExportCSV,
    formatDate,
    refetch: fetchForms,
  };
};
