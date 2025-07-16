import React, { useState } from 'react';
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
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from '@/services/emailService';

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
  const [currentStep, setCurrentStep] = useState(0);
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
  React.useEffect(() => {
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
              <Label htmlFor="taxId">Tax Identification Number</Label>
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
      title: 'Directors Information',
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>ID Type *</Label>
                    <Select
                      value={watchedValues.directors?.[index]?.idType || ''}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.idType`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="International Passport">International Passport</SelectItem>
                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                        <SelectItem value="Voter's Card">Voter's Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

                <div>
                  <Label>Source of Income *</Label>
                  <Select
                    value={watchedValues.directors?.[index]?.sourceOfIncome || ''}
                    onValueChange={(value) => formMethods.setValue(`directors.${index}.sourceOfIncome`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Source of Income" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Inheritance">Inheritance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {watchedValues.directors?.[index]?.sourceOfIncome === 'Other' && (
                  <div>
                    <Label>Please specify *</Label>
                    <Input {...formMethods.register(`directors.${index}.sourceOfIncomeOther`)} />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'banking',
      title: 'Banking Information',
      component: (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Account Details</h3>
          
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <h3 className="text-lg font-medium mt-8">Foreign Account Details (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foreignBankName">Foreign Bank Name</Label>
              <Input
                id="foreignBankName"
                {...formMethods.register('foreignBankName')}
              />
            </div>
            <div>
              <Label htmlFor="foreignAccountNumber">Foreign Account Number</Label>
              <Input
                id="foreignAccountNumber"
                {...formMethods.register('foreignAccountNumber')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foreignBankBranch">Foreign Bank Branch</Label>
              <Input
                id="foreignBankBranch"
                {...formMethods.register('foreignBankBranch')}
              />
            </div>
            <div>
              <DatePickerField
                name="foreignAccountOpeningDate"
                label="Foreign Account Opening Date"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Files',
      component: (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Declaration</h3>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
            />
            <Label htmlFor="agreeToDataPrivacy" className="text-sm leading-5">
              I agree to the data privacy policy and confirm that all information provided is accurate and complete. *
            </Label>
          </div>

          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as digital signature"
              {...formMethods.register('signature')}
            />
            <p className="text-sm text-gray-500 mt-1">
              By typing your name above, you are providing your digital signature
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Upload Required Documents</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileUpload
                label="Certificate of Incorporation"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, certificateOfIncorporation: file }))}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <FileUpload
                label="Memorandum & Articles of Association"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, memorandumArticles: file }))}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <FileUpload
                label="Form CAC 7 (Particulars of Directors)"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, formCAC7: file }))}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <FileUpload
                label="Tax Clearance Certificate"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, taxClearance: file }))}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <FileUpload
                label="Audited Financial Statements"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, auditedFinancials: file }))}
                accept=".pdf"
              />
              
              <FileUpload
                label="Board Resolution"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, boardResolution: file }))}
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Corporate Customer Due Diligence (CDD)</h1>
          <p className="text-gray-600 mt-2">Complete all required information for corporate client onboarding</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                return (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">{step.title}</span>
                    {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 ml-4" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
            </div>
            <div className="p-6">
              {steps[currentStep].component}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
              size="lg"
              className="px-8"
            >
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                size="lg"
                className="px-8"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={formMethods.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                size="lg"
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Form'
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Corporate CDD Form Submitted Successfully!</DialogTitle>
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