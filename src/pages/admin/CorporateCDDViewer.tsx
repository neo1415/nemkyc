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
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Corporate CDD Form', 20, yPosition);
    yPosition += 15;
    
    // Form ID and Date
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Form ID: ${formData.id}`, 20, yPosition);
    yPosition += 10;
    
    if (formData.timestamp) {
      const submissionDate = formData.timestamp.toDate ? formData.timestamp.toDate() : new Date(formData.timestamp);
      pdf.text(`Submitted: ${format(submissionDate, 'PPpp')}`, 20, yPosition);
      yPosition += 15;
    }
    
    // Company Details Section
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Company Details', 20, yPosition);
    yPosition += 10;
    
    const companyFields = [
      { label: 'Company Name', value: formData.companyName },
      { label: 'Registered Address', value: formData.registeredCompanyAddress },
      { label: 'Incorporation Number', value: formData.incorporationNumber },
      { label: 'Incorporation State', value: formData.incorporationState },
      { label: 'Date of Incorporation', value: formData.dateOfIncorporationRegistration },
      { label: 'Nature of Business', value: formData.natureOfBusiness },
      { label: 'Company Type', value: formData.companyLegalForm },
      { label: 'Email', value: formData.emailAddress },
      { label: 'Website', value: formData.website },
      { label: 'Tax ID', value: formData.taxIdentificationNumber },
      { label: 'Telephone', value: formData.telephoneNumber }
    ];
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    companyFields.forEach(field => {
      if (field.value) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${field.label}: ${field.value}`, 20, yPosition);
        yPosition += 8;
      }
    });
    
    // Directors Section
    if (formData.directors && Array.isArray(formData.directors)) {
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('Directors Information', 20, yPosition);
      yPosition += 10;
      
      formData.directors.forEach((director: Director, index: number) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text(`Director ${index + 1}`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        const directorFields = [
          { label: 'Name', value: `${director.firstName || ''} ${director.middleName || ''} ${director.lastName || ''}`.trim() },
          { label: 'Date of Birth', value: director.dob },
          { label: 'Place of Birth', value: director.placeOfBirth },
          { label: 'Nationality', value: director.nationality },
          { label: 'Country', value: director.country },
          { label: 'Occupation', value: director.occupation },
          { label: 'Email', value: director.email },
          { label: 'Phone', value: director.phoneNumber },
          { label: 'BVN', value: director.BVNNumber },
          { label: 'Address', value: director.residentialAddress },
          { label: 'ID Type', value: director.idType },
          { label: 'ID Number', value: director.idNumber }
        ];
        
        directorFields.forEach(field => {
          if (field.value) {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`${field.label}: ${field.value}`, 25, yPosition);
            yPosition += 6;
          }
        });
        
        yPosition += 5;
      });
    }
    
    // Account Details
    yPosition += 10;
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Account Details', 20, yPosition);
    yPosition += 10;
    
    const accountFields = [
      { label: 'Bank Name', value: formData.bankName },
      { label: 'Account Number', value: formData.accountNumber },
      { label: 'Bank Branch', value: formData.bankBranch },
      { label: 'Account Opening Date', value: formData.accountOpeningDate }
    ];
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    accountFields.forEach(field => {
      if (field.value) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${field.label}: ${field.value}`, 20, yPosition);
        yPosition += 8;
      }
    });
    
    // Save PDF
    pdf.save(`Corporate_CDD_${formData.id}.pdf`);
    
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
            
            // Check for old flat format (director1, director2, etc.)
            const oldFormatDirectors: Director[] = [];
            let directorIndex = 1;
            while (true) {
              const directorKey = directorIndex === 1 ? '' : directorIndex.toString();
              const firstNameKey = `director${directorKey}FirstName`;
              const lastNameKey = `director${directorKey}LastName`;
              
              if (formData[firstNameKey] || formData[lastNameKey]) {
                const director: Director = {
                  firstName: formData[firstNameKey] || formData[`firstName${directorKey}`],
                  middleName: formData[`director${directorKey}MiddleName`] || formData[`middleName${directorKey}`],
                  lastName: formData[lastNameKey] || formData[`lastName${directorKey}`],
                  dob: formData[`director${directorKey}DOB`] || formData[`dob${directorKey}`],
                  placeOfBirth: formData[`director${directorKey}PlaceOfBirth`] || formData[`placeOfBirth${directorKey}`],
                  nationality: formData[`director${directorKey}Nationality`] || formData[`nationality${directorKey}`],
                  country: formData[`director${directorKey}Country`] || formData[`country${directorKey}`],
                  occupation: formData[`director${directorKey}Occupation`] || formData[`occupation${directorKey}`],
                  email: formData[`director${directorKey}Email`] || formData[`email${directorKey}`],
                  phoneNumber: formData[`director${directorKey}PhoneNumber`] || formData[`phoneNumber${directorKey}`],
                  BVNNumber: formData[`director${directorKey}BVNNumber`] || formData[`BVNNumber${directorKey}`],
                  employersName: formData[`director${directorKey}EmployersName`] || formData[`employersName${directorKey}`],
                  employersPhoneNumber: formData[`director${directorKey}EmployersPhoneNumber`] || formData[`employersPhoneNumber${directorKey}`],
                  residentialAddress: formData[`director${directorKey}ResidentialAddress`] || formData[`residentialAddress${directorKey}`],
                  taxIDNumber: formData[`director${directorKey}TaxIDNumber`] || formData[`taxIDNumber${directorKey}`],
                  idType: formData[`director${directorKey}IdType`] || formData[`idType${directorKey}`],
                  idNumber: formData[`director${directorKey}IdNumber`] || formData[`idNumber${directorKey}`],
                  issuingBody: formData[`director${directorKey}IssuingBody`] || formData[`issuingBody${directorKey}`],
                  issuedDate: formData[`director${directorKey}IssuedDate`] || formData[`issuedDate${directorKey}`],
                  expiryDate: formData[`director${directorKey}ExpiryDate`] || formData[`expiryDate${directorKey}`],
                  sourceOfIncome: formData[`director${directorKey}SourceOfIncome`] || formData[`sourceOfIncome${directorKey}`],
                  sourceOfIncomeOther: formData[`director${directorKey}SourceOfIncomeOther`] || formData[`sourceOfIncomeOther${directorKey}`]
                };
                oldFormatDirectors.push(director);
                directorIndex++;
              } else {
                break;
              }
            }
            
            // Use old format if no new format directors found
            if (directors.length === 0 && oldFormatDirectors.length > 0) {
              directors.push(...oldFormatDirectors);
            }
            
            return directors.length > 0 ? (
              directors.map((director: Director, index: number) => (
                <div key={index} className="border rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-lg">Director {index + 1}</h4>
                  
                  {/* Personal Information */}
                  <div>
                    <h5 className="font-medium text-base mb-3">Personal Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Title:</Label>
                        <span className="text-sm">{director.title || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Gender:</Label>
                        <span className="text-sm">{director.gender || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">First Name:</Label>
                        <span className="text-sm">{director.firstName || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Middle Name:</Label>
                        <span className="text-sm">{director.middleName || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Last Name:</Label>
                        <span className="text-sm">{director.lastName || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Date of Birth:</Label>
                        <span className="text-sm">{formatDate(director.dob)}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Place of Birth:</Label>
                        <span className="text-sm">{director.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Nationality:</Label>
                        <span className="text-sm">{director.nationality || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Country:</Label>
                        <span className="text-sm">{director.country || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Occupation:</Label>
                        <span className="text-sm">{director.occupation || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h5 className="font-medium text-base mb-3">Contact Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Email:</Label>
                        <span className="text-sm">{director.email || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Phone Number:</Label>
                        <span className="text-sm">{director.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">BVN:</Label>
                        <span className="text-sm">{director.BVNNumber || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Tax ID Number:</Label>
                        <span className="text-sm">{director.taxIDNumber || director.taxIdNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label className="font-medium text-muted-foreground">Residential Address:</Label>
                      <span className="text-sm">{director.residentialAddress || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div>
                    <h5 className="font-medium text-base mb-3">Employment Information</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Employer Name:</Label>
                        <span className="text-sm">{director.employersName || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Employer Phone:</Label>
                        <span className="text-sm">{director.employersPhoneNumber || director.employerPhone || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Source of Income:</Label>
                        <span className="text-sm">{director.sourceOfIncome || director.incomeSource || 'N/A'}</span>
                      </div>
                      {(director.sourceOfIncome === 'Other' || director.incomeSource === 'Other') && (
                        <div className="space-y-2">
                          <Label className="font-medium text-muted-foreground">Other Income Source:</Label>
                          <span className="text-sm">{director.sourceOfIncomeOther || director.incomeSourceOther || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identification Details */}
                  <div>
                    <h5 className="font-medium text-base mb-3">Identification Details</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">ID Type:</Label>
                        <span className="text-sm">{director.idType || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">ID Number:</Label>
                        <span className="text-sm">{director.idNumber || director.identificationNumber || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Issuing Body:</Label>
                        <span className="text-sm">{director.issuingBody || 'N/A'}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Issued Date:</Label>
                        <span className="text-sm">{formatDate(director.issuedDate)}</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium text-muted-foreground">Expiry Date:</Label>
                        <span className="text-sm">{formatDate(director.expiryDate)}</span>
                      </div>
                    </div>
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