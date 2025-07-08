import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CalendarIcon, Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { NaicomPartnersCDDData, Director } from '@/types';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';

const naicomPartnersCDDSchema = z.object({
  // Company Info
  companyName: z.string().min(1, "Company name is required"),
  registeredAddress: z.string().min(1, "Registered address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().min(1, "Website is required"),
  contactPersonName: z.string().min(1, "Contact person name is required"),
  contactPersonNumber: z.string().min(1, "Contact person number is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  vatRegistrationNumber: z.string().min(1, "VAT registration number is required"),
  incorporationNumber: z.string().min(1, "Incorporation number is required"),
  incorporationDate: z.coerce.date(),
  incorporationState: z.string().min(1, "Incorporation state is required"),
  businessNature: z.string().min(1, "Business nature is required"),
  bvn: z.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits"),
  naicomLicenseIssuingDate: z.coerce.date(),
  naicomLicenseExpiryDate: z.coerce.date(),
  
  // Directors
  directors: z.array(z.object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    dateOfBirth: z.coerce.date(),
    placeOfBirth: z.string().min(1, "Place of birth is required"),
    nationality: z.string().min(1, "Nationality is required"),
    country: z.string().min(1, "Country is required"),
    occupation: z.string().min(1, "Occupation is required"),
    email: z.string().email("Valid email is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    bvn: z.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits"),
    employerName: z.string().optional(),
    employerPhone: z.string().optional(),
    residentialAddress: z.string().min(1, "Residential address is required"),
    taxIdNumber: z.string().optional(),
    idType: z.string().min(1, "ID type is required"),
    identificationNumber: z.string().min(1, "Identification number is required"),
    issuingBody: z.string().min(1, "Issuing body is required"),
    issuedDate: z.coerce.date(),
    expiryDate: z.coerce.date().optional(),
    incomeSource: z.string().min(1, "Income source is required"),
    incomeSourceOther: z.string().optional()
  })).min(1, "At least one director is required"),
  
  // Account Details
  localAccountNumber: z.string().min(1, "Account number is required"),
  localBankName: z.string().min(1, "Bank name is required"),
  localBankBranch: z.string().min(1, "Bank branch is required"),
  localAccountOpeningDate: z.coerce.date(),
  foreignAccountNumber: z.string().optional(),
  foreignBankName: z.string().optional(),
  foreignBankBranch: z.string().optional(),
  foreignAccountOpeningDate: z.coerce.date().optional(),
  
  // Declaration
  agreeToDataPrivacy: z.boolean().refine(val => val === true, "You must agree to data privacy"),
  signature: z.string().min(1, "Signature is required")
});

const defaultValues: Partial<NaicomPartnersCDDData> = {
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
    firstName: '',
    middleName: '',
    lastName: '',
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

const NaicomPartnersCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm({
    resolver: zodResolver(naicomPartnersCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomPartners', formMethods);
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: NaicomPartnersCDDData) => {
    setIsSubmitting(true);
    try {
      // Submit logic would go here
      console.log('NAICOM Partners CDD submitted:', data);
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "CDD form submitted successfully!" });
    } catch (error) {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DatePickerField = ({ field, label }: { field: any; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

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
                field={formMethods.control._formValues.incorporationDate}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                field={formMethods.control._formValues.naicomLicenseIssuingDate}
                label="NAICOM License Issuing Date *"
              />
            </div>
            <div>
              <DatePickerField
                field={formMethods.control._formValues.naicomLicenseExpiryDate}
                label="NAICOM License Expiry Date *"
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
              onClick={() => append({
                firstName: '',
                middleName: '',
                lastName: '',
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
                      value={formMethods.watch(`directors.${index}.title`)}
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
                      value={formMethods.watch(`directors.${index}.gender`)}
                      onValueChange={(value) => formMethods.setValue(`directors.${index}.gender`, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
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
                
                <div>
                  <Label>Residential Address *</Label>
                  <Textarea
                    {...formMethods.register(`directors.${index}.residentialAddress`)}
                  />
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
                    <Label>Occupation *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.occupation`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>BVN *</Label>
                    <Input
                      maxLength={11}
                      {...formMethods.register(`directors.${index}.bvn`)}
                    />
                  </div>
                  <div>
                    <Label>Tax ID Number</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.taxIdNumber`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nationality *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.nationality`)}
                    />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      {...formMethods.register(`directors.${index}.phoneNumber`)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    {...formMethods.register(`directors.${index}.email`)}
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
                        <SelectValue placeholder="Choose Identification Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">International Passport</SelectItem>
                        <SelectItem value="nimc">NIMC</SelectItem>
                        <SelectItem value="drivers">Drivers Licence</SelectItem>
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
                  field={formMethods.control._formValues.localAccountOpeningDate}
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
                  // Handle file upload
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>Identification Means for Director 1 *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>Identification Means for Director 2 *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>CAC Status Report *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>VAT Registration License *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>Tax Clearance Certificate *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
                }}
              />
            </div>
            
            <div>
              <Label>NAICOM License Certificate (Optional)</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  console.log('File selected:', file);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NAICOM Partners CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for NAICOM Partners</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Form"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your NAICOM Partners CDD</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Company Information</h3>
                <p><strong>Company Name:</strong> {watchedValues.companyName}</p>
                <p><strong>Address:</strong> {watchedValues.registeredAddress}</p>
                <p><strong>Contact:</strong> {watchedValues.contactPersonName} - {watchedValues.contactPersonNumber}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Directors ({watchedValues.directors?.length || 0})</h3>
                {watchedValues.directors?.map((director, index) => (
                  <div key={index} className="p-3 border rounded mb-2">
                    <p><strong>Name:</strong> {director.firstName} {director.lastName}</p>
                    <p><strong>Email:</strong> {director.email}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                >
                  Edit Details
                </Button>
                <Button
                  onClick={() => {
                    const formData = formMethods.getValues();
                    handleSubmit(formData as NaicomPartnersCDDData);
                  }}
                  disabled={isSubmitting}
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
              <p>Your NAICOM Partners CDD form has been submitted successfully.</p>
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

export default NaicomPartnersCDD;