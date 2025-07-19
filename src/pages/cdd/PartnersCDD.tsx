import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { PartnersCDDData, Director } from '@/types';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const partnersCDDSchema = yup.object().shape({
  // Company Info
  companyName: yup.string().required("Company name is required"),
  registeredAddress: yup.string().required("Registered address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),
  website: yup.string().required("Website is required"),
  contactPersonName: yup.string().required("Contact person name is required"),
  contactPersonNumber: yup.string().required("Contact person number is required"),
  taxId: yup.string().required("Tax ID is required"),
  vatRegistrationNumber: yup.string().required("VAT registration number is required"),
  incorporationNumber: yup.string().required("Incorporation number is required"),
  incorporationDate: yup.date().required("Incorporation date is required"),
  incorporationState: yup.string().required("Incorporation state is required"),
  businessNature: yup.string().required("Business nature is required"),
  bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  
  // Directors
  directors: yup.array().of(yup.object().shape({
    title: yup.string(),
    gender: yup.string(),
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
    employerName: yup.string(),
    employerPhone: yup.string(),
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
  
  // Account Details
  localAccountNumber: yup.string().required("Account number is required"),
  localBankName: yup.string().required("Bank name is required"),
  localBankBranch: yup.string().required("Bank branch is required"),
  localAccountOpeningDate: yup.date().required("Account opening date is required"),
  foreignAccountNumber: yup.string(),
  foreignBankName: yup.string(),
  foreignBankBranch: yup.string(),
  foreignAccountOpeningDate: yup.date(),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues: Partial<PartnersCDDData> = {
  companyName: '',
  registeredAddress: '',
  city: '',
  state: '',
  country: '',
  email: '',
  website: '',
  contactPersonName: '',
  contactPersonNumber: '',
  taxId: '',
  vatRegistrationNumber: '',
  incorporationNumber: '',
  incorporationState: '',
  businessNature: '',
  bvn: '',
  directors: [{
    title: '',
    gender: '',
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
    incomeSource: '',
    incomeSourceOther: ''
  }],
  localAccountNumber: '',
  localBankName: '',
  localBankBranch: '',
  foreignAccountNumber: '',
  foreignBankName: '',
  foreignBankBranch: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const PartnersCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess,
    isSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    resolver: yupResolver(partnersCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('partners', formMethods);
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
        // Hide loading after 5 seconds max (in case something goes wrong)
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };

    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (showSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [showSuccess]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: PartnersCDDData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `partners-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Partners CDD'
    };

    await handleSubmitWithAuth(finalData, 'Partners CDD');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: PartnersCDDData) => {
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...formMethods.register('city')}
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...formMethods.register('state')}
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...formMethods.register('country')}
              />
            </div>
          </div>
          
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
              <Label htmlFor="contactPersonName">Contact Person Name *</Label>
              <Input
                id="contactPersonName"
                {...formMethods.register('contactPersonName')}
              />
            </div>
            <div>
              <Label htmlFor="contactPersonNumber">Contact Person Number *</Label>
              <Input
                id="contactPersonNumber"
                {...formMethods.register('contactPersonNumber')}
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
              <Label htmlFor="vatRegistrationNumber">VAT Registration Number *</Label>
              <Input
                id="vatRegistrationNumber"
                {...formMethods.register('vatRegistrationNumber')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="incorporationNumber">Incorporation/RC Number *</Label>
              <Input
                id="incorporationNumber"
                {...formMethods.register('incorporationNumber')}
              />
            </div>
            <div>
              <DatePickerField
                name="incorporationDate"
                label="Date of Incorporation *"
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
            <Label htmlFor="businessNature">Nature of Business *</Label>
            <Textarea
              id="businessNature"
              {...formMethods.register('businessNature')}
            />
          </div>
          
          <div>
            <Label htmlFor="bvn">BVN *</Label>
            <Input
              id="bvn"
              maxLength={11}
              {...formMethods.register('bvn')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Directors Information',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Directors</h3>
            <Button
              type="button"
              onClick={() => append({
                title: '',
                gender: '',
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
                incomeSource: '',
                incomeSourceOther: ''
              })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Director {index + 1}</h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Select
                      value={((formMethods.watch('directors') as any[]) || [])[index]?.title || ''}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.title`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mr">Mr</SelectItem>
                        <SelectItem value="Mrs">Mrs</SelectItem>
                        <SelectItem value="Chief">Chief</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Gender *</Label>
                    <Select
                      value={((formMethods.watch('directors') as any[]) || [])[index]?.gender || ''}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.gender`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.firstName`)}
                    />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.middleName`)}
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.lastName`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      {...formMethods.register(`directors.${index}.dateOfBirth`)}
                    />
                  </div>
                  <div>
                    <Label>Place of Birth *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.placeOfBirth`)}
                    />
                  </div>
                  <div>
                    <Label>Nationality *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.nationality`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Country *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.country`)}
                    />
                  </div>
                  <div>
                    <Label>Occupation *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.occupation`)}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      {...formMethods.register(`directors.${index}.email`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.phoneNumber`)}
                    />
                  </div>
                  <div>
                    <Label>BVN *</Label>
                    <Input
                      maxLength={11}
                      {...formMethods.register(`directors.${index}.bvn`)}
                    />
                  </div>
                  <div>
                    <Label>Employer's Name</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.employerName`)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Residential Address *</Label>
                  <Textarea
                    {...formMethods.register(`directors.${index}.residentialAddress`)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ID Type *</Label>
                    <Select
                      value={formMethods.watch(`directors.${index}.idType`)}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.idType`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="international-passport">International Passport</SelectItem>
                        <SelectItem value="nimc">NIMC</SelectItem>
                        <SelectItem value="drivers">Driver's License</SelectItem>
                        <SelectItem value="voters">Voters Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Identification Number *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.identificationNumber`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Issued Date *</Label>
                    <Input
                      type="date"
                      {...formMethods.register(`directors.${index}.issuedDate`)}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      {...formMethods.register(`directors.${index}.expiryDate`)}
                    />
                  </div>
                  <div>
                    <Label>Issuing Body *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.issuingBody`)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Source of Income *</Label>
                  <Select
                    value={formMethods.watch(`directors.${index}.incomeSource`)}
                    onValueChange={(value) => formMethods.setValue(`directors.${index}.incomeSource`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Income Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary or Business Income</SelectItem>
                      <SelectItem value="investments">Investments or Dividends</SelectItem>
                      <SelectItem value="other">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formMethods.watch(`directors.${index}.incomeSource`) === 'other' && (
                  <div>
                    <Label>Please specify other income source</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.incomeSourceOther`)}
                    />
                  </div>
                )}
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
                <Label htmlFor="localAccountNumber">Account Number *</Label>
                <Input
                  id="localAccountNumber"
                  {...formMethods.register('localAccountNumber')}
                />
              </div>
              <div>
                <Label htmlFor="localBankName">Bank Name *</Label>
                <Input
                  id="localBankName"
                  {...formMethods.register('localBankName')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="localBankBranch">Bank Branch *</Label>
                <Input
                  id="localBankBranch"
                  {...formMethods.register('localBankBranch')}
                />
              </div>
              <div>
                <DatePickerField
                  name="localAccountOpeningDate"
                  label="Account Opening Date *"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foreignAccountNumber">Account Number</Label>
                <Input
                  id="foreignAccountNumber"
                  {...formMethods.register('foreignAccountNumber')}
                />
              </div>
              <div>
                <Label htmlFor="foreignBankName">Bank Name</Label>
                <Input
                  id="foreignBankName"
                  {...formMethods.register('foreignBankName')}
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
                <Label>Account Opening Date</Label>
                <Input
                  type="date"
                  {...formMethods.register('foreignAccountOpeningDate')}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'uploads',
      title: 'Document Uploads',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Certificate of Incorporation *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, certificateOfIncorporation: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.certificateOfIncorporation}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { certificateOfIncorporation, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>Identification Means for Director 1 *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, directorId1: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.directorId1}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { directorId1, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>Identification Means for Director 2 *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, directorId2: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.directorId2}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { directorId2, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>CAC Status Report *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, cacStatusReport: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.cacStatusReport}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { cacStatusReport, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>VAT Registration License *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, vatRegistrationLicense: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.vatRegistrationLicense}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { vatRegistrationLicense, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>Tax Clearance Certificate *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, taxClearanceCertificate: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.taxClearanceCertificate}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { taxClearanceCertificate, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
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
            <h3 className="font-medium mb-2">Data Privacy Notice</h3>
            <p className="text-sm text-muted-foreground">
              Your personal data will be processed in accordance with our privacy policy and applicable data protection laws.
              We will use your information for customer due diligence purposes and may share it with relevant regulatory bodies
              as required by law. All data will be handled securely and confidentially.
            </p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partners CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for Partners</p>
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
              <DialogTitle>Review Your Partners CDD</DialogTitle>
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
                {editingField === 'company' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input {...formMethods.register('companyName')} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input {...formMethods.register('email')} />
                      </div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea {...formMethods.register('registeredAddress')} />
                    </div>
                    <Button onClick={() => setEditingField(null)} size="sm">Save</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                    <div><strong>Email:</strong> {watchedValues.email}</div>
                    <div><strong>Website:</strong> {watchedValues.website}</div>
                    <div><strong>City:</strong> {watchedValues.city}</div>
                    <div><strong>State:</strong> {watchedValues.state}</div>
                    <div><strong>Country:</strong> {watchedValues.country}</div>
                    <div><strong>Contact Person:</strong> {watchedValues.contactPersonName}</div>
                    <div><strong>Contact Number:</strong> {watchedValues.contactPersonNumber}</div>
                    <div><strong>Tax ID:</strong> {watchedValues.taxId}</div>
                    <div><strong>VAT Number:</strong> {watchedValues.vatRegistrationNumber}</div>
                    <div><strong>RC Number:</strong> {watchedValues.incorporationNumber}</div>
                    <div><strong>Incorporation State:</strong> {watchedValues.incorporationState}</div>
                    <div><strong>BVN:</strong> {watchedValues.bvn}</div>
                    <div className="col-span-2"><strong>Address:</strong> {watchedValues.registeredAddress}</div>
                    <div className="col-span-2"><strong>Business Nature:</strong> {watchedValues.businessNature}</div>
                    <div><strong>Incorporation Date:</strong> {watchedValues.incorporationDate ? new Date(watchedValues.incorporationDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                )}
              </div>

              {/* Directors */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Directors ({watchedValues.directors?.length || 0})</h3>
                {watchedValues.directors?.map((director, index) => (
                  <div key={index} className="border rounded p-3 mb-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Director {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><strong>Title:</strong> {director.title}</div>
                      <div><strong>Gender:</strong> {director.gender}</div>
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
                      <div><strong>Issuing Body:</strong> {director.issuingBody}</div>
                      <div><strong>Income Source:</strong> {director.incomeSource}</div>
                      <div className="col-span-2"><strong>Address:</strong> {director.residentialAddress}</div>
                      {director.incomeSource === 'other' && director.incomeSourceOther && (
                        <div className="col-span-2"><strong>Other Income Source:</strong> {director.incomeSourceOther}</div>
                      )}
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
                      <div><strong>Account Number:</strong> {watchedValues.localAccountNumber}</div>
                      <div><strong>Bank Name:</strong> {watchedValues.localBankName}</div>
                      <div><strong>Bank Branch:</strong> {watchedValues.localBankBranch}</div>
                      <div><strong>Opening Date:</strong> {watchedValues.localAccountOpeningDate ? new Date(watchedValues.localAccountOpeningDate).toLocaleDateString() : 'Not set'}</div>
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
                    handleSubmit(formData as PartnersCDDData);
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
              <p>Your Partners CDD form has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly.
              </p>
              <Button onClick={() => setShowSuccess()}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartnersCDD;