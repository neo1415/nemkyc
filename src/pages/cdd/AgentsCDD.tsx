import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '@/services/emailService';

const agentsCDDSchema = yup.object().shape({
  // Personal Info
  firstName: yup.string().required("First name is required"),
  middleName: yup.string(),
  lastName: yup.string().required("Last name is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  gender: yup.string().required("Gender is required"),
  position: yup.string().required("Position/Role is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  placeOfBirth: yup.string().required("Place of birth is required"),
  otherSourceOfIncome: yup.string().required("Other source of income is required"),
  otherSourceOfIncomeOther: yup.string(),
  nationality: yup.string().required("Nationality is required"),
  phoneNumber: yup.string().required("Phone number is required"),
  bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  taxIdNumber: yup.string(),
  occupation: yup.string().required("Occupation is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),
  validMeansOfId: yup.string().required("Valid means of ID is required"),
  identificationNumber: yup.string().required("Identification number is required"),
  issuedDate: yup.date().required("Issued date is required"),
  expiryDate: yup.date(),
  issuingBody: yup.string().required("Issuing body is required"),
  
  // Additional Info
  agentName: yup.string().required("Agent name is required"),
  agentsOfficeAddress: yup.string().required("Agents office address is required"),
  naicomLicenseNumber: yup.string().required("NAICOM license number is required"),
  licenseIssuedDate: yup.date().required("License issued date is required"),
  licenseExpiryDate: yup.date().required("License expiry date is required"),
  emailAddress: yup.string().email("Valid email is required").required("Email address is required"),
  website: yup.string().required("Website is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  taxIdentificationNumber: yup.string(),
  arianMembershipNumber: yup.string().required("ARIAN membership number is required"),
  listOfAgentsApprovedPrincipals: yup.string().required("List of agents approved principals is required"),
  
  // Financial Info
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
  signature: yup.string().required("Digital signature is required")
});

const defaultValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  residentialAddress: '',
  gender: '',
  position: '',
  dateOfBirth: '',
  placeOfBirth: '',
  otherSourceOfIncome: '',
  otherSourceOfIncomeOther: '',
  nationality: '',
  phoneNumber: '',
  bvn: '',
  taxIdNumber: '',
  occupation: '',
  email: '',
  validMeansOfId: '',
  identificationNumber: '',
  issuedDate: '',
  expiryDate: '',
  issuingBody: '',
  agentName: '',
  agentsOfficeAddress: '',
  naicomLicenseNumber: '',
  licenseIssuedDate: '',
  licenseExpiryDate: '',
  emailAddress: '',
  website: '',
  mobileNumber: '',
  taxIdentificationNumber: '',
  arianMembershipNumber: '',
  listOfAgentsApprovedPrincipals: '',
  localAccountNumber: '',
  localBankName: '',
  localBankBranch: '',
  localAccountOpeningDate: '',
  foreignAccountNumber: '',
  foreignBankName: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const AgentsCDD: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<any>({
    resolver: yupResolver(agentsCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('agents-cdd', formMethods);
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
      const submissionData = {
        ...data,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'agents-cdd'
      };
      
      await addDoc(collection(db, 'cdd-forms'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      try {
        await sendEmail({
          to: data.email,
          subject: 'Agents CDD Form Submission Confirmation',
          html: `
            <h2>Agents CDD Form Submitted Successfully</h2>
            <p>Dear ${data.firstName} ${data.lastName},</p>
            <p>Your Agents CDD form has been successfully submitted and is being processed.</p>
            <p>You will be contacted if any additional information is required.</p>
            <p>Thank you for your submission.</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
      
      clearDraft();
      setShowSuccess(true);
      toast({ title: "Agents CDD form submitted successfully!" });
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
      id: 'personal',
      title: 'Personal Info',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...formMethods.register('firstName')} />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input id="middleName" {...formMethods.register('middleName')} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...formMethods.register('lastName')} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="residentialAddress">Residential Address *</Label>
            <Textarea id="residentialAddress" {...formMethods.register('residentialAddress')} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Gender *</Label>
              <Select
                value={watchedValues.gender || ''}
                onValueChange={(value) => formMethods.setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="position">Position/Role *</Label>
              <Input id="position" {...formMethods.register('position')} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField name="dateOfBirth" label="Date of Birth *" />
            </div>
            <div>
              <Label htmlFor="placeOfBirth">Place of Birth *</Label>
              <Input id="placeOfBirth" {...formMethods.register('placeOfBirth')} />
            </div>
          </div>
          
          <div>
            <Label>Other Source of Income *</Label>
            <Select
              value={watchedValues.otherSourceOfIncome || ''}
              onValueChange={(value) => formMethods.setValue('otherSourceOfIncome', value)}
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
          
          {watchedValues.otherSourceOfIncome === 'other' && (
            <div>
              <Label htmlFor="otherSourceOfIncomeOther">Please specify income source *</Label>
              <Input id="otherSourceOfIncomeOther" {...formMethods.register('otherSourceOfIncomeOther')} />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nationality">Nationality *</Label>
              <Input id="nationality" {...formMethods.register('nationality')} />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input id="phoneNumber" {...formMethods.register('phoneNumber')} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bvn">BVN *</Label>
              <Input id="bvn" maxLength={11} {...formMethods.register('bvn')} />
            </div>
            <div>
              <Label htmlFor="taxIdNumber">Tax ID Number</Label>
              <Input id="taxIdNumber" {...formMethods.register('taxIdNumber')} />
            </div>
            <div>
              <Label htmlFor="occupation">Occupation *</Label>
              <Input id="occupation" {...formMethods.register('occupation')} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...formMethods.register('email')} />
          </div>
          
          <div>
            <Label>Valid Means of ID *</Label>
            <Select
              value={watchedValues.validMeansOfId || ''}
              onValueChange={(value) => formMethods.setValue('validMeansOfId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Identification Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">International Passport</SelectItem>
                <SelectItem value="nimc">NIMC</SelectItem>
                <SelectItem value="driversLicense">Drivers Licence</SelectItem>
                <SelectItem value="votersCard">Voters Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="identificationNumber">Identification Number *</Label>
              <Input id="identificationNumber" {...formMethods.register('identificationNumber')} />
            </div>
            <div>
              <DatePickerField name="issuedDate" label="Issued Date *" />
            </div>
            <div>
              <DatePickerField name="expiryDate" label="Expiry Date" />
            </div>
            <div>
              <Label htmlFor="issuingBody">Issuing Body *</Label>
              <Input id="issuingBody" {...formMethods.register('issuingBody')} />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'additional',
      title: 'Additional Info',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agentName">Agent Name *</Label>
              <Input id="agentName" {...formMethods.register('agentName')} />
            </div>
            <div>
              <Label htmlFor="naicomLicenseNumber">NAICOM License Number (RIA) *</Label>
              <Input id="naicomLicenseNumber" {...formMethods.register('naicomLicenseNumber')} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="agentsOfficeAddress">Agents Office Address *</Label>
            <Textarea id="agentsOfficeAddress" {...formMethods.register('agentsOfficeAddress')} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField name="licenseIssuedDate" label="License Issued Date *" />
            </div>
            <div>
              <DatePickerField name="licenseExpiryDate" label="License Expiry Date *" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emailAddress">Email Address *</Label>
              <Input id="emailAddress" type="email" {...formMethods.register('emailAddress')} />
            </div>
            <div>
              <Label htmlFor="website">Website *</Label>
              <Input id="website" {...formMethods.register('website')} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input id="mobileNumber" {...formMethods.register('mobileNumber')} />
            </div>
            <div>
              <Label htmlFor="taxIdentificationNumber">Tax Identification Number</Label>
              <Input id="taxIdentificationNumber" {...formMethods.register('taxIdentificationNumber')} />
            </div>
            <div>
              <Label htmlFor="arianMembershipNumber">ARIAN Membership Number *</Label>
              <Input id="arianMembershipNumber" {...formMethods.register('arianMembershipNumber')} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="listOfAgentsApprovedPrincipals">List of Agents Approved Principals (Insurers) *</Label>
            <Textarea id="listOfAgentsApprovedPrincipals" {...formMethods.register('listOfAgentsApprovedPrincipals')} />
          </div>
        </div>
      )
    },
    {
      id: 'financial',
      title: 'Financial Info',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="localAccountNumber">Account Number *</Label>
                <Input id="localAccountNumber" {...formMethods.register('localAccountNumber')} />
              </div>
              <div>
                <Label htmlFor="localBankName">Bank Name *</Label>
                <Input id="localBankName" {...formMethods.register('localBankName')} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="localBankBranch">Bank Branch *</Label>
                <Input id="localBankBranch" {...formMethods.register('localBankBranch')} />
              </div>
              <div>
                <DatePickerField name="localAccountOpeningDate" label="Account Opening Date *" />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foreignAccountNumber">Account Number</Label>
                <Input id="foreignAccountNumber" {...formMethods.register('foreignAccountNumber')} />
              </div>
              <div>
                <Label htmlFor="foreignBankName">Bank Name</Label>
                <Input id="foreignBankName" {...formMethods.register('foreignBankName')} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="foreignBankBranch">Bank Branch</Label>
                <Input id="foreignBankBranch" {...formMethods.register('foreignBankBranch')} />
              </div>
              <div>
                <DatePickerField name="foreignAccountOpeningDate" label="Account Opening Date" />
              </div>
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
            <Textarea
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for Agents</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Form"
          formMethods={formMethods}
        />

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CDD Form Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl">✓</div>
              <p>Your Agents CDD form has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly. For inquiries about your submission status, please contact our customer service team.
              </p>
              <Button onClick={() => setShowSuccess(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgentsCDD;