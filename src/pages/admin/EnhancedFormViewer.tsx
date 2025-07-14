import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  Grid,
  Paper,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack, 
  Edit, 
  Save, 
  Cancel, 
  Download,
  CheckCircle,
  Cancel as CancelIcon,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  getDownloadURL 
} from 'firebase/storage';
import { db } from '@/firebase/config';

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

interface FormField {
  key: string;
  label: string;
  value: any;
  type: 'text' | 'date' | 'email' | 'url' | 'array' | 'object' | 'boolean';
  section: string;
  editable: boolean;
}

const EnhancedFormViewer: React.FC = () => {
  const { collection: collectionName, id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('processing');

  const isClaim = collectionName?.includes('claims');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    fetchFormData();
  }, [user, isAdmin, navigate, collectionName, id]);

  const fetchFormData = async () => {
    if (!collectionName || !id) return;

    try {
      setLoading(true);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setFormData({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast({ title: 'Form not found', variant: 'destructive' });
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({ title: 'Error fetching form data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    
    try {
      let dateObj: Date;
      
      if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else if (typeof date === 'string') {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
          return date;
        }
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return '';
      }

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  const getFieldType = (key: string, value: any): FormField['type'] => {
    if (key.toLowerCase().includes('url') || (typeof value === 'string' && value.includes('firebase'))) {
      return 'url';
    }
    if (key.toLowerCase().includes('date') || key === 'dateOfBirth') {
      return 'date';
    }
    if (key.toLowerCase().includes('email')) {
      return 'email';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (typeof value === 'object' && value !== null) {
      return 'object';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    return 'text';
  };

  const getSectionName = (key: string): string => {
    // Determine section based on field name patterns
    if (['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'].includes(key)) {
      return 'Policy Details';
    }
    if (['nameCompany', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'].includes(key)) {
      return 'Personal/Company Information';
    }
    if (['companyName', 'registeredAddress', 'city', 'state', 'country', 'incorporationNumber'].includes(key)) {
      return 'Company Information';
    }
    if (key === 'directors' || key.startsWith('director')) {
      return 'Directors Information';
    }
    if (key === 'witnesses' || key.startsWith('witness')) {
      return 'Witnesses Information';
    }
    if (['localAccountNumber', 'localBankName', 'foreignAccountNumber'].includes(key)) {
      return 'Account Details';
    }
    if (['registrationNumber', 'make', 'model', 'year', 'engineNumber'].includes(key)) {
      return 'Vehicle Details';
    }
    if (['incidentLocation', 'incidentDate', 'incidentTime', 'incidentDescription'].includes(key)) {
      return 'Incident Details';
    }
    if (['status', 'createdAt', 'timestamp', 'formType'].includes(key)) {
      return 'System Information';
    }
    return 'Other Information';
  };

  const organizeFields = (data: any): Record<string, FormField[]> => {
    const sections: Record<string, FormField[]> = {};
    
    // Exclude certain fields
    const excludeFields = ['id', 'timestamp', 'submittedAt', 'agreeToDataPrivacy', 'declarationTrue', 'declarationAdditionalInfo', 'declarationDocuments', 'signature'];
    
    Object.entries(data).forEach(([key, value]) => {
      if (excludeFields.includes(key)) return;
      
      const section = getSectionName(key);
      const fieldType = getFieldType(key, value);
      const editable = !['timestamp', 'createdAt', 'formType', 'id'].includes(key);
      
      if (!sections[section]) {
        sections[section] = [];
      }
      
      sections[section].push({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        value,
        type: fieldType,
        section,
        editable
      });
    });
    
    return sections;
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, url);
      const downloadUrl = await getDownloadURL(fileRef);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      
      toast({ title: 'File download started' });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: 'Error downloading file', variant: 'destructive' });
    }
  };

  const handleEditField = (fieldKey: string) => {
    setEditingFields(prev => new Set(prev).add(fieldKey));
    setEditedValues(prev => ({
      ...prev,
      [fieldKey]: formData[fieldKey]
    }));
  };

  const handleSaveField = async (fieldKey: string) => {
    if (!collectionName || !id) return;

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        [fieldKey]: editedValues[fieldKey],
        updatedAt: new Date()
      });

      setFormData((prev: any) => ({
        ...prev,
        [fieldKey]: editedValues[fieldKey]
      }));

      setEditingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });

      toast({ title: 'Field updated successfully' });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({ title: 'Error updating field', variant: 'destructive' });
    }
  };

  const handleCancelEdit = (fieldKey: string) => {
    setEditingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldKey);
      return newSet;
    });
    
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldKey];
      return newValues;
    });
  };

  const handleStatusChange = async () => {
    if (!collectionName || !id) return;

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      setFormData((prev: any) => ({
        ...prev,
        status: newStatus
      }));

      setStatusDialogOpen(false);
      toast({ title: `Status updated to ${newStatus}` });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const renderFieldValue = (field: FormField) => {
    const isEditing = editingFields.has(field.key);
    const displayValue = isEditing ? editedValues[field.key] : field.value;

    if (field.type === 'url') {
      const fileName = field.key.replace('Url', '').replace(/([A-Z])/g, ' $1').trim();
      return (
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={() => handleDownloadFile(field.value, fileName)}
          size="small"
        >
          Download {fileName}
        </Button>
      );
    }

    if (field.type === 'array') {
      const items = Array.isArray(field.value) ? field.value : [];
      return (
        <Box>
          <Typography variant="body2" color="textSecondary">
            {items.length} item(s)
          </Typography>
          {items.map((item: any, index: number) => (
            <Card key={index} variant="outlined" sx={{ mt: 1, p: 2 }}>
              <Typography variant="subtitle2">Item {index + 1}</Typography>
              {typeof item === 'object' ? (
                Object.entries(item).map(([key, value]) => (
                  <Typography key={key} variant="body2">
                    <strong>{key}:</strong> {String(value)}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2">{String(item)}</Typography>
              )}
            </Card>
          ))}
        </Box>
      );
    }

    if (field.type === 'object') {
      return (
        <Card variant="outlined" sx={{ p: 2 }}>
          {Object.entries(field.value || {}).map(([key, value]) => (
            <Typography key={key} variant="body2">
              <strong>{key}:</strong> {String(value)}
            </Typography>
          ))}
        </Card>
      );
    }

    if (field.type === 'date') {
      const formattedDate = formatDate(field.value);
      return isEditing ? (
        <TextField
          type="date"
          value={editedValues[field.key] || ''}
          onChange={(e) => setEditedValues(prev => ({ ...prev, [field.key]: e.target.value }))}
          size="small"
          fullWidth
        />
      ) : (
        <Typography>{formattedDate}</Typography>
      );
    }

    if (field.type === 'boolean') {
      return (
        <Chip 
          label={field.value ? 'Yes' : 'No'} 
          color={field.value ? 'success' : 'default'}
          size="small"
        />
      );
    }

    if (isEditing && field.editable) {
      return (
        <TextField
          value={editedValues[field.key] || ''}
          onChange={(e) => setEditedValues(prev => ({ ...prev, [field.key]: e.target.value }))}
          size="small"
          fullWidth
          multiline={field.type === 'text' && String(field.value).length > 100}
          rows={field.type === 'text' && String(field.value).length > 100 ? 3 : 1}
        />
      );
    }

    return (
      <Typography>
        {field.key === 'status' ? (
          <Chip 
            label={field.value || 'processing'} 
            color={
              field.value === 'approved' ? 'success' : 
              field.value === 'rejected' ? 'error' : 'warning'
            }
            size="small"
          />
        ) : (
          String(field.value || '')
        )}
      </Typography>
    );
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!formData) {
    return <Typography>Form not found</Typography>;
  }

  const sections = organizeFields(formData);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/admin')}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h4">
              Form Details - {collectionName?.replace('-', ' ').toUpperCase()}
            </Typography>
          </Box>
          
          {isClaim && (
            <Button
              variant="contained"
              onClick={() => setStatusDialogOpen(true)}
              startIcon={<Edit />}
            >
              Update Status
            </Button>
          )}
        </Box>

        {/* Sections */}
        {Object.entries(sections).map(([sectionName, fields]) => (
          <Card key={sectionName} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                {sectionName}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                {fields.map((field) => (
                  <Box key={field.key}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {field.label}
                        </Typography>
                        {field.editable && (
                          <Box>
                            {editingFields.has(field.key) ? (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleSaveField(field.key)}
                                  color="primary"
                                >
                                  <Save />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCancelEdit(field.key)}
                                >
                                  <Cancel />
                                </IconButton>
                              </>
                            ) : (
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditField(field.key)}
                              >
                                <Edit />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Box>
                      {renderFieldValue(field)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>Update Claim Status</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newStatus}
                label="Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusChange} variant="contained">
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default EnhancedFormViewer;