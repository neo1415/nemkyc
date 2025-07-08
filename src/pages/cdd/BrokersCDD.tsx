import React from 'react';
import { useForm } from 'react-hook-form';
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
      incorporationDate: '',
      email: '',
      website: '',
      businessType: '',
      taxNumber: '',
      telephone: '',
      localBankName: '',
      localBankBranch: '',
      localAccountNumber: '',
      localAccountOpeningDate: '',
      agreeToDataPrivacy: false,
      signature: '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: any) => {
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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