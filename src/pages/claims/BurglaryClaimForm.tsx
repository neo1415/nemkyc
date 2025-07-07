
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import MultiStepForm from '../../components/common/MultiStepForm';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { sendSubmissionConfirmation } from '../../services/emailService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BurglaryClaimData } from '../../types';
import { burglaryClaimSchema } from '../../utils/validation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

const BurglaryClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<BurglaryClaimData | null>(null);

  const form = useForm<BurglaryClaimData>({
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
      email: '',
      premisesAddress: '',
      premisesTelephone: '',
      dateOfTheft: '',
      timeOfTheft: '',
      howEntryEffected: '',
      roomsEntered: '',
      premisesOccupied: true,
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
    control: form.control,
    name: 'propertyItems'
  });

  const watchedValues = form.watch();

  // Save to localStorage on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem('burglaryClaimForm', JSON.stringify(data));
      localStorage.setItem('burglaryClaimForm_timestamp', Date.now().toString());
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('burglaryClaimForm');
    const timestamp = localStorage.getItem('burglaryClaimForm_timestamp');
    
    if (savedData && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (age < maxAge) {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((key) => {
          if (parsedData[key] !== undefined && parsedData[key] !== null) {
            form.setValue(key as keyof BurglaryClaimData, parsedData[key]);
          }
        });
        toast({
          title: "Draft Restored",
          description: "Your previous form data has been restored.",
        });
      } else {
        localStorage.removeItem('burglaryClaimForm');
        localStorage.removeItem('burglaryClaimForm_timestamp');
      }
    }
  }, [form, toast]);

  const addPropertyItem = () => {
    append({ description: '', costPrice: 0, purchaseDate: '', estimatedValue: 0, netAmountClaimed: 0 });
  };

  const removePropertyItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: BurglaryClaimData) => {
    setSubmittedData(data);
    setShowSummary(true);
  };

  const confirmSubmit = async () => {
    if (!submittedData) return;
    
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'burglary-claims'), {
        ...submittedData,
        submittedAt: new Date(),
        status: 'pending'
      });

      await sendSubmissionConfirmation(submittedData.email, 'Burglary, Housebreaking and Larceny Claim');

      // Clear form and localStorage
      form.reset();
      localStorage.removeItem('burglaryClaimForm');
      localStorage.removeItem('burglaryClaimForm_timestamp');

      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your burglary claim has been submitted and you'll receive a confirmation email shortly.",
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

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
      isValid: form.formState.isValid
    },
    
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="nameOfInsured"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of Insured *</FormLabel>
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
                <FormLabel>Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
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
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                      <SelectItem value="Chief">Chief</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      ),
      isValid: form.formState.isValid
    },
    
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
            control={form.control}
            name="howEntryEffected"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How Entry Was Effected *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe how entry was made to the premises" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="roomsEntered"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rooms Entered *</FormLabel>
                <FormControl>
                  <Textarea placeholder="List the rooms that were entered" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="premisesOccupied"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Were the premises occupied at the time of loss? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="occupied-yes" />
                      <Label htmlFor="occupied-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="occupied-no" />
                      <Label htmlFor="occupied-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!watchedValues.premisesOccupied && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastOccupiedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Occupied Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastOccupiedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Occupied Time</FormLabel>
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
            control={form.control}
            name="suspicionsOnAnyone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Do you have suspicions on anyone? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="suspicions-yes" />
                      <Label htmlFor="suspicions-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="suspicions-no" />
                      <Label htmlFor="suspicions-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watchedValues.suspicionsOnAnyone && (
            <FormField
              control={form.control}
              name="suspicionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of Suspected Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name of suspected person" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="policeInformed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Was the police informed? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="police-yes" />
                      <Label htmlFor="police-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="police-no" />
                      <Label htmlFor="police-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watchedValues.policeInformed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Police Informed</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="policeStationAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Police Station Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter police station address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      ),
      isValid: form.formState.isValid
    },
    
    {
      id: 'ownership',
      title: 'Ownership & Insurance',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="soleOwner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Are you the sole owner of the property? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="sole-owner-yes" />
                      <Label htmlFor="sole-owner-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="sole-owner-no" />
                      <Label htmlFor="sole-owner-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!watchedValues.soleOwner && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner's Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter owner's address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <FormField
            control={form.control}
            name="otherInsurance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Do you have any other insurance on this property? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="other-insurance-yes" />
                      <Label htmlFor="other-insurance-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="other-insurance-no" />
                      <Label htmlFor="other-insurance-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watchedValues.otherInsurance && (
            <FormField
              control={form.control}
              name="otherInsurerDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Insurer Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details of other insurance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalContentsValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value of Total Contents *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter total value" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sumInsuredFirePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sum Insured Under Fire Policy *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter sum insured" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firePolicyInsurerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fire Policy Insurer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter fire policy insurer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="firePolicyInsurerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fire Policy Insurer Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter fire policy insurer address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="previousBurglaryLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Have you had any previous burglary/theft loss? *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="previous-loss-yes" />
                      <Label htmlFor="previous-loss-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="previous-loss-no" />
                      <Label htmlFor="previous-loss-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {watchedValues.previousBurglaryLoss && (
            <FormField
              control={form.control}
              name="previousLossExplanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Loss Explanation</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details of previous burglary/theft losses" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      ),
      isValid: form.formState.isValid
    },
    
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button type="button" onClick={addPropertyItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Estimated Value</TableHead>
                  <TableHead>Net Amount Claimed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`propertyItems.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`propertyItems.${index}.costPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`propertyItems.${index}.purchaseDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`propertyItems.${index}.estimatedValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`propertyItems.${index}.netAmountClaimed`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePropertyItem(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ),
      isValid: form.formState.isValid
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
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                NEM Insurance is committed to protecting your personal information. The data you provide in this form will be used to process your insurance claim and may be shared with relevant third parties as necessary for claim processing.
              </p>
              <p className="text-sm text-gray-600">
                Your information will be stored securely and will not be used for any purpose other than claim processing without your explicit consent.
              </p>
            </CardContent>
          </Card>
          
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
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the data privacy policy and declare that the information provided is true and complete *
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
          
          <div className="text-sm text-gray-600">
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>
      ),
      isValid: watchedValues.agreeToDataPrivacy && watchedValues.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Burglary, Housebreaking and Larceny Claim Form</h1>
          <p className="text-gray-600">Submit your claim for burglary, housebreaking, or larceny incidents</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <MultiStepForm
              steps={steps}
              onSubmit={form.handleSubmit(onSubmit)}
              isSubmitting={isSubmitting}
              submitButtonText="Submit Claim"
            />
          </form>
        </Form>

        {/* Summary Modal */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim Submission</DialogTitle>
            </DialogHeader>
            {submittedData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Policy Number:</strong> {submittedData.policyNumber}</div>
                  <div><strong>Name:</strong> {submittedData.nameOfInsured}</div>
                  <div><strong>Email:</strong> {submittedData.email}</div>
                  <div><strong>Phone:</strong> {submittedData.phone}</div>
                  <div><strong>Date of Theft:</strong> {submittedData.dateOfTheft}</div>
                  <div><strong>Time of Theft:</strong> {submittedData.timeOfTheft}</div>
                </div>
                
                <div>
                  <strong>Property Items:</strong>
                  <div className="mt-2 space-y-2">
                    {submittedData.propertyItems.map((item, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div><strong>Description:</strong> {item.description}</div>
                        <div><strong>Cost Price:</strong> ₦{item.costPrice.toLocaleString()}</div>
                        <div><strong>Net Amount Claimed:</strong> ₦{item.netAmountClaimed.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setShowSummary(false)}>
                    Back to Edit
                  </Button>
                  <AuthRequiredSubmit onSubmit={confirmSubmit} isSubmitting={isSubmitting}>
                    Confirm & Submit Claim
                  </AuthRequiredSubmit>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">Claim Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <p>Your burglary claim has been submitted successfully. You will receive a confirmation email shortly.</p>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BurglaryClaimForm;
