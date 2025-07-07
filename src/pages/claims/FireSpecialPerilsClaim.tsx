import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { fireSpecialPerilsSchema } from '../../utils/validation';
import { FireSpecialPerilsClaimData } from '../../types/claims';
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

const FireSpecialPerilsClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FireSpecialPerilsClaimData>({
    resolver: yupResolver(fireSpecialPerilsSchema) as any,
    defaultValues: {
      itemsLost: [{ 
        description: '', 
        costPrice: 0, 
        purchaseDate: '', 
        estimatedValue: 0, 
        salvageValue: 0, 
        netAmountClaimed: 0 
      }],
      usedAsPerPolicy: true,
      unallowedRiskIntroduced: false,
      soleOwner: true,
      hasOtherInsurance: false,
      hasPreviousClaim: false,
      agreeToDataPrivacy: false,
      signature: ''
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'itemsLost'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('fire-special-perils-claim', 7);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        form.setValue(key as keyof FireSpecialPerilsClaimData, draft[key]);
      });
    }
  }, [form, loadDraft]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const addItem = () => {
    appendItem({ 
      description: '', 
      costPrice: 0, 
      purchaseDate: '', 
      estimatedValue: 0, 
      salvageValue: 0, 
      netAmountClaimed: 0 
    });
  };

  const calculateNetAmount = (index: number) => {
    const estimatedValue = form.getValues(`itemsLost.${index}.estimatedValue`) || 0;
    const salvageValue = form.getValues(`itemsLost.${index}.salvageValue`) || 0;
    const netAmount = estimatedValue - salvageValue;
    form.setValue(`itemsLost.${index}.netAmountClaimed`, Math.max(0, netAmount));
  };

  const handleSubmit = async (data: FireSpecialPerilsClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'fireSpecialPerilsClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      // Send confirmation email
      await emailService.sendConfirmationEmail(
        data.email,
        'Fire and Special Perils Claim Submitted',
        `Your claim has been submitted successfully. Reference: ${docRef.id}`
      );

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your fire and special perils claim has been submitted and you'll receive a confirmation email shortly.",
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
    <FormSection title="Insured Details" description="Personal and contact information">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mr">Mr</SelectItem>
                    <SelectItem value="mrs">Mrs</SelectItem>
                    <SelectItem value="chief">Chief</SelectItem>
                    <SelectItem value="dr">Dr</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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

  const LossDetailsSection = () => (
    <FormSection title="Loss Details" description="Details about the incident">
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="premisesAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Address of Premises Involved *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter full premises address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="premisesTelephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Premises Telephone *</FormLabel>
              <FormControl>
                <Input placeholder="Enter premises telephone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dateOfOccurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Occurrence *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timeOfOccurrence"
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
          name="causeOfFire"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cause of Fire *</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the cause of fire (include suspicious reasons if undiscovered)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );

  const PremisesUseSection = () => {
    const usedAsPerPolicy = form.watch('usedAsPerPolicy');
    const unallowedRiskIntroduced = form.watch('unallowedRiskIntroduced');

    return (
      <FormSection title="Premises Use" description="How the premises was being used">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="usedAsPerPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Was the premises used as per policy? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="used-as-policy-yes" />
                      <label htmlFor="used-as-policy-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="used-as-policy-no" />
                      <label htmlFor="used-as-policy-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!usedAsPerPolicy && (
            <FormField
              control={form.control}
              name="usageDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>If no, details *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details about how premises was used differently" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="purposeOfUse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose premises was being used for *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the purpose of use" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unallowedRiskIntroduced"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any unallowed element of risk introduced? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="risk-yes" />
                      <label htmlFor="risk-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="risk-no" />
                      <label htmlFor="risk-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {unallowedRiskIntroduced && (
            <FormField
              control={form.control}
              name="unallowedRiskDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>If yes, explain *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain the unallowed risk introduced" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="measuresWhenDiscovered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Measures taken when fire was discovered *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the measures taken when fire was discovered" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormSection>
    );
  };

  const PropertyOwnershipSection = () => {
    const soleOwner = form.watch('soleOwner');

    return (
      <FormSection title="Property Ownership" description="Ownership details">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="soleOwner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Are you the sole owner? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="sole-owner-yes" />
                      <label htmlFor="sole-owner-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sole-owner-no" />
                      <label htmlFor="sole-owner-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!soleOwner && (
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="otherOwnersName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of other owners *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter names of other owners" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="otherOwnersAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address of other owners *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address of other owners" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      </FormSection>
    );
  };

  const OtherInsuranceSection = () => {
    const hasOtherInsurance = form.watch('hasOtherInsurance');

    return (
      <FormSection title="Other Insurance" description="Other insurance policies">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="hasOtherInsurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Any other policy on the property? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="other-insurance-yes" />
                      <label htmlFor="other-insurance-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="other-insurance-no" />
                      <label htmlFor="other-insurance-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasOtherInsurance && (
            <FormField
              control={form.control}
              name="otherInsurerDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name and address of other insurers *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide name and address of other insurers" {...field} />
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

  const ValuationSection = () => {
    const hasPreviousClaim = form.watch('hasPreviousClaim');

    return (
      <FormSection title="Valuation" description="Property valuation and previous claims">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="premisesContentsValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value of premises contents *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter value in currency" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hasPreviousClaim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous claim under similar policy? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'yes')}
                    value={field.value ? 'yes' : 'no'}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="previous-claim-yes" />
                      <label htmlFor="previous-claim-yes">Yes</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="previous-claim-no" />
                      <label htmlFor="previous-claim-no">No</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {hasPreviousClaim && (
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="previousClaimDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of previous claim *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousClaimAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount of loss *</FormLabel>
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
          )}
        </div>
      </FormSection>
    );
  };

  const ItemsLostSection = () => (
    <FormSection title="Items Lost or Damaged" description="Itemized list of damaged property">
      <div className="space-y-4">
        {itemFields.map((field, index) => (
          <Card key={field.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Item {index + 1}</h4>
              {itemFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name={`itemsLost.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`itemsLost.${index}.costPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter cost price" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itemsLost.${index}.purchaseDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Purchase *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`itemsLost.${index}.estimatedValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value at Occurrence *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter estimated value" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            calculateNetAmount(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itemsLost.${index}.salvageValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value of Salvage *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter salvage value" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            calculateNetAmount(index);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`itemsLost.${index}.netAmountClaimed`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Amount Claimed *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Auto-calculated" 
                          {...field}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
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
      id: 'loss-details',
      title: 'Loss Details',
      component: <LossDetailsSection />,
      isValid: true
    },
    {
      id: 'premises-use',
      title: 'Premises Use',
      component: <PremisesUseSection />,
      isValid: true
    },
    {
      id: 'property-ownership',
      title: 'Property Ownership',
      component: <PropertyOwnershipSection />,
      isValid: true
    },
    {
      id: 'other-insurance',
      title: 'Other Insurance',
      component: <OtherInsuranceSection />,
      isValid: true
    },
    {
      id: 'valuation',
      title: 'Valuation',
      component: <ValuationSection />,
      isValid: true
    },
    {
      id: 'items-lost',
      title: 'Items Lost or Damaged',
      component: <ItemsLostSection />,
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
            Fire and Special Perils Claim Form
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
                  <p className="text-sm">Name: {form.getValues('name')}</p>
                  <p className="text-sm">Email: {form.getValues('email')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Incident Details</h4>
                  <p className="text-sm">Date: {form.getValues('dateOfOccurrence')}</p>
                  <p className="text-sm">Time: {form.getValues('timeOfOccurrence')}</p>
                  <p className="text-sm">Premises: {form.getValues('premisesAddress')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Items Lost</h4>
                  {form.getValues('itemsLost')?.map((item, index) => (
                    <p key={index} className="text-sm">{item.description} - Net Claim: {item.netAmountClaimed}</p>
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
                  Your fire and special perils claim has been submitted successfully. 
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

export default FireSpecialPerilsClaim;