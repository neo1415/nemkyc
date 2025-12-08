import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Building, Users, CreditCard, FileCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  NINNumber?: string;
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

  // Helper function to format values
  const formatValue = (value: any, isFile: boolean = false) => {
    if (!value || value === '') {
      return isFile ? 'Document not uploaded' : 'N/A';
    }
    
    // Handle Firebase Timestamp objects
    if (value && typeof value === 'object' && value.seconds && value.nanoseconds) {
      return new Date(value.seconds * 1000).toLocaleDateString();
    }
    
    // Handle regular Date objects
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Handle date strings
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return value;
  };

  // Helper function to extract directors data
  const extractDirectorsData = () => {
    if (!formData) return [];
    
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
    
    return directors;
  };

  // Helper function to check if it's NAICOM form
  const isNaicomForm = (data: any) => {
    return !!(data.cacForm || data.naicomLicense || data.naicomLicenseCertificate);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('corporate-cdd-pdf-content');
    if (!element) return;

    try {
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
      const title = isNaicomForm(formData) ? 'NAICOM Corporate CDD Form' : 'Corporate CDD Form';
      pdf.text(title, 20, 65);
      
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
      
      const companyName = formData?.companyName || 'Corporate';
      const formType = isNaicomForm(formData) ? 'NAICOM_CDD' : 'CDD';
      pdf.save(`${companyName}_${formType}_Form.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading form data...</p>
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

  const directors = extractDirectorsData();
  const isNaicom = isNaicomForm(formData);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            {isNaicom ? 'NAICOM Corporate CDD Form' : 'Corporate CDD Form'}
          </h2>
          <p className="text-muted-foreground">Form ID: {formData.id || 'N/A'}</p>
          <p className="text-muted-foreground">Company: {formatValue(formData.companyName)}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>

      <div id="corporate-cdd-pdf-content" className="space-y-6 bg-white p-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
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
                <p className="font-medium">{formatValue(formData.dateOfIncorporationRegistration)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">CAC Number</p>
                <p className="font-medium">{formatValue(formData.cacNumber)}</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Directors Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Directors Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {directors.length > 0 ? (
              directors.map((director: Director, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-base text-primary mb-3">
                    Director {index + 1}
                  </h4>
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
                      <p className="font-medium text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formatValue(director.dob)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Place of Birth</p>
                      <p className="font-medium">{formatValue(director.placeOfBirth)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Nationality</p>
                      <p className="font-medium">{formatValue(director.nationality || director.country)}</p>
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
                      <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                      <p className="font-medium">{formatValue(director.occupation)}</p>
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
                      <p className="font-medium">{formatValue(director.taxIDNumber || director.taxIdNumber)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">ID Type</p>
                      <p className="font-medium">{formatValue(director.idType)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Identification Number</p>
                      <p className="font-medium">{formatValue(director.identificationNumber || director.idNumber)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Issuing Body</p>
                      <p className="font-medium">{formatValue(director.issuingBody)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Issued Date</p>
                      <p className="font-medium">{formatValue(director.issuedDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">{formatValue(director.expiryDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Residential Address</p>
                      <p className="font-medium">{formatValue(director.residentialAddress)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Employer Name</p>
                      <p className="font-medium">{formatValue(director.employersName)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Employer Phone</p>
                      <p className="font-medium">{formatValue(director.employersPhoneNumber || director.employerPhone)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Source of Income</p>
                      <p className="font-medium">{formatValue(director.sourceOfIncome || director.incomeSource)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No directors information available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details & Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Account Details & Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              {/* Local Account Details */}
              <div>
                <h4 className="font-medium text-base mb-3">Local Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{formatValue(formData.bankName || formData.localBankName)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{formatValue(formData.accountNumber || formData.localAccountNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                    <p className="font-medium">{formatValue(formData.bankBranch || formData.localBankBranch)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                    <p className="font-medium">{formatValue(formData.accountOpeningDate || formData.localAccountOpeningDate)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Foreign Account Details */}
              <div>
                <h4 className="font-medium text-base mb-3">Foreign Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{formatValue(formData.bankName2 || formData.foreignBankName)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                    <p className="font-medium">{formatValue(formData.accountNumber2 || formData.foreignAccountNumber)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                    <p className="font-medium">{formatValue(formData.bankBranch2 || formData.foreignBankBranch)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                    <p className="font-medium">{formatValue(formData.accountOpeningDate2 || formData.foreignAccountOpeningDate)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Document Uploads</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">CAC Certificate</p>
                  {formData.cac || formData.identificationDocument ? (
                    <a 
                      href={formData.cac || formData.identificationDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.cac, true)}</p>
                  )}
                </div>
                
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Identification Document</p>
                  {formData.identification ? (
                    <a 
                      href={formData.identification} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">{formatValue(formData.identification, true)}</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-sm text-muted-foreground">NAICOM License Certificate</p>
                  {formData.cacForm || formData.naicomLicense || formData.naicomLicenseCertificate ? (
                    <a 
                      href={formData.cacForm || formData.naicomLicense || formData.naicomLicenseCertificate} 
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
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
                <p className="font-medium">{formatValue(formData.timestamp || formData.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Form Type</p>
                <p className="font-medium">{isNaicom ? 'NAICOM Corporate CDD' : 'Corporate CDD'}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">User Email</p>
                <p className="font-medium">{formatValue(formData.userEmail)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorporateCDDViewer;