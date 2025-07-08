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

// Rent Assurance Policy Claim Types
export interface RentAssuranceClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  nameOfInsured: string;
  address: string;
  age: number;
  email: string;
  phone: string;
  nameOfLandlord: string;
  addressOfLandlord: string;
  livingAtPremisesFrom: string;
  livingAtPremisesTo: string;
  
  // Claim Information
  periodOfDefaultFrom: string;
  periodOfDefaultTo: string;
  amountDefaulted: number;
  rentDueDate: string;
  rentPaymentFrequency: string;
  rentPaymentFrequencyOther?: string;
  causeOfInabilityToPay: string;
  
  // Beneficiary Details
  nameOfBeneficiary: string;
  beneficiaryAge: number;
  beneficiaryAddress: string;
  beneficiaryEmail: string;
  beneficiaryPhone: string;
  beneficiaryOccupation: string;
  
  // Declaration
  writtenDeclaration: string;
  agreeToDataPrivacy: boolean;
  signature: string;
  
  // Documents
  rentAgreement?: File;
  demandNote?: File;
  quitNotice?: File;
}

// Money Insurance Claim Types
export interface PersonDiscoveringLoss {
  name: string;
  position: string;
  salary: number;
}

export interface KeyHolder {
  name: string;
  position: string;
  salary: number;
}

export interface MoneyInsuranceClaimData {
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
  lossDate: string;
  lossTime: string;
  lossLocation: string;
  moneyInTransitOrSafe: string;
  
  // If loss was in transit
  peopleDiscoveringLoss: PersonDiscoveringLoss[];
  hadPoliceEscort: boolean;
  amountInPossessionAtStart?: number;
  disbursementsDuringJourney?: number;
  doubtEmployeeIntegrity: boolean;
  integrityExplanation?: string;
  
  // If loss was in safe
  personDiscoveringLossInSafe?: string;
  safeBrickedOrFree: string;
  keyHolders: KeyHolder[];
  
  // General
  howItHappened: string;
  policeNotified: boolean;
  policeStation?: string;
  previousLossUnderPolicy: boolean;
  previousLossDetails?: string;
  amountOfLoss: number;
  lossDescription: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}
