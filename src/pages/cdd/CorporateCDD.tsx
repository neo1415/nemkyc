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
import { CalendarIcon, Plus, Trash2, Upload, Edit2, Building2, FileText, CheckCircle2, Loader2, CreditCard, User, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import FormSection from '@/components/common/FormSection';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from '@/services/emailService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Corporate CDD Schema
const corporateCDDSchema = yup.object().shape({
  // Company Info
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
  taxId: yup.string().min(6).max(15),
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

const CorporateCDD: React.FC = () => {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

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
    resolver: yupResolver(corporateCDDSchema),
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

  const { saveDraft, clearDraft } = useFormDraft('corporateCDD', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
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
        formType: 'corporate-cdd'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'cdd-forms'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(
        data.email,
        'Corporate CDD'
      );

      clearDraft();
      setShowSuccess(true);
      toast({ title: "Corporate CDD form submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DatePickerField = ({ name, label, required = false }: { name: string; label: string; required?: boolean }) => {
    const value = formMethods.watch(name);
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label} {required && '*'}
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
              />
            </PopoverContent>
          </Popover>
          {formMethods.formState.errors[name] && <p className="text-sm text-red-600">{String(formMethods.formState.errors[name]?.message || '')}</p>}
        </div>
      </TooltipProvider>
    );
  };

  const CompanyInfoStep = () => (
    <FormSection title="Company Information" icon={<Building2 className="h-5 w-5" />}>
      <TooltipProvider>
        <div className="space-y-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Label htmlFor="companyName" className="flex items-center gap-1">
                  Company Name *
                  <Info className="h-3 w-3" />
                </Label>
                <Input id="companyName" {...formMethods.register('companyName')} />
                {formMethods.formState.errors.companyName && <p className="text-sm text-red-600">{String(formMethods.formState.errors.companyName.message || '')}</p>}
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Enter the full registered company name</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Label htmlFor="registeredAddress" className="flex items-center gap-1">
                  Registered Company Address *
                  <Info className="h-3 w-3" />
                </Label>
                <Textarea id="registeredAddress" {...formMethods.register('registeredAddress')} />
                {formMethods.formState.errors.registeredAddress && <p className="text-sm text-red-600">{String(formMethods.formState.errors.registeredAddress.message || '')}</p>}
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Enter the official registered address</p></TooltipContent>
          </Tooltip>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="incorporationNumber" className="flex items-center gap-1">
                    Incorporation Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input id="incorporationNumber" {...formMethods.register('incorporationNumber')} />
                  {formMethods.formState.errors.incorporationNumber && <p className="text-sm text-red-600">{String(formMethods.formState.errors.incorporationNumber.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Official company incorporation number</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="incorporationState" className="flex items-center gap-1">
                    Incorporation State *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input id="incorporationState" {...formMethods.register('incorporationState')} />
                  {formMethods.formState.errors.incorporationState && <p className="text-sm text-red-600">{String(formMethods.formState.errors.incorporationState.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>State where the company was incorporated</p></TooltipContent>
            </Tooltip>
          </div>

          <DatePickerField name="dateOfIncorporation" label="Date of Incorporation/Registration" required />

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Label htmlFor="natureOfBusiness" className="flex items-center gap-1">
                  Nature of Business *
                  <Info className="h-3 w-3" />
                </Label>
                <Textarea id="natureOfBusiness" {...formMethods.register('natureOfBusiness')} />
                {formMethods.formState.errors.natureOfBusiness && <p className="text-sm text-red-600">{String(formMethods.formState.errors.natureOfBusiness.message || '')}</p>}
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Describe the main business activities</p></TooltipContent>
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
            {formMethods.formState.errors.companyType && <p className="text-sm text-red-600">{String(formMethods.formState.errors.companyType.message || '')}</p>}
          </div>

          {watchedValues.companyType === 'Other' && (
            <div>
              <Label htmlFor="companyTypeOther">Please specify *</Label>
              <Input id="companyTypeOther" {...formMethods.register('companyTypeOther')} />
              {formMethods.formState.errors.companyTypeOther && <p className="text-sm text-red-600">{String(formMethods.formState.errors.companyTypeOther.message || '')}</p>}
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
                  <Input id="email" type="email" {...formMethods.register('email')} />
                  {formMethods.formState.errors.email && <p className="text-sm text-red-600">{String(formMethods.formState.errors.email.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Official company email address</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-1">
                    Website *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input id="website" {...formMethods.register('website')} />
                  {formMethods.formState.errors.website && <p className="text-sm text-red-600">{String(formMethods.formState.errors.website.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Company website URL</p></TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="taxId" className="flex items-center gap-1">
                    Tax Identification Number
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input id="taxId" {...formMethods.register('taxId')} />
                  {formMethods.formState.errors.taxId && <p className="text-sm text-red-600">{String(formMethods.formState.errors.taxId.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Company tax identification number</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="telephone" className="flex items-center gap-1">
                    Telephone Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input id="telephone" {...formMethods.register('telephone')} />
                  {formMethods.formState.errors.telephone && <p className="text-sm text-red-600">{String(formMethods.formState.errors.telephone.message || '')}</p>}
                </div>
              </TooltipTrigger>
              <TooltipContent><p>Company contact telephone number</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </FormSection>
  );

  const DirectorsStep = () => (
    <FormSection title="Directors Information" icon={<User className="h-5 w-5" />}>
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
                  {formMethods.formState.errors.directors?.[index]?.firstName && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.firstName?.message || '')}</p>}
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input {...formMethods.register(`directors.${index}.middleName`)} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input {...formMethods.register(`directors.${index}.lastName`)} />
                  {formMethods.formState.errors.directors?.[index]?.lastName && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.lastName?.message || '')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField name={`directors.${index}.dateOfBirth`} label="Date of Birth" required />
                <div>
                  <Label>Place of Birth *</Label>
                  <Input {...formMethods.register(`directors.${index}.placeOfBirth`)} />
                  {formMethods.formState.errors.directors?.[index]?.placeOfBirth && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.placeOfBirth?.message || '')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nationality *</Label>
                  <Input {...formMethods.register(`directors.${index}.nationality`)} />
                  {formMethods.formState.errors.directors?.[index]?.nationality && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.nationality?.message || '')}</p>}
                </div>
                <div>
                  <Label>Country *</Label>
                  <Input {...formMethods.register(`directors.${index}.country`)} />
                  {formMethods.formState.errors.directors?.[index]?.country && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.country?.message || '')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Occupation *</Label>
                  <Input {...formMethods.register(`directors.${index}.occupation`)} />
                  {formMethods.formState.errors.directors?.[index]?.occupation && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.occupation?.message || '')}</p>}
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" {...formMethods.register(`directors.${index}.email`)} />
                  {formMethods.formState.errors.directors?.[index]?.email && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.email?.message || '')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number *</Label>
                  <Input {...formMethods.register(`directors.${index}.phoneNumber`)} />
                  {formMethods.formState.errors.directors?.[index]?.phoneNumber && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.phoneNumber?.message || '')}</p>}
                </div>
                <div>
                  <Label>BVN *</Label>
                  <Input {...formMethods.register(`directors.${index}.bvn`)} />
                  {formMethods.formState.errors.directors?.[index]?.bvn && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.bvn?.message || '')}</p>}
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
                {formMethods.formState.errors.directors?.[index]?.residentialAddress && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.residentialAddress?.message || '')}</p>}
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
                {formMethods.formState.errors.directors?.[index]?.idType && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.idType?.message || '')}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Identification Number *</Label>
                  <Input {...formMethods.register(`directors.${index}.identificationNumber`)} />
                  {formMethods.formState.errors.directors?.[index]?.identificationNumber && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.identificationNumber?.message || '')}</p>}
                </div>
                <div>
                  <Label>Issuing Body *</Label>
                  <Input {...formMethods.register(`directors.${index}.issuingBody`)} />
                  {formMethods.formState.errors.directors?.[index]?.issuingBody && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.issuingBody?.message || '')}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField name={`directors.${index}.issuedDate`} label="Issued Date" required />
                <DatePickerField name={`directors.${index}.expiryDate`} label="Expiry Date" />
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
                {formMethods.formState.errors.directors?.[index]?.sourceOfIncome && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.sourceOfIncome?.message || '')}</p>}
              </div>

              {watchedValues.directors?.[index]?.sourceOfIncome === 'Other' && (
                <div>
                  <Label>Please specify *</Label>
                  <Input {...formMethods.register(`directors.${index}.sourceOfIncomeOther`)} />
                  {formMethods.formState.errors.directors?.[index]?.sourceOfIncomeOther && <p className="text-sm text-red-600">{String((formMethods.formState.errors.directors[index] as any)?.sourceOfIncomeOther?.message || '')}</p>}
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
          <Plus className="h-4 w-4 mr-2" />
          Add Director
        </Button>
      </div>
    </FormSection>
  );

  const AccountDetailsStep = () => (
    <FormSection title="Account Details" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Local Account Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input {...formMethods.register('bankName')} />
              {formMethods.formState.errors.bankName && <p className="text-sm text-red-600">{String(formMethods.formState.errors.bankName.message || '')}</p>}
            </div>
            
            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input {...formMethods.register('accountNumber')} />
              {formMethods.formState.errors.accountNumber && <p className="text-sm text-red-600">{String(formMethods.formState.errors.accountNumber.message || '')}</p>}
            </div>
            
            <div>
              <Label htmlFor="bankBranch">Bank Branch *</Label>
              <Input {...formMethods.register('bankBranch')} />
              {formMethods.formState.errors.bankBranch && <p className="text-sm text-red-600">{String(formMethods.formState.errors.bankBranch.message || '')}</p>}
            </div>
            
            <DatePickerField name="accountOpeningDate" label="Account Opening Date" required />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Foreign Account Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foreignBankName">Bank Name</Label>
              <Input {...formMethods.register('foreignBankName')} />
            </div>
            
            <div>
              <Label htmlFor="foreignAccountNumber">Account Number</Label>
              <Input {...formMethods.register('foreignAccountNumber')} />
            </div>
            
            <div>
              <Label htmlFor="foreignBankBranch">Bank Branch</Label>
              <Input {...formMethods.register('foreignBankBranch')} />
            </div>
            
            <DatePickerField name="foreignAccountOpeningDate" label="Account Opening Date" />
          </div>
        </div>
      </div>
    </FormSection>
  );

  const DocumentsStep = () => (
    <FormSection title="Document Upload" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Upload Your CAC Certificate"
          required
          onFileSelect={(file) => {
            formMethods.setValue('cacCertificate', file);
            setUploadedFiles(prev => ({ ...prev, cacCertificate: file }));
          }}
          currentFile={watchedValues.cacCertificate as File}
          error={String(formMethods.formState.errors.cacCertificate?.message || '')}
        />
        
        <FileUpload
          label="Upload Means of Identification"
          required
          onFileSelect={(file) => {
            formMethods.setValue('meansOfIdentification', file);
            setUploadedFiles(prev => ({ ...prev, meansOfIdentification: file }));
          }}
          currentFile={watchedValues.meansOfIdentification as File}
          error={String(formMethods.formState.errors.meansOfIdentification?.message || '')}
        />
      </div>
    </FormSection>
  );

  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<FileText className="h-5 w-5" />}>
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
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="agreeToDataPrivacy"
            checked={watchedValues.agreeToDataPrivacy}
            onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked as boolean)}
          />
          <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy policy and declaration *</Label>
        </div>
        {formMethods.formState.errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{String(formMethods.formState.errors.agreeToDataPrivacy.message || '')}</p>}
        
        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Input {...formMethods.register('signature')} placeholder="Type your full name as signature" />
          {formMethods.formState.errors.signature && <p className="text-sm text-red-600">{String(formMethods.formState.errors.signature.message || '')}</p>}
        </div>
        
        <div>
          <Label>Date</Label>
          <Input type="date" value={new Date().toISOString().split('T')[0]} readOnly />
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'company-info',
      title: 'Company Information',
      component: <CompanyInfoStep />,
      isValid: !formMethods.formState.errors.companyName && !formMethods.formState.errors.incorporationNumber && !formMethods.formState.errors.registeredAddress
    },
    {
      id: 'directors',
      title: 'Directors Information',
      component: <DirectorsStep />,
      isValid: !formMethods.formState.errors.directors
    },
    {
      id: 'account-details',
      title: 'Account Details',
      component: <AccountDetailsStep />,
      isValid: !formMethods.formState.errors.bankName && !formMethods.formState.errors.accountNumber
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: true
    },
    {
      id: 'privacy',
      title: 'Data Privacy & Declaration',
      component: <DataPrivacyStep />,
      isValid: watchedValues.agreeToDataPrivacy && watchedValues.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Corporate CDD Form
          </h1>
          <p className="text-gray-600 mt-2">
            Customer Due Diligence form for corporate entities and their directors.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Form"
          formMethods={formMethods}
        />

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">CDD Form Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600 mb-4">Your Corporate CDD form has been submitted successfully.</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Reference Number:</strong> CDD-{new Date().getTime()}
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  For status updates and enquiries, contact:
                  <br />
                  Email: compliance@neminsurance.ng
                  <br />
                  Phone: +234-1-234-5678
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CorporateCDD;