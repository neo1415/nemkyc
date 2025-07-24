import React, { useState, useEffect } from 'react';
import { FormField, PhoneField, NumericField, FormTextarea, FormSelect, DateField } from '@/components/form/FormFieldControllers';
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
import { format, subYears } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Form validation schema
const corporateKYCSchema = yup.object().shape({
  // Company Info
  branchOffice: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Branch Office is required"),
  insured: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Insured field is required"),
  officeAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Office address is required"),
  ownershipOfCompany: yup.string().required("Ownership of company is required"),
  contactPerson: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Contact person is required"),
  website: yup.string().url("Please enter a valid URL").min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Website is required"),
  incorporationNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Incorporation number is required"),
  incorporationState: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Incorporation state is required"),
  dateOfIncorporationRegistration: yup.date().max(new Date(), "Date must be in the past").required("Date of incorporation is required"),
  BVN: yup.string().matches(/^\d{11}$/, "BVN must be exactly 11 digits").required("BVN is required"),
  contactPersonNo: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Contact person mobile is required"),
  taxIdNo: yup.string().nullable().transform((value) => value || null),
  email: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email is required"),
  natureOfBusiness: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Business type is required"),
  estimatedTurnover: yup.string().required("Estimated turnover is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other payment source"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Directors
  directors: yup.array().of(yup.object().shape({
    firstName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("First name is required"),
    middleName: yup.string().nullable().transform((value) => value || null),
    lastName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Last name is required"),
    dob: yup.date().max(subYears(new Date(), 18), "Must be at least 18 years old").required("Date of birth is required"),
    placeOfBirth: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Place of birth is required"),
    nationality: yup.string().required("Nationality is required"),
    country: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Country is required"),
    occupation: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Occupation is required"),
    email: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email is required"),
    phoneNumber: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Phone number is required"),
    BVN: yup.string().matches(/^\d{11}$/, "BVN must be exactly 11 digits").required("BVN is required"),
    employersName: yup.string().nullable().transform((value) => value || null),
    employersPhoneNumber: yup.string().nullable().transform((value) => value || null).when('employersName', {
      is: (value: string | null) => value && value.length > 0,
      then: (schema) => schema.matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters"),
      otherwise: (schema) => schema.nullable()
    }),
    residentialAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Residential address is required"),
    taxIdNumber: yup.string().nullable().transform((value) => value || null),
    idType: yup.string().required("ID type is required"),
    idNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Identification number is required"),
    issuingBody: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Issuing body is required"),
    issuedDate: yup.date().max(new Date(), "Date must be in the past").required("Issued date is required"),
    expiryDate: yup.date().nullable().transform((value) => value || null).when('idType', {
      is: (value: string) => value && value !== 'NIN',
      then: (schema) => schema.min(new Date(), "Expiry date must be in the future"),
      otherwise: (schema) => schema.nullable()
    }),
    sourceOfIncome: yup.string().required("Income source is required"),
    sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
      is: 'Other',
      then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other income source"),
      otherwise: (schema) => schema.notRequired()
    })
  })).min(1, "At least one director is required"),

  // Verification
  companyNameVerificationDoc: yup.string().required("Verification document type is required"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().min(2, "Minimum 2 characters").required("Signature is required")
});

const defaultValues = {
  branchOffice: '',
  insured: '',
  officeAddress: '',
  ownershipOfCompany: '',
  contactPerson: '',
  website: '',
  incorporationNumber: '',
  incorporationState: '',
  dateOfIncorporationRegistration: '',
  BVN: '',
  contactPersonNo: '',
  taxIdNo: '',
  email: '',
  natureOfBusiness: '',
  estimatedTurnover: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
  directors: [{
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    placeOfBirth: '',
    nationality: '',
    country: '',
    occupation: '',
    email: '',
    phoneNumber: '',
    BVN: '',
    employersName: '',
    employersPhoneNumber: '',
    residentialAddress: '',
    taxIdNumber: '',
    idType: '',
    idNumber: '',
    issuingBody: '',
    issuedDate: '',
    expiryDate: '',
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  }],
  companyNameVerificationDoc: '',
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

  // Step validation function
  const validateCurrentStep = async (stepId: string): Promise<boolean> => {
    const stepFields = getStepFields(stepId);
    const result = await formMethods.trigger(stepFields);
    return result;
  };

  // Get fields for each step
  const getStepFields = (stepId: string): string[] => {
    switch (stepId) {
      case 'company':
        return ['branchOffice', 'insured', 'officeAddress', 'ownershipOfCompany', 'contactPerson', 'website', 
                'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration', 'BVN', 
                'contactPersonNo', 'email', 'natureOfBusiness', 'estimatedTurnover', 
                'premiumPaymentSource', 'premiumPaymentSourceOther'];
      case 'directors':
        return ['directors'];
      case 'verification':
        return ['companyNameVerificationDoc'];
      case 'declaration':
        return ['agreeToDataPrivacy', 'signature'];
      default:
        return [];
    }
  };

  // Enhanced form methods with validation
  const enhancedFormMethods = {
    ...formMethods,
    validateCurrentStep
  };

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

  const DatePickerField = ({ name, label, required = false }: { name: string; label: string; required?: boolean }) => {
    const error = formMethods.formState.errors[name];
    const value = formMethods.watch(name);
    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                error && "border-red-500"
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
        {error && (
          <p className="text-sm text-red-500">{error.message as string}</p>
        )}
      </div>
    );
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      isValid: true, // Will be dynamically calculated
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="branchOffice" 
              label="NEM Branch Office" 
              required 
              placeholder="Enter branch office"
            />
            <FormField 
              name="insured" 
              label="Insured" 
              required 
              placeholder="Enter insured name"
            />
          </div>

          <FormTextarea
            name="officeAddress"
            label="Office Address"
            required
            placeholder="Enter office address"
          />

          <FormSelect
            name="ownershipOfCompany"
            label="Ownership of Company"
            required
            placeholder="Select Ownership Of Company"
            options={[
              { value: "Nigerian", label: "Nigerian" },
              { value: "Foreign", label: "Foreign" },
              { value: "Both", label: "Both" }
            ]}
          />

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
            name="dateOfIncorporationRegistration"
            label="Date of Incorporation/Registration *"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="BVN">
                BVN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="BVN"
                maxLength={11}
                {...formMethods.register('BVN')}
                className={formMethods.formState.errors.BVN ? "border-red-500" : ""}
              />
              {formMethods.formState.errors.BVN && (
                <p className="text-sm text-red-500 mt-1">
                  {formMethods.formState.errors.BVN.message as string}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPersonNo">Contact Person Mobile Number *</Label>
              <Input
                id="contactPersonNo"
                {...formMethods.register('contactPersonNo')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxIdNo">Tax Identification Number</Label>
              <Input
                id="taxIdNo"
                {...formMethods.register('taxIdNo')}
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
            <Label htmlFor="natureOfBusiness">Business Type/Occupation *</Label>
            <Input
              id="natureOfBusiness"
              {...formMethods.register('natureOfBusiness')}
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
                  name={`directors.${index}.dob`}
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
                  <Label htmlFor={`directors.${index}.BVNNumber`}>BVN *</Label>
                  <Input
                    id={`directors.${index}.BVnNumber`}
                    maxLength={11}
                    {...formMethods.register(`directors.${index}.BVNNumber`)}
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
                  <Label htmlFor={`directors.${index}.employersPhoneNumber`}>Employer Phone</Label>
                  <Input
                    id={`directors.${index}.employersPhoneNumber`}
                    {...formMethods.register(`directors.${index}.employersPhoneNumber`)}
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
                  <Label htmlFor={`directors.${index}.idNumber`}>Identification Number *</Label>
                  <Input
                    id={`directors.${index}.idNumber`}
                    {...formMethods.register(`directors.${index}.idNumber`)}
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
                  value={formMethods.watch(`directors.${index}.sourceOfIncome`)}
                  onValueChange={(value) => formMethods.setValue(`directors.${index}.sourceOfIncome`, value)}
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

              {formMethods.watch(`directors.${index}.sourceOfIncome`) === 'Other' && (
                <div className="mt-4">
                  <Label htmlFor={`directors.${index}.sourceOfIncomeOther`}>Please specify *</Label>
                  <Input
                    id={`directors.${index}.sourecOfIncomeOther`}
                    {...formMethods.register(`directors.${index}.sourceOfIncomeOther`)}
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
              dob: '',
              placeOfBirth: '',
              nationality: '',
              country: '',
              occupation: '',
              email: '',
              phoneNumber: '',
              BVNNumber: '',
              employersName: '',
              employersPhoneNumber: '',
              residentialAddress: '',
              taxIdNumber: '',
              idType: '',
              idNumber: '',
              issuingBody: '',
              issuedDate: '',
              expiryDate: '',
              sourcOfIncome: '',
              sourcOfIncomeOther: ''
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
              value={formMethods.watch('companyNameVerificationDoc')}
              onValueChange={(value) => formMethods.setValue('companyNameVerificationDoc', value)}
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
            {uploadedFiles.verificationDoc && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.verificationDoc.name}
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
            formMethods={enhancedFormMethods}
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
