import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, FileText, User, Building, CreditCard } from 'lucide-react';
import { generateFormPDF, downloadPDF } from '@/services/pdfService';
import logoImage from '/NEMLogo (2)_page-0001.jpg';

interface BrokersCDDViewerProps {
  data: any;
}

const BrokersCDDViewer: React.FC<BrokersCDDViewerProps> = ({ data }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper functions for data extraction and formatting
  const extractDirectorsData = (data: any) => {
    if (data.directors && Array.isArray(data.directors)) {
      return data.directors; // New format
    }
    
    // Extract legacy format
    const directors = [];
    if (data.firstName) {
      directors.push({
        title: data.title || '',
        gender: data.gender || '',
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        lastName: data.lastName || '',
        dob: data.dob || '',
        placeOfBirth: data.placeOfBirth || '',
        nationality: data.nationality || '',
        residenceCountry: data.residenceCountry || '',
        occupation: data.occupation || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        BVNNumber: data.BVNNumber || '',
        employersName: data.employersName || '',
        address: data.address || '',
        taxIDNumber: data.taxIDNumber || '',
        intPassNo: data.intPassNo || '',
        passIssuedCountry: data.passIssuedCountry || '',
        idType: data.idType || '',
        idNumber: data.idNumber || '',
        issuedBy: data.issuedBy || '',
        issuedDate: data.issuedDate || '',
        expiryDate: data.expiryDate || '',
        sourceOfIncome: data.sourceOfIncome || '',
        sourceOfIncomeOther: data.sourceOfIncomeOther || ''
      });
    }
    
    return directors;
  };

  const formatValue = (value: any, isFile: boolean = false) => {
    if (!value || value === '') {
      return isFile ? 'Document not uploaded' : 'N/A';
    }
    return value;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toLocaleDateString('en-GB');
    } catch {
      return 'N/A';
    }
  };

  const directors = extractDirectorsData(data);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfBlob = await generateFormPDF({
        title: 'Brokers Customer Due Diligence (CDD) Form',
        subtitle: 'NEM Insurance Company Limited',
        data: data,
        logoUrl: logoImage,
        attachments: []
      });
      
      downloadPDF(pdfBlob, `brokers-cdd-${data.companyName || 'form'}.pdf`, data, 'Brokers-CDD');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Brokers CDD Form
          </h1>
          <p className="text-muted-foreground">
            Company: {formatValue(data.companyName)}
          </p>
        </div>
        <Button 
          onClick={generatePDF} 
          disabled={isGeneratingPDF}
          className="flex items-center gap-2"
        >
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <Separator />

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
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="mt-1">{formatValue(data.companyName)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="mt-1">{formatValue(data.emailAddress)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Company Address</label>
            <p className="mt-1">{formatValue(data.companyAddress)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">City</label>
              <p className="mt-1">{formatValue(data.city)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">State</label>
              <p className="mt-1">{formatValue(data.state)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country</label>
              <p className="mt-1">{formatValue(data.country)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Website</label>
              <p className="mt-1">{formatValue(data.website)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telephone Number</label>
              <p className="mt-1">{formatValue(data.telephoneNumber)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Incorporation/RC Number</label>
              <p className="mt-1">{formatValue(data.incorporationNumber)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
              <p className="mt-1">{formatValue(data.registrationNumber)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Incorporation State</label>
              <p className="mt-1">{formatValue(data.incorporationState)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Type</label>
              <p className="mt-1">{formatValue(data.companyLegalForm)}</p>
              {data.companyLegalForm === 'other' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Specified: {formatValue(data.companyLegalFormOther)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Incorporation/Registration</label>
              <p className="mt-1">{formatDate(data.dateOfIncorporationRegistration)}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Business Type/Occupation</label>
            <p className="mt-1">{formatValue(data.natureOfBusiness)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Tax Number</label>
            <p className="mt-1">{formatValue(data.taxIdentificationNumber)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Directors Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Directors Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {directors.length > 0 ? (
            directors.map((director: any, index: number) => (
              <div key={index}>
                {index > 0 && <Separator className="my-6" />}
                <h4 className="font-semibold text-lg mb-4">Director {index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="mt-1">{formatValue(director.title)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gender</label>
                    <p className="mt-1">{formatValue(director.gender)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                    <p className="mt-1">{formatValue(director.firstName)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Middle Name</label>
                    <p className="mt-1">{formatValue(director.middleName)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                    <p className="mt-1">{formatValue(director.lastName)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="mt-1">{formatDate(director.dob)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Place of Birth</label>
                    <p className="mt-1">{formatValue(director.placeOfBirth)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nationality</label>
                    <p className="mt-1">{formatValue(director.nationality)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Residence Country</label>
                    <p className="mt-1">{formatValue(director.residenceCountry)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Occupation</label>
                    <p className="mt-1">{formatValue(director.occupation)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{formatValue(director.email)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="mt-1">{formatValue(director.phoneNumber)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">BVN</label>
                    <p className="mt-1">{formatValue(director.BVNNumber)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="mt-1">{formatValue(director.address)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Employer's Name</label>
                    <p className="mt-1">{formatValue(director.employersName)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tax ID Number</label>
                    <p className="mt-1">{formatValue(director.taxIDNumber)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">International Passport Number</label>
                    <p className="mt-1">{formatValue(director.intPassNo)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Passport Issued Country</label>
                  <p className="mt-1">{formatValue(director.passIssuedCountry)}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID Type</label>
                    <p className="mt-1">{formatValue(director.idType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Identification Number</label>
                    <p className="mt-1">{formatValue(director.idNumber)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issued By</label>
                    <p className="mt-1">{formatValue(director.issuedBy)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issued Date</label>
                    <p className="mt-1">{formatDate(director.issuedDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                    <p className="mt-1">{formatDate(director.expiryDate)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source of Income</label>
                  <p className="mt-1">{formatValue(director.sourceOfIncome)}</p>
                  {director.sourceOfIncome === 'other' && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Specified: {formatValue(director.sourceOfIncomeOther)}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No directors information available</p>
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
        <CardContent className="space-y-6">
          {/* Local Account Details */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Local Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Local Bank Name</label>
                <p className="mt-1">{formatValue(data.localBankName)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bank Branch</label>
                <p className="mt-1">{formatValue(data.bankBranch)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Account Number</label>
                <p className="mt-1">{formatValue(data.currentAccountNumber)}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Account Opening Date</label>
              <p className="mt-1">{formatDate(data.accountOpeningDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Domicilliary Account Details */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Domicilliary Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Domicilliary Account Number</label>
                <p className="mt-1">{formatValue(data.domAccountNumber2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Foreign Bank Name</label>
                <p className="mt-1">{formatValue(data.foreignBankName2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bank Branch Name</label>
                <p className="mt-1">{formatValue(data.bankBranchName2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Currency</label>
                <p className="mt-1">{formatValue(data.currency)}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Account Opening Date</label>
              <p className="mt-1">{formatDate(data.accountOpeningDate2)}</p>
            </div>
          </div>

          <Separator />

          {/* Document Uploads */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Document Uploads</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certificate of Incorporation</label>
                <div className="mt-1">
                  {data.Incorporation ? (
                    <a 
                      href={data.Incorporation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{formatValue(data.Incorporation, true)}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Director 1 Identification</label>
                <div className="mt-1">
                  {data.identification ? (
                    <a 
                      href={data.identification} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{formatValue(data.identification, true)}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Director 2 Identification</label>
                <div className="mt-1">
                  {data.identification2 ? (
                    <a 
                      href={data.identification2} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{formatValue(data.identification2, true)}</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">NAICOM Form</label>
                <div className="mt-1">
                  {data.NAICOMForm ? (
                    <a 
                      href={data.NAICOMForm} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      View Document
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{formatValue(data.NAICOMForm, true)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Submission Date</label>
              <p className="mt-1">{formatDate(data.timestamp)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="mt-1">{formatValue(data.status)}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Signature</label>
            <p className="mt-1">{formatValue(data.signature)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokersCDDViewer;