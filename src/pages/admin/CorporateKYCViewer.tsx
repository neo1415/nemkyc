import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Building2, Users, CreditCard, FileCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CorporateKYCViewerProps {
  data: any;
  onClose: () => void;
}

const CorporateKYCViewer: React.FC<CorporateKYCViewerProps> = ({ data, onClose }) => {
  // Helper function to format values
  const formatValue = (value: any, isFile: boolean = false) => {
    if (!value || value === '') {
      return isFile ? 'Document not uploaded' : 'N/A';
    }
    return value;
  };

  // Helper function to format dates and timestamps
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      let dateObj: Date;
      
      // Handle Firebase Timestamp objects
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        dateObj = timestamp.toDate();
      } else if (typeof timestamp === 'string') {
        // If already formatted as DD/MM/YYYY, return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(timestamp)) {
          return timestamp;
        }
        dateObj = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        dateObj = timestamp;
      } else if (timestamp.seconds) {
        // Handle Firebase Timestamp-like objects with seconds property
        dateObj = new Date(timestamp.seconds * 1000);
      } else {
        return 'N/A';
      }

      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to extract directors data (handles both legacy and new formats)
  const extractDirectorsData = (data: any) => {
    const directors: any[] = [];
    
    // Check if directors is an array (new format)
    if (data.directors && Array.isArray(data.directors)) {
      return data.directors;
    }
    
    // Check for old flat format (firstName, lastName, firstName2, lastName2, etc.)
    // Director 1 (no number suffix)
    if (data.firstName || data.lastName) {
      const director = {
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        dob: data.dob || '',
        placeOfBirth: data.placeOfBirth || '',
        nationality: data.nationality || '',
        country: data.country || '',
        occupation: data.occupation || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        BVNNumber: data.BVNNumber || '',
        employersName: data.employersName || '',
        employersPhoneNumber: data.employersPhoneNumber || '',
        residentialAddress: data.residentialAddress || '',
        taxIDNumber: data.taxIDNumber || '',
        idType: data.idType || '',
        idNumber: data.idNumber || '',
        issuingBody: data.issuingBody || '',
        issuedDate: data.issuedDate || '',
        expiryDate: data.expiryDate || '',
        sourceOfIncome: data.sourceOfIncome || ''
      };
      directors.push(director);
    }
    
    // Director 2 (with "2" suffix)
    if (data.firstName2 || data.lastName2) {
      const director = {
        firstName: data.firstName2 || '',
        middleName: data.middleName2 || '',
        lastName: data.lastName2 || '',
        dob: data.dob2 || '',
        placeOfBirth: data.placeOfBirth2 || '',
        nationality: data.nationality2 || '',
        country: data.country2 || '',
        occupation: data.occupation2 || '',
        email: data.email2 || '',
        phoneNumber: data.phoneNumber2 || '',
        BVNNumber: data.BVNNumber2 || '',
        employersName: data.employersName2 || '',
        employersPhoneNumber: data.employersPhoneNumber2 || '',
        residentialAddress: data.residentialAddress2 || '',
        taxIDNumber: data.taxIDNumber2 || '',
        idType: data.idType2 || '',
        idNumber: data.idNumber2 || '',
        issuingBody: data.issuingBody2 || '',
        issuedDate: data.issuedDate2 || '',
        expiryDate: data.expiryDate2 || '',
        sourceOfIncome: data.sourceOfIncome2 || ''
      };
      directors.push(director);
    }
    
    return directors;
  };

  const directors = extractDirectorsData(data);

  const downloadPDF = async () => {
    const element = document.getElementById('corporate-kyc-pdf-content');
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
      pdf.text('Corporate KYC Form', 20, 65);
      
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
      
      pdf.save(`Corporate_KYC_${data.insured || 'form'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Corporate KYC Form</h2>
          <p className="text-muted-foreground">Form ID: {data.id || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>

      <div id="corporate-kyc-pdf-content" className="space-y-6 bg-white p-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Branch Office</p>
                <p className="font-medium">{formatValue(data.branchOffice)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Insured</p>
                <p className="font-medium">{formatValue(data.insured)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Office Address</p>
                <p className="font-medium">{formatValue(data.officeAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Ownership of Company</p>
                <p className="font-medium">{formatValue(data.ownershipOfCompany)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{formatValue(data.contactPerson)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Website</p>
                <p className="font-medium">{formatValue(data.website)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Incorporation Number</p>
                <p className="font-medium">{formatValue(data.incorporationNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Incorporation State</p>
                <p className="font-medium">{formatValue(data.incorporationState)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Date of Incorporation</p>
                <p className="font-medium">{formatDate(data.dateOfIncorporationRegistration)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">BVN Number</p>
                <p className="font-medium">{formatValue(data.BVNNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">NIN Number</p>
                <p className="font-medium">{formatValue(data.NINNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Contact Person Mobile</p>
                <p className="font-medium">{formatValue(data.contactPersonNo)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Tax ID Number</p>
                <p className="font-medium">{formatValue(data.taxIDNo)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{formatValue(data.emailAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Nature of Business</p>
                <p className="font-medium">{formatValue(data.natureOfBusiness)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Estimated Turnover</p>
                <p className="font-medium">{formatValue(data.estimatedTurnover)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Premium Payment Source</p>
                <p className="font-medium">{formatValue(data.premiumPaymentSource)}</p>
              </div>
              {data.premiumPaymentSource === 'Other' && (
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Other Premium Payment Source</p>
                  <p className="font-medium">{formatValue(data.premiumPaymentSourceOther)}</p>
                </div>
              )}
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
          <CardContent>
            {directors.length > 0 ? (
              <div className="space-y-6">
                {directors.map((director: any, index: number) => (
                  <div key={index}>
                    {index > 0 && <Separator className="my-4" />}
                    <h4 className="font-semibold text-lg mb-4">Director {index + 1}</h4>
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
                        <p className="font-medium">{formatDate(director.dob)}</p>
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
                        <p className="font-medium text-sm text-muted-foreground">Country</p>
                        <p className="font-medium">{formatValue(director.country)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                        <p className="font-medium">{formatValue(director.occupation)}</p>
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
                        <p className="font-medium text-sm text-muted-foreground">BVN Number</p>
                        <p className="font-medium">{formatValue(director.BVNNumber)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">NIN Number</p>
                        <p className="font-medium">{formatValue(director.NINNumber)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Employer Name</p>
                        <p className="font-medium">{formatValue(director.employersName)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Employer Phone</p>
                        <p className="font-medium">{formatValue(director.employersPhoneNumber)}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Residential Address</p>
                        <p className="font-medium">{formatValue(director.residentialAddress)}</p>
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
                      {director.sourceOfIncome === 'Other' && (
                        <div>
                          <p className="font-medium text-sm text-muted-foreground">Other Income Source</p>
                          <p className="font-medium">{formatValue(director.sourceOfIncomeOther)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No directors information available</p>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-md mb-3">Local Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{formatValue(data.localBankName)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{formatValue(data.localAccountNumber)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                  <p className="font-medium">{formatValue(data.localBankBranch)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                  <p className="font-medium">{formatDate(data.localAccountOpeningDate)}</p>
                </div>
              </div>
            </div>
            
            {(data.foreignBankName || data.foreignAccountNumber || data.foreignBankBranch || data.foreignAccountOpeningDate) && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="font-semibold text-md mb-3">Foreign Account</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{formatValue(data.foreignBankName)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{formatValue(data.foreignAccountNumber)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Bank Branch</p>
                      <p className="font-medium">{formatValue(data.foreignBankBranch)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Account Opening Date</p>
                      <p className="font-medium">{formatDate(data.foreignAccountOpeningDate)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Verification Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Verification Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{formatValue(data.companyNameVerificationDoc)}</p>
            </div>
            <div>
              <p className="font-medium text-sm text-muted-foreground">Verification Document</p>
              {data.verificationDoc ? (
                <a 
                  href={data.verificationDoc} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Document
                </a>
              ) : (
                <p className="text-muted-foreground">{formatValue(data.verificationDoc, true)}</p>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Status</p>
                <Badge variant={data.status === 'completed' ? 'default' : 'secondary'}>
                  {formatValue(data.status)}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Submitted At</p>
                <p className="font-medium">{formatDate(data.submittedAt || data.createdAt || data.timestamp)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Signature</p>
                <p className="font-medium">{formatValue(data.signature)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorporateKYCViewer;
