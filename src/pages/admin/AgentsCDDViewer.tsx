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
import { generateFormPDF, downloadPDF } from '@/services/pdfService';

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
      
      const pdfData = {
        title: 'AGENTS CDD FORM',
        subtitle: `Agent: ${formatValue(formData.agentsName)}`,
        data: formData,
        mapping: {
          'Personal Information': [
            { label: 'First Name', field: 'firstName' },
            { label: 'Middle Name', field: 'middleName' },
            { label: 'Last Name', field: 'lastName' },
            { label: 'Residential Address', field: 'residentialAddress' },
            { label: 'Gender', field: 'gender' },
            { label: 'Position/Role', field: 'position' },
            { label: 'Date of Birth', field: 'dateOfBirth', type: 'date' },
            { label: 'Place of Birth', field: 'placeOfBirth' },
            { label: 'Source of Income', field: 'sourceOfIncome' },
            { label: 'Other Source of Income', field: 'sourceOfIncomeOther' },
            { label: 'Nationality', field: 'nationality' },
            { label: 'Phone Number', field: 'GSMno' },
            { label: 'BVN', field: 'BVNNumber' },
            { label: 'Tax ID Number', field: 'taxIDNumber' },
            { label: 'Occupation', field: 'occupation' },
            { label: 'Email', field: 'emailAddress' },
            { label: 'ID Type', field: 'idType' },
            { label: 'Identification Number', field: 'idNumber' },
            { label: 'Issued Date', field: 'issuedDate', type: 'date' },
            { label: 'Expiry Date', field: 'expiryDate', type: 'date' },
            { label: 'Issuing Body', field: 'issuingBody' }
          ],
          'Additional Information': [
            { label: 'Agent Name', field: 'agentsName' },
            { label: 'Agents Office Address', field: 'agentsAddress' },
            { label: 'NAICOM License Number', field: 'naicomNo' },
            { label: 'License Issued Date', field: 'lisenceIssuedDate', type: 'date' },
            { label: 'License Expiry Date', field: 'lisenceExpiryDate', type: 'date' },
            { label: 'Email Address', field: 'agentsEmail' },
            { label: 'Website', field: 'website' },
            { label: 'Mobile Number', field: 'mobileNo' },
            { label: 'Tax ID Number', field: 'taxIDNo' },
            { label: 'ARIAN Membership Number', field: 'arian' },
            { label: 'List of Agents Approved Principals', field: 'listOfAgents' }
          ],
          'Account Details & Files': [
            { label: 'Local Account Number', field: 'accountNumber' },
            { label: 'Local Bank Name', field: 'bankName' },
            { label: 'Local Bank Branch', field: 'bankBranch' },
            { label: 'Local Account Opening Date', field: 'accountOpeningDate', type: 'date' },
            { label: 'Foreign Account Number', field: 'accountNumber2' },
            { label: 'Foreign Bank Name', field: 'bankName2' },
            { label: 'Foreign Bank Branch', field: 'bankBranch2' },
            { label: 'Foreign Account Opening Date', field: 'accountOpeningDate2', type: 'date' },
            { label: 'Agent ID Document', field: 'agentId', type: 'file' },
            { label: 'NAICOM Certificate', field: 'naicomCertificate', type: 'file' }
          ],
          'System Information': [
            { label: 'Form Type', field: 'formType' },
            { label: 'Signature', field: 'signature' },
            { label: 'Submitted At', field: 'timestamp', type: 'date' }
          ]
        }
      };

      const pdfBlob = await generateFormPDF(pdfData);
      const filename = `agents-cdd-${formatValue(formData.agentsName).replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(pdfBlob, filename, formData, 'Agents-CDD');
      
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
      <div className="grid grid-cols-3 gap-4 py-2">
        <Label className="font-medium">{label}</Label>
        {isEditing ? (
          <div className="col-span-2 space-y-2">
            {type === 'textarea' ? (
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full"
              />
            ) : (
              <Input
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full"
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
          <div className="col-span-2 flex items-center justify-between">
            <span className={value ? '' : 'text-muted-foreground'}>
              {type === 'date' ? formatDate(value) : displayValue}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(fieldName, value || '')}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderFileField = (label: string, fileUrl: string) => (
    <div className="grid grid-cols-3 gap-4 py-2">
      <Label className="font-medium">{label}</Label>
      <div className="col-span-2">
        {fileUrl ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View Document
          </Button>
        ) : (
          <span className="text-muted-foreground">Document not uploaded</span>
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Agents CDD Form</h1>
            <p className="text-muted-foreground">
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
          <div className="grid grid-cols-3 gap-4 py-2">
            <Label className="font-medium">Form Type</Label>
            <div className="col-span-2">
              <span>{formatValue(formData.formType)}</span>
            </div>
          </div>
          {renderEditableField("Digital Signature", "signature", formData.signature)}
          <div className="grid grid-cols-3 gap-4 py-2">
            <Label className="font-medium">Submitted At</Label>
            <div className="col-span-2">
              <span>{formatDate(formData.timestamp)}</span>
            </div>
          </div>
          {formData.updatedAt && (
            <div className="grid grid-cols-3 gap-4 py-2">
              <Label className="font-medium">Last Updated</Label>
              <div className="col-span-2">
                <span>{formatDate(formData.updatedAt)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentsCDDViewer;