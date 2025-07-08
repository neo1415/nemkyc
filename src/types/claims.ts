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

// Goods-in-Transit Insurance Claim Types
export interface GoodsItem {
  quantity: number;
  description: string;
  value: number;
}

export interface GoodsInTransitClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;
  businessType: string;
  
  // Details of Loss
  dateOfLoss: string;
  timeOfLoss: string;
  placeOfOccurrence: string;
  descriptionOfGoods: string;
  numberOfPackages: number;
  totalWeight: number;
  weightUnits: string;
  totalValue: number;
  howGoodsPacked: string;
  
  // Circumstances
  circumstancesOfLoss: string;
  otherVehicleInvolved: boolean;
  otherVehicleOwnerName?: string;
  otherVehicleOwnerAddress?: string;
  witnessName?: string;
  witnessAddress?: string;
  policeStation?: string;
  dateReportedToPolice?: string;
  dispatchAddress: string;
  dispatchDate: string;
  consigneeName: string;
  consigneeAddress: string;
  
  // Particulars of Goods
  goodsItems: GoodsItem[];
  
  // Inspection
  inspectionAddress: string;
  
  // If owner of goods
  isOwnerOfGoods: boolean;
  howTransported?: string;
  transporterInsurerName?: string;
  transporterInsurerAddress?: string;
  
  // If claiming as carrier
  goodsOwnerName?: string;
  goodsOwnerAddress?: string;
  goodsOwnerInsurerName?: string;
  goodsOwnerInsurerAddress?: string;
  
  // Vehicle/Transport
  goodsInSoundCondition: boolean;
  checkedByDriver: boolean;
  vehicleRegistration: string;
  staffLoadedUnloaded: boolean;
  receiptGiven: boolean;
  carriageConditionFile?: {
    name: string;
    type: string;
    url: string;
  };
  claimMadeAgainstYou: boolean;
  claimReceivedDate?: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Contractors, Plant and Machinery Claim Types
export interface PlantMachineryItem {
  itemNumber: string;
  yearOfManufacture: number;
  make: string;
  registrationNumber: string;
  dateOfPurchase: string;
  costPrice: number;
  deductionForAge: number;
  sumClaimed: number;
  claimType: 'presentValue' | 'repairs';
}

export interface Witness {
  name: string;
  address: string;
  phone: string;
}

export interface ContractorsPlantMachineryClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  nameOfInsured: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Plant/Machinery Details
  plantMachineryItems: PlantMachineryItem[];
  
  // Loss/Damage Details
  dateOfLoss: string;
  timeOfLoss: string;
  lastSeenIntact?: string;
  whereDidLossOccur: string;
  partsDamaged: string;
  whereCanBeInspected: string;
  fullAccountCircumstances: string;
  suspicionInformation?: string;
  
  // Witnesses
  witnesses: Witness[];
  
  // Theft/Third Party Details
  policeInformed: boolean;
  policeStation?: string;
  otherRecoveryActions?: string;
  isSoleOwner: boolean;
  ownershipDetails?: string;
  hasOtherInsurance: boolean;
  otherInsuranceDetails?: string;
  thirdPartyInvolved: boolean;
  thirdPartyName?: string;
  thirdPartyAddress?: string;
  thirdPartyInsurer?: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// All Risk Claim Types
export interface AllRiskPropertyItem {
  description: string;
  dateOfPurchase: string;
  costPrice: number;
  deductionForAge: number;
  amountClaimed: number;
  remarks: string;
}

export interface AllRiskClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  nameOfInsured: string;
  address: string;
  phone: string;
  email: string;
  
  // Details of Loss
  typeOfClaim: string;
  locationOfClaim: string;
  dateOfOccurrence: string;
  timeOfOccurrence: string;
  propertyDescription: string;
  circumstancesOfLoss: string;
  estimateOfLoss: number;
  
  // Property Details
  propertyItems: AllRiskPropertyItem[];
  
  // Ownership & Recovery
  isSoleOwner: boolean;
  ownershipExplanation?: string;
  hasHirePurchase: boolean;
  hirePurchaseCompany?: string;
  hirePurchaseAddress?: string;
  recoveryStepsTaken: string;
  hasOtherInsurance: boolean;
  otherInsuranceDetails?: string;
  hasPreviousLoss: boolean;
  previousLossDetails?: string;
  totalPropertyValue: number;
  hasOtherInsuranceAtTime: boolean;
  otherInsuranceAtTimeDetails?: string;
  hasPriorClaims: boolean;
  priorClaimsDetails?: string;
  policeInformed: boolean;
  policeStationDetails?: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}
