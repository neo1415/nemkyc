import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Check, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Form validation schema
const corporateKYCSchema = yup.object().shape({
  // Company Info
  nemBranchOffice: yup.string().required("NEM Branch Office is required"),
  insured: yup.string().required("Insured field is required"),
  officeAddress: yup.string().required("Office address is required"),
  ownershipOfCompany: yup.string().required("Ownership of company is required"),
  contactPerson: yup.string().required("Contact person is required"),
  website: yup.string().required("Website is required"),
  incorporationNumber: yup.string().required("Incorporation number is required"),
  incorporationState: yup.string().required("Incorporation state is required"),
  incorporationDate: yup.date().required("Date of incorporation is required"),
  bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  contactPersonMobile: yup.string().required("Contact person mobile is required"),
  taxId: yup.string(),
  email: yup.string().email("Valid email is required").required("Email is required"),
  businessType: yup.string().required("Business type is required"),
  estimatedTurnover: yup.string().required("Estimated turnover is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string(),

  // Directors
  directors: yup.array().of(yup.object().shape({
    firstName: yup.string().required("First name is required"),
    middleName: yup.string(),
    lastName: yup.string().required("Last name is required"),
    dateOfBirth: yup.date().required("Date of birth is required"),
    placeOfBirth: yup.string().required("Place of birth is required"),
    nationality: yup.string().required("Nationality is required"),
    country: yup.string().required("Country is required"),
    occupation: yup.string().required("Occupation is required"),
    email: yup.string().email("Valid email is required").required("Email is required"),
    phoneNumber: yup.string().required("Phone number is required"),
    bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
    employersName: yup.string(),
    employersPhone: yup.string(),
    residentialAddress: yup.string().required("Residential address is required"),
    taxIdNumber: yup.string(),
    idType: yup.string().required("ID type is required"),
    identificationNumber: yup.string().required("Identification number is required"),
    issuingBody: yup.string().required("Issuing body is required"),
    issuedDate: yup.date().required("Issued date is required"),
    expiryDate: yup.date(),
    incomeSource: yup.string().required("Income source is required"),
    incomeSourceOther: yup.string()
  })).min(1, "At least one director is required"),

  // Verification
  verificationDocumentType: yup.string().required("Verification document type is required"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues = {
  nemBranchOffice: '',
  insured: '',
  officeAddress: '',
  ownershipOfCompany: '',
  contactPerson: '',
  website: '',
  incorporationNumber: '',
  incorporationState: '',
  incorporationDate: '',
  bvn: '',
  contactPersonMobile: '',
  taxId: '',
  email: '',
  businessType: '',
  estimatedTurnover: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
  directors: [{
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    country: '',
    occupation: '',
    email: '',
    phoneNumber: '',
    bvn: '',
    employersName: '',
    employersPhone: '',
    residentialAddress: '',
    taxIdNumber: '',
    idType: '',
    identificationNumber: '',
    issuingBody: '',
    issuedDate: '',
    expiryDate: '',
    incomeSource: '',
    incomeSourceOther: ''
  }],
  verificationDocumentType: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const CorporateKYC: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    resolver: yupResolver(corporateKYCSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('corporateKYC', formMethods);
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });
  const watchedValues = formMethods.watch();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };
    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `corporate-kyc/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Corporate KYC'
    };

    await handleSubmitWithAuth(finalData, 'Corporate KYC');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: any) => {
    setShowSummary(true);
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <ReactCalendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => formMethods.setValue(name, date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nemBranchOffice">NEM Branch Office *</Label>
              <Input
                id="nemBranchOffice"
                {...formMethods.register('nemBranchOffice')}
              />
            </div>
            <div>
              <Label htmlFor="insured">Insured *</Label>
              <Input
                id="insured"
                {...formMethods.register('insured')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="officeAddress">Office Address *</Label>
            <Textarea
              id="officeAddress"
              {...formMethods.register('officeAddress')}
            />
          </div>

          <div>
            <Label>Ownership of Company *</Label>
            <Select
              value={formMethods.watch('ownershipOfCompany')}
              onValueChange={(value) => formMethods.setValue('ownershipOfCompany', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Ownership Of Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nigerian">Nigerian</SelectItem>
                <SelectItem value="Foreign">Foreign</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                {...formMethods.register('contactPerson')}
              />
            </div>
            <div>
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                {...formMethods.register('website')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incorporationNumber">Incorporation Number *</Label>
              <Input
                id="incorporationNumber"
                {...formMethods.register('incorporationNumber')}
              />
            </div>
            <div>
              <Label htmlFor="incorporationState">Incorporation State *</Label>
              <Input
                id="incorporationState"
                {...formMethods.register('incorporationState')}
              />
            </div>
          </div>

          <DatePickerField
            name="incorporationDate"
            label="Date of Incorporation/Registration *"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bvn">BVN *</Label>
              <Input
                id="bvn"
                maxLength={11}
                {...formMethods.register('bvn')}
              />
            </div>
            <div>
              <Label htmlFor="contactPersonMobile">Contact Person Mobile Number *</Label>
              <Input
                id="contactPersonMobile"
                {...formMethods.register('contactPersonMobile')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxId">Tax Identification Number</Label>
              <Input
                id="taxId"
                {...formMethods.register('taxId')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessType">Business Type/Occupation *</Label>
            <Input
              id="businessType"
              {...formMethods.register('businessType')}
            />
          </div>

          <div>
            <Label>Estimated Turnover *</Label>
            <Select
              value={formMethods.watch('estimatedTurnover')}
              onValueChange={(value) => formMethods.setValue('estimatedTurnover', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Annual Income Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Less Than 10 Million">Less Than 10 Million</SelectItem>
                <SelectItem value="11 Million - 50 Million">11 Million - 50 Million</SelectItem>
                <SelectItem value="51 Million - 200 Million">51 Million - 200 Million</SelectItem>
                <SelectItem value="More Than 200 Million">More Than 200 Million</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Premium Payment Source *</Label>
            <Select
              value={formMethods.watch('premiumPaymentSource')}
              onValueChange={(value) => formMethods.setValue('premiumPaymentSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Income Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
                <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
                <SelectItem value="Other">Other (please specify)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formMethods.watch('premiumPaymentSource') === 'Other' && (
            <div>
              <Label htmlFor="premiumPaymentSourceOther">Please specify other income source *</Label>
              <Input
                id="premiumPaymentSourceOther"
                {...formMethods.register('premiumPaymentSourceOther')}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Director Information',
      component: (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Director {index + 1}</h3>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.firstName`}>First Name *</Label>
                  <Input
                    id={`directors.${index}.firstName`}
                    {...formMethods.register(`directors.${index}.firstName`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.middleName`}>Middle Name</Label>
                  <Input
                    id={`directors.${index}.middleName`}
                    {...formMethods.register(`directors.${index}.middleName`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.lastName`}>Last Name *</Label>
                  <Input
                    id={`directors.${index}.lastName`}
                    {...formMethods.register(`directors.${index}.lastName`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <DatePickerField
                  name={`directors.${index}.dateOfBirth`}
                  label="Date of Birth *"
                />
                <div>
                  <Label htmlFor={`directors.${index}.placeOfBirth`}>Place of Birth *</Label>
                  <Input
                    id={`directors.${index}.placeOfBirth`}
                    {...formMethods.register(`directors.${index}.placeOfBirth`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.nationality`}>Nationality *</Label>
                  <Input
                    id={`directors.${index}.nationality`}
                    {...formMethods.register(`directors.${index}.nationality`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.country`}>Country *</Label>
                  <Input
                    id={`directors.${index}.country`}
                    {...formMethods.register(`directors.${index}.country`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.occupation`}>Occupation *</Label>
                  <Input
                    id={`directors.${index}.occupation`}
                    {...formMethods.register(`directors.${index}.occupation`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.email`}>Email *</Label>
                  <Input
                    id={`directors.${index}.email`}
                    type="email"
                    {...formMethods.register(`directors.${index}.email`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.phoneNumber`}>Phone Number *</Label>
                  <Input
                    id={`directors.${index}.phoneNumber`}
                    {...formMethods.register(`directors.${index}.phoneNumber`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.bvn`}>BVN *</Label>
                  <Input
                    id={`directors.${index}.bvn`}
                    maxLength={11}
                    {...formMethods.register(`directors.${index}.bvn`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.employersName`}>Employer Name</Label>
                  <Input
                    id={`directors.${index}.employersName`}
                    {...formMethods.register(`directors.${index}.employersName`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.employersPhone`}>Employer Phone</Label>
                  <Input
                    id={`directors.${index}.employersPhone`}
                    {...formMethods.register(`directors.${index}.employersPhone`)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label htmlFor={`directors.${index}.residentialAddress`}>Residential Address *</Label>
                <Textarea
                  id={`directors.${index}.residentialAddress`}
                  {...formMethods.register(`directors.${index}.residentialAddress`)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.taxIdNumber`}>Tax ID Number</Label>
                  <Input
                    id={`directors.${index}.taxIdNumber`}
                    {...formMethods.register(`directors.${index}.taxIdNumber`)}
                  />
                </div>
                <div>
                  <Label>ID Type *</Label>
                  <Select
                    value={formMethods.watch(`directors.${index}.idType`)}
                    onValueChange={(value) => formMethods.setValue(`directors.${index}.idType`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National ID">National ID</SelectItem>
                      <SelectItem value="Driver's License">Driver's License</SelectItem>
                      <SelectItem value="International Passport">International Passport</SelectItem>
                      <SelectItem value="Voters Card">Voters Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor={`directors.${index}.identificationNumber`}>Identification Number *</Label>
                  <Input
                    id={`directors.${index}.identificationNumber`}
                    {...formMethods.register(`directors.${index}.identificationNumber`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`directors.${index}.issuingBody`}>Issuing Body *</Label>
                  <Input
                    id={`directors.${index}.issuingBody`}
                    {...formMethods.register(`directors.${index}.issuingBody`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <DatePickerField
                  name={`directors.${index}.issuedDate`}
                  label="Issued Date *"
                />
                <DatePickerField
                  name={`directors.${index}.expiryDate`}
                  label="Expiry Date"
                />
              </div>

              <div>
                <Label>Source of Income *</Label>
                <Select
                  value={formMethods.watch(`directors.${index}.incomeSource`)}
                  onValueChange={(value) => formMethods.setValue(`directors.${index}.incomeSource`, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Source of Income" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Business Income">Business Income</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formMethods.watch(`directors.${index}.incomeSource`) === 'Other' && (
                <div className="mt-4">
                  <Label htmlFor={`directors.${index}.incomeSourceOther`}>Please specify *</Label>
                  <Input
                    id={`directors.${index}.incomeSourceOther`}
                    {...formMethods.register(`directors.${index}.incomeSourceOther`)}
                  />
                </div>
              )}
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
              firstName: '',
              middleName: '',
              lastName: '',
              dateOfBirth: '',
              placeOfBirth: '',
              nationality: '',
              country: '',
              occupation: '',
              email: '',
              phoneNumber: '',
              bvn: '',
              employersName: '',
              employersPhone: '',
              residentialAddress: '',
              taxIdNumber: '',
              idType: '',
              identificationNumber: '',
              issuingBody: '',
              issuedDate: '',
              expiryDate: '',
              incomeSource: '',
              incomeSourceOther: ''
            })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Director
          </Button>
        </div>
      )
    },
    {
      id: 'verification',
      title: 'Account Details & Verification Upload',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Company Name Verification Document *</Label>
            <Select
              value={formMethods.watch('verificationDocumentType')}
              onValueChange={(value) => formMethods.setValue('verificationDocumentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification Document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Certificate of Incorporation or Business Registration">Certificate of Incorporation or Business Registration</SelectItem>
                <SelectItem value="CAC Status Report">CAC Status Report</SelectItem>
                <SelectItem value="Board Resolution">Board Resolution</SelectItem>
                <SelectItem value="Power of Attorney">Power of Attorney</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Upload Your Verification Document *</Label>
            <FileUpload
              accept="image/*,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  verificationDocument: file
                }));
              }}
              maxSize={3 * 1024 * 1024}
            />
            {uploadedFiles.verificationDocument && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.verificationDocument.name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Data Privacy</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
            
            <h3 className="font-medium mb-2 mt-4">Declaration</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked === true)}
            />
            <Label htmlFor="agreeToDataPrivacy" className="text-sm">
              I agree to the data privacy terms and declaration and confirm that all information provided is true and accurate to the best of my knowledge *
            </Label>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          {formMethods.watch('agreeToDataPrivacy') && (
            <Button
              type="button"
              onClick={() => setShowSummary(true)}
              className="w-full"
            >
              Submit Corporate KYC Form
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Post-auth loading overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Completing your submission...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your KYC form.</p>
          </div>
        </div>
      )}

      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Corporate KYC Form
          </CardTitle>
          <CardDescription>
            Know Your Customer - Please provide accurate information for regulatory compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={formMethods}
            submitButtonText="Submit KYC Form"
          />
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Corporate KYC Form Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Branch Office:</strong> {formMethods.watch('nemBranchOffice')}</div>
              <div><strong>Insured:</strong> {formMethods.watch('insured')}</div>
              <div><strong>Email:</strong> {formMethods.watch('email')}</div>
              <div><strong>Contact Person:</strong> {formMethods.watch('contactPerson')}</div>
              <div><strong>BVN:</strong> {formMethods.watch('bvn')}</div>
              <div><strong>Business Type:</strong> {formMethods.watch('businessType')}</div>
            </div>
            <div>
              <strong>Address:</strong>
              <p className="text-sm mt-1">{formMethods.watch('officeAddress')}</p>
            </div>
            <div>
              <strong>Directors:</strong>
              <div className="text-sm mt-1 space-y-2">
                {formMethods.watch('directors')?.map((director: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-2 rounded">
                    {director.firstName} {director.lastName} - {director.occupation}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Edit Form
            </Button>
            <Button 
              onClick={() => handleSubmit(formMethods.getValues())}
              disabled={authSubmitting}
            >
              {authSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit KYC Form'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={authShowSuccess}
        onClose={() => setAuthShowSuccess()}
        title="KYC Form Submitted Successfully!"
        message="Your Corporate KYC form has been submitted successfully. You will receive a confirmation email shortly."
        formType="Corporate KYC"
      />
    </div>
  );
};

export default CorporateKYC;
