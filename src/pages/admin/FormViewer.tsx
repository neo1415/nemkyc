import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Button, Typography, Box, Paper, Divider, Chip } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Download, Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import jsPDF from 'jspdf';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c2d12',
    },
  },
});

const FormViewer: React.FC = () => {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        setFormData({
          id: docSnap.id,
          collection,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        });
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

  const generatePDF = () => {
    if (!formData) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Add title
    pdf.setFontSize(18);
    pdf.text(`${formData.collection?.replace('-', ' ').toUpperCase()} - ${formData.id}`, 20, yPosition);
    yPosition += 20;

    // Add form data
    pdf.setFontSize(12);
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'collection' && value !== null && value !== undefined) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const displayValue = typeof value === 'object' && value instanceof Date 
          ? value.toLocaleDateString() 
          : String(value);
        
        pdf.text(`${key}: ${displayValue}`, 20, yPosition);
        yPosition += 10;
      }
    });

    pdf.save(`${formData.collection}-${formData.id}.pdf`);
  };

  const renderField = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') return null;
    
    let displayValue = value;
    if (value instanceof Date) {
      displayValue = value.toLocaleDateString();
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value, null, 2);
    }

    return (
      <Box key={key} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.5 }}>
          {String(displayValue)}
        </Typography>
      </Box>
    );
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            Back to Admin
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {formData.collection?.replace('-', ' ').toUpperCase()}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={generatePDF}
            sx={{ ml: 2 }}
          >
            Download PDF
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Form Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={`ID: ${formData.id}`} size="small" />
              <Chip label={`Status: ${formData.status || 'pending'}`} size="small" />
              <Chip label={`Submitted: ${formData.createdAt?.toLocaleDateString()}`} size="small" />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'grid', gap: 2 }}>
            {Object.entries(formData)
              .filter(([key]) => !['id', 'collection', 'createdAt', 'updatedAt'].includes(key))
              .map(([key, value]) => renderField(key, value))}
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default FormViewer;