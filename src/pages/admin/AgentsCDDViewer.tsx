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
import { ArrowLeft, Edit2, Save, X, Download, FileText, ExternalLink } from 'lucide-react';
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

const AgentsCDDViewer: React.FC = () => {
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
      const docRef = doc(db, 'agents-kyc', id);
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
      const docRef = doc(db, 'agents-kyc', id);
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

  const handleDownloadPDF = async () => {
    if (!formData) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Use the same approach as Individual CDD - direct HTML to PDF conversion
      const element = document.getElementById('agents-cdd-pdf-content');
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
      pdf.text('199, Ikorodu Road, Obanikoro Lagos', 20, 35);
      
      // Burgundy line
      pdf.setDrawColor(128, 0, 32);
      pdf.setLineWidth(0.5);
      pdf.line(20, 50, 190, 50);
      
      // Title
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('AGENTS CDD FORM', 20, 65);
      pdf.text(`Agent: ${formatValue(formData.agentsName)}`, 20, 75);
      
      // Add the form content
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPosition = 85;
      
      if (imgHeight > 210) {
        // If content is too long, split across pages
        const pageHeight = 210;
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
      
      const filename = `agents-cdd-${formatValue(formData.agentsName).replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
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
            <h1 className="text-xl lg:text-2xl font-bold">Agents CDD Form</h1>
            <p className="text-sm lg:text-base text-muted-foreground break-words">
              Agent: {formatValue(formData.agentsName)} • Submitted: {formatDate(formData.timestamp)}
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
      <div id="agents-cdd-pdf-content" className="space-y-6 bg-white p-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{formatValue(formData.firstName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Middle Name</p>
                <p className="font-medium">{formatValue(formData.middleName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{formatValue(formData.lastName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Residential Address</p>
                <p className="font-medium">{formatValue(formData.residentialAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{formatValue(formData.gender)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Position/Role</p>
                <p className="font-medium">{formatValue(formData.position)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(formData.dateOfBirth)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Place of Birth</p>
                <p className="font-medium">{formatValue(formData.placeOfBirth)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Source of Income</p>
                <p className="font-medium">{formatValue(formData.sourceOfIncome)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Other Source of Income</p>
                <p className="font-medium">{formatValue(formData.sourceOfIncomeOther)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{formatValue(formData.nationality)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{formatValue(formData.GSMno)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">BVN</p>
                <p className="font-medium">{formatValue(formData.BVNNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">NIN</p>
                <p className="font-medium">{formatValue(formData.NINNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Tax ID Number</p>
                <p className="font-medium">{formatValue(formData.taxIDNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                <p className="font-medium">{formatValue(formData.occupation)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{formatValue(formData.emailAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">ID Type</p>
                <p className="font-medium">{formatValue(formData.idType)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Identification Number</p>
                <p className="font-medium">{formatValue(formData.idNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Issued Date</p>
                <p className="font-medium">{formatDate(formData.issuedDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{formatDate(formData.expiryDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Issuing Body</p>
                <p className="font-medium">{formatValue(formData.issuingBody)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Agent Name</p>
                <p className="font-medium">{formatValue(formData.agentsName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Agents Office Address</p>
                <p className="font-medium">{formatValue(formData.agentsAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">NAICOM License Number</p>
                <p className="font-medium">{formatValue(formData.naicomNo)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">License Issued Date</p>
                <p className="font-medium">{formatDate(formData.lisenceIssuedDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">License Expiry Date</p>
                <p className="font-medium">{formatDate(formData.lisenceExpiryDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{formatValue(formData.agentsEmail)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Website</p>
                <p className="font-medium">{formatValue(formData.website)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{formatValue(formData.mobileNo)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Tax ID Number</p>
                <p className="font-medium">{formatValue(formData.taxIDNo)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">ARIAN Membership Number</p>
                <p className="font-medium">{formatValue(formData.arian)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-medium text-sm text-muted-foreground">List of Agents Approved Principals</p>
                <p className="font-medium">{formatValue(formData.listOfAgents)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details & Files */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details & Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-4">Local Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{formatValue(formData.accountNumber)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{formatValue(formData.bankName)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                  <p className="font-medium">{formatValue(formData.bankBranch)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                  <p className="font-medium">{formatDate(formData.accountOpeningDate)}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-4">Foreign Account Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{formatValue(formData.accountNumber2)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{formatValue(formData.bankName2)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                  <p className="font-medium">{formatValue(formData.bankBranch2)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                  <p className="font-medium">{formatDate(formData.accountOpeningDate2)}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-4">Document Uploads</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Agent ID Document</p>
                  <p className="font-medium">{formatValue(formData.agentId, true)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">NAICOM Certificate</p>
                  <p className="font-medium">{formatValue(formData.naicomCertificate, true)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable Interface (visible on screen, hidden in PDF) */}
      <div className="space-y-4 lg:space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderEditableField("First Name", "firstName", formData.firstName)}
            {renderEditableField("Middle Name", "middleName", formData.middleName)}
            {renderEditableField("Last Name", "lastName", formData.lastName)}
            {renderEditableField("Residential Address", "residentialAddress", formData.residentialAddress, 'textarea')}
            {renderEditableField("Gender", "gender", formData.gender)}
            {renderEditableField("Position/Role", "position", formData.position)}
            {renderEditableField("Date of Birth", "dateOfBirth", formData.dateOfBirth, 'date')}
            {renderEditableField("Place of Birth", "placeOfBirth", formData.placeOfBirth)}
            {renderEditableField("Source of Income", "sourceOfIncome", formData.sourceOfIncome)}
            {renderEditableField("Other Source of Income", "sourceOfIncomeOther", formData.sourceOfIncomeOther)}
            {renderEditableField("Nationality", "nationality", formData.nationality)}
            {renderEditableField("Phone Number", "GSMno", formData.GSMno)}
            {renderEditableField("BVN", "BVNNumber", formData.BVNNumber)}
            {renderEditableField("NIN", "NINNumber", formData.NINNumber)}
            {renderEditableField("Tax ID Number", "taxIDNumber", formData.taxIDNumber)}
            {renderEditableField("Occupation", "occupation", formData.occupation)}
            {renderEditableField("Email", "emailAddress", formData.emailAddress)}
            {renderEditableField("ID Type", "idType", formData.idType)}
            {renderEditableField("Identification Number", "idNumber", formData.idNumber)}
            {renderEditableField("Issued Date", "issuedDate", formData.issuedDate, 'date')}
            {renderEditableField("Expiry Date", "expiryDate", formData.expiryDate, 'date')}
            {renderEditableField("Issuing Body", "issuingBody", formData.issuingBody)}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderEditableField("Agent Name", "agentsName", formData.agentsName)}
            {renderEditableField("Agents Office Address", "agentsAddress", formData.agentsAddress, 'textarea')}
            {renderEditableField("NAICOM License Number", "naicomNo", formData.naicomNo)}
            {renderEditableField("License Issued Date", "lisenceIssuedDate", formData.lisenceIssuedDate, 'date')}
            {renderEditableField("License Expiry Date", "lisenceExpiryDate", formData.lisenceExpiryDate, 'date')}
            {renderEditableField("Email Address", "agentsEmail", formData.agentsEmail)}
            {renderEditableField("Website", "website", formData.website)}
            {renderEditableField("Mobile Number", "mobileNo", formData.mobileNo)}
            {renderEditableField("Tax ID Number", "taxIDNo", formData.taxIDNo)}
            {renderEditableField("ARIAN Membership Number", "arian", formData.arian)}
            {renderEditableField("List of Agents Approved Principals", "listOfAgents", formData.listOfAgents, 'textarea')}
          </CardContent>
        </Card>

        {/* Account Details & Files */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details & Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Local Account Details</h4>
              <div className="space-y-1">
                {renderEditableField("Account Number", "accountNumber", formData.accountNumber)}
                {renderEditableField("Bank Name", "bankName", formData.bankName)}
                {renderEditableField("Bank Branch", "bankBranch", formData.bankBranch)}
                {renderEditableField("Account Opening Date", "accountOpeningDate", formData.accountOpeningDate, 'date')}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Foreign Account Details</h4>
              <div className="space-y-1">
                {renderEditableField("Account Number", "accountNumber2", formData.accountNumber2)}
                {renderEditableField("Bank Name", "bankName2", formData.bankName2)}
                {renderEditableField("Bank Branch", "bankBranch2", formData.bankBranch2)}
                {renderEditableField("Account Opening Date", "accountOpeningDate2", formData.accountOpeningDate2, 'date')}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Document Uploads</h4>
              <div className="space-y-1">
                {renderFileField("Agent ID Document", formData.agentId)}
                {renderFileField("NAICOM Certificate", formData.naicomCertificate)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 py-2">
              <Label className="font-medium text-sm lg:text-base">Form Type</Label>
              <div className="lg:col-span-2">
                <span className="text-sm lg:text-base">{formatValue(formData.formType)}</span>
              </div>
            </div>
            {renderEditableField("Digital Signature", "signature", formData.signature)}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 py-2">
              <Label className="font-medium text-sm lg:text-base">Submitted At</Label>
              <div className="lg:col-span-2">
                <span className="text-sm lg:text-base">{formatDate(formData.timestamp)}</span>
              </div>
            </div>
            {formData.updatedAt && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-4 py-2">
                <Label className="font-medium text-sm lg:text-base">Last Updated</Label>
                <div className="lg:col-span-2">
                  <span className="text-sm lg:text-base">{formatDate(formData.updatedAt)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentsCDDViewer;