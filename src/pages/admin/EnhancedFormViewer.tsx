import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Save, X, Download, FileText, Calendar, Mail, Link, User, Check, AlertTriangle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { getFormMapping, FormField } from '@/config/formMappings';

interface FormFieldWithValue extends FormField {
  value: any;
  section: string;
  editable: boolean;
}

const EnhancedFormViewer: React.FC = () => {
  const { collection: collectionName, id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [organizedFields, setOrganizedFields] = useState<Record<string, FormFieldWithValue[]>>({});
  const [formMapping, setFormMapping] = useState<any>(null);

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    
    if (collectionName && id) {
      // Get form mapping first
      const mapping = getFormMapping(collectionName);
      setFormMapping(mapping);
      fetchFormData();
    }
  }, [collectionName, id, user, isAdmin, navigate]);

  const fetchFormData = async () => {
    if (!collectionName || !id) return;
    
    try {
      setLoading(true);
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(data);
        setNewStatus(data.status || 'processing');
        if (formMapping) {
          const organized = organizeFieldsWithMapping(data, formMapping);
          setOrganizedFields(organized);
        }
      } else {
        setError('Document not found');
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to fetch form data');
    } finally {
      setLoading(false);
    }
  };

  // Re-organize fields when mapping is available
  useEffect(() => {
    if (formData && formMapping) {
      const organized = organizeFieldsWithMapping(formData, formMapping);
      setOrganizedFields(organized);
    }
  }, [formData, formMapping]);

  const organizeFieldsWithMapping = (data: any, mapping: any): Record<string, FormFieldWithValue[]> => {
    const organized: Record<string, FormFieldWithValue[]> = {};
    
    if (!mapping || !mapping.sections) {
      // Fallback to original organization if no mapping
      return organizeFieldsFallback(data);
    }

    mapping.sections.forEach((section: any) => {
      const sectionFields: FormFieldWithValue[] = [];
      
      section.fields.forEach((fieldDef: FormField) => {
        const value = data[fieldDef.key];
        if (value !== undefined) {
          sectionFields.push({
            ...fieldDef,
            value,
            section: section.title,
            editable: fieldDef.editable !== false && fieldDef.key !== 'submittedAt' && fieldDef.key !== 'createdAt' && fieldDef.key !== 'timestamp'
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
    const organized: Record<string, FormFieldWithValue[]> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'timestamp' || key === 'id') return; // Skip Firebase internal fields
      
      const field: FormFieldWithValue = {
        key,
        label: formatFieldLabel(key),
        value,
        type: getFieldType(key, value),
        section: getSectionName(key),
        editable: key !== 'submittedAt' && key !== 'createdAt' && key !== 'formType' && key !== 'timestamp'
      };
      
      if (!organized[field.section]) {
        organized[field.section] = [];
      }
      organized[field.section].push(field);
    });
    
    return organized;
  };

  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  const getFieldType = (key: string, value: any): FormField['type'] => {
    if (key.toLowerCase().includes('email')) return 'email';
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) return 'url';
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) return 'date';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'text';
  };

  const getSectionName = (key: string): string => {
    if (key.includes('policy') || key.includes('Policy')) return 'Policy Details';
    if (key.includes('insured') || key.includes('name') || key.includes('address') || key.includes('phone') || key.includes('email')) return 'Insured Details';
    if (key.includes('vehicle') || key.includes('registration') || key.includes('make') || key.includes('model')) return 'Vehicle Details';
    if (key.includes('accident') || key.includes('incident') || key.includes('loss')) return 'Incident Details';
    if (key.includes('claim') || key.includes('damage')) return 'Claim Details';
    if (key.includes('witness')) return 'Witnesses';
    if (key.includes('declaration') || key.includes('signature') || key.includes('agree')) return 'Declaration';
    if (key.includes('status') || key.includes('submitted') || key.includes('created') || key.includes('formType')) return 'System Information';
    return 'Other Information';
  };

  const formatDate = (date: any): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      if (date.toDate && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return String(date);
      }
      
      if (isValid(dateObj)) {
        return format(dateObj, 'dd/MM/yyyy');
      }
      return String(date);
    } catch (error) {
      return String(date);
    }
  };

  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      if (url.startsWith('gs://')) {
        // Firebase Storage URL
        const storageRef = ref(storage, url);
        const downloadURL = await getDownloadURL(storageRef);
        window.open(downloadURL, '_blank');
      } else {
        // Direct URL
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleEditField = (fieldKey: string) => {
    setEditingFields({ ...editingFields, [fieldKey]: true });
    setEditValues({ ...editValues, [fieldKey]: formData[fieldKey] });
  };

  const handleSaveField = async (fieldKey: string) => {
    try {
      const docRef = doc(db, collectionName!, id!);
      await updateDoc(docRef, {
        [fieldKey]: editValues[fieldKey]
      });
      
      setFormData({ ...formData, [fieldKey]: editValues[fieldKey] });
      setEditingFields({ ...editingFields, [fieldKey]: false });
      
      toast({
        title: "Field Updated",
        description: `${fieldKey} has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Update Error",
        description: "Failed to update field",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = (fieldKey: string) => {
    setEditingFields({ ...editingFields, [fieldKey]: false });
    setEditValues({ ...editValues, [fieldKey]: formData[fieldKey] });
  };

  const handleStatusChange = async () => {
    try {
      const docRef = doc(db, collectionName!, id!);
      await updateDoc(docRef, { status: newStatus });
      
      setFormData({ ...formData, status: newStatus });
      setIsStatusDialogOpen(false);
      
      toast({
        title: "Status Updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const renderFieldValue = (field: FormFieldWithValue) => {
    const isEditing = editingFields[field.key];
    const currentValue = isEditing ? editValues[field.key] : field.value;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {field.type === 'boolean' ? (
            <Select
              value={String(editValues[field.key])}
              onValueChange={(value) => setEditValues({ ...editValues, [field.key]: value === 'true' })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          ) : field.type === 'number' ? (
            <Input
              type="number"
              value={editValues[field.key] || ''}
              onChange={(e) => setEditValues({ ...editValues, [field.key]: Number(e.target.value) })}
              className="max-w-xs"
            />
          ) : (
            <Textarea
              value={editValues[field.key] || ''}
              onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
              className="max-w-md"
              rows={field.type === 'text' && String(currentValue).length > 50 ? 3 : 1}
            />
          )}
          <Button
            size="sm"
            onClick={() => handleSaveField(field.key)}
            className="px-2"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCancelEdit(field.key)}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    // Display mode
    const renderValue = () => {
      if (field.type === 'date') {
        return formatDate(currentValue);
      } else if (field.type === 'email') {
        return (
          <a href={`mailto:${currentValue}`} className="text-blue-600 hover:underline">
            {currentValue}
          </a>
        );
      } else if (field.type === 'url') {
        if (String(currentValue).includes('firebase') || String(currentValue).includes('storage')) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadFile(String(currentValue), 'document')}
              className="text-blue-600"
            >
              <Download className="h-4 w-4 mr-1" />
              Download File
            </Button>
          );
        }
        return (
          <a href={String(currentValue)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {currentValue}
          </a>
        );
      } else if (field.type === 'boolean') {
        return currentValue ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Yes
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            No
          </Badge>
        );
      } else if (field.type === 'array') {
        if (Array.isArray(currentValue)) {
          return (
            <div className="space-y-2">
              {currentValue.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                </div>
              ))}
            </div>
          );
        }
        return String(currentValue);
      } else if (field.type === 'object') {
        return (
          <pre className="p-2 bg-gray-50 rounded border text-sm overflow-auto">
            {JSON.stringify(currentValue, null, 2)}
          </pre>
        );
      }
      return String(currentValue || '');
    };

    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">{renderValue()}</div>
        {field.editable && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditField(field.key)}
            className="ml-2 px-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  if (!user || !isAdmin()) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{formMapping?.title || 'Form Details'}</h1>
            <p className="text-gray-600">
              ID: {id} • Status: 
              <Badge variant={formData?.status === 'approved' ? 'default' : 'secondary'} className="ml-1">
                {formData?.status || 'processing'}
              </Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Status</DialogTitle>
                <DialogDescription>
                  Change the status of this form submission.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusChange}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {Object.entries(organizedFields).map(([sectionName, fields]) => (
          <Card key={sectionName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {sectionName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {fields.map((field) => (
                  <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                    <div className="font-medium text-gray-700">
                      {field.label}
                    </div>
                    <div className="md:col-span-2">
                      {renderFieldValue(field)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnhancedFormViewer;