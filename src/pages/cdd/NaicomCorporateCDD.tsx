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
import { CalendarIcon, Plus, Trash2, Upload, Edit2, Building2, FileText, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from '@/services/emailService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

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
  taxId: yup.string().min(6).max(15).required("Tax identification number is required"),
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
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  declarationAdditionalInfo: yup.boolean().oneOf([true], "You must agree to provide additional information"),
  declarationDocuments: yup.boolean().oneOf([true], "You must agree to submit documents"),
  signature: yup.string().required("Signature is required")
});

interface Director {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  country: string;
  occupation: string;
  email: string;
  phoneNumber: string;
  bvn: string;
  employerName?: string;
  employerPhone?: string;
  residentialAddress: string;
  taxIdNumber?: string;
  idType: string;
  identificationNumber: string;
  issuingBody: string;
  issuedDate: Date;
  expiryDate?: Date;
  sourceOfIncome: string;
  sourceOfIncomeOther?: string;
}

interface NaicomCorporateCDDData {
  // Company Details
  companyName: string;
  registeredAddress: string;
  incorporationNumber: string;
  incorporationState: string;
  dateOfIncorporation: Date;
  natureOfBusiness: string;
  companyType: string;
  companyTypeOther?: string;
  email: string;
  website: string;
  taxId: string;
  telephone: string;

  // Directors
  directors: Director[];

  // Account Details
  bankName: string;
  accountNumber: string;
  bankBranch: string;
  accountOpeningDate: Date;

  // Foreign Account
  foreignBankName?: string;
  foreignAccountNumber?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: Date;

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
  signature: string;
}

const defaultDirector: Director = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: new Date(),
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
  issuedDate: new Date(),
  expiryDate: new Date(),
  sourceOfIncome: '',
  sourceOfIncomeOther: ''
};

const defaultValues: Partial<NaicomCorporateCDDData> = {
  companyName: '',
  registeredAddress: '',
  incorporationNumber: '',
  incorporationState: '',
  natureOfBusiness: '',
  companyType: '',
  email: '',
  website: '',
  taxId: '',
  telephone: '',
  directors: [defaultDirector],
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  foreignBankName: '',
  foreignAccountNumber: '',
  foreignBankBranch: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const NaicomCorporateCDD: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(naicomCorporateCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomCorporateCDD', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: NaicomCorporateCDDData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = formMethods.getValues();
      
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'cdd-forms').then(url => [key + 'Url', url])
        );
      });
      
      const uploadedUrls = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(uploadedUrls);
      
      // Prepare form data with file URLs
      const submissionData = {
        ...data,
        ...fileUrls,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        formType: 'naicom-corporate-cdd'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'cdd-forms'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      // await emailService.sendSubmissionConfirmation(data.email, 'NAICOM Corporate CDD Form');
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "NAICOM Corporate CDD form submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label}
                <Info className="h-3 w-3" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select the {label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
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
      </TooltipProvider>
    );
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="companyName" className="flex items-center gap-1">
                    Company Name *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="companyName"
                    {...formMethods.register('companyName')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the full registered company name</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="registeredAddress" className="flex items-center gap-1">
                    Registered Company Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="registeredAddress"
                    {...formMethods.register('registeredAddress')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the official registered address</p>
              </TooltipContent>
            </Tooltip>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="incorporationNumber" className="flex items-center gap-1">
                      Incorporation Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="incorporationNumber"
                      {...formMethods.register('incorporationNumber')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the RC number or incorporation number</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="incorporationState" className="flex items-center gap-1">
                      Incorporation State *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="incorporationState"
                      {...formMethods.register('incorporationState')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>State where the company was incorporated</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <DatePickerField
              name="dateOfIncorporation"
              label="Date of Incorporation/Registration *"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="natureOfBusiness" className="flex items-center gap-1">
                    Nature of Business *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="natureOfBusiness"
                    {...formMethods.register('natureOfBusiness')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the main business activities</p>
              </TooltipContent>
            </Tooltip>

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
                <Label htmlFor="companyTypeOther">Specify Other Company Type *</Label>
                <Input
                  id="companyTypeOther"
                  {...formMethods.register('companyTypeOther')}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...formMethods.register('email')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Official company email address</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="website" className="flex items-center gap-1">
                      Website *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="website"
                      {...formMethods.register('website')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Company website URL</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="taxId" className="flex items-center gap-1">
                      Tax Identification Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="taxId"
                      {...formMethods.register('taxId')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Company tax identification number (required for NAICOM entities)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="telephone" className="flex items-center gap-1">
                      Telephone Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="telephone"
                      {...formMethods.register('telephone')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Company contact telephone number</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'directors',
      title: 'Director Info',
      component: (
        <TooltipProvider>
          <div className="space-y-6">
            {directorFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Director {index + 1}</h3>
                  {directorFields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDirector(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
                    <DatePickerField
                      name={`directors.${index}.dateOfBirth`}
                      label="Date of Birth *"
                    />
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
                      value={watchedValues.directors?.[index]?.sourceOfIncome || ''}
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

                  {watchedValues.directors?.[index]?.sourceOfIncome === 'Other' && (
                    <div>
                      <Label>Specify Other Income Source *</Label>
                      <Input {...formMethods.register(`directors.${index}.sourceOfIncomeOther`)} />
                    </div>
                  )}
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => addDirector(defaultDirector)}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Director
            </Button>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'accounts',
      title: 'Account Details',
      component: (
        <TooltipProvider>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Local Account Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor="bankName" className="flex items-center gap-1">
                          Bank Name *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id="bankName"
                          {...formMethods.register('bankName')}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Name of the bank where account is held</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor="accountNumber" className="flex items-center gap-1">
                          Account Number *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id="accountNumber"
                          {...formMethods.register('accountNumber')}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Company bank account number</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankBranch">Bank Branch *</Label>
                    <Input
                      id="bankBranch"
                      {...formMethods.register('bankBranch')}
                    />
                  </div>

                  <DatePickerField
                    name="accountOpeningDate"
                    label="Account Opening Date *"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Foreign Account Details (Optional)</h3>
              <div className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foreignBankBranch">Bank Branch</Label>
                    <Input
                      id="foreignBankBranch"
                      {...formMethods.register('foreignBankBranch')}
                    />
                  </div>

                  <DatePickerField
                    name="foreignAccountOpeningDate"
                    label="Account Opening Date"
                  />
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'uploads',
      title: 'Uploads',
      component: (
        <div className="space-y-6">
          <FileUpload
            label="Upload Your CAC Certificate"
            required
            onFileSelect={(file) => {
              formMethods.setValue('cacCertificate', file);
              setUploadedFiles(prev => ({ ...prev, cacCertificate: file }));
            }}
            currentFile={watchedValues.cacCertificate as File}
            accept=".jpg,.png,.pdf"
            maxSize={3}
          />
          
          <FileUpload
            label="Upload Means of Identification"
            required
            onFileSelect={(file) => {
              formMethods.setValue('meansOfIdentification', file);
              setUploadedFiles(prev => ({ ...prev, meansOfIdentification: file }));
            }}
            currentFile={watchedValues.meansOfIdentification as File}
            accept=".jpg,.png,.pdf"
            maxSize={3}
          />
          
          <FileUpload
            label="Upload NAICOM License Certificate"
            required
            onFileSelect={(file) => {
              formMethods.setValue('naicomLicense', file);
              setUploadedFiles(prev => ({ ...prev, naicomLicense: file }));
            }}
            currentFile={watchedValues.naicomLicense as File}
            accept=".jpg,.png,.pdf"
            maxSize={3}
          />
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Data Privacy',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <div className="text-sm space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationAdditionalInfo"
                checked={watchedValues.declarationAdditionalInfo || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
              />
              <Label htmlFor="declarationAdditionalInfo">I agree to provide more info *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationDocuments"
                checked={watchedValues.declarationDocuments || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
              />
              <Label htmlFor="declarationDocuments">I agree on documents requested *</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as signature"
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toISOString().split('T')[0]} disabled />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            NAICOM Company CDD Form
          </h1>
          <p className="text-gray-600 mt-2">
            Customer Due Diligence form for NAICOM-regulated companies and their directors.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review CDD Form"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your NAICOM Corporate CDD Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Incorporation Number:</strong> {watchedValues.incorporationNumber}</div>
                <div><strong>Directors:</strong> {watchedValues.directors?.length || 0}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For enquiries about your NAICOM CDD submission, contact our compliance team.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit CDD Form'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                NAICOM CDD Form Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-600 mb-4">
                  Your NAICOM Corporate CDD form has been submitted successfully. 
                  You will receive a confirmation email shortly.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    For enquiries about your NAICOM CDD submission, contact our compliance team.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NaicomCorporateCDD;