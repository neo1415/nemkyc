import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GroupPersonalAccidentClaimData } from '../../types/claims';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const GroupPersonalAccidentClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<GroupPersonalAccidentClaimData>({
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      accidentDate: '',
      accidentTime: '',
      accidentPlace: '',
      incidentDescription: '',
      particularsOfInjuries: '',
      doctorName: '',
      doctorAddress: '',
      isUsualDoctor: false,
      totalIncapacityFrom: '',
      totalIncapacityTo: '',
      partialIncapacityFrom: '',
      partialIncapacityTo: '',
      otherInsurerName: '',
      otherInsurerAddress: '',
      otherPolicyNumber: '',
      witnesses: [{ name: '', address: '' }],
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: methods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('group-personal-accident-claim', methods);

  const watchedValues = methods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        methods.setValue(key as keyof GroupPersonalAccidentClaimData, draft[key]);
      });
    }
  }, [methods, loadDraft]);

  useEffect(() => {
    const subscription = methods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [methods, saveDraft]);

  const handleSubmit = async (data: GroupPersonalAccidentClaimData) => {
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'groupPersonalAccidentClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

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

  const onFinalSubmit = (data: GroupPersonalAccidentClaimData) => {
    setShowSummary(true);
  };

  const addWitness = () => {
    appendWitness({ name: '', address: '' });
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
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
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="periodOfCoverFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period of Cover From *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="periodOfCoverTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period of Cover To *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
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
            control={methods.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter full address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
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
              control={methods.control}
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
      )
    },
    {
      id: 'accident',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
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
              control={methods.control}
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
            control={methods.control}
            name="accidentPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place *</FormLabel>
                <FormControl>
                  <Input placeholder="Where did the accident occur?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="incidentDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe how the incident occurred" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="particularsOfInjuries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Particulars of Injuries *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the injuries sustained" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'witnesses',
      title: 'Witness Information',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Witnesses</h3>
            <Button
              type="button"
              onClick={addWitness}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Witness {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeWitness(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={methods.control}
                  name={`witnesses.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter witness name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={methods.control}
                  name={`witnesses.${index}.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter witness address" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
          
          {witnessFields.length === 0 && (
            <div className="text-center text-sm text-muted-foreground border p-6 rounded-md">
              No witnesses added yet. Click "Add Witness" to add witness information.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'doctor',
      title: 'Doctor Information',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of doctor *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter doctor's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="doctorAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address of doctor *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter doctor's address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={methods.control}
            name="isUsualDoctor"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is this your usual doctor?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'incapacity',
      title: 'Incapacity Details',
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Total incapacity period:</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={methods.control}
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
                control={methods.control}
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
            <h4 className="font-medium mb-4">Partial incapacity period:</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={methods.control}
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
                control={methods.control}
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
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="otherInsurerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter other insurer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="otherInsurerAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter other insurer address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="otherPolicyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
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
                    I agree to the data privacy notice and declaration *
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Digital Signature *</FormLabel>
                <FormControl>
                  <Input placeholder="Type your full name as signature" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto text-center p-6">
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Claim Submitted Successfully!</h2>
          <p className="text-green-600">
            Your group personal accident claim has been submitted and you'll receive a confirmation email shortly.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Submit Another Claim
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Group Personal Accident Insurance Claim
          </h1>
          <p className="text-lg text-gray-600">
            Please fill out all required information accurately
          </p>
        </div>

        <FormProvider {...methods}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={methods}
          />
        </FormProvider>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Policy Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Policy Number: {watchedValues.policyNumber}</div>
                  <div>Period: {watchedValues.periodOfCoverFrom} to {watchedValues.periodOfCoverTo}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Insured Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Company: {watchedValues.companyName}</div>
                  <div>Email: {watchedValues.email}</div>
                  <div>Phone: {watchedValues.phone}</div>
                  <div>Address: {watchedValues.address}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Accident Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Date: {watchedValues.accidentDate}</div>
                  <div>Time: {watchedValues.accidentTime}</div>
                  <div>Place: {watchedValues.accidentPlace}</div>
                </div>
                <div className="mt-2 text-sm">
                  <div>Description: {watchedValues.incidentDescription}</div>
                  <div>Injuries: {watchedValues.particularsOfInjuries}</div>
                </div>
              </div>

              {watchedValues.witnesses && watchedValues.witnesses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Witnesses</h3>
                  {watchedValues.witnesses.map((witness, index) => (
                    <div key={index} className="text-sm mb-2">
                      <div>Name: {witness.name}</div>
                      <div>Address: {witness.address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Claim
              </Button>
              <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GroupPersonalAccidentClaim;