// Group Personal Accident Insurance Claim Types
export interface GroupPersonalAccidentClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;
  
  // Details of Loss
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  incidentDescription: string;
  particularsOfInjuries: string;
  
  // Witness Information
  witnesses: Array<{
    name: string;
    address: string;
  }>;
  
  // Doctor Information
  doctorName: string;
  doctorAddress: string;
  isUsualDoctor: boolean;
  
  // Incapacity Details
  totalIncapacityFrom?: string;
  totalIncapacityTo?: string;
  partialIncapacityFrom?: string;
  partialIncapacityTo?: string;
  
  // Other Insurers
  otherInsurerName: string;
  otherInsurerAddress: string;
  otherPolicyNumber: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Fire and Special Perils Claim Types
export interface FireSpecialPerilsClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  name: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Loss Details
  premisesAddress: string;
  premisesTelephone: string;
  dateOfOccurrence: string;
  timeOfOccurrence: string;
  incidentDescription: string;
  causeOfFire: string;
  
  // Premises Use
  usedAsPerPolicy: boolean;
  usageDetails?: string;
  purposeOfUse: string;
  unallowedRiskIntroduced: boolean;
  unallowedRiskDetails?: string;
  measuresWhenDiscovered: string;
  
  // Property Ownership
  soleOwner: boolean;
  otherOwnersName?: string;
  otherOwnersAddress?: string;
  
  // Other Insurance
  hasOtherInsurance: boolean;
  otherInsurerDetails?: string;
  
  // Valuation
  premisesContentsValue: number;
  hasPreviousClaim: boolean;
  previousClaimDate?: string;
  previousClaimAmount?: number;
  
  // Items Lost or Damaged
  itemsLost: Array<{
    description: string;
    costPrice: number;
    purchaseDate: string;
    estimatedValue: number;
    salvageValue: number;
    netAmountClaimed: number;
  }>;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}
