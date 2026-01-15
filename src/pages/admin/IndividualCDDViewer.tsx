import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, User, CreditCard, FileCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface IndividualCDDViewerProps {
  data: any;
  onClose: () => void;
}

const IndividualCDDViewer: React.FC<IndividualCDDViewerProps> = ({ data, onClose }) => {
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

  const downloadPDF = async () => {
    const element = document.getElementById('individual-cdd-pdf-content');
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
      pdf.text('Individual CDD Form', 20, 65);
      
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
      
      pdf.save(`Individual_CDD_${data.firstName || 'form'}_${data.lastName || ''}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Individual CDD Form</h2>
          <p className="text-muted-foreground">Form ID: {data.id || 'N/A'}</p>
          <p className="text-muted-foreground">Form Type: {formatValue(data.formType)}</p>
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

      {/* Ticket ID Display - Prominent */}
      {data.ticketId && (
        <Card className="bg-[#800020] text-white">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-sm opacity-90 mb-1">Ticket ID</p>
            <p className="text-3xl font-bold tracking-wider">{data.ticketId}</p>
          </CardContent>
        </Card>
      )}

      <div id="individual-cdd-pdf-content" className="space-y-6 bg-white p-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{formatValue(data.title)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{formatValue(data.firstName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{formatValue(data.lastName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Contact Address</p>
                <p className="font-medium">{formatValue(data.contactAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{formatValue(data.gender)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Residence Country</p>
                <p className="font-medium">{formatValue(data.country)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatValue(data.dateOfBirth)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Place of Birth</p>
                <p className="font-medium">{formatValue(data.placeOfBirth)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium">{formatValue(data.emailAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{formatValue(data.GSMno)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Residential Address</p>
                <p className="font-medium">{formatValue(data.residentialAddress)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{formatValue(data.nationality)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Occupation</p>
                <p className="font-medium">{formatValue(data.occupation)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{formatValue(data.position)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Business Type</p>
                <p className="font-medium">{formatValue(data.businessType)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Business Type Other</p>
                <p className="font-medium">{formatValue(data.businessTypeOther)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Employer's Email</p>
                <p className="font-medium">{formatValue(data.employersEmail)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Employer's Name</p>
                <p className="font-medium">{formatValue(data.employersName)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Employer's Telephone Number</p>
                <p className="font-medium">{formatValue(data.employersTelephoneNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Tax Identification Number</p>
                <p className="font-medium">{formatValue(data.taxidentificationNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Employer's Address</p>
                <p className="font-medium">{formatValue(data.employersAddress)}</p>
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
                <p className="font-medium text-sm text-muted-foreground">Identification Type</p>
                <p className="font-medium">{formatValue(data.identificationType)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Identification Number</p>
                <p className="font-medium">{formatValue(data.identificationNumber)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Issuing Country</p>
                <p className="font-medium">{formatValue(data.issuingCountry)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Issued Date</p>
                <p className="font-medium">{formatValue(data.issuedDate)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-medium">{formatValue(data.expiryDate)}</p>
              </div>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm text-muted-foreground">Annual Income Range</p>
                <p className="font-medium">{formatValue(data.annualIncomeRange)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Premium Payment Source</p>
                <p className="font-medium">{formatValue(data.premiumPaymentSource)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Premium Payment Source Other</p>
                <p className="font-medium">{formatValue(data.premiumPaymentSourceOther)}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Document Uploads</h4>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Valid Means of Identification</p>
                {data.identification ? (
                  <a 
                    href={data.identification} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Document
                  </a>
                ) : (
                  <p className="text-muted-foreground">{formatValue(data.identification, true)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Declaration & System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Declaration & System Information
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
                <p className="font-medium">{formatValue(data.timestamp || data.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Digital Signature</p>
                <p className="font-medium">{formatValue(data.signature)}</p>
              </div>
              <div>
                <p className="font-medium text-sm text-muted-foreground">Data Privacy Agreement</p>
                <p className="font-medium">{data.agreeToDataPrivacy ? 'Agreed' : 'Not Agreed'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndividualCDDViewer;