import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PartnersCDDViewerProps {
  data: any;
}

const PartnersCDDViewer: React.FC<PartnersCDDViewerProps> = ({ data }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

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
        bvn: data.directorBvn || data.directorBvn1 || data.bvn1 || '',
        employerName: data.employerName || data.employerName1 || '',
        employerPhone: data.employerPhone || data.employerPhone1 || '',
        residentialAddress: data.residentialAddress || data.residentialAddress1 || '',
        taxIdNumber: data.taxIdNumber || data.taxIdNumber1 || '',
        idType: data.idType || data.idType1 || '',
        identificationNumber: data.identificationNumber || data.identificationNumber1 || '',
        issuingBody: data.issuingBody || data.issuingBody1 || '',
        issuedDate: data.issuedDate || data.issuedDate1 || '',
        expiryDate: data.expiryDate || data.expiryDate1 || '',
        incomeSource: data.incomeSource || data.incomeSource1 || '',
        incomeSourceOther: data.incomeSourceOther || data.incomeSourceOther1 || ''
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
        bvn: data.directorBvn2 || data.bvn2 || '',
        employerName: data.employerName2 || '',
        employerPhone: data.employerPhone2 || '',
        residentialAddress: data.residentialAddress2 || '',
        taxIdNumber: data.taxIdNumber2 || '',
        idType: data.idType2 || '',
        identificationNumber: data.identificationNumber2 || '',
        issuingBody: data.issuingBody2 || '',
        issuedDate: data.issuedDate2 || '',
        expiryDate: data.expiryDate2 || '',
        incomeSource: data.incomeSource2 || '',
        incomeSourceOther: data.incomeSourceOther2 || ''
      });
    }
    
    return directors;
  };

  // Helper function to format values
  const formatValue = (value: any, isFile: boolean = false) => {
    if (!value || value === '') {
      return isFile ? 'Document not uploaded' : 'N/A';
    }
    return value;
  };

  // Helper function to format dates
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return 'N/A';
  };

  // Check if this is a NAICOM form
  const isNaicomForm = (data: any) => {
    return data.naicomLicenseCertificate && data.naicomLicenseCertificate.trim() !== '';
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('partners-cdd-content');
      if (!element) {
        throw new Error('PDF content element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: 0,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Check if content fits on one page
      if (imgHeight * ratio <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      } else {
        // Multi-page handling
        let position = 0;
        const pageHeight = pdfHeight / ratio;
        
        while (position < imgHeight) {
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(pageHeight, imgHeight - position);
          
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, position, imgWidth, pageCanvas.height, 0, 0, imgWidth, pageCanvas.height);
            const pageImgData = pageCanvas.toDataURL('image/png');
            
            if (position > 0) {
              pdf.addPage();
            }
            
            pdf.addImage(pageImgData, 'PNG', imgX, imgY, imgWidth * ratio, pageCanvas.height * ratio);
          }
          
          position += pageHeight;
        }
      }

      const formType = isNaicomForm(data) ? 'NAICOM Partners CDD' : 'Partners CDD';
      pdf.save(`${formType} - ${data.companyName || 'Unknown'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const directors = extractDirectorsData(data);
  const formType = isNaicomForm(data) ? 'NAICOM Partners CDD' : 'Partners CDD';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/admin/partners-cdd')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{formType} Details</h1>
              <p className="text-sm text-muted-foreground">Company: {data.companyName || 'N/A'}</p>
            </div>
          </div>
          
          <Button 
            onClick={generatePDF} 
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="sm:hidden">Download</span>
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>

        {/* PDF Content */}
        <div id="partners-cdd-content" className="bg-white">
          {/* PDF Header */}
          <div className="text-center mb-6 p-6 border-b-2 border-[#800020]">
            <h1 className="text-2xl font-bold text-[#800020] mb-2">NEM Insurance</h1>
            <p className="text-sm text-gray-600 mb-1">NEM Insurance Plc</p>
            <p className="text-sm text-gray-600 mb-4">199, Ikorodu Road, Obanikoro Lagos</p>
            <h2 className="text-xl font-semibold text-[#800020]">{formType.toUpperCase()} FORM</h2>
            <p className="text-lg font-medium mt-2">Company: {data.companyName || 'N/A'}</p>
          </div>

          {/* Company Information */}
          <Card className="mb-6 border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-[#800020]">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Company Name:</label>
                  <p className="text-gray-900">{formatValue(data.companyName)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Email Address:</label>
                  <p className="text-gray-900">{formatValue(data.email)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="font-medium text-gray-700">Registered Address:</label>
                  <p className="text-gray-900">{formatValue(data.registeredAddress)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">City:</label>
                  <p className="text-gray-900">{formatValue(data.city)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">State:</label>
                  <p className="text-gray-900">{formatValue(data.state)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Country:</label>
                  <p className="text-gray-900">{formatValue(data.country)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Website:</label>
                  <p className="text-gray-900">{formatValue(data.website)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Contact Person Name:</label>
                  <p className="text-gray-900">{formatValue(data.contactPersonName)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Contact Person Number:</label>
                  <p className="text-gray-900">{formatValue(data.contactPersonNumber)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Tax Identification Number:</label>
                  <p className="text-gray-900">{formatValue(data.taxId)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">VAT Registration Number:</label>
                  <p className="text-gray-900">{formatValue(data.vatRegistrationNumber)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Incorporation/RC Number:</label>
                  <p className="text-gray-900">{formatValue(data.incorporationNumber)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Date of Incorporation:</label>
                  <p className="text-gray-900">{formatDate(data.incorporationDate)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Incorporation State:</label>
                  <p className="text-gray-900">{formatValue(data.incorporationState)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">BVN:</label>
                  <p className="text-gray-900">{formatValue(data.bvn)}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="font-medium text-gray-700">Nature of Business:</label>
                  <p className="text-gray-900">{formatValue(data.businessNature)}</p>
                </div>
                
                {/* NAICOM specific fields */}
                {isNaicomForm(data) && (
                  <>
                    <div>
                      <label className="font-medium text-gray-700">NAICOM License Issuing Date:</label>
                      <p className="text-gray-900">{formatDate(data.naicomLicenseIssuingDate)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">NAICOM License Expiry Date:</label>
                      <p className="text-gray-900">{formatDate(data.naicomLicenseExpiryDate)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Directors Information */}
          <Card className="mb-6 border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-[#800020]">Directors Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {directors.length > 0 ? (
                directors.map((director: any, index: number) => (
                  <div key={index} className="mb-6 last:mb-0">
                    {index > 0 && <hr className="my-6 border-gray-200" />}
                    <h3 className="text-md font-semibold text-[#800020] mb-4">Director {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Title:</label>
                        <p className="text-gray-900">{formatValue(director.title)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Gender:</label>
                        <p className="text-gray-900">{formatValue(director.gender)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">First Name:</label>
                        <p className="text-gray-900">{formatValue(director.firstName)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Middle Name:</label>
                        <p className="text-gray-900">{formatValue(director.middleName)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Last Name:</label>
                        <p className="text-gray-900">{formatValue(director.lastName)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Date of Birth:</label>
                        <p className="text-gray-900">{formatDate(director.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Place of Birth:</label>
                        <p className="text-gray-900">{formatValue(director.placeOfBirth)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Nationality:</label>
                        <p className="text-gray-900">{formatValue(director.nationality)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Country:</label>
                        <p className="text-gray-900">{formatValue(director.country)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Occupation:</label>
                        <p className="text-gray-900">{formatValue(director.occupation)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Email:</label>
                        <p className="text-gray-900">{formatValue(director.email)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Phone Number:</label>
                        <p className="text-gray-900">{formatValue(director.phoneNumber)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">BVN:</label>
                        <p className="text-gray-900">{formatValue(director.bvn)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Employer Name:</label>
                        <p className="text-gray-900">{formatValue(director.employerName)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Employer Phone:</label>
                        <p className="text-gray-900">{formatValue(director.employerPhone)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-medium text-gray-700">Residential Address:</label>
                        <p className="text-gray-900">{formatValue(director.residentialAddress)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Tax ID Number:</label>
                        <p className="text-gray-900">{formatValue(director.taxIdNumber)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">ID Type:</label>
                        <p className="text-gray-900">{formatValue(director.idType)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Identification Number:</label>
                        <p className="text-gray-900">{formatValue(director.identificationNumber)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Issuing Body:</label>
                        <p className="text-gray-900">{formatValue(director.issuingBody)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Issued Date:</label>
                        <p className="text-gray-900">{formatDate(director.issuedDate)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Expiry Date:</label>
                        <p className="text-gray-900">{formatDate(director.expiryDate)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Source of Income:</label>
                        <p className="text-gray-900">{formatValue(director.incomeSource)}</p>
                      </div>
                      {director.incomeSource === 'Other' && director.incomeSourceOther && (
                        <div>
                          <label className="font-medium text-gray-700">Other Income Source:</label>
                          <p className="text-gray-900">{formatValue(director.incomeSourceOther)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No directors information available</p>
              )}
            </CardContent>
          </Card>

          {/* Account Details & Files */}
          <Card className="mb-6 border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-[#800020]">Account Details & Files</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Local Account Information */}
                <div>
                  <h3 className="text-md font-semibold text-[#800020] mb-3">Local Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Account Number:</label>
                      <p className="text-gray-900">{formatValue(data.localAccountNumber)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Bank Name:</label>
                      <p className="text-gray-900">{formatValue(data.localBankName)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Bank Branch:</label>
                      <p className="text-gray-900">{formatValue(data.localBankBranch)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Account Opening Date:</label>
                      <p className="text-gray-900">{formatDate(data.localAccountOpeningDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Foreign Account Information */}
                {(data.foreignAccountNumber || data.foreignBankName || data.foreignBankBranch) && (
                  <div>
                    <h3 className="text-md font-semibold text-[#800020] mb-3">Foreign Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-gray-700">Account Number:</label>
                        <p className="text-gray-900">{formatValue(data.foreignAccountNumber)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Bank Name:</label>
                        <p className="text-gray-900">{formatValue(data.foreignBankName)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Bank Branch:</label>
                        <p className="text-gray-900">{formatValue(data.foreignBankBranch)}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Account Opening Date:</label>
                        <p className="text-gray-900">{formatDate(data.foreignAccountOpeningDate)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Uploads */}
                <div>
                  <h3 className="text-md font-semibold text-[#800020] mb-3">Document Uploads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Certificate of Incorporation:</label>
                      <p className="text-gray-900">
                        {data.certificateOfIncorporation ? (
                          <a href={data.certificateOfIncorporation} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Director 1 ID:</label>
                      <p className="text-gray-900">
                        {data.directorId1 ? (
                          <a href={data.directorId1} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Director 2 ID:</label>
                      <p className="text-gray-900">
                        {data.directorId2 ? (
                          <a href={data.directorId2} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">CAC Status Report:</label>
                      <p className="text-gray-900">
                        {data.cacStatusReport ? (
                          <a href={data.cacStatusReport} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">VAT Registration License:</label>
                      <p className="text-gray-900">
                        {data.vatRegistrationLicense ? (
                          <a href={data.vatRegistrationLicense} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Tax Clearance Certificate:</label>
                      <p className="text-gray-900">
                        {data.taxClearanceCertificate ? (
                          <a href={data.taxClearanceCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Document
                          </a>
                        ) : (
                          formatValue(null, true)
                        )}
                      </p>
                    </div>
                    {isNaicomForm(data) && (
                      <div>
                        <label className="font-medium text-gray-700">NAICOM License Certificate:</label>
                        <p className="text-gray-900">
                          {data.naicomLicenseCertificate ? (
                            <a href={data.naicomLicenseCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View Document
                            </a>
                          ) : (
                            formatValue(null, true)
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="border border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg font-semibold text-[#800020]">System Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700">Form ID:</label>
                  <p className="text-gray-900 font-mono text-xs">{id || 'N/A'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Form Type:</label>
                  <p className="text-gray-900">{data.formType || formType}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Submitted Date:</label>
                  <p className="text-gray-900">{formatDate(data.createdAt || data.submittedAt)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">Last Updated:</label>
                  <p className="text-gray-900">{formatDate(data.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Privacy Statement */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-md font-semibold text-[#800020] mb-2">Data Privacy Statement</h3>
            <p className="text-sm text-gray-600">
              This form contains personal and confidential information. All data collected is processed in accordance with applicable data protection 
              laws and NEM Insurance privacy policy. The information provided will be used solely for insurance purposes and will be kept confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersCDDViewer;