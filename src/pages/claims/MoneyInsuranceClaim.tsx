import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MoneyInsuranceClaimData } from '../../types/claims';
import { emailService } from '../../services/emailService';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';

const moneyInsuranceSchema = yup.object({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Period of cover from is required'),
  periodOfCoverTo: yup.string().required('Period of cover to is required'),
  companyName: yup.string().required('Company name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  lossDate: yup.string().required('Loss date is required'),
  lossTime: yup.string().required('Loss time is required'),
  lossLocation: yup.string().required('Loss location is required'),
  moneyInTransitOrSafe: yup.string().required('Must specify if money was in transit or safe'),
  hadPoliceEscort: yup.boolean().required('Must specify if there was police escort'),
  doubtEmployeeIntegrity: yup.boolean().required('Must specify if there are doubts about employee integrity'),
  safeBrickedOrFree: yup.string().when('moneyInTransitOrSafe', {
    is: 'safe',
    then: (schema) => schema.required('Must specify if safe was bricked or free standing')
  }),
  howItHappened: yup.string().required('Must describe how it happened'),
  policeNotified: yup.boolean().required('Must specify if police were notified'),
  previousLossUnderPolicy: yup.boolean().required('Must specify if there was previous loss'),
  amountOfLoss: yup.number().required('Amount of loss is required').min(0),
  lossDescription: yup.string().required('Loss description is required'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: yup.string().required('Signature is required'),
});

const MoneyInsuranceClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MoneyInsuranceClaimData>({
    resolver: yupResolver(moneyInsuranceSchema) as any,
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      lossDate: '',
      lossTime: '',
      lossLocation: '',
      moneyInTransitOrSafe: '',
      peopleDiscoveringLoss: [{ name: '', position: '', salary: 0 }],
      hadPoliceEscort: false,
      amountInPossessionAtStart: 0,
      disbursementsDuringJourney: 0,
      doubtEmployeeIntegrity: false,
      integrityExplanation: '',
      personDiscoveringLossInSafe: '',
      safeBrickedOrFree: '',
      keyHolders: [{ name: '', position: '', salary: 0 }],
      howItHappened: '',
      policeNotified: false,
      policeStation: '',
      previousLossUnderPolicy: false,
      previousLossDetails: '',
      amountOfLoss: 0,
      lossDescription: '',
      agreeToDataPrivacy: false,
      signature: '',
    }
  });

  const { control, setValue, watch, getValues } = form;

  const { fields: peopleFields, append: appendPerson, remove: removePerson } = useFieldArray({
    control,
    name: 'peopleDiscoveringLoss'
  });

  const { fields: keyHolderFields, append: appendKeyHolder, remove: removeKeyHolder } = useFieldArray({
    control,
    name: 'keyHolders'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('money-insurance-claim', {
    setValue,
    watch,
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (key === 'peopleDiscoveringLoss' && Array.isArray(value)) {
          value.forEach((person, index) => {
            if (index > 0) appendPerson(person);
          });
        } else if (key === 'keyHolders' && Array.isArray(value)) {
          value.forEach((holder, index) => {
            if (index > 0) appendKeyHolder(holder);
          });
        } else {
          setValue(key as any, value);
        }
      });
    }
  }, [loadDraft, setValue, appendPerson, appendKeyHolder]);

  useEffect(() => {
    const subscription = watch((data) => {
      const timeout = setTimeout(() => saveDraft(data), 300);
      return () => clearTimeout(timeout);
    });
    return () => subscription.unsubscribe();
  }, [saveDraft, watch]);

  const submit = async (data: MoneyInsuranceClaimData) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'moneyInsuranceClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted',
      });

      // await emailService.sendSubmissionConfirmation(data.email, 'Money Insurance Claim');

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);

      toast({
        title: 'Claim Submitted Successfully',
        description: "Your money insurance claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: 'Submission Error',
        description: 'There was an error submitting your claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = () => {
    if (form.formState.isValid) {
      setShowSummary(true);
    }
  };

  const PolicyDetailsSection = () => (
    <FormSection title="Policy Details" description="Enter your policy information">
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="policyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Number *</FormLabel>
              <FormControl>
                <Input placeholder="Enter policy number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="md:col-span-2">
          <FormLabel>Period of Cover *</FormLabel>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <FormField
              control={control}
              name="periodOfCoverFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="periodOfCoverTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );

  const InsuredDetailsSection = () => (
    <FormSection title="Insured Details" description="Company information">
      <div className="space-y-6">
        <FormField
          control={control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </FormSection>
  );

  const DetailsOfLossSection = () => (
    <FormSection title="Details of Loss" description="When and where did the loss occur">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="lossDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="lossTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time *</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="lossLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where did it happen? *</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="moneyInTransitOrSafe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Was the money in transit or locked in a safe? *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transit" id="transit" />
                    <label htmlFor="transit">In Transit</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="safe" id="safe" />
                    <label htmlFor="safe">Locked in Safe</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );

  const TransitLossSection = () => {
    const moneyInTransitOrSafe = watch('moneyInTransitOrSafe');
    const hadPoliceEscort = watch('hadPoliceEscort');
    const doubtEmployeeIntegrity = watch('doubtEmployeeIntegrity');

    if (moneyInTransitOrSafe !== 'transit') return null;

    return (
      <FormSection title="If Loss was in Transit" description="Details about transit loss">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <FormLabel>Names of persons who discovered loss *</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPerson({ name: '', position: '', salary: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </div>
            {peopleFields.map((field, index) => (
              <Card key={field.id} className="p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Person {index + 1}</h4>
                  {peopleFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePerson(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`peopleDiscoveringLoss.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`peopleDiscoveringLoss.${index}.position`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter position" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`peopleDiscoveringLoss.${index}.salary`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter salary" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
          </div>
          
          <FormField
            control={control}
            name="hadPoliceEscort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Was there a police escort? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="escort-yes" />
                      <label htmlFor="escort-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="escort-no" />
                      <label htmlFor="escort-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="amountInPossessionAtStart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount in employee's possession at journey start</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="disbursementsDuringJourney"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disbursements made during journey</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="doubtEmployeeIntegrity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any reason to doubt integrity of employee? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="doubt-yes" />
                      <label htmlFor="doubt-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="doubt-no" />
                      <label htmlFor="doubt-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {doubtEmployeeIntegrity && (
            <FormField
              control={control}
              name="integrityExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>If yes, explain *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain the reason for doubt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </FormSection>
    );
  };

  const SafeLossSection = () => {
    const moneyInTransitOrSafe = watch('moneyInTransitOrSafe');

    if (moneyInTransitOrSafe !== 'safe') return null;

    return (
      <FormSection title="If Loss was in Safe" description="Details about safe loss">
        <div className="space-y-6">
          <FormField
            control={control}
            name="personDiscoveringLossInSafe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of person who discovered loss *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="safeBrickedOrFree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Was the safe bricked into wall or standing free? *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bricked">Bricked into wall</SelectItem>
                    <SelectItem value="free">Standing free</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="flex justify-between items-center mb-4">
              <FormLabel>Names, positions, salaries of employees in charge of keys *</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendKeyHolder({ name: '', position: '', salary: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Key Holder
              </Button>
            </div>
            {keyHolderFields.map((field, index) => (
              <Card key={field.id} className="p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Key Holder {index + 1}</h4>
                  {keyHolderFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeKeyHolder(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name={`keyHolders.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`keyHolders.${index}.position`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter position" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`keyHolders.${index}.salary`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter salary" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </FormSection>
    );
  };

  const GeneralSection = () => {
    const policeNotified = watch('policeNotified');
    const previousLossUnderPolicy = watch('previousLossUnderPolicy');

    return (
      <FormSection title="General" description="General information about the loss">
        <div className="space-y-6">
          <FormField
            control={control}
            name="howItHappened"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How did it happen? *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe how the loss occurred" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="policeNotified"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Have police been notified? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="police-yes" />
                      <label htmlFor="police-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="police-no" />
                      <label htmlFor="police-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {policeNotified && (
            <FormField
              control={control}
              name="policeStation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Police Station *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter police station name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="previousLossUnderPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous loss under the policy? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="previous-yes" />
                      <label htmlFor="previous-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="previous-no" />
                      <label htmlFor="previous-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {previousLossUnderPolicy && (
            <FormField
              control={control}
              name="previousLossDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details of previous loss *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details of previous loss" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="amountOfLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount of loss *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount of loss" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="lossDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did it consist of? *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe what the loss consisted of" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </FormSection>
    );
  };

  const DataPrivacySection = () => (
    <FormSection title="Data Privacy" description="Privacy policy and data usage">
      <div className="prose prose-sm max-w-none">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
          <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
          <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
        </div>
      </div>
    </FormSection>
  );

  const DeclarationSection = () => (
    <FormSection title="Declaration & Signature" description="Final declaration and signature">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-3">Declaration</h4>
            <div className="space-y-2 text-sm">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          <FormField
            control={control}
            name="agreeToDataPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  I agree to the data privacy policy and declaration statements above *
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="signature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digital Signature *</FormLabel>
              <FormControl>
                <Input placeholder="Type your full name as digital signature" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-sm text-muted-foreground">
          Date: {new Date().toLocaleDateString()}
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: <PolicyDetailsSection />,
      isValid: true
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: <InsuredDetailsSection />,
      isValid: true
    },
    {
      id: 'details-of-loss',
      title: 'Details of Loss',
      component: <DetailsOfLossSection />,
      isValid: true
    },
    {
      id: 'transit-loss',
      title: 'Transit Loss Details',
      component: <TransitLossSection />,
      isValid: true
    },
    {
      id: 'safe-loss',
      title: 'Safe Loss Details',
      component: <SafeLossSection />,
      isValid: true
    },
    {
      id: 'general',
      title: 'General Information',
      component: <GeneralSection />,
      isValid: true
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      component: <DataPrivacySection />,
      isValid: true
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: <DeclarationSection />,
      isValid: true
    }
  ].filter(step => {
    const moneyInTransitOrSafe = watch('moneyInTransitOrSafe');
    if (step.id === 'transit-loss' && moneyInTransitOrSafe !== 'transit') return false;
    if (step.id === 'safe-loss' && moneyInTransitOrSafe !== 'safe') return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Money Insurance Claim Form
          </h1>
          <p className="text-gray-600">
            Please fill out all required fields accurately
          </p>
        </div>

        <Form {...form}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Claim"
            formMethods={form}
          />
        </Form>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claim Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Policy Information</h4>
                  <p className="text-sm">Policy Number: {getValues('policyNumber')}</p>
                  <p className="text-sm">Company: {getValues('companyName')}</p>
                  <p className="text-sm">Email: {getValues('email')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Loss Details</h4>
                  <p className="text-sm">Date: {getValues('lossDate')}</p>
                  <p className="text-sm">Time: {getValues('lossTime')}</p>
                  <p className="text-sm">Amount: {getValues('amountOfLoss')}</p>
                  <p className="text-sm">Location: Transit or Safe - {getValues('moneyInTransitOrSafe')}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Information
              </Button>
              <Button onClick={() => submit(getValues())} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Submission'
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
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  ✓
                </div>
                <p className="text-gray-600 mb-4">
                  Your money insurance claim has been submitted successfully. 
                  You will receive a confirmation email shortly.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    For claims status enquiries, call 01 448 9570
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

export default MoneyInsuranceClaim;