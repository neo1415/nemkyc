import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Button, Typography, Box, Paper, Divider, Chip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Download, ArrowLeft } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { downloadDynamicPDF } from '../../services/dynamicPdfService';
import { FORM_MAPPINGS, FormField } from '../../config/formMappings';
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
}

const UserFormViewer: React.FC = () => {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [organizedFields, setOrganizedFields] = useState<Record<string, FormFieldWithValue[]>>({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (collection && id) {
      fetchFormData();
    }
  }, [user, collection, id, navigate]);

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
        
        // Verify user owns this submission
        if (data.submittedBy !== user?.email && data.userUid !== user?.uid) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this submission',
            variant: 'destructive',
          });
          navigate('/dashboard');
          return;
        }
        
        setFormData(data);
        
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
        navigate('/dashboard');
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

  const getFormMappingKey = (collectionName: string, formData?: any): string => {
    const collectionMappings: Record<string, string | ((data: any) => string)> = {
      'corporate-kyc': (data: any) => {
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-corporate-cdd';
        }
        return 'corporate-kyc';
      },
      'partners-kyc': (data: any) => {
        if (data.naicomField || data.typeOfEntity === 'naicom') {
          return 'naicom-partners-cdd';
        }
        return 'partners-cdd';
      },
      'Individual-kyc-form': 'individual-kyc',
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
      return true;
    }
    
    const dependentValue = watchedValues[field.conditional.dependsOn];
    return dependentValue === field.conditional.value;
  };

  const organizeFieldsWithMapping = (data: any, mapping: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {};
    
    // Administrative fields to exclude from user view
    const adminFields = ['id', 'collection', 'formId', 'userUid', 'timestamp', 'sn', 'S/N', 'serialNumber', 'rowNumber'];
    
    mapping.sections.forEach((section: any) => {
      const sectionFields: FormFieldWithValue[] = [];
      
      section.fields.forEach((field: FormField) => {
        // Skip administrative fields
        if (adminFields.includes(field.key) ||
            field.key.toLowerCase().includes('sn') ||
            field.key.toLowerCase().includes('serial') ||
            field.label?.toLowerCase().includes('s/n') ||
            field.label?.toLowerCase().includes('serial')) {
          return;
        }
        
        // Check if field should be shown based on conditional logic
        if (shouldShowField(field, data)) {
          let value = data[field.key];
          
          // Handle array normalization
          if (field.type === 'array' && value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              // Already an array
            } else if (typeof value === 'object' && value !== null) {
              value = [value];
            } else {
              value = [];
            }
          }
          
          sectionFields.push({
            ...field,
            value: value !== undefined && value !== null && value !== '' ? value : 'N/A',
            section: section.title
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
    
    // Administrative fields to exclude
    const adminFields = ['id', 'collection', 'formId', 'userUid', 'timestamp'];
    
    Object.entries(data).forEach(([key, value]) => {
      if (!adminFields.includes(key)) {
        organized['Form Data'].push({
          key,
          label: formatFieldLabel(key),
          type: getFieldType(key, value),
          value,
          section: 'Form Data'
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

  const generatePDF = async () => {
    if (!formData || !collection) return;
    
    setIsGeneratingPDF(true);
    try {
      await downloadDynamicPDF(formData);
      
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
    const { key, value, type, label } = field;

    // Handle file fields
    if (type === 'file' || type === 'url' || 
        (typeof value === 'string' && (value.startsWith('gs://') || value.includes('firebasestorage.googleapis.com'))) ||
        key.toLowerCase().includes('url') || key.toLowerCase().includes('file')) {
      const fieldLabel = label.replace(/Url$/, '');
      
      if (!value || value === null || value === undefined || value === '') {
        return <Typography variant="body2" color="text.secondary">N/A</Typography>;
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

    // Handle empty values
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

  if (!user) {
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
            onClick={() => navigate('/dashboard')}
            sx={{ order: { xs: 1, md: 0 } }}
          >
            Back to Dashboard
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
          </Box>
        </Box>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Ticket ID Display - Prominent */}
          {formData.ticketId && (
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              backgroundColor: '#f8f9fa',
              border: '2px solid #800020',
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Your Ticket ID
              </Typography>
              <Typography variant="h4" sx={{ color: '#800020', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formData.ticketId}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Please reference this ID in all future correspondence
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Submission Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Status: ${formData.status || 'pending'}`} 
                size="small" 
                color={formData.status === 'approved' ? 'success' : formData.status === 'rejected' ? 'error' : 'default'}
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
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 1,
                        fontWeight: 'medium',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}
                    >
                      {field.label}
                    </Typography>
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
      </Box>
    </ThemeProvider>
  );
};

export default UserFormViewer;
