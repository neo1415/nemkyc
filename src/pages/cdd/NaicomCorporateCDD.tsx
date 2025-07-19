import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// NAICOM Corporate CDD Schema
const naicomCorporateCDDSchema = yup.object().shape({
  // Company Details
  companyName: yup.string().min(3).max(50).required("Company name is required"),
  registeredAddress: yup.string().min(3).max(60).required("Registered address is required"),
  incorporationNumber: yup.string().min(7).max(15).required("Incorporation number is required"),
  incorporationState: yup.string().min(3).max(50).required("Incorporation state is required"),
  dateOfIncorporation: yup.date().required("Date of incorporation is required"),
  natureOfBusiness: yup.string().min(3).max(60).required("Nature of business is required"),
  companyType: yup.string().required("Company type is required"),
  companyTypeOther: yup.string().when('companyType', {
    is: 'Other',
    then: (schema) => schema.required("Please specify other company type"),
    otherwise: (schema) => schema.notRequired()
  }),
  email: yup.string().email("Valid email is required").min(5).max(50).required("Email is required"),
  website: yup.string().required("Website is required"),
  taxId: yup.string().min(6).max(15).required("Tax ID is required"),
  telephone: yup.string().min(5).max(11).required("Telephone number is required"),

  // Directors
  directors: yup.array().of(
    yup.object().shape({
      firstName: yup.string().min(3).max(30).required("First name is required"),
      middleName: yup.string().min(3).max(30),
      lastName: yup.string().min(3).max(30).required("Last name is required"),
      dateOfBirth: yup.date().required("Date of birth is required"),
      placeOfBirth: yup.string().min(3).max(30).required("Place of birth is required"),
      nationality: yup.string().required("Nationality is required"),
      country: yup.string().required("Country is required"),
      occupation: yup.string().min(3).max(30).required("Occupation is required"),
      email: yup.string().email("Valid email is required").min(6).max(30).required("Email is required"),
      phoneNumber: yup.string().min(5).max(11).required("Phone number is required"),
      bvn: yup.string().length(11, "BVN must be exactly 11 digits").required("BVN is required"),
      employerName: yup.string().min(2).max(50),
      employerPhone: yup.string().min(5).max(11),
      residentialAddress: yup.string().required("Residential address is required"),
      taxIdNumber: yup.string(),
      idType: yup.string().required("ID type is required"),
      identificationNumber: yup.string().min(1).max(20).required("Identification number is required"),
      issuingBody: yup.string().min(1).max(50).required("Issuing body is required"),
      issuedDate: yup.date().required("Issued date is required"),
      expiryDate: yup.date(),
      sourceOfIncome: yup.string().required("Source of income is required"),
      sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
        is: 'Other',
        then: (schema) => schema.required("Please specify other income source"),
        otherwise: (schema) => schema.notRequired()
      })
    })
  ).min(1, "At least one director is required"),

  // Account Details
  bankName: yup.string().min(3).max(50).required("Bank name is required"),
  accountNumber: yup.string().min(7).max(10).required("Account number is required"),
  bankBranch: yup.string().min(3).max(30).required("Bank branch is required"),
  accountOpeningDate: yup.date().required("Account opening date is required"),

  // Foreign Account (optional)
  foreignBankName: yup.string(),
  foreignAccountNumber: yup.string(),
  foreignBankBranch: yup.string(),
  foreignAccountOpeningDate: yup.date(),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const NaicomCorporateCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  const defaultDirector = {
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
    employerName: '',
    employerPhone: '',
    residentialAddress: '',
    taxIdNumber: '',
    idType: '',
    identificationNumber: '',
    issuingBody: '',
    issuedDate: '',
    expiryDate: '',
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  };

  const formMethods = useForm<any>({
    resolver: yupResolver(naicomCorporateCDDSchema),
    defaultValues: {
      companyName: '',
      registeredAddress: '',
      incorporationNumber: '',
      incorporationState: '',
      dateOfIncorporation: '',
      natureOfBusiness: '',
      companyType: '',
      companyTypeOther: '',
      email: '',
      website: '',
      taxId: '',
      telephone: '',
      directors: [defaultDirector],
      bankName: '',
      accountNumber: '',
      bankBranch: '',
      accountOpeningDate: '',
      foreignBankName: '',
      foreignAccountNumber: '',
      foreignBankBranch: '',
      foreignAccountOpeningDate: '',
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomCorporateCDD', formMethods);
  const watchedValues = formMethods.watch();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
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

  // Main submit handler that checks authentication
  const handleSubmit = async (data: any) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `naicom-corporate-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'NAICOM Corporate CDD'
    };

    await handleSubmitWithAuth(finalData, 'NAICOM Corporate CDD');
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
      title: 'Company Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
            />
          </div>
          
          <div>
            <Label htmlFor="registeredAddress">Registered Company Address *</Label>
            <Textarea
              id="registeredAddress"
              {...formMethods.register('registeredAddress')}
            />
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
          
          <div>
            <DatePickerField
              name="dateOfIncorporation"
              label="Date of Incorporation/Registration *"
            />
          </div>
          
          <div>
            <Label htmlFor="natureOfBusiness">Nature of Business *</Label>
            <Textarea
              id="natureOfBusiness"
              {...formMethods.register('natureOfBusiness')}
            />
          </div>
          
          <div>
            <Label>Company Type *</Label>
            <Select
              value={watchedValues.companyType || ''}
              onValueChange={(value) => formMethods.setValue('companyType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                <SelectItem value="Unlimited Liability Company">Unlimited Liability Company</SelectItem>
                <SelectItem value="Limited Liability Company">Limited Liability Company</SelectItem>
                <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watchedValues.companyType === 'Other' && (
            <div>
              <Label htmlFor="companyTypeOther">Please specify *</Label>
              <Input id="companyTypeOther" {...formMethods.register('companyTypeOther')} />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
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
              <Label htmlFor="taxId">Tax Identification Number *</Label>
              <Input
                id="taxId"
                {...formMethods.register('taxId')}
              />
            </div>
            <div>
              <Label htmlFor="telephone">Telephone Number *</Label>
              <Input
                id="telephone"
                {...formMethods.register('telephone')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Director Info',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Directors</h3>
            <Button
              type="button"
              onClick={() => addDirector(defaultDirector)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>
          
          {directorFields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Director {index + 1}</h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDirector(index)}
                  disabled={directorFields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input {...formMethods.register(`directors.${index}.firstName`)} />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input {...formMethods.register(`directors.${index}.middleName`)} />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input {...formMethods.register(`directors.${index}.lastName`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField name={`directors.${index}.dateOfBirth`} label="Date of Birth *" />
                  <div>
                    <Label>Place of Birth *</Label>
                    <Input {...formMethods.register(`directors.${index}.placeOfBirth`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nationality *</Label>
                    <Input {...formMethods.register(`directors.${index}.nationality`)} />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Input {...formMethods.register(`directors.${index}.country`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Occupation *</Label>
                    <Input {...formMethods.register(`directors.${index}.occupation`)} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" {...formMethods.register(`directors.${index}.email`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input {...formMethods.register(`directors.${index}.phoneNumber`)} />
                  </div>
                  <div>
                    <Label>BVN *</Label>
                    <Input {...formMethods.register(`directors.${index}.bvn`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Employer's Name</Label>
                    <Input {...formMethods.register(`directors.${index}.employerName`)} />
                  </div>
                  <div>
                    <Label>Employer's Phone</Label>
                    <Input {...formMethods.register(`directors.${index}.employerPhone`)} />
                  </div>
                </div>

                <div>
                  <Label>Residential Address *</Label>
                  <Textarea {...formMethods.register(`directors.${index}.residentialAddress`)} />
                </div>

                <div>
                  <Label>Tax ID Number</Label>
                  <Input {...formMethods.register(`directors.${index}.taxIdNumber`)} />
                </div>

                <div>
                  <Label>ID Type *</Label>
                  <Select
                    value={watchedValues.directors?.[index]?.idType || ''}
                    onValueChange={(value) => formMethods.setValue(`directors.${index}.idType`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Identification Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="International Passport">International Passport</SelectItem>
                      <SelectItem value="NIMC">NIMC</SelectItem>
                      <SelectItem value="Driver's Licence">Driver's Licence</SelectItem>
                      <SelectItem value="Voters Card">Voters Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Identification Number *</Label>
                    <Input {...formMethods.register(`directors.${index}.identificationNumber`)} />
                  </div>
                  <div>
                    <Label>Issuing Body *</Label>
                    <Input {...formMethods.register(`directors.${index}.issuingBody`)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField name={`directors.${index}.issuedDate`} label="Issued Date *" />
                  <DatePickerField name={`directors.${index}.expiryDate`} label="Expiry Date" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Source of Income *</Label>
                    <Select
                      value={((formMethods.watch('directors') as any[]) || [])[index]?.sourceOfIncome || ''}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.sourceOfIncome`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Income Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
                        <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {((formMethods.watch('directors') as any[]) || [])[index]?.sourceOfIncome === 'Other' && (
                    <div>
                      <Label>Please specify *</Label>
                      <Input {...formMethods.register(`directors.${index}.sourceOfIncomeOther`)} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Account Details',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  {...formMethods.register('bankName')}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  {...formMethods.register('accountNumber')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="bankBranch">Bank Branch *</Label>
                <Input
                  id="bankBranch"
                  {...formMethods.register('bankBranch')}
                />
              </div>
              <div>
                <DatePickerField
                  name="accountOpeningDate"
                  label="Account Opening Date *"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foreignBankName">Bank Name</Label>
                <Input
                  id="foreignBankName"
                  {...formMethods.register('foreignBankName')}
                />
              </div>
              <div>
                <Label htmlFor="foreignAccountNumber">Account Number</Label>
                <Input
                  id="foreignAccountNumber"
                  {...formMethods.register('foreignAccountNumber')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="foreignBankBranch">Bank Branch</Label>
                <Input
                  id="foreignBankBranch"
                  {...formMethods.register('foreignBankBranch')}
                />
              </div>
              <div>
                <DatePickerField
                  name="foreignAccountOpeningDate"
                  label="Account Opening Date"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'uploads',
      title: 'Uploads',
      component: (
        <div className="space-y-4">
          <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, cacCertificate: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.cacCertificate}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { cacCertificate, ...rest } = prev;
                    return rest;
                  });
                }}
              />
          
           <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, identification: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.identification}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { identification, ...rest } = prev;
                    return rest;
                  });
                }}
              />
          
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, naicomLicense: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.naicomLicense}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { naicomLicense, ...rest } = prev;
                    return rest;
                  });
                }}
              />
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-4">Data Privacy</h4>
            <div className="space-y-2 text-sm">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-4">Declaration</h4>
            <div className="space-y-2 text-sm">
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
              I agree to the data privacy terms and confirm that all information provided is true and accurate to the best of my knowledge *
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
          <div className="text-center pt-4">
            <Button
              type="button"
              onClick={() => {
                const isValid = formMethods.trigger();
                if (isValid) setShowSummary(true);
              }}
            >
              Review & Submit
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NAICOM Company CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for NAICOM Company entities</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your NAICOM Corporate CDD</DialogTitle>
            </DialogHeader>
            <div className="space-y-8">
              {/* Company Information */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Company Information</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingField(editingField === 'company' ? null : 'company')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                  <div><strong>Email:</strong> {watchedValues.email}</div>
                  <div><strong>Website:</strong> {watchedValues.website}</div>
                  <div><strong>Telephone:</strong> {watchedValues.telephone}</div>
                  <div><strong>Tax ID:</strong> {watchedValues.taxId}</div>
                  <div><strong>Incorporation Number:</strong> {watchedValues.incorporationNumber}</div>
                  <div><strong>Incorporation State:</strong> {watchedValues.incorporationState}</div>
                  <div><strong>Company Type:</strong> {watchedValues.companyType}</div>
                  <div className="col-span-2"><strong>Address:</strong> {watchedValues.registeredAddress}</div>
                  <div className="col-span-2"><strong>Business Nature:</strong> {watchedValues.natureOfBusiness}</div>
                  <div><strong>Incorporation Date:</strong> {watchedValues.dateOfIncorporation ? new Date(watchedValues.dateOfIncorporation).toLocaleDateString() : 'Not set'}</div>
                </div>
              </div>

              {/* Directors */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Directors ({watchedValues.directors?.length || 0})</h3>
                {watchedValues.directors?.map((director, index) => (
                  <div key={index} className="border rounded p-3 mb-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Director {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Full Name:</strong> {director.firstName} {director.middleName} {director.lastName}</div>
                      <div><strong>Email:</strong> {director.email}</div>
                      <div><strong>Phone:</strong> {director.phoneNumber}</div>
                      <div><strong>Nationality:</strong> {director.nationality}</div>
                      <div><strong>Occupation:</strong> {director.occupation}</div>
                      <div><strong>BVN:</strong> {director.bvn}</div>
                      <div><strong>Date of Birth:</strong> {director.dateOfBirth}</div>
                      <div><strong>Place of Birth:</strong> {director.placeOfBirth}</div>
                      <div><strong>ID Type:</strong> {director.idType}</div>
                      <div><strong>ID Number:</strong> {director.identificationNumber}</div>
                      <div><strong>Income Source:</strong> {director.sourceOfIncome}</div>
                      <div className="col-span-2"><strong>Address:</strong> {director.residentialAddress}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Account Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Account Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Local Account</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Account Number:</strong> {watchedValues.accountNumber}</div>
                      <div><strong>Bank Name:</strong> {watchedValues.bankName}</div>
                      <div><strong>Bank Branch:</strong> {watchedValues.bankBranch}</div>
                      <div><strong>Opening Date:</strong> {watchedValues.accountOpeningDate ? new Date(watchedValues.accountOpeningDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  </div>
                  {(watchedValues.foreignAccountNumber || watchedValues.foreignBankName) && (
                    <div>
                      <h4 className="font-medium mb-2">Foreign Account</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Account Number:</strong> {watchedValues.foreignAccountNumber}</div>
                        <div><strong>Bank Name:</strong> {watchedValues.foreignBankName}</div>
                        <div><strong>Bank Branch:</strong> {watchedValues.foreignBankBranch}</div>
                        <div><strong>Opening Date:</strong> {watchedValues.foreignAccountOpeningDate ? new Date(watchedValues.foreignAccountOpeningDate).toLocaleDateString() : 'Not set'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Uploaded Documents</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {Object.entries(uploadedFiles).map(([key, file]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-green-600">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                  {Object.keys(uploadedFiles).length === 0 && (
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  )}
                </div>
              </div>

              {/* Declaration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Declaration</h3>
                <div className="text-sm">
                  <div><strong>Data Privacy Agreement:</strong> {watchedValues.agreeToDataPrivacy ? 'Agreed' : 'Not agreed'}</div>
                  <div><strong>Digital Signature:</strong> {watchedValues.signature}</div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                >
                  Edit Details
                </Button>
                <Button
                  onClick={() => {
                    const formData = formMethods.getValues();
                    handleSubmit(formData);
                  }}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CDD Form Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl">✓</div>
              <p>Your NAICOM Company CDD form has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly.
              </p>
              <Button onClick={() => setShowSuccess(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NaicomCorporateCDD;
