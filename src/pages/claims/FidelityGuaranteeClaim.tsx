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
import { Calendar } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Checkbox } from '../../components/ui/checkbox';
import { FidelityGuaranteeClaimData } from '../../types';


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

const FidelityGuaranteeClaim: React.FC = () => {
  const formMethods = useForm({
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      defaulterName: '',
      defaulterAge: '',
      defaulterAddress: '',
      defaulterOccupation: '',
      discoveryDate: '',
      defaultCarriedOut: '',
      defaultAmount: '',
      previousIrregularity: false,
      previousIrregularityDetails: '',
      lastCheckedDate: '',
      defaulterProperty: false,
      defaulterPropertyDetails: '',
      remunerationDue: false,
      remunerationDetails: '',
      otherSecurity: false,
      otherSecurityDetails: '',
      defaulterDischarged: false,
      dischargeDate: '',
      settlementProposal: false,
      settlementDetails: '',
      agreeToDataPrivacy: false,
      signature: '',
    },
    mode: 'onChange',
  });

  const { watch } = formMethods;

  const onSubmit = async (data: any) => {
    try {
      console.log('Fidelity Guarantee Claim Data:', data);
      localStorage.setItem('fidelityGuaranteeClaimData', JSON.stringify({ ...data, submittedAt: new Date().toISOString() }));
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your Fidelity Guarantee claim has been submitted and saved locally for 7 days.",
      });
    } catch (error) {
      console.error('Claim submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={formMethods.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DatePickerField
              name="periodOfCoverFrom"
              label="Period of Cover From"
              required
              formMethods={formMethods}
            />
            
            <DatePickerField
              name="periodOfCoverTo"
              label="Period of Cover To"
              required
              formMethods={formMethods}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
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
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formMethods.control}
              name="email"
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
          </div>
        </div>
      ),
    },
    {
      id: 'defaulter-details',
      title: 'Details of Defaulter',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={formMethods.control}
              name="defaulterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formMethods.control}
              name="defaulterAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={formMethods.control}
            name="defaulterAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Present Address <span className="text-red-500">*</span></FormLabel>
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
              name="defaulterOccupation"
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

            <DatePickerField
              name="discoveryDate"
              label="Date of Discovery of Default"
              required
              formMethods={formMethods}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'default-details',
      title: 'Details of Default',
      component: (
        <div className="space-y-6">
          <FormField
            control={formMethods.control}
            name="defaultCarriedOut"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How long, and in what manner, has the default been carried out and concealed? <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={formMethods.control}
            name="defaultAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount of the Default <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="previousIrregularity"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Previous irregularity in accounts?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('previousIrregularity') && (
                <FormField
                  control={formMethods.control}
                  name="previousIrregularityDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please explain <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <DatePickerField
            name="lastCheckedDate"
            label="On what date was the account last checked and found correct?"
            required
            formMethods={formMethods}
          />

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="defaulterProperty"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Any property/furniture of the defaulter known?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('defaulterProperty') && (
                <FormField
                  control={formMethods.control}
                  name="defaulterPropertyDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="remunerationDue"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Any salary, commission or other remuneration due to defaulter?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('remunerationDue') && (
                <FormField
                  control={formMethods.control}
                  name="remunerationDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="otherSecurity"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Other security in addition to the guarantee?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('otherSecurity') && (
                <FormField
                  control={formMethods.control}
                  name="otherSecurityDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'employment-status',
      title: 'Employment Status',
      component: (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="defaulterDischarged"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Has the defaulter been discharged?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('defaulterDischarged') && (
                <DatePickerField
                  name="dischargeDate"
                  label="Discharge Date"
                  required
                  formMethods={formMethods}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={formMethods.control}
                name="settlementProposal"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Has a proposal for settlement been put forward?</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watch('settlementProposal') && (
                <FormField
                  control={formMethods.control}
                  name="settlementDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Settlement Details <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
              <CardTitle>Data Privacy Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Data Privacy & Protection:</p>
                <p className="mb-2">
                  By submitting this claim form, you acknowledge that the information provided will be processed 
                  in accordance with our Privacy Policy and applicable data protection laws. Your personal data 
                  will be used solely for the purpose of processing your insurance claim.
                </p>
                <p>
                  This information will be stored securely and retained locally for 7 days for your convenience. 
                  We are committed to protecting your privacy and ensuring the confidentiality of your personal information.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Declaration & Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                        I declare that the information provided in this claim form is true and complete to the best of my knowledge, 
                        and I agree to the data privacy policy <span className="text-red-500">*</span>
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
                    <FormLabel>Signature of Policyholder (Digital Signature) <span className="text-red-500">*</span></FormLabel>
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

              <div className="text-sm text-gray-600">
                <p><strong>Date:</strong> {format(new Date(), "PPP")}</p>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fidelity Guarantee Insurance Claim Form</h1>
          <p className="text-lg text-gray-600">Submit your fidelity guarantee insurance claim</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          formMethods={formMethods}
          submitButtonText="Submit Claim"
        />
      </div>
    </div>
  );
};

export default FidelityGuaranteeClaim;