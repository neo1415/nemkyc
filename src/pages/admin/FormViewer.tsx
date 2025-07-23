import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Button, Typography, Box, Paper, Divider, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Download, Edit, ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { generateFormPDF, downloadPDF } from '../../services/pdfService';
import { FORM_MAPPINGS, FormField } from '../../config/formMappings';
import { sendStatusUpdateNotification } from '../../services/emailService';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';

const theme = createTheme({
  palette: {
    primary: {
      main: 'hsl(350, 50%, 30%)', // Burgundy from design system
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
  const [status, setStatus] = useState<string>('processing');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

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
          status: docSnap.data().status || 'processing'
        };
        
        setFormData(data);
        setStatus(data.status || 'processing');
        
        // Organize fields using form mapping
        const mappingKey = getFormMappingKey(collection, data);
        const mapping = FORM_MAPPINGS[mappingKey];
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

  // Collection to form mapping (same as AdminUnifiedTable)
  const getFormMappingKey = (collectionName: string, formData?: any): string => {
    const collectionMappings: Record<string, string | ((data: any) => string)> = {
      'corporate-kyc': (data: any) => {
        // Check if it's NAICOM corporate form based on certain fields
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-corporate-cdd';
        }
        return 'corporate-kyc';
      },
      'partners-kyc': (data: any) => {
        // Check if it's NAICOM partners form
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-partners-cdd';
        }
        return 'partners-cdd';
      },
      'individual-kyc-form': 'individual-kyc',
      'corporate-kyc-form': 'corporate-kyc',
      'motor-claims': 'motor-claims',
      'fire-claims': 'fire-special-perils-claims',
      'professional-indemnity': 'professional-indemnity-claims',
      'burglary-claims': 'burglary-claims',
      'all-risk-claims': 'all-risk-claims',
      'goods-in-transit-claims': 'goods-in-transit-claims',
      'money-insurance-claims': 'money-insurance-claims',
      'public-liability-claims': 'public-liability-claims',
      'employers-liability-claims': 'employers-liability-claims',
      'group-personal-accident-claims': 'group-personal-accident-claims',
      'fidelity-guarantee-claims': 'fidelity-guarantee-claims',
      'rent-assurance-claims': 'rent-assurance-claims',
      'contractors-plant-machinery-claims': 'contractors-plant-machinery-claims',
      'combined-gpa-employers-liability-claims': 'combined-gpa-employers-liability-claims'
    };

    const mappingKey = collectionMappings[collectionName];
    if (typeof mappingKey === 'function') {
      return mappingKey(formData || {});
    }
    return mappingKey || collectionName;
  };

  const shouldShowField = (field: FormField, watchedValues: any) => {
    if (!field.conditional) {
      // Check if this is a flat director field and we have a directors array
      const flatDirectorFieldPatterns = [
        'firstName', 'firstName2', 'middleName', 'middleName2', 'lastName', 'lastName2',
        'email', 'email2', 'phoneNumber', 'phoneNumber2', 'dob', 'dob2',
        'nationality', 'nationality2', 'occupation', 'occupation2', 'residentialAddress', 'residentialAddress2',
        'idType', 'idType2', 'idNumber', 'idNumber2', 'issuedDate', 'issuedDate2',
        'expiryDate', 'expiryDate2', 'issuingBody', 'issuingBody2', 'placeOfBirth', 'placeOfBirth2',
        'employersName', 'employersName2', 'employersPhoneNumber', 'employersPhoneNumber2',
        'sourceOfIncome', 'sourceOfIncome2', 'taxIDNumber', 'taxIDNumber2', 'BVNNumber', 'BVNNumber2'
      ];
      
      // If we have a directors array and this field is a flat director field, don't show it
      if (watchedValues.directors && Array.isArray(watchedValues.directors) && flatDirectorFieldPatterns.includes(field.key)) {
        return false;
      }
      
      return true;
    }
    
    const dependentValue = watchedValues[field.conditional.dependsOn];
    return dependentValue === field.conditional.value;
  };

  const organizeFieldsWithMapping = (data: any, mapping: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {};
    
    // Known director field keys for flat structure detection
    const directorFieldKeys = [
      'firstName', 'firstName2', 'middleName', 'middleName2', 'lastName', 'lastName2',
      'email', 'email2', 'phoneNumber', 'phoneNumber2', 'dob', 'dob2',
      'nationality', 'nationality2', 'occupation', 'occupation2', 'residentialAddress', 'residentialAddress2',
      'idType', 'idType2', 'idNumber', 'idNumber2', 'issuedDate', 'issuedDate2',
      'expiryDate', 'expiryDate2', 'issuingBody', 'issuingBody2', 'placeOfBirth', 'placeOfBirth2',
      'employersName', 'employersName2', 'employersPhoneNumber', 'employersPhoneNumber2',
      'sourceOfIncome', 'sourceOfIncome2', 'taxIDNumber', 'taxIDNumber2', 'BVNNumber', 'BVNNumber2'
    ];
    
    // Check if we have a flat director structure and need to synthesize the directors array
    const hasDirectorsArray = data.directors && Array.isArray(data.directors);
    const hasFlatDirectorFields = directorFieldKeys.some(key => data[key] !== undefined && data[key] !== '');
    
    let processedData = { ...data };
    
    // If we don't have a directors array but have flat director fields, synthesize directors
    if (!hasDirectorsArray && hasFlatDirectorFields) {
      const director1: any = {};
      const director2: any = {};
      
      // Extract director 1 data (fields without '2' suffix)
      const director1Fields = ['firstName', 'middleName', 'lastName', 'email', 'phoneNumber', 'dob', 
                              'nationality', 'occupation', 'residentialAddress', 'idType', 'idNumber', 
                              'issuedDate', 'expiryDate', 'issuingBody', 'placeOfBirth', 'employersName', 
                              'employersPhoneNumber', 'sourceOfIncome', 'taxIDNumber', 'BVNNumber'];
      
      director1Fields.forEach(field => {
        if (data[field] !== undefined && data[field] !== '') {
          director1[field] = data[field];
        }
      });
      
      // Extract director 2 data (fields with '2' suffix)
      const director2Fields = ['firstName2', 'middleName2', 'lastName2', 'email2', 'phoneNumber2', 'dob2',
                              'nationality2', 'occupation2', 'residentialAddress2', 'idType2', 'idNumber2',
                              'issuedDate2', 'expiryDate2', 'issuingBody2', 'placeOfBirth2', 'employersName2',
                              'employersPhoneNumber2', 'sourceOfIncome2', 'taxIDNumber2', 'BVNNumber2'];
      
      director2Fields.forEach(field => {
        const baseField = field.replace('2', '');
        if (data[field] !== undefined && data[field] !== '') {
          director2[baseField] = data[field];
        }
      });
      
      // Only add directors if they have meaningful data
      const directors = [];
      if (Object.keys(director1).length > 0) {
        directors.push(director1);
      }
      if (Object.keys(director2).length > 0) {
        directors.push(director2);
      }
      
      if (directors.length > 0) {
        processedData.directors = directors;
        
        // Remove flat director fields from processedData to avoid duplication
        const allDirectorFields = [...director1Fields, ...director2Fields];
        allDirectorFields.forEach(field => {
          delete processedData[field];
        });
      }
    }
    
    mapping.sections.forEach((section: any) => {
      const sectionFields: FormFieldWithValue[] = [];
      
      section.fields.forEach((field: FormField) => {
        // Skip system/technical fields and file uploads in FormViewer
        const excludedFields = ['formId', 'id', 'collection', 'timestamp'];
        if (excludedFields.includes(field.key)) {
          return;
        }
        
        // Check if field should be shown based on conditional logic
        if (shouldShowField(field, processedData)) {
          let value = processedData[field.key];
          
          // Handle array normalization for directors field and other array fields
          if (field.type === 'array' && field.key === 'directors') {
            if (Array.isArray(value)) {
              // Already an array, keep as-is
            } else if (typeof value === 'object' && value !== null) {
              // Single object, convert to array
              value = [value];
            } else {
              // No directors data, treat as empty array
              value = [];
            }
          } else if (field.type === 'array' && value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Already an array, keep as-is
            } else if (typeof value === 'object' && value !== null) {
              // Single object, convert to array
              value = [value];
            } else {
              // Non-object (string, null, etc.), treat as empty array
              value = [];
            }
          }
          
          // Always show all fields defined in formMappings, even if empty (use N/A for empty)
          sectionFields.push({
            ...field,
            value: value !== undefined && value !== null && value !== '' ? value : 'N/A',
            section: section.title,
            editable: field.editable !== false
          });
        }
      });
      
      // Only show sections that have fields (after filtering)
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

  const handleStatusUpdate = async (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!formData || !collection || !id || !pendingStatus) return;

    try {
      const docRef = doc(db, collection, id);
      await updateDoc(docRef, {
        status: pendingStatus,
        updatedAt: new Date()
      });
      
      setStatus(pendingStatus);
      setFormData(prev => prev ? { ...prev, status: pendingStatus } : null);
      
      // Send email notification if user email is available
      console.log('📧 Starting email notification process...');
      console.log('📧 User email:', formData?.email);
      console.log('📝 Collection:', collection);
      console.log('📊 Status:', pendingStatus);
      
      if (formData?.email) {
        try {
          const formType = collection?.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
          console.log('📝 Form type formatted:', formType);
          console.log('👤 User name:', formData.fullName || formData.firstName || formData.name);
          
          console.log('📤 Calling sendStatusUpdateNotification...');
          await sendStatusUpdateNotification(
            formData.email, 
            formType, 
            pendingStatus,
            formData.fullName || formData.firstName || formData.name
          );
          console.log('✅ Email notification sent successfully!');
        } catch (emailError) {
          console.error('❌ Error sending status email:', emailError);
          console.log('📧 Email error details:', JSON.stringify(emailError, null, 2));
          // Don't fail the status update if email fails
        }
      } else {
        console.log('⚠️ No email address found in form data');
        console.log('📋 Available form data keys:', Object.keys(formData));
      }
      
      toast({
        title: 'Success',
        description: `Status updated to ${pendingStatus}`,
      });
      
      setShowStatusModal(false);
      setPendingStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Error updating status',
        variant: 'destructive',
      });
    }
  };

  const generatePDF = async () => {
    if (!formData || !collection) return;
    
    setIsGeneratingPDF(true);
    try {
      const mappingKey = getFormMappingKey(collection, formData);
      const mapping = FORM_MAPPINGS[mappingKey];
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
        data: cleanData,
        mapping: mapping
      });
      
      downloadPDF(pdfBlob, '', formData, collection || '');
      
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

    // Handle file fields - always show, even if empty
    if (type === 'file' || type === 'url' || 
        (typeof value === 'string' && (value.startsWith('gs://') || value.includes('firebasestorage.googleapis.com'))) ||
        key.toLowerCase().includes('url') || key.toLowerCase().includes('file')) {
      const fieldLabel = label.replace(/Url$/, '');
      
      if (!value || value === null || value === undefined || value === '') {
        return (
          <Button
            size="small"
            variant="outlined"
            disabled
            sx={{ mt: 1, color: 'text.secondary' }}
          >
            No file uploaded
          </Button>
        );
      }
      
      return (
        <Button
          size="small"
          variant="outlined"
          startIcon={<Download />}
          onClick={() => handleDownloadFile(value, `${fieldLabel}.pdf`)}
          sx={{ mt: 1 }}
        >
          Download {fieldLabel}
        </Button>
      );
    }

    // Handle empty values - show "N/A" instead of hiding
    if (value === null || value === undefined || value === '') {
      return <Typography variant="body2" color="text.secondary">N/A</Typography>;
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
      
      case 'array':
        if (!Array.isArray(value) || value.length === 0) {
          return <Typography variant="body2" color="text.secondary">N/A</Typography>;
        }
        
        return (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {value.map((item, index) => (
              <Paper 
                key={index} 
                elevation={2}
                sx={{ 
                  p: 3, 
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  {label} {index + 1}
                </Typography>
                {typeof item === 'object' && item !== null ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                    {Object.entries(item).map(([itemKey, itemValue]) => (
                      <Box key={itemKey} sx={{ p: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                          {formatFieldLabel(itemKey)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {String(itemValue || 'N/A')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{String(item)}</Typography>
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
      <Box sx={{ 
        p: { xs: 2, sm: 3 }, 
        maxWidth: '1200px', 
        mx: 'auto',
        width: '100%',
        minHeight: '100vh'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' }, 
          mb: 3,
          gap: 2
        }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate(-1)}
            sx={{ order: { xs: 1, md: 0 } }}
          >
            Back
          </Button>
          <Typography 
            variant="h4" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1.5rem', md: '2rem' },
              order: { xs: 0, md: 1 }
            }}
          >
            {formTitle}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            order: { xs: 2, md: 2 }
          }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              fullWidth={true}
              sx={{ 
                minWidth: { xs: 'auto', sm: 'unset' }
              }}
            >
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            {collection?.includes('claim') && (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1
              }}>
                <Button 
                  onClick={() => handleStatusUpdate('processing')}
                  variant={status === 'processing' ? 'contained' : 'outlined'}
                  size="small"
                  color="warning"
                  fullWidth={true}
                >
                  Processing
                </Button>
                <Button 
                  onClick={() => handleStatusUpdate('approved')}
                  variant={status === 'approved' ? 'contained' : 'outlined'}
                  size="small"
                  color="success"
                  fullWidth={true}
                >
                  Approved
                </Button>
                <Button 
                  onClick={() => handleStatusUpdate('rejected')}
                  variant={status === 'rejected' ? 'contained' : 'outlined'}
                  size="small"
                  color="error"
                  fullWidth={true}
                >
                  Rejected
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Form Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`ID: ${formData.id}`} 
                size="small" 
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
              <Chip 
                label={`Status: ${status || 'pending'}`} 
                size="small" 
                color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'default'}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              />
              {formData.createdAt && (
                <Chip 
                  label={`Submitted: ${formatDate(formData.createdAt)}`} 
                  size="small" 
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {Object.entries(organizedFields).map(([sectionTitle, fields]) => (
            <Paper key={sectionTitle} elevation={1} sx={{ 
              mb: { xs: 2, sm: 3 }, 
              p: { xs: 2, sm: 3 }, 
              bgcolor: 'grey.50' 
            }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  color: 'primary.main', 
                  mb: 2,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {sectionTitle}
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gap: { xs: 2, sm: 3 },
                gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(300px, 1fr))' }
              }}>
                {fields.map((field) => (
                  <Box key={field.key} sx={{ width: '100%' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'start', sm: 'center' }, 
                      mb: 1,
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary" 
                        sx={{ 
                          flexGrow: 1, 
                          fontWeight: 'medium',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        {field.label}
                      </Typography>
                      {field.editable && !editingFields[field.key] && (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleEditField(field.key)}
                          sx={{ 
                            ml: { xs: 0, sm: 1 },
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ 
                      width: '100%',
                      overflow: 'hidden',
                      wordBreak: 'break-word'
                    }}>
                      {renderFieldValue(field)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Paper>
        
        <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)}>
          <DialogTitle>Confirm Status Update</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to update the status to "{pendingStatus}"? 
              {formData?.email && ' An email notification will be sent to the user.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setShowStatusModal(false);
                setPendingStatus('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusUpdate} variant="contained">
              Confirm Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default FormViewer;