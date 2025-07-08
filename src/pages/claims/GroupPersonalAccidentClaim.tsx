import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { groupPersonalAccidentSchema } from '../../utils/validation';
import { GroupPersonalAccidentClaimData } from '../../types/claims';
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
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';

const GroupPersonalAccidentClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GroupPersonalAccidentClaimData>({
    resolver: yupResolver(groupPersonalAccidentSchema) as any,
    defaultValues: {
      witnesses: [{ name: '', address: '' }],
      isUsualDoctor: false,
      agreeToDataPrivacy: false,
      signature: ''
    }
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: form.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('group-personal-accident-claim', form);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        form.setValue(key as keyof GroupPersonalAccidentClaimData, draft[key]);
      });
    }
  }, [form, loadDraft]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const addWitness = () => {
    appendWitness({ name: '', address: '' });
  };

  const handleSubmit = async (data: GroupPersonalAccidentClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'groupPersonalAccidentClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(
        data.email,
        'Group Personal Accident Insurance Claim'
      );

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your group personal accident claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
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
          control={form.control}
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
              control={form.control}
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
              control={form.control}
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
    <FormSection title="Insured Details" description="Company and contact information">
      <div className="space-y-6">
        <FormField
          control={form.control}
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
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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
    <FormSection title="Details of Loss" description="Accident information and description">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accidentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accident Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accidentTime"
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
          control={form.control}
          name="accidentPlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place *</FormLabel>
              <FormControl>
                <Input placeholder="Enter place where accident occurred" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="incidentDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Incident Description *</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe how the incident occurred" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="particularsOfInjuries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Particulars of Injuries *</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the injuries sustained" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );

  const WitnessInformationSection = () => (
    <FormSection title="Witness Information" description="Add witness details">
      <div className="space-y-4">
        {witnessFields.map((field, index) => (
          <Card key={field.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Witness {index + 1}</h4>
              {witnessFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWitness(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name={`witnesses.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter witness name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`witnesses.${index}.address`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter witness address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addWitness} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>
    </FormSection>
  );

  const DoctorInformationSection = () => (
    <FormSection title="Doctor Information" description="Medical practitioner details">
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name of Doctor *</FormLabel>
              <FormControl>
                <Input placeholder="Enter doctor's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="doctorAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address of Doctor *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter doctor's address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isUsualDoctor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Is this your usual doctor? *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === 'yes')}
                  value={field.value ? 'yes' : 'no'}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="usual-doctor-yes" />
                    <label htmlFor="usual-doctor-yes">Yes</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="usual-doctor-no" />
                    <label htmlFor="usual-doctor-no">No</label>
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

  const IncapacityDetailsSection = () => (
    <FormSection title="Incapacity Details" description="Duration of incapacity periods">
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Total Incapacity Period</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalIncapacityFrom"
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
              control={form.control}
              name="totalIncapacityTo"
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
        <div>
          <h4 className="font-medium mb-4">Partial Incapacity Period</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="partialIncapacityFrom"
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
              control={form.control}
              name="partialIncapacityTo"
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

  const OtherInsurersSection = () => (
    <FormSection title="Other Insurers" description="Details of other insurance coverage">
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="otherInsurerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter insurer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otherInsurerAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter insurer address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otherPolicyNumber"
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
      </div>
    </FormSection>
  );

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
            control={form.control}
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
          control={form.control}
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
      id: 'witness-information',
      title: 'Witness Information',
      component: <WitnessInformationSection />,
      isValid: true
    },
    {
      id: 'doctor-information',
      title: 'Doctor Information',
      component: <DoctorInformationSection />,
      isValid: true
    },
    {
      id: 'incapacity-details',
      title: 'Incapacity Details',
      component: <IncapacityDetailsSection />,
      isValid: true
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: <OtherInsurersSection />,
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
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Group Personal Accident Insurance Claim Form
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
                  <p className="text-sm">Policy Number: {form.getValues('policyNumber')}</p>
                  <p className="text-sm">Company: {form.getValues('companyName')}</p>
                  <p className="text-sm">Email: {form.getValues('email')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Accident Details</h4>
                  <p className="text-sm">Date: {form.getValues('accidentDate')}</p>
                  <p className="text-sm">Time: {form.getValues('accidentTime')}</p>
                  <p className="text-sm">Place: {form.getValues('accidentPlace')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Witnesses</h4>
                  {form.getValues('witnesses')?.map((witness, index) => (
                    <p key={index} className="text-sm">{witness.name} - {witness.address}</p>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Information
              </Button>
              <Button onClick={form.handleSubmit(handleSubmit)} disabled={isSubmitting}>
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
                  Your group personal accident claim has been submitted successfully. 
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

export default GroupPersonalAccidentClaim;