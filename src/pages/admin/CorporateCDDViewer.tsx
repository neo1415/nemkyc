import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit2, Save, X, Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';

interface FormData {
  id: string;
  [key: string]: any;
}

interface Director {
  title?: string;
  gender?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: any;
  placeOfBirth?: string;
  nationality?: string;
  country?: string;
  occupation?: string;
  email?: string;
  phoneNumber?: string;
  BVNNumber?: string;
  employersName?: string;
  employersPhoneNumber?: string;
  employerPhone?: string;
  residentialAddress?: string;
  taxIDNumber?: string;
  taxIdNumber?: string;
  idType?: string;
  idNumber?: string;
  identificationNumber?: string;
  issuingBody?: string;
  issuedDate?: any;
  expiryDate?: any;
  sourceOfIncome?: string;
  incomeSource?: string;
  sourceOfIncomeOther?: string;
  incomeSourceOther?: string;
}

const CorporateCDDViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/unauthorized');
      return;
    }
    
    fetchFormData();
  }, [user, isAdmin, navigate, id]);

  const fetchFormData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const docRef = doc(db, 'corporate-kyc', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setFormData({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast({
          title: "Error",
          description: "Form data not found",
          variant: "destructive"
        });
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch form data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fieldName: string, currentValue: string) => {
    setEditingField(fieldName);
    setEditValue(currentValue || '');
  };

  const handleSave = async (fieldName: string) => {
    if (!id || !formData) return;
    
    try {
      setIsUpdating(true);
      const docRef = doc(db, 'corporate-kyc', id);
      await updateDoc(docRef, {
        [fieldName]: editValue,
        updatedAt: new Date()
      });
      
      setFormData(prev => prev ? { ...prev, [fieldName]: editValue } : null);
      setEditingField(null);
      
      toast({
        title: "Success",
        description: "Field updated successfully"
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Error",
        description: "Failed to update field",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    
    try {
      setIsUpdating(true);
      const docRef = doc(db, 'corporate-kyc', id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setFormData(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusDialog(false);
      
      toast({
        title: "Success",
        description: "Status updated successfully"
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const generatePDF = () => {
    if (!formData) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;
    
    // Define burgundy color (139, 69, 19) as RGB values
    const burgundyR = 139;
    const burgundyG = 69;
    const burgundyB = 19;
    
    // Company Header
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('NEM INSURANCE PLC', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('199, Ikorodu Road, Obanikoro, Lagos', 20, yPosition);
    yPosition += 5;
    pdf.text('Tel: +234-1-295-2627, Email: info@neminsurance.com.ng', 20, yPosition);
    yPosition += 5;
    pdf.text('Website: www.neminsurance.com.ng', 20, yPosition);
    
    // Draw burgundy line under header
    pdf.setDrawColor(burgundyR, burgundyG, burgundyB);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition + 3, pageWidth - 20, yPosition + 3);
    yPosition += 15;
    
    // Form Title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    const isNaicomForm = formData.cacForm && formData.cacForm.trim() !== '';
    pdf.text(isNaicomForm ? 'NAICOM CORPORATE CDD FORM' : 'CORPORATE CDD FORM', 20, yPosition);
    yPosition += 15;
    
    // Company Details Section
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('COMPANY DETAILS', 20, yPosition);
    yPosition += 2;
    
    // Draw burgundy line under section header
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    const companyFields = [
      { label: 'Company Name', value: formData.companyName || 'N/A' },
      { label: 'Incorporation Number', value: formData.incorporationNumber || 'N/A' },
      { label: 'Incorporation State', value: formData.incorporationState || 'N/A' },
      { label: 'Date of Incorporation', value: formatDate(formData.dateOfIncorporationRegistration) },
      { label: 'Company Type', value: formData.companyLegalForm || 'N/A' },
      { label: 'Email Address', value: formData.emailAddress || 'N/A' },
      { label: 'Website', value: formData.website || 'N/A' },
      { label: 'Tax ID Number', value: formData.taxIdentificationNumber || 'N/A' },
      { label: 'Telephone Number', value: formData.telephoneNumber || 'N/A' },
      { label: 'Registered Address', value: formData.registeredCompanyAddress || 'N/A' },
      { label: 'Nature of Business', value: formData.natureOfBusiness || 'N/A' }
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    companyFields.forEach(field => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label}:`, 20, yPosition);
      pdf.setFont(undefined, 'normal');
      
      const maxWidth = 130;
      const textLines = pdf.splitTextToSize(field.value, maxWidth);
      pdf.text(textLines, 70, yPosition);
      yPosition += Math.max(textLines.length * 5, 6);
    });
    
    // Directors Section
    yPosition += 5;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('DIRECTORS INFORMATION', 20, yPosition);
    yPosition += 2;
    
    // Draw burgundy line under section header
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    // Handle both new array format and old flat format
    const directors: Director[] = [];
    
    // Check if directors is an array (new format)
    if (formData.directors && Array.isArray(formData.directors)) {
      directors.push(...formData.directors);
    }
    
    // Check for old flat format (firstName, lastName, firstName2, lastName2, etc.)
    if (directors.length === 0) {
      // Director 1 (no number suffix)
      if (formData.firstName || formData.lastName) {
        const director: Director = {
          firstName: formData.firstName || '',
          middleName: formData.middleName || '',
          lastName: formData.lastName || '',
          dob: formData.dob || '',
          placeOfBirth: formData.placeOfBirth || '',
          nationality: formData.nationality || '',
          country: formData.country || '',
          occupation: formData.occupation || '',
          email: formData.email || '',
          phoneNumber: formData.phoneNumber || '',
          BVNNumber: formData.BVNNumber || '',
          employersName: formData.employersName || '',
          employersPhoneNumber: formData.employersPhoneNumber || '',
          residentialAddress: formData.residentialAddress || '',
          taxIDNumber: formData.taxIDNumber || '',
          idType: formData.idType || '',
          idNumber: formData.idNumber || '',
          issuingBody: formData.issuingBody || '',
          issuedDate: formData.issuedDate || '',
          expiryDate: formData.expiryDate || '',
          sourceOfIncome: formData.sourceOfIncome || ''
        };
        directors.push(director);
      }
      
      // Director 2 (with "2" suffix)
      if (formData.firstName2 || formData.lastName2) {
        const director: Director = {
          firstName: formData.firstName2 || '',
          middleName: formData.middleName2 || '',
          lastName: formData.lastName2 || '',
          dob: formData.dob2 || '',
          placeOfBirth: formData.placeOfBirth2 || '',
          nationality: formData.nationality2 || '',
          country: formData.country2 || '',
          occupation: formData.occupation2 || '',
          email: formData.email2 || '',
          phoneNumber: formData.phoneNumber2 || '',
          BVNNumber: formData.BVNNumber2 || '',
          employersName: formData.employersName2 || '',
          employersPhoneNumber: formData.employersPhoneNumber2 || '',
          residentialAddress: formData.residentialAddress2 || '',
          taxIDNumber: formData.taxIDNumber2 || '',
          idType: formData.idType2 || '',
          idNumber: formData.idNumber2 || '',
          issuingBody: formData.issuingBody2 || '',
          issuedDate: formData.issuedDate2 || '',
          expiryDate: formData.expiryDate2 || '',
          sourceOfIncome: formData.sourceOfIncome2 || ''
        };
        directors.push(director);
      }
    }
    
    if (directors.length > 0) {
      directors.forEach((director: Director, index: number) => {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(burgundyR, burgundyG, burgundyB);
        pdf.text(`Director ${index + 1}`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        const directorFields = [
          { label: 'First Name', value: director.firstName || 'N/A' },
          { label: 'Middle Name', value: director.middleName || 'N/A' },
          { label: 'Last Name', value: director.lastName || 'N/A' },
          { label: 'Date of Birth', value: formatDate(director.dob) },
          { label: 'Place of Birth', value: director.placeOfBirth || 'N/A' },
          { label: 'Nationality', value: director.nationality || director.country || 'N/A' },
          { label: 'Email', value: director.email || 'N/A' },
          { label: 'Phone Number', value: director.phoneNumber || 'N/A' },
          { label: 'Residential Address', value: director.residentialAddress || 'N/A' },
          { label: 'ID Type', value: director.idType || 'N/A' },
          { label: 'Identification Number', value: director.identificationNumber || director.idNumber || 'N/A' },
          { label: 'Issued Date', value: formatDate(director.issuedDate) },
          { label: 'Expiry Date', value: formatDate(director.expiryDate) },
          { label: 'Issuing Body', value: director.issuingBody || 'N/A' },
          { label: 'BVN', value: director.BVNNumber || 'N/A' },
          { label: 'Tax ID Number', value: director.taxIDNumber || director.taxIdNumber || 'N/A' },
          { label: 'Occupation', value: director.occupation || 'N/A' },
          { label: 'Employer Name', value: director.employersName || 'N/A' },
          { label: 'Employer Phone', value: director.employersPhoneNumber || director.employerPhone || 'N/A' },
          { label: 'Source of Income', value: director.sourceOfIncome || director.incomeSource || 'N/A' }
        ];
        
        directorFields.forEach(field => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFont(undefined, 'bold');
          pdf.text(`${field.label}:`, 25, yPosition);
          pdf.setFont(undefined, 'normal');
          
          const maxWidth = 125;
          const textLines = pdf.splitTextToSize(field.value, maxWidth);
          pdf.text(textLines, 75, yPosition);
          yPosition += Math.max(textLines.length * 5, 6);
        });
        
        yPosition += 5;
      });
    } else {
      pdf.setFont(undefined, 'normal');
      pdf.text('No directors information available', 25, yPosition);
      yPosition += 10;
    }
    
    // Account Details Section
    yPosition += 5;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('ACCOUNT DETAILS', 20, yPosition);
    yPosition += 2;
    
    // Draw burgundy line under section header
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    // Local Account Details
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('Local Account Details', 20, yPosition);
    yPosition += 6;
    
    const localAccountFields = [
      { label: 'Bank Name', value: formData.bankName || formData.localBankName || 'N/A' },
      { label: 'Account Number', value: formData.accountNumber || formData.localAccountNumber || 'N/A' },
      { label: 'Bank Branch', value: formData.bankBranch || formData.localBankBranch || 'N/A' },
      { label: 'Account Opening Date', value: formatDate(formData.accountOpeningDate || formData.localAccountOpeningDate) }
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    localAccountFields.forEach(field => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label}:`, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      
      const maxWidth = 125;
      const textLines = pdf.splitTextToSize(field.value, maxWidth);
      pdf.text(textLines, 75, yPosition);
      yPosition += Math.max(textLines.length * 5, 6);
    });
    
    yPosition += 5;
    
    // Foreign Account Details
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('Foreign Account Details', 20, yPosition);
    yPosition += 6;
    
    const foreignAccountFields = [
      { label: 'Bank Name', value: formData.bankName2 || formData.foreignBankName || 'N/A' },
      { label: 'Account Number', value: formData.accountNumber2 || formData.foreignAccountNumber || 'N/A' },
      { label: 'Bank Branch', value: formData.bankBranch2 || formData.foreignBankBranch || 'N/A' },
      { label: 'Account Opening Date', value: formatDate(formData.accountOpeningDate2 || formData.foreignAccountOpeningDate) }
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    foreignAccountFields.forEach(field => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label}:`, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      
      const maxWidth = 125;
      const textLines = pdf.splitTextToSize(field.value, maxWidth);
      pdf.text(textLines, 75, yPosition);
      yPosition += Math.max(textLines.length * 5, 6);
    });
    
    // Document Uploads Section
    yPosition += 10;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('DOCUMENT UPLOADS', 20, yPosition);
    yPosition += 2;
    
    // Draw burgundy line under section header
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    const documentFields = [
      { label: 'CAC Certificate', uploaded: !!(formData.cac || formData.identificationDocument) },
      { label: 'Identification Document', uploaded: !!formData.identification },
      { label: 'NAICOM License Certificate', uploaded: !!(formData.cacForm || formData.naicomLicense) }
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    documentFields.forEach(field => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label}:`, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      pdf.text(field.uploaded ? 'Document uploaded' : 'Document not uploaded', 75, yPosition);
      yPosition += 6;
    });
    
    // System Information Section
    yPosition += 10;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(burgundyR, burgundyG, burgundyB);
    pdf.text('SYSTEM INFORMATION', 20, yPosition);
    yPosition += 2;
    
    // Draw burgundy line under section header
    pdf.setLineWidth(0.3);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    const systemFields = [
      { label: 'Submission Date', value: formData.timestamp ? formatDate(formData.timestamp) : 'N/A' },
      { label: 'Last Updated', value: formData.updatedAt ? formatDate(formData.updatedAt) : 'N/A' },
      { label: 'Form Type', value: isNaicomForm ? 'NAICOM Corporate CDD' : 'Corporate CDD' },
      { label: 'User Email', value: formData.userEmail || 'N/A' }
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    systemFields.forEach(field => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFont(undefined, 'bold');
      pdf.text(`${field.label}:`, 25, yPosition);
      pdf.setFont(undefined, 'normal');
      
      const maxWidth = 125;
      const textLines = pdf.splitTextToSize(field.value, maxWidth);
      pdf.text(textLines, 75, yPosition);
      yPosition += Math.max(textLines.length * 5, 6);
    });
    
    // Footer
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    } else {
      yPosition += 15;
    }
    
    pdf.setDrawColor(burgundyR, burgundyG, burgundyB);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This document contains confidential information and is generated by NEM Insurance Plc system.', 20, yPosition);
    yPosition += 4;
    pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition);
    
    // Save PDF
    const companyName = formData.companyName || 'Unknown_Company';
    const formType = isNaicomForm ? 'NAICOM_Corporate_CDD' : 'Corporate_CDD';
    pdf.save(`${companyName}_${formType}.pdf`);
    
    toast({
      title: "Success",
      description: "PDF generated successfully"
    });
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  const renderEditableField = (fieldName: string, label: string, value: any, type: 'text' | 'textarea' = 'text') => {
    const isEditing = editingField === fieldName;
    const displayValue = value || 'N/A';
    
    return (
      <div className="grid grid-cols-4 items-start gap-4 py-2">
        <Label className="font-medium text-muted-foreground">{label}:</Label>
        <div className="col-span-2">
          {isEditing ? (
            type === 'textarea' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[80px]"
              />
            ) : (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            )
          ) : (
            <span className="text-sm">{displayValue}</span>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={() => handleSave(fieldName)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(fieldName, value)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Form data not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if it's NAICOM form based on whether naicom license certificate is uploaded
  const isNaicomForm = formData.cacForm && formData.cacForm.trim() !== '';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNaicomForm ? 'NAICOM Corporate CDD Form' : 'Corporate CDD Form'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generatePDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {renderEditableField('companyName', 'Company Name', formData.companyName)}
              {renderEditableField('incorporationNumber', 'Incorporation Number', formData.incorporationNumber)}
              {renderEditableField('incorporationState', 'Incorporation State', formData.incorporationState)}
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Date of Incorporation:</Label>
                <span className="text-sm">{formatDate(formData.dateOfIncorporationRegistration)}</span>
              </div>
              {renderEditableField('companyLegalForm', 'Company Type', formData.companyLegalForm)}
              {formData.companyLegalForm === 'Other' && renderEditableField('companyLegalFormOther', 'Other Company Type', formData.companyLegalFormOther)}
              {renderEditableField('emailAddress', 'Email Address', formData.emailAddress)}
            </div>
            <div className="space-y-4">
              {renderEditableField('website', 'Website', formData.website)}
              {renderEditableField('taxIdentificationNumber', 'Tax ID Number', formData.taxIdentificationNumber)}
              {renderEditableField('telephoneNumber', 'Telephone Number', formData.telephoneNumber)}
            </div>
          </div>
          <div className="space-y-4">
            {renderEditableField('registeredCompanyAddress', 'Registered Address', formData.registeredCompanyAddress, 'textarea')}
            {renderEditableField('natureOfBusiness', 'Nature of Business', formData.natureOfBusiness, 'textarea')}
          </div>
        </CardContent>
      </Card>

      {/* Directors Information */}
      <Card>
        <CardHeader>
          <CardTitle>Directors Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(() => {
            // Handle both new array format and old flat format
            const directors: Director[] = [];
            
            // Check if directors is an array (new format)
            if (formData.directors && Array.isArray(formData.directors)) {
              directors.push(...formData.directors);
            }
            
            // Check for old flat format (firstName, lastName, firstName2, lastName2, etc.)
            const oldFormatDirectors: Director[] = [];
            
            // Director 1 (no number suffix)
            if (formData.firstName || formData.lastName) {
              const director: Director = {
                firstName: formData.firstName || '',
                middleName: formData.middleName || '',
                lastName: formData.lastName || '',
                dob: formData.dob || '',
                placeOfBirth: formData.placeOfBirth || '',
                nationality: formData.nationality || '',
                country: formData.country || '',
                occupation: formData.occupation || '',
                email: formData.email || '',
                phoneNumber: formData.phoneNumber || '',
                BVNNumber: formData.BVNNumber || '',
                employersName: formData.employersName || '',
                employersPhoneNumber: formData.employersPhoneNumber || '',
                residentialAddress: formData.residentialAddress || '',
                taxIDNumber: formData.taxIDNumber || '',
                idType: formData.idType || '',
                idNumber: formData.idNumber || '',
                issuingBody: formData.issuingBody || '',
                issuedDate: formData.issuedDate || '',
                expiryDate: formData.expiryDate || '',
                sourceOfIncome: formData.sourceOfIncome || ''
              };
              oldFormatDirectors.push(director);
            }
            
            // Director 2 (with "2" suffix)
            if (formData.firstName2 || formData.lastName2) {
              const director: Director = {
                firstName: formData.firstName2 || '',
                middleName: formData.middleName2 || '',
                lastName: formData.lastName2 || '',
                dob: formData.dob2 || '',
                placeOfBirth: formData.placeOfBirth2 || '',
                nationality: formData.nationality2 || '',
                country: formData.country2 || '',
                occupation: formData.occupation2 || '',
                email: formData.email2 || '',
                phoneNumber: formData.phoneNumber2 || '',
                BVNNumber: formData.BVNNumber2 || '',
                employersName: formData.employersName2 || '',
                employersPhoneNumber: formData.employersPhoneNumber2 || '',
                residentialAddress: formData.residentialAddress2 || '',
                taxIDNumber: formData.taxIDNumber2 || '',
                idType: formData.idType2 || '',
                idNumber: formData.idNumber2 || '',
                issuingBody: formData.issuingBody2 || '',
                issuedDate: formData.issuedDate2 || '',
                expiryDate: formData.expiryDate2 || '',
                sourceOfIncome: formData.sourceOfIncome2 || ''
              };
              oldFormatDirectors.push(director);
            }
            
            // Use old format if no new format directors found
            if (directors.length === 0 && oldFormatDirectors.length > 0) {
              directors.push(...oldFormatDirectors);
            }
            
            return directors.length > 0 ? (
              directors.map((director: Director, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-4 text-primary">
                    Director {index + 1}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="text-sm">{director.firstName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Middle Name</label>
                      <p className="text-sm">{director.middleName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                      <p className="text-sm">{director.lastName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-sm">{formatDate(director.dob)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Place of Birth</label>
                      <p className="text-sm">{director.placeOfBirth || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                      <p className="text-sm">{director.nationality || director.country || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{director.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p className="text-sm">{director.phoneNumber || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Residential Address</label>
                      <p className="text-sm">{director.residentialAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID Type</label>
                      <p className="text-sm">{director.idType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Identification Number</label>
                      <p className="text-sm">{director.identificationNumber || director.idNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Issued Date</label>
                      <p className="text-sm">{formatDate(director.issuedDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                      <p className="text-sm">{formatDate(director.expiryDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Issuing Body</label>
                      <p className="text-sm">{director.issuingBody || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BVN</label>
                      <p className="text-sm">{director.BVNNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tax ID Number</label>
                      <p className="text-sm">{director.taxIDNumber || director.taxIdNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Occupation</label>
                      <p className="text-sm">{director.occupation || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employer Name</label>
                      <p className="text-sm">{director.employersName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Employer Phone</label>
                      <p className="text-sm">{director.employersPhoneNumber || director.employerPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Source of Income</label>
                      <p className="text-sm">{director.sourceOfIncome || director.incomeSource || 'N/A'}</p>
                    </div>
                    {(director.sourceOfIncomeOther || director.incomeSourceOther) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Other Source of Income</label>
                        <p className="text-sm">{director.sourceOfIncomeOther || director.incomeSourceOther}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No directors information available
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Local Account Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Local Account Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Bank Name:</Label>
                <span className="text-sm">{formData.bankName || formData.localBankName || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Account Number:</Label>
                <span className="text-sm">{formData.accountNumber || formData.localAccountNumber || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Bank Branch:</Label>
                <span className="text-sm">{formData.bankBranch || formData.localBankBranch || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Account Opening Date:</Label>
                <span className="text-sm">{formatDate(formData.accountOpeningDate || formData.localAccountOpeningDate)}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Foreign Account Details - Always show even if empty */}
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Foreign Account Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Bank Name:</Label>
                <span className="text-sm">{formData.bankName2 || formData.foreignBankName || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Account Number:</Label>
                <span className="text-sm">{formData.accountNumber2 || formData.foreignAccountNumber || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Bank Branch:</Label>
                <span className="text-sm">{formData.bankBranch2 || formData.foreignBankBranch || 'N/A'}</span>
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-muted-foreground">Account Opening Date:</Label>
                <span className="text-sm">{formatDate(formData.accountOpeningDate2 || formData.foreignAccountOpeningDate)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Document Uploads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">CAC Certificate:</Label>
              {formData.cac || formData.identificationDocument ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document uploaded</span>
                  {(formData.cac || formData.identificationDocument) && (
                    <Button size="sm" variant="outline" onClick={() => window.open(formData.cac || formData.identificationDocument, '_blank')}>
                      View
                    </Button>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Document not uploaded</span>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">Identification Document:</Label>
              {formData.identification ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document uploaded</span>
                  <Button size="sm" variant="outline" onClick={() => window.open(formData.identification, '_blank')}>
                    View
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Document not uploaded</span>
              )}
            </div>

            {/* NAICOM License - Always show this section */}
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">NAICOM License Certificate:</Label>
              {formData.cacForm || formData.naicomLicense ? (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document uploaded</span>
                  <Button size="sm" variant="outline" onClick={() => window.open(formData.cacForm || formData.naicomLicense, '_blank')}>
                    View
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Document not uploaded</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">Submission Date:</Label>
              <span className="text-sm">
                {formData.timestamp ? formatDate(formData.timestamp) : 'N/A'}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">Last Updated:</Label>
              <span className="text-sm">
                {formData.updatedAt ? formatDate(formData.updatedAt) : 'N/A'}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">Form Type:</Label>
              <span className="text-sm">
                {isNaicomForm ? 'NAICOM Corporate CDD' : 'Corporate CDD'}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-muted-foreground">User Email:</Label>
              <span className="text-sm">{formData.userEmail || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CorporateCDDViewer;