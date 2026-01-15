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
import { ArrowLeft, Edit2, Save, X, Download, FileText, ExternalLink, User, CreditCard, FileCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FormData {
  id: string;
  [key: string]: any;
}

const PartnersCDDViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
      const docRef = doc(db, 'partners-kyc', id);
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
      const docRef = doc(db, 'partners-kyc', id);
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

  const formatValue = (value: any, isFile: boolean = false) => {
    if (!value || value === '') {
      return isFile ? 'Document not uploaded' : 'N/A';
    }
    return value;
  };

  const formatDate = (value: any) => {
    if (!value) return 'N/A';
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      return format(date, 'PPP');
    } catch {
      return 'N/A';
    }
  };

  // Helper function to extract directors/partners data (supports both legacy and new formats)
  const extractDirectorsData = (data: any) => {
    if (data.directors && Array.isArray(data.directors)) {
      return data.directors; // New format
    }
    
    // Extract legacy format
    const directors = [];
    if (data.firstName || data.firstName1) {
      directors.push({
        title: data.title || data.title1 || '',
        gender: data.gender || data.gender1 || '',
        firstName: data.firstName || data.firstName1 || '',
        middleName: data.middleName || data.middleName1 || '',
        lastName: data.lastName || data.lastName1 || '',
        dateOfBirth: data.dateOfBirth || data.dateOfBirth1 || '',
        placeOfBirth: data.placeOfBirth || data.placeOfBirth1 || '',
        nationality: data.nationality || data.nationality1 || '',
        country: data.country || data.country1 || '',
        occupation: data.occupation || data.occupation1 || '',
        email: data.directorEmail || data.directorEmail1 || data.email1 || '',
        phoneNumber: data.phoneNumber || data.phoneNumber1 || '',
        BVNNumber: data.directorBvn || data.directorBvn1 || data.bvn1 || '',
        NINNumber: data.NINNumber || data.NINNumber1 || '',
        employerName: data.employerName || data.employerName1 || '',
        employerPhone: data.employerPhone || data.employerPhone1 || '',
        residentialAddress: data.residentialAddress || data.residentialAddress1 || '',
        taxIDNumber: data.taxIdNumber || data.taxIdNumber1 || '',
        idType: data.idType || data.idType1 || '',
        idNumber: data.identificationNumber || data.identificationNumber1 || '',
        issuingBody: data.issuingBody || data.issuingBody1 || '',
        issuedDate: data.issuedDate || data.issuedDate1 || '',
        expiryDate: data.expiryDate || data.expiryDate1 || '',
        sourceOfIncome: data.incomeSource || data.incomeSource1 || '',
        sourceOfIncomeOther: data.incomeSourceOther || data.incomeSourceOther1 || ''
      });
    }
    
    if (data.firstName2) {
      directors.push({
        title: data.title2 || '',
        gender: data.gender2 || '',
        firstName: data.firstName2 || '',
        middleName: data.middleName2 || '',
        lastName: data.lastName2 || '',
        dateOfBirth: data.dateOfBirth2 || '',
        placeOfBirth: data.placeOfBirth2 || '',
        nationality: data.nationality2 || '',
        country: data.country2 || '',
        occupation: data.occupation2 || '',
        email: data.directorEmail2 || data.email2 || '',
        phoneNumber: data.phoneNumber2 || '',
        BVNNumber: data.directorBvn2 || data.bvn2 || '',
        NINNumber: data.NINNumber2 || '',
        employerName: data.employerName2 || '',
        employerPhone: data.employerPhone2 || '',
        residentialAddress: data.residentialAddress2 || '',
        taxIDNumber: data.taxIdNumber2 || '',
        idType: data.idType2 || '',
        idNumber: data.identificationNumber2 || '',
        issuingBody: data.issuingBody2 || '',
        issuedDate: data.issuedDate2 || '',
        expiryDate: data.expiryDate2 || '',
        sourceOfIncome: data.incomeSource2 || '',
        sourceOfIncomeOther: data.incomeSourceOther2 || ''
      });
    }
    
    return directors;
  };

  // Check if this is a NAICOM form
  const isNaicomForm = (data: any) => {
    return data.naicomLicenseCertificate && data.naicomLicenseCertificate.trim() !== '';
  };

  const handleDownloadPDF = async () => {
    if (!formData) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Use the same approach as Individual CDD - direct HTML to PDF conversion
      const element = document.getElementById('partners-cdd-pdf-content');
      if (!element) {
        throw new Error('PDF content element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // NEM Insurance Header
      pdf.setFontSize(20);
      pdf.setTextColor(128, 0, 32); // Burgundy color
      pdf.text('NEM INSURANCE PLC', 20, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Corporate Head Office: 10 Lokogoma Close, Zone 1, Federal Capital Territory, Abuja', 20, 35);
      pdf.text('Lagos Head Office: 100 NNL Building, Ralph Shodeinde Street, Central Business District, Lagos', 20, 42);
      
      // Burgundy line
      pdf.setDrawColor(128, 0, 32);
      pdf.setLineWidth(0.5);
      pdf.line(20, 50, 190, 50);
      
      // Title
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      const formType = isNaicomForm(formData) ? 'NAICOM Partners CDD' : 'Partners CDD';
      pdf.text(`${formType} Form`, 20, 65);
      
      // Add the form content
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 75;
      
      if (imgHeight > 220) {
        // If content is too long, split across pages
        const pageHeight = 220;
        let remainingHeight = imgHeight;
        let currentY = 0;
        
        while (remainingHeight > 0) {
          const heightToAdd = Math.min(pageHeight, remainingHeight);
          
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = (heightToAdd * canvas.width) / imgWidth;
          
          tempCtx?.drawImage(
            canvas,
            0,
            (currentY * canvas.width) / imgWidth,
            canvas.width,
            tempCanvas.height,
            0,
            0,
            canvas.width,
            tempCanvas.height
          );
          
          const tempImgData = tempCanvas.toDataURL('image/png');
          
          if (currentY > 0) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(tempImgData, 'PNG', 20, yPosition, imgWidth, heightToAdd);
          
          currentY += heightToAdd;
          remainingHeight -= heightToAdd;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
      }
      
      const filename = `partners-cdd-${formatValue(formData.companyName).replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderEditableField = (label: string, fieldName: string, value: any, type: 'text' | 'textarea' | 'date' = 'text') => {
    const isEditing = editingField === fieldName;
    const displayValue = formatValue(value);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 py-2">
        <Label className="font-medium text-sm lg:text-base">{label}</Label>
        {isEditing ? (
          <div className="lg:col-span-2 space-y-2">
            {type === 'textarea' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full text-sm lg:text-base"
              />
            ) : (
              <Input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full text-sm lg:text-base"
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSave(fieldName)}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-between">
            <span className={`text-sm lg:text-base break-words ${value ? '' : 'text-muted-foreground'}`}>
              {type === 'date' ? formatDate(value) : displayValue}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(fieldName, value || '')}
              className="flex-shrink-0"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderFileField = (label: string, fileUrl: string) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 py-2">
      <Label className="font-medium text-sm lg:text-base">{label}</Label>
      <div className="lg:col-span-2">
        {fileUrl ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className="flex items-center gap-2 text-sm lg:text-base"
          >
            <ExternalLink className="w-4 h-4" />
            View Document
          </Button>
        ) : (
          <span className="text-muted-foreground text-sm lg:text-base">Document not uploaded</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Form data not found</p>
      </div>
    );
  }

  const directors = extractDirectorsData(formData);
  const formType = isNaicomForm(formData) ? 'NAICOM Partners CDD' : 'Partners CDD';

  return (
    <div className="container mx-auto p-3 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">{formType}</h1>
            <p className="text-sm lg:text-base text-muted-foreground break-words">
              Company: {formatValue(formData.companyName)} • Submitted: {formatDate(formData.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="text-sm lg:text-base"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* Ticket ID Display - Prominent */}
      {formData.ticketId && (
        <Card className="bg-[#800020] text-white">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm opacity-90 mb-1">Ticket ID</p>
            <p className="text-3xl font-bold tracking-wider">{formData.ticketId}</p>
          </CardContent>
        </Card>
      )}

      {/* PDF Content Wrapper */}
      <div id="partners-cdd-pdf-content" className="space-y-6 bg-white p-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Company Name</p>
                <p className="font-medium">{formatValue(formData.companyName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Incorporation Number</p>
                <p className="font-medium">{formatValue(formData.incorporationNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Incorporation State</p>
                <p className="font-medium">{formatValue(formData.incorporationState)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Date of Incorporation</p>
                <p className="font-medium">{formatDate(formData.dateOfIncorporationRegistration)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Company Type</p>
                <p className="font-medium">{formatValue(formData.companyLegalForm)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{formatValue(formData.emailAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Website</p>
                <p className="font-medium">{formatValue(formData.website)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Tax ID Number</p>
                <p className="font-medium">{formatValue(formData.taxIdentificationNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Telephone Number</p>
                <p className="font-medium">{formatValue(formData.telephoneNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Registered Address</p>
                <p className="font-medium">{formatValue(formData.registeredCompanyAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Nature of Business</p>
                <p className="font-medium">{formatValue(formData.natureOfBusiness)}</p>
              </div>
              
              {/* NAICOM-specific fields */}
              {isNaicomForm(formData) && (
                <>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">NAICOM License Number</p>
                    <p className="font-medium">{formatValue(formData.naicomLicenseNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">License Issue Date</p>
                    <p className="font-medium">{formatDate(formData.licenseIssueDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">License Expiry Date</p>
                    <p className="font-medium">{formatDate(formData.licenseExpiryDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">ARIAN Membership Number</p>
                    <p className="font-medium">{formatValue(formData.arianMembershipNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Insurance License Type</p>
                    <p className="font-medium">{formatValue(formData.insuranceLicenseType)}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Directors Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Directors/Partners Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {directors.map((director: any, index: number) => (
              <div key={index} className="border rounded p-4">
                <h4 className="font-semibold mb-3">Director/Partner {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{formatValue(director.firstName)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Middle Name</p>
                    <p className="font-medium">{formatValue(director.middleName)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{formatValue(director.lastName)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{formatValue(director.email)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{formatValue(director.phoneNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{formatDate(director.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Place of Birth</p>
                    <p className="font-medium">{formatValue(director.placeOfBirth)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{formatValue(director.nationality)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                    <p className="font-medium">{formatValue(director.occupation)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Residential Address</p>
                    <p className="font-medium">{formatValue(director.residentialAddress)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">BVN Number</p>
                    <p className="font-medium">{formatValue(director.BVNNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">NIN Number</p>
                    <p className="font-medium">{formatValue(director.NINNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Tax ID Number</p>
                    <p className="font-medium">{formatValue(director.taxIDNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">ID Type</p>
                    <p className="font-medium">{formatValue(director.idType)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">ID Number</p>
                    <p className="font-medium">{formatValue(director.idNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Issuing Body</p>
                    <p className="font-medium">{formatValue(director.issuingBody)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Issued Date</p>
                    <p className="font-medium">{formatDate(director.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-medium">{formatDate(director.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Source of Income</p>
                    <p className="font-medium">{formatValue(director.sourceOfIncome)}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Account Details & Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Account Details & Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Local Bank Name</p>
                <p className="font-medium">{formatValue(formData.localBankName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Local Account Number</p>
                <p className="font-medium">{formatValue(formData.localAccountNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Local Bank Branch</p>
                <p className="font-medium">{formatValue(formData.localBankBranch)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Local Account Opening Date</p>
                <p className="font-medium">{formatDate(formData.localAccountOpeningDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Foreign Bank Name</p>
                <p className="font-medium">{formatValue(formData.foreignBankName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Foreign Account Number</p>
                <p className="font-medium">{formatValue(formData.foreignAccountNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Foreign Bank Branch</p>
                <p className="font-medium">{formatValue(formData.foreignBankBranch)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Foreign Account Opening Date</p>
                <p className="font-medium">{formatDate(formData.foreignAccountOpeningDate)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Document Uploads</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">CAC Form</p>
                  {formData.cacForm ? (
                    <a 
                      href={formData.cacForm} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.cacForm, true)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Incorporation Certificate</p>
                  {formData.incorporationCertificate ? (
                    <a 
                      href={formData.incorporationCertificate} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.incorporationCertificate, true)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Memorandum of Association</p>
                  {formData.memorandumOfAssociation ? (
                    <a 
                      href={formData.memorandumOfAssociation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.memorandumOfAssociation, true)}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Article of Association</p>
                  {formData.articleOfAssociation ? (
                    <a 
                      href={formData.articleOfAssociation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.articleOfAssociation, true)}</p>
                  )}
                </div>
                {/* NAICOM-specific documents */}
                {isNaicomForm(formData) && (
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">NAICOM License Certificate</p>
                    {formData.naicomLicenseCertificate ? (
                      <a 
                        href={formData.naicomLicenseCertificate} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                      </a>
                    ) : (
                      <p className="text-muted-foreground">{formatValue(formData.naicomLicenseCertificate, true)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Status</p>
                <Badge variant={formData.status === 'completed' ? 'default' : 'secondary'}>
                  {formatValue(formData.status)}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">{formatDate(formData.timestamp || formData.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Digital Signature</p>
                <p className="font-medium">{formatValue(formData.signature)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Data Privacy Agreement</p>
                <p className="font-medium">{formData.agreeToDataPrivacy ? 'Agreed' : 'Not Agreed'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnersCDDViewer;