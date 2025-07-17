import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Button, Typography, Box, Paper, Divider, Chip, TextField } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Download, Edit, ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { generateFormPDF, downloadPDF } from '../../services/pdfService';
import { FORM_MAPPINGS, FormField } from '../../config/formMappings';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513',
    },
  },
});

interface FormFieldWithValue extends FormField {
  value: any;
  section: string;
  editable: boolean;
}

const FormViewer: React.FC = () => {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizedFields, setOrganizedFields] = useState<Record<string, FormFieldWithValue[]>>({});
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    if (collection && id) {
      fetchFormData();
    }
  }, [user, isAdmin, collection, id, navigate]);

  const fetchFormData = async () => {
    try {
      if (!collection || !id) return;
      
      const docRef = doc(db, collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          collection,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.() || docSnap.data().updatedAt,
        };
        
        setFormData(data);
        
        // Organize fields using form mapping
        const mapping = FORM_MAPPINGS[collection];
        if (mapping) {
          const organized = organizeFieldsWithMapping(data, mapping);
          setOrganizedFields(organized);
        } else {
          const organized = organizeFieldsFallback(data);
          setOrganizedFields(organized);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Form not found',
          variant: 'destructive',
        });
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const organizeFieldsWithMapping = (data: any, mapping: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {};
    
    mapping.sections.forEach((section: any) => {
      const sectionFields: FormFieldWithValue[] = [];
      
      section.fields.forEach((field: FormField) => {
        if (data.hasOwnProperty(field.key)) {
          sectionFields.push({
            ...field,
            value: data[field.key],
            section: section.title,
            editable: field.editable !== false
          });
        }
      });
      
      if (sectionFields.length > 0) {
        organized[section.title] = sectionFields;
      }
    });
    
    return organized;
  };

  const organizeFieldsFallback = (data: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {
      'Form Data': []
    };
    
    Object.entries(data).forEach(([key, value]) => {
      if (!['id', 'collection'].includes(key)) {
        organized['Form Data'].push({
          key,
          label: formatFieldLabel(key),
          type: getFieldType(key, value),
          value,
          section: 'Form Data',
          editable: !['createdAt', 'updatedAt', 'submittedAt', 'timestamp'].includes(key)
        });
      }
    });
    
    return organized;
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFieldType = (key: string, value: any): FormField['type'] => {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (key.toLowerCase().includes('email')) return 'email';
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) return 'url';
    if (key.toLowerCase().includes('date')) return 'date';
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('cost')) return 'currency';
    if (typeof value === 'string' && value.length > 100) return 'textarea';
    return 'text';
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString();
      }
    }
    return String(date);
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      if (url.startsWith('gs://')) {
        const storageRef = ref(storage, url);
        const downloadUrl = await getDownloadURL(storageRef);
        window.open(downloadUrl, '_blank');
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleEditField = (fieldKey: string) => {
    setEditingFields(prev => ({ ...prev, [fieldKey]: true }));
    setEditValues(prev => ({ ...prev, [fieldKey]: formData[fieldKey] }));
  };

  const handleSaveField = async (fieldKey: string) => {
    try {
      if (!collection || !id) return;
      
      const docRef = doc(db, collection, id);
      await updateDoc(docRef, {
        [fieldKey]: editValues[fieldKey],
        updatedAt: new Date()
      });
      
      setFormData(prev => ({ ...prev, [fieldKey]: editValues[fieldKey] }));
      setEditingFields(prev => ({ ...prev, [fieldKey]: false }));
      
      // Update organized fields
      const updatedOrganized = { ...organizedFields };
      Object.keys(updatedOrganized).forEach(sectionKey => {
        updatedOrganized[sectionKey] = updatedOrganized[sectionKey].map(field => 
          field.key === fieldKey ? { ...field, value: editValues[fieldKey] } : field
        );
      });
      setOrganizedFields(updatedOrganized);
      
      toast({
        title: 'Success',
        description: 'Field updated successfully',
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = (fieldKey: string) => {
    setEditingFields(prev => ({ ...prev, [fieldKey]: false }));
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldKey];
      return newValues;
    });
  };

  const generatePDF = async () => {
    if (!formData || !collection) return;
    
    setIsGeneratingPDF(true);
    try {
      const mapping = FORM_MAPPINGS[collection];
      const formTitle = mapping?.title || collection.replace(/[-_]/g, ' ').toUpperCase();
      
      // Filter out file URLs and prepare clean data for PDF
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          return !key.toLowerCase().includes('url') && 
                 !key.toLowerCase().includes('file') &&
                 !['id', 'collection', 'timestamp'].includes(key);
        })
      );
      
      const pdfBlob = await generateFormPDF({
        title: formTitle,
        subtitle: `Form ID: ${formData.id}`,
        logoUrl: '/Nem-insurance-Logo.jpg',
        data: cleanData
      });
      
      downloadPDF(pdfBlob, `${collection}-${formData.id}.pdf`);
      
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderFieldValue = (field: FormFieldWithValue) => {
    const { key, value, type, label, editable } = field;
    const isEditing = editingFields[key];

    if (isEditing && editable) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={editValues[key] || ''}
            onChange={(e) => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
            multiline={type === 'textarea'}
            rows={type === 'textarea' ? 3 : 1}
            type={type === 'number' ? 'number' : 'text'}
          />
          <Button size="small" startIcon={<Save />} onClick={() => handleSaveField(key)}>
            Save
          </Button>
          <Button size="small" startIcon={<X />} onClick={() => handleCancelEdit(key)}>
            Cancel
          </Button>
        </Box>
      );
    }

    // Display value based on type
    if (value === null || value === undefined || value === '') {
      return <Typography variant="body2" color="text.secondary">Not provided</Typography>;
    }

    switch (type) {
      case 'boolean':
        return (
          <Chip 
            label={value ? 'Yes' : 'No'} 
            color={value ? 'success' : 'default'} 
            size="small" 
          />
        );
      
      case 'date':
        return <Typography variant="body1">{formatDate(value)}</Typography>;
      
      case 'currency':
        return (
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            ₦{typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        );
      
      case 'email':
        return (
          <Typography variant="body1" component="a" href={`mailto:${value}`} sx={{ color: 'primary.main' }}>
            {value}
          </Typography>
        );
      
      case 'url':
      case 'file':
        return (
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleDownloadFile(value, `${label}.pdf`)}
            sx={{ mt: 1 }}
          >
            Download {label}
          </Button>
        );
      
      case 'array':
        if (!Array.isArray(value) || value.length === 0) {
          return <Typography variant="body2" color="text.secondary">No items</Typography>;
        }
        
        return (
          <Box sx={{ mt: 1 }}>
            {value.map((item, index) => (
              <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {label} {index + 1}
                </Typography>
                {typeof item === 'object' && item !== null ? (
                  Object.entries(item).map(([itemKey, itemValue]) => (
                    <Box key={itemKey} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatFieldLabel(itemKey)}:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {String(itemValue)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2">{String(item)}</Typography>
                )}
              </Paper>
            ))}
          </Box>
        );
      
      case 'object':
        if (typeof value !== 'object' || value === null) {
          return <Typography variant="body1">{String(value)}</Typography>;
        }
        
        return (
          <Box sx={{ mt: 1 }}>
            {Object.entries(value).map(([objKey, objValue]) => (
              <Box key={objKey} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {formatFieldLabel(objKey)}:
                </Typography>
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {String(objValue)}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      
      default:
        const displayValue = String(value);
        return (
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: type === 'textarea' ? 'pre-wrap' : 'normal'
            }}
          >
            {displayValue}
          </Typography>
        );
    }
  };

  if (!user || !isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3 }}>
          <Typography>Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (!formData) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ p: 3 }}>
          <Typography>Form not found</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  const mapping = FORM_MAPPINGS[collection || ''];
  const formTitle = mapping?.title || collection?.replace(/[-_]/g, ' ').toUpperCase();

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, maxWidth: '1000px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {formTitle}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            sx={{ ml: 2 }}
          >
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Form Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`ID: ${formData.id}`} size="small" />
              <Chip 
                label={`Status: ${formData.status || 'pending'}`} 
                size="small" 
                color={formData.status === 'approved' ? 'success' : formData.status === 'rejected' ? 'error' : 'default'}
              />
              {formData.createdAt && (
                <Chip label={`Submitted: ${formatDate(formData.createdAt)}`} size="small" />
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {Object.entries(organizedFields).map(([sectionTitle, fields]) => (
            <Paper key={sectionTitle} elevation={1} sx={{ mb: 3, p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                {sectionTitle}
              </Typography>
              <Box sx={{ display: 'grid', gap: 3 }}>
                {fields.map((field) => (
                  <Box key={field.key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                        {field.label}
                      </Typography>
                      {field.editable && !editingFields[field.key] && (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEditField(field.key)}
                          sx={{ ml: 1 }}
                        >
                          Edit
                        </Button>
                      )}
                    </Box>
                    {renderFieldValue(field)}
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default FormViewer;