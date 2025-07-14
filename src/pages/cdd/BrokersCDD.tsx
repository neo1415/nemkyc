import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from '@/hooks/use-toast';
import { FormProvider } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FileUpload from '@/components/common/FileUpload';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FORM_COLLECTIONS } from '@/services/formsService';
import { useAuth } from '@/contexts/AuthContext';
import { notifySubmission } from '@/services/notificationService';

// Form validation schema
const brokersCDDSchema = yup.object().shape({
  // Company Info
  companyName: yup.string().required('Company name is required'),
  companyAddress: yup.string().required('Company address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  incorporationNumber: yup.string().required('Incorporation/RC number is required'),
  registrationNumber: yup.string().required('Registration number is required'),
  incorporationState: yup.string().required('Incorporation state is required'),
  companyType: yup.string().required('Company type is required'),
  companyTypeOther: yup.string().when('companyType', {
    is: 'Other',
    then: (schema) => schema.required('Please specify company type'),
    otherwise: (schema) => schema.notRequired()
  }),
  incorporationDate: yup.string().required('Date of incorporation is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  website: yup.string().required('Website is required'),
  businessType: yup.string().required('Business type is required'),
  taxNumber: yup.string().required('Tax number is required'),
  telephone: yup.string().required('Telephone number is required'),
  
  // Directors (at least one)
  directors: yup.array().of(
    yup.object().shape({
      title: yup.string().required('Title is required'),
      gender: yup.string().required('Gender is required'),
      firstName: yup.string().required('First name is required'),
      lastName: yup.string().required('Last name is required'),
      dateOfBirth: yup.string().required('Date of birth is required'),
      placeOfBirth: yup.string().required('Place of birth is required'),
      nationality: yup.string().required('Nationality is required'),
      residenceCountry: yup.string().required('Residence country is required'),
      occupation: yup.string().required('Occupation is required'),
      bvn: yup.string().matches(/^\d{11}$/, 'BVN must be 11 digits').required('BVN is required'),
      employerName: yup.string().required('Employer name is required'),
      phoneNumber: yup.string().required('Phone number is required'),
      address: yup.string().required('Address is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
      idType: yup.string().required('ID type is required'),
      identificationNumber: yup.string().required('Identification number is required'),
      issuedBy: yup.string().required('Issuing country is required'),
      issuedDate: yup.string().required('Issued date is required'),
      sourceOfIncome: yup.string().required('Source of income is required'),
      sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
        is: 'Other',
        then: (schema) => schema.required('Please specify income source'),
        otherwise: (schema) => schema.notRequired()
      })
    })
  ).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: yup.string().required('Local bank name is required'),
  bankBranch: yup.string().required('Bank branch is required'),
  currentAccountNumber: yup.string().required('Current account number is required'),
  accountOpeningDate: yup.string().required('Account opening date is required'),
  
  // File uploads
  certificateOfIncorporation: yup.mixed().required('Certificate of incorporation is required'),
  director1Id: yup.mixed().required('Director 1 identification is required'),
  director2Id: yup.mixed().required('Director 2 identification is required'),
  naicomLicense: yup.mixed().notRequired(),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: yup.string().required('Digital signature is required')
});

interface Director {
  title: string;
  gender: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  residenceCountry: string;
  occupation: string;
  bvn: string;
  employerName: string;
  phoneNumber: string;
  address: string;
  email: string;
  taxIdNumber: string;
  passportNumber: string;
  passportIssuedCountry: string;
  idType: string;
  identificationNumber: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate: string;
  sourceOfIncome: string;
  sourceOfIncomeOther: string;
}

const DatePickerField: React.FC<{
  name: string;
  label: string;
  required?: boolean;
  formMethods: any;
}> = ({ name, label, required, formMethods }) => {
  const fieldValue = formMethods.watch(name);
  
  return (
    <FormField
      control={formMethods.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label} {required && <span className="text-red-500">*</span>}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !fieldValue && "text-muted-foreground"
                  )}
                >
                  {fieldValue ? (
                    format(new Date(fieldValue), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={fieldValue ? new Date(fieldValue) : undefined}
                onSelect={(date) => {
                  formMethods.setValue(name, date ? format(date, 'yyyy-MM-dd') : '');
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const BrokersCDD: React.FC = () => {
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [directors, setDirectors] = useState<Director[]>([{
    title: '',
    gender: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    residenceCountry: '',
    occupation: '',
    bvn: '',
    employerName: '',
    phoneNumber: '',
    address: '',
    email: '',
    taxIdNumber: '',
    passportNumber: '',
    passportIssuedCountry: '',
    idType: '',
    identificationNumber: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  }]);

  const formMethods = useForm({
    defaultValues: {
      companyName: '',
      companyAddress: '',
      city: '',
      state: '',
      country: '',
      incorporationNumber: '',
      registrationNumber: '',
      incorporationState: '',
      companyType: '',
      companyTypeOther: '',
      incorporationDate: '',
      email: '',
      website: '',
      businessType: '',
      taxNumber: '',
      telephone: '',
      directors: directors,
      localBankName: '',
      bankBranch: '',
      currentAccountNumber: '',
      accountOpeningDate: '',
      domiciliaryAccountNumber: '',
      foreignBankName: '',
      foreignBankBranch: '',
      currency: '',
      foreignAccountOpeningDate: '',
      certificateOfIncorporation: null,
      director1Id: null,
      director2Id: null,
      naicomLicense: null,
      agreeToDataPrivacy: false,
      signature: '',
      signatureDate: new Date().toLocaleDateString('en-GB')
    },
    mode: 'onChange',
  });

  const { saveDraft, clearDraft } = useFormDraft('brokers-cdd', formMethods);

  // Auto-save on form changes
  const watchedValues = formMethods.watch();
  React.useEffect(() => {
    saveDraft(watchedValues);
  }, [watchedValues, saveDraft]);

  const addDirector = () => {
    const newDirector: Director = {
      title: '',
      gender: '',
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: '',
      residenceCountry: '',
      occupation: '',
      bvn: '',
      employerName: '',
      phoneNumber: '',
      address: '',
      email: '',
      taxIdNumber: '',
      passportNumber: '',
      passportIssuedCountry: '',
      idType: '',
      identificationNumber: '',
      issuedBy: '',
      issuedDate: '',
      expiryDate: '',
      sourceOfIncome: '',
      sourceOfIncomeOther: ''
    };
    const updatedDirectors = [...directors, newDirector];
    setDirectors(updatedDirectors);
    formMethods.setValue('directors', updatedDirectors);
  };

  const removeDirector = (index: number) => {
    if (directors.length > 1) {
      const updatedDirectors = directors.filter((_, i) => i !== index);
      setDirectors(updatedDirectors);
      formMethods.setValue('directors', updatedDirectors);
    }
  };

  const updateDirector = (index: number, field: keyof Director, value: string) => {
    const updatedDirectors = [...directors];
    updatedDirectors[index] = { ...updatedDirectors[index], [field]: value };
    setDirectors(updatedDirectors);
    formMethods.setValue('directors', updatedDirectors);
  };

  const onSubmit = async (data: any) => {
    setShowSummary(true);
  };

  const finalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = formMethods.getValues();
      
      // Upload files if they exist
      const fileUrls: any = {};
      
      if (data.certificateOfIncorporation) {
        fileUrls.certificateOfIncorporation = await uploadFile(data.certificateOfIncorporation, 'brokers-cdd');
      }
      if (data.director1Id) {
        fileUrls.director1Id = await uploadFile(data.director1Id, 'brokers-cdd');
      }
      if (data.director2Id) {
        fileUrls.director2Id = await uploadFile(data.director2Id, 'brokers-cdd');
      }
      if (data.naicomLicense) {
        fileUrls.naicomLicense = await uploadFile(data.naicomLicense, 'brokers-cdd');
      }

      const submissionData = {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'brokers-cdd',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || data.email
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'brokers-cdd'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      // Send notification email
      if (user) {
        await notifySubmission(user, 'Brokers CDD');
      }
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Form Submitted Successfully",
        description: "Your Brokers CDD form has been submitted and is being processed.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'company-info',
      title: 'Company Information',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={formMethods.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Address <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="incorporationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation/RC Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="incorporationState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incorporation State <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formMethods.control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Type <span className="text-red-500">*</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Company Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="Unlimited Liability Company">Unlimited Liability Company</SelectItem>
                      <SelectItem value="Limited Liability Company">Limited Liability Company</SelectItem>
                      <SelectItem value="Public Limited Company">Public Limited Company</SelectItem>
                      <SelectItem value="Joint Venture">Joint Venture</SelectItem>
                      <SelectItem value="Other">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {formMethods.watch('companyType') === 'Other' && (
            <FormField
              control={formMethods.control}
              name="companyTypeOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please specify company type <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <DatePickerField
            name="incorporationDate"
            label="Date of Incorporation/Registration"
            required
            formMethods={formMethods}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={formMethods.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type/Occupation <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="taxNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'directors-info',
      title: 'Directors Information',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Directors Information</h3>
            <Button type="button" onClick={addDirector} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Director
            </Button>
          </div>

          {directors.map((director, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Director {index + 1}</CardTitle>
                  {directors.length > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => removeDirector(index)} 
                      variant="destructive" 
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'title', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.gender`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          updateDirector(index, 'gender', value);
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'firstName', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.middleName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'middleName', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'lastName', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField
                    name={`directors.${index}.dateOfBirth`}
                    label="Date of Birth"
                    required
                    formMethods={formMethods}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.placeOfBirth`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Birth <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'placeOfBirth', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.nationality`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'nationality', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.residenceCountry`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residence Country <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'residenceCountry', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.occupation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'occupation', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.bvn`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BVN <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={11} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'bvn', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.employerName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer's Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'employerName', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.phoneNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'phoneNumber', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={formMethods.control}
                  name={`directors.${index}.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} onChange={(e) => {
                          field.onChange(e);
                          updateDirector(index, 'address', e.target.value);
                        }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="email" onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'email', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.taxIdNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID Number</FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'taxIdNumber', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.passportNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>International Passport Number</FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'passportNumber', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.passportIssuedCountry`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Issued Country</FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'passportIssuedCountry', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.idType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={(value) => {
                          field.onChange(value);
                          updateDirector(index, 'idType', value);
                        }}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose Identification Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="International Passport">International Passport</SelectItem>
                            <SelectItem value="NIMC">NIMC</SelectItem>
                            <SelectItem value="Drivers Licence">Drivers Licence</SelectItem>
                            <SelectItem value="Voters Card">Voters Card</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.identificationNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identification Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'identificationNumber', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.issuedBy`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued By (Issuing Country) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'issuedBy', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DatePickerField
                    name={`directors.${index}.issuedDate`}
                    label="Issued Date"
                    required
                    formMethods={formMethods}
                  />

                  <DatePickerField
                    name={`directors.${index}.expiryDate`}
                    label="Expiry Date"
                    formMethods={formMethods}
                  />
                </div>

                <FormField
                  control={formMethods.control}
                  name={`directors.${index}.sourceOfIncome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source of Income <span className="text-red-500">*</span></FormLabel>
                      <Select value={field.value} onValueChange={(value) => {
                        field.onChange(value);
                        updateDirector(index, 'sourceOfIncome', value);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose Income Source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
                          <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
                          <SelectItem value="Other">Other (please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {formMethods.watch(`directors.${index}.sourceOfIncome`) === 'Other' && (
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.sourceOfIncomeOther`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Please specify income source <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            updateDirector(index, 'sourceOfIncomeOther', e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'account-details',
      title: 'Account Details',
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="localBankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Bank Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formMethods.control}
                  name="bankBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Branch <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="currentAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Account Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DatePickerField
                  name="accountOpeningDate"
                  label="Account Opening Date"
                  required
                  formMethods={formMethods}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Domiciliary Account Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="domiciliaryAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domiciliary Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formMethods.control}
                  name="foreignBankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foreign Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="foreignBankBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Branch Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formMethods.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DatePickerField
                name="foreignAccountOpeningDate"
                label="Account Opening Date"
                formMethods={formMethods}
              />
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'uploads',
      title: 'Document Uploads',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="certificateOfIncorporation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate of Incorporation <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <FileUpload
                      accept=".jpg,.png,.pdf"
                      maxSize={3}
                      onFileSelect={field.onChange}
                      currentFile={field.value}
                      label="Certificate of Incorporation"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formMethods.control}
              name="director1Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identification Means for Director 1 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <FileUpload
                      accept=".jpg,.png,.pdf"
                      maxSize={3}
                      onFileSelect={field.onChange}
                      currentFile={field.value}
                      label="Director 1 ID"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="director2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identification Means for Director 2 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <FileUpload
                      accept=".jpg,.png,.pdf"
                      maxSize={3}
                      onFileSelect={field.onChange}
                      currentFile={field.value}
                      label="Director 2 ID"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formMethods.control}
              name="naicomLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NAICOM License Certificate</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept=".jpg,.png,.pdf"
                      maxSize={3}
                      onFileSelect={field.onChange}
                      currentFile={field.value}
                      label="NAICOM License Certificate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Privacy & Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg text-sm space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Data Privacy</h4>
                  <div className="space-y-2">
                    <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                    <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                    <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Declaration</h4>
                  <div className="space-y-2">
                    <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                    <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                    <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
                  </div>
                </div>
              </div>

              <FormField
                control={formMethods.control}
                name="agreeToDataPrivacy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I agree to the data privacy policy and declaration above <span className="text-red-500">*</span>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digital Signature <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Type your full name as digital signature"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="signatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Brokers CDD Form</h1>
            <p className="text-lg text-muted-foreground">Customer Due Diligence form for insurance brokers</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 mx-2 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{steps[currentStep]?.title}</h2>
            </div>
          </div>

          <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                {steps[currentStep]?.component}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!formMethods.watch('agreeToDataPrivacy') || !formMethods.watch('signature')}
                >
                  Submit Form
                </Button>
              )}
            </div>
          </form>

          {/* Summary Modal */}
          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Your Submission</DialogTitle>
                <DialogDescription>
                  Please review all information before final submission.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Company Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Company Name:</strong> {formMethods.watch('companyName')}</div>
                    <div><strong>Email:</strong> {formMethods.watch('email')}</div>
                    <div><strong>City:</strong> {formMethods.watch('city')}</div>
                    <div><strong>State:</strong> {formMethods.watch('state')}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Directors ({directors.length})</h3>
                  {directors.map((director, index) => (
                    <div key={index} className="mb-4 p-3 border rounded">
                      <h4 className="font-medium">Director {index + 1}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div><strong>Name:</strong> {director.firstName} {director.lastName}</div>
                        <div><strong>Email:</strong> {director.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit Form
                </Button>
                <Button onClick={finalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Success Modal */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="text-center">
              <DialogHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <DialogTitle>Submission Successful!</DialogTitle>
                <DialogDescription>
                  Your Brokers CDD form has been submitted successfully.
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6 p-4 bg-muted rounded-lg text-sm text-left">
                <h4 className="font-semibold mb-2">What's Next?</h4>
                <p>Your form is being processed. You will receive updates via email and SMS.</p>
                <p className="mt-2">For inquiries about your submission status, please contact:</p>
                <ul className="mt-2 space-y-1">
                  <li>Email: customerservice@neminsurance.com</li>
                  <li>Phone: +234 1 280 6820</li>
                  <li>WhatsApp: +234 812 345 6789</li>
                </ul>
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
    </FormProvider>
  );
};

export default BrokersCDD;