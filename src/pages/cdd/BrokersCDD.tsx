import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '../../hooks/use-toast';
import MultiStepForm from '../../components/common/MultiStepForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Checkbox } from '../../components/ui/checkbox';
import FileUpload from '../../components/common/FileUpload';
import { BrokersCDDData } from '../../types';

const brokersCDDValidationSchema = yup.object({
  companyName: yup.string().required('Company name is required'),
  companyAddress: yup.string().required('Company address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  incorporationNumber: yup.string().required('Incorporation number is required'),
  registrationNumber: yup.string().required('Registration number is required'),
  incorporationState: yup.string().required('Incorporation state is required'),
  companyType: yup.string().required('Company type is required'),
  companyTypeOther: yup.string().when('companyType', {
    is: 'other',
    then: (schema) => schema.required('Please specify company type'),
    otherwise: (schema) => schema.notRequired(),
  }),
  incorporationDate: yup.string().required('Incorporation date is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  website: yup.string().required('Website is required'),
  businessType: yup.string().required('Business type is required'),
  taxNumber: yup.string().required('Tax number is required'),
  telephone: yup.string().required('Telephone is required'),
  directors: yup.array().of(
    yup.object({
      title: yup.string().required('Title is required'),
      gender: yup.string().required('Gender is required'),
      firstName: yup.string().required('First name is required'),
      middleName: yup.string().notRequired(),
      lastName: yup.string().required('Last name is required'),
      dateOfBirth: yup.string().required('Date of birth is required'),
      placeOfBirth: yup.string().required('Place of birth is required'),
      nationality: yup.string().required('Nationality is required'),
      residenceCountry: yup.string().required('Residence country is required'),
      occupation: yup.string().required('Occupation is required'),
      bvn: yup.string().matches(/^\d{11}$/, 'BVN must be exactly 11 digits').required('BVN is required'),
      employerName: yup.string().required('Employer name is required'),
      phoneNumber: yup.string().required('Phone number is required'),
      address: yup.string().required('Address is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
      taxIdNumber: yup.string().notRequired(),
      passportNumber: yup.string().notRequired(),
      passportIssuedCountry: yup.string().notRequired(),
      idType: yup.string().required('ID type is required'),
      identificationNumber: yup.string().required('Identification number is required'),
      issuedBy: yup.string().required('Issuing country is required'),
      issuedDate: yup.string().required('Issued date is required'),
      expiryDate: yup.string().notRequired(),
      incomeSource: yup.string().required('Income source is required'),
      incomeSourceOther: yup.string().when('incomeSource', {
        is: 'other',
        then: (schema) => schema.required('Please specify income source'),
        otherwise: (schema) => schema.notRequired(),
      }),
    })
  ).min(1, 'At least one director is required'),
  localBankName: yup.string().required('Local bank name is required'),
  localBankBranch: yup.string().required('Local bank branch is required'),
  localAccountNumber: yup.string().required('Local account number is required'),
  localAccountOpeningDate: yup.string().required('Local account opening date is required'),
  foreignAccountNumber: yup.string().notRequired(),
  foreignBankName: yup.string().notRequired(),
  foreignBankBranch: yup.string().notRequired(),
  foreignCurrency: yup.string().notRequired(),
  foreignAccountOpeningDate: yup.string().notRequired(),
  certificateOfIncorporation: yup.mixed().required('Certificate of incorporation is required'),
  directorId1: yup.mixed().required('Director ID 1 is required'),
  directorId2: yup.mixed().required('Director ID 2 is required'),
  naicomLicense: yup.mixed().notRequired(),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy policy'),
  signature: yup.string().required('Signature is required'),
});

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
  const formMethods = useForm<BrokersCDDData>({
    resolver: yupResolver(brokersCDDValidationSchema),
    defaultValues: {
      directors: [
        {
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
          incomeSource: '',
          incomeSourceOther: '',
        }
      ],
      companyType: '',
      companyTypeOther: '',
      incomeSource: '',
      incomeSourceOther: '',
      agreeToDataPrivacy: false,
      signature: '',
    },
    mode: 'onChange',
  });

  const { watch, setValue } = formMethods;
  const directors = watch('directors') || [];
  const companyType = watch('companyType');

  const addDirector = () => {
    const newDirector = {
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
      incomeSource: '',
      incomeSourceOther: '',
    };
    setValue('directors', [...directors, newDirector]);
  };

  const removeDirector = (index: number) => {
    if (directors.length > 1) {
      const updatedDirectors = directors.filter((_, i) => i !== index);
      setValue('directors', updatedDirectors);
    }
  };

  const onSubmit = async (data: BrokersCDDData) => {
    try {
      console.log('Brokers CDD Form Data:', data);
      localStorage.setItem('brokersCDDData', JSON.stringify({ ...data, submittedAt: new Date().toISOString() }));
      
      toast({
        title: "Form Submitted Successfully",
        description: "Your Brokers CDD form has been submitted and saved locally for 7 days.",
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      });
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
                      <SelectItem value="soleProprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="unlimitedLiability">Unlimited Liability Company</SelectItem>
                      <SelectItem value="limitedLiability">Limited Liability Company</SelectItem>
                      <SelectItem value="publicLimited">Public Limited Company</SelectItem>
                      <SelectItem value="jointVenture">Joint Venture</SelectItem>
                      <SelectItem value="other">Other (please specify)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {companyType === 'other' && (
            <FormField
              control={formMethods.control}
              name="companyTypeOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Company Type <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Please specify" />
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
                    <Input {...field} />
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
          {directors.map((director, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Director {index + 1}</CardTitle>
                  {directors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDirector(index)}
                      className="text-red-600"
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
                          <Input {...field} />
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
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
                    name={`directors.${index}.middleName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                    name={`directors.${index}.nationality`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                    name={`directors.${index}.occupation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} maxLength={11} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                        <Textarea {...field} rows={2} />
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
                          <Input {...field} type="email" />
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
                    name={`directors.${index}.passportNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>International Passport Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                    name={`directors.${index}.idType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose Identification Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="passport">International Passport</SelectItem>
                            <SelectItem value="nimc">NIMC</SelectItem>
                            <SelectItem value="driversLicense">Drivers Licence</SelectItem>
                            <SelectItem value="votersCard">Voters Card</SelectItem>
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
                    name={`directors.${index}.issuedBy`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issued By (Issuing Country) <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField
                    name={`directors.${index}.expiryDate`}
                    label="Expiry Date"
                    formMethods={formMethods}
                  />
                  
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.incomeSource`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source of Income <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose Income Source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="salary">Salary or Business Income</SelectItem>
                            <SelectItem value="investments">Investments or Dividends</SelectItem>
                            <SelectItem value="other">Other (please specify)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watch(`directors.${index}.incomeSource`) === 'other' && (
                  <FormField
                    control={formMethods.control}
                    name={`directors.${index}.incomeSourceOther`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify Income Source <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Please specify" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addDirector}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Director
          </Button>
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
                  name="localBankBranch"
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
                  name="localAccountNumber"
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
                  name="localAccountOpeningDate"
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
              <CardDescription>Fill this section if you have a foreign account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={formMethods.control}
                  name="foreignAccountNumber"
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
                  name="foreignCurrency"
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
      id: 'uploads-declaration',
      title: 'Uploads & Declaration',
      component: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Uploads</CardTitle>
              <CardDescription>Please upload the required documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={formMethods.control}
                name="certificateOfIncorporation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate of Incorporation <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <FileUpload
                        onFileSelect={(files) => field.onChange(files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={3 * 1024 * 1024}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="directorId1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identification Means for Director 1 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <FileUpload
                        onFileSelect={(files) => field.onChange(files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={3 * 1024 * 1024}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="directorId2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identification Means for Director 2 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <FileUpload
                        onFileSelect={(files) => field.onChange(files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={3 * 1024 * 1024}
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
                        onFileSelect={(files) => field.onChange(files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxSize={3 * 1024 * 1024}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Privacy & Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Data Privacy Notice:</p>
                <p>
                  By submitting this form, you acknowledge that the information provided will be processed in accordance 
                  with our Privacy Policy and applicable data protection laws. Your data will be stored securely and 
                  used only for the purposes stated. This information will be retained locally for 7 days for your convenience.
                </p>
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
                        I agree to the data privacy policy and terms <span className="text-red-500">*</span>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Brokers CDD Form</h1>
          <p className="text-lg text-gray-600">Customer Due Diligence form for insurance brokers</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          formMethods={formMethods}
          submitButtonText="Submit Brokers CDD"
        />
      </div>
    </div>
  );
};

export default BrokersCDD;