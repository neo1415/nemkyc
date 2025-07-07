import React, { useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { burglaryClaimSchema } from '../../utils/validation';
import { BurglaryClaimData } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import { Badge } from '../../components/ui/badge';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
// import { generatePDF } from '../../services/pdfService';
import { notifySubmission } from '../../services/notificationService';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form';
import { Shield, FileText, Home, Plus, Trash2, Upload, Check, DollarSign, X, Lock } from 'lucide-react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const BurglaryClaimForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<BurglaryClaimData | null>(null);

  const form = useForm({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      nameOfInsured: '',
      companyName: '',
      title: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phone: '',
      email: user?.email || '',
      premisesAddress: '',
      premisesTelephone: '',
      dateOfTheft: '',
      timeOfTheft: '',
      howEntryEffected: '',
      roomsEntered: '',
      premisesOccupied: false,
      lastOccupiedDate: '',
      lastOccupiedTime: '',
      suspicionsOnAnyone: false,
      suspicionName: '',
      policeInformed: false,
      policeDate: '',
      policeStationAddress: '',
      soleOwner: true,
      ownerName: '',
      ownerAddress: '',
      otherInsurance: false,
      otherInsurerDetails: '',
      totalContentsValue: 0,
      sumInsuredFirePolicy: 0,
      firePolicyInsurerName: '',
      firePolicyInsurerAddress: '',
      previousBurglaryLoss: false,
      previousLossExplanation: '',
      propertyItems: [{ description: '', costPrice: 0, purchaseDate: '', estimatedValue: 0, netAmountClaimed: 0 }],
      agreeToDataPrivacy: false,
      signature: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control as any,
    name: 'propertyItems'
  });

  const watchedValues = form.watch();

  // Save draft to localStorage with 7-day expiry
  const { saveDraft } = useFormDraft('burglary-claim', 7);

  React.useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const addPropertyItem = () => {
    append({ description: '', costPrice: 0, purchaseDate: '', estimatedValue: 0, netAmountClaimed: 0 });
  };

  const removePropertyItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: BurglaryClaimData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowSummary(true);
    setSubmittedData(data);
  };

  const handleFinalSubmit = async () => {
    if (!submittedData || !user) return;
    
    setIsSubmitting(true);
    setShowSummary(false);
    
    try {
      const submissionId = `claim_burglary_${Date.now()}`;
      
      // Upload files if any
      const uploadedFiles: { [key: string]: string } = {};
      
      // Save to Firestore
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'burglary-claim',
        data: {
          ...submittedData,
          uploadedFiles
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate and upload PDF (placeholder)
      // const pdfBlob = await generatePDF(submittedData, 'Burglary Claim Form');
      // const pdfRef = ref(storage, `claims/burglary/${submissionId}/form.pdf`);
      // await uploadBytes(pdfRef, pdfBlob);
      // const pdfUrl = await getDownloadURL(pdfRef);

      // Update submission with PDF URL
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'burglary-claim',
        data: {
          ...submittedData,
          uploadedFiles
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send notification
      await notifySubmission(user, 'Burglary Claim');
      
      // Clear draft and show success
      // clearDraft();
      setShowSuccess(true);

      toast({
        title: "Claim Submitted Successfully",
        description: "Your burglary claim has been submitted and is being processed.",
      });

    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control as any}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter policy number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
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
              control={form.control as any}
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
      ),
      isValid: !!watchedValues.policyNumber && !!watchedValues.periodOfCoverFrom && !!watchedValues.periodOfCoverTo
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control as any}
            name="nameOfInsured"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of Insured *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter name of insured" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control as any}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter company name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Chief">Chief</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
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
              control={form.control as any}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            control={form.control as any}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter full address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="Enter email address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ),
      isValid: !!watchedValues.nameOfInsured && !!watchedValues.title && !!watchedValues.dateOfBirth && !!watchedValues.gender && !!watchedValues.address && !!watchedValues.phone && !!watchedValues.email
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control as any}
            name="premisesAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address of Premises Involved *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter premises address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control as any}
            name="premisesTelephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premises Telephone *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter premises telephone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="dateOfTheft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Theft *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="timeOfTheft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of Theft *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control as any}
            name="howEntryEffected"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How Entry was Effected *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe how entry was effected" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control as any}
            name="roomsEntered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rooms Entered *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="List rooms that were entered" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control as any}
            name="premisesOccupied"
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
                    Premises occupied at time of loss?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {!watchedValues.premisesOccupied && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <FormField
                control={form.control as any}
                name="lastOccupiedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Occupied Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="lastOccupiedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Occupied Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <FormField
            control={form.control as any}
            name="suspicionsOnAnyone"
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
                    Suspicions on anyone?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {watchedValues.suspicionsOnAnyone && (
            <FormField
              control={form.control as any}
              name="suspicionName"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel>Name of Suspected Person *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter name of suspected person" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control as any}
            name="policeInformed"
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
                    Police informed?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {watchedValues.policeInformed && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <FormField
                control={form.control as any}
                name="policeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Police Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="policeStationAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Police Station Address *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter police station address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      ),
      isValid: !!watchedValues.premisesAddress && !!watchedValues.premisesTelephone && !!watchedValues.dateOfTheft && !!watchedValues.timeOfTheft && !!watchedValues.howEntryEffected && !!watchedValues.roomsEntered
    },
    {
      id: 'ownership',
      title: 'Ownership & Insurance',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control as any}
            name="soleOwner"
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
                    Are you the sole owner of the property?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {!watchedValues.soleOwner && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <FormField
                control={form.control as any}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter owner name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="ownerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Address *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter owner address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <FormField
            control={form.control as any}
            name="otherInsurance"
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
                    Any other insurance covering this property?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {watchedValues.otherInsurance && (
            <FormField
              control={form.control as any}
              name="otherInsurerDetails"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel>Other Insurer Details *</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Provide details of other insurance" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="totalContentsValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value of Total Contents *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter total value"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="sumInsuredFirePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sum Insured Under Fire Policy *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder="Enter sum insured"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="firePolicyInsurerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fire Policy Insurer Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter insurer name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="firePolicyInsurerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fire Policy Insurer Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter insurer address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control as any}
            name="previousBurglaryLoss"
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
                    Previous burglary/theft loss?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          {watchedValues.previousBurglaryLoss && (
            <FormField
              control={form.control as any}
              name="previousLossExplanation"
              render={({ field }) => (
                <FormItem className="ml-6">
                  <FormLabel>Previous Loss Explanation *</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Explain the previous loss" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      ),
      isValid: !!watchedValues.totalContentsValue && !!watchedValues.sumInsuredFirePolicy
    },
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button type="button" onClick={addPropertyItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePropertyItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control as any}
                      name={`propertyItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe the item" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.costPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter cost price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.purchaseDate`}
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
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.estimatedValue`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Value at Time of Loss *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter estimated value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.netAmountClaimed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Net Amount Claimed *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            placeholder="Enter net amount claimed"
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
      ),
      isValid: fields.every((_, index) => 
        watchedValues.propertyItems?.[index]?.description &&
        watchedValues.propertyItems?.[index]?.costPrice > 0 &&
        watchedValues.propertyItems?.[index]?.purchaseDate &&
        watchedValues.propertyItems?.[index]?.estimatedValue > 0 &&
        watchedValues.propertyItems?.[index]?.netAmountClaimed > 0
      )
    },
    {
      id: 'privacy-declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Privacy Notice</h3>
            <div className="prose prose-sm max-w-none">
              <p>
                We collect and process your personal information in accordance with applicable data protection laws.
                Your data will be used to process your claim and may be shared with relevant parties including
                investigators, adjusters, and medical professionals as necessary for claim assessment.
              </p>
              <p>
                By submitting this form, you consent to the collection, processing, and storage of your personal
                information for the purposes of claim processing and related activities.
              </p>
            </div>
          </Card>
          
          <FormField
            control={form.control as any}
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
                    I agree to the data privacy policy and consent to the processing of my personal information *
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control as any}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Digital Signature *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Type your full name as digital signature" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="text-sm text-gray-600">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      ),
      isValid: !!watchedValues.agreeToDataPrivacy && !!watchedValues.signature
    }
  ];

  return (
    <FormProvider {...form}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Burglary, Housebreaking and Larceny Claim Form</h1>
            <p className="text-gray-600 mt-2">Submit your burglary claim with detailed information</p>
          </div>

          <MultiStepForm
            steps={steps}
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Burglary Claim"
          />

          {/* Summary Modal */}
          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Your Claim</DialogTitle>
                <DialogDescription>
                  Please review all information before final submission
                </DialogDescription>
              </DialogHeader>
              
              {submittedData && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Policy Details</h3>
                    <p><strong>Policy Number:</strong> {submittedData.policyNumber}</p>
                    <p><strong>Period:</strong> {submittedData.periodOfCoverFrom} to {submittedData.periodOfCoverTo}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Insured Details</h3>
                    <p><strong>Name:</strong> {submittedData.nameOfInsured}</p>
                    <p><strong>Email:</strong> {submittedData.email}</p>
                    <p><strong>Phone:</strong> {submittedData.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Property Items</h3>
                    <div className="space-y-2">
                      {submittedData.propertyItems.map((item, index) => (
                        <div key={index} className="border rounded p-3">
                          <p><strong>Item {index + 1}:</strong> {item.description}</p>
                          <p><strong>Amount Claimed:</strong> ₦{item.netAmountClaimed.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSummary(false)}>
                      Back to Edit
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Success Modal */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Check className="h-6 w-6 text-green-600" />
                  Claim Submitted Successfully
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p>Your burglary claim has been submitted successfully and is now being processed.</p>
                <p>You will receive email updates on the status of your claim.</p>
                
                <Button onClick={() => {
                  setShowSuccess(false);
                  window.location.href = '/dashboard';
                }}>
                  Go to Dashboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AuthRequiredSubmit
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onProceedToSignup={() => {
              window.location.href = '/signup';
            }}
            formType="Burglary Claim"
          />
        </div>
      </div>
    </FormProvider>
  );
};

export default BurglaryClaimForm;