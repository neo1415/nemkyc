export interface User {
  uid: string;
  email: string;
  name: string;
  role: string;
  notificationPreference: 'email' | 'sms';
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// CDD Form Types
export interface Director {
  title?: string;
  gender?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  country: string;
  occupation: string;
  email: string;
  phoneNumber: string;
  bvn: string;
  employerName?: string;
  employerPhone?: string;
  residentialAddress: string;
  taxIdNumber?: string;
  idType: string;
  identificationNumber: string;
  issuingBody: string;
  issuedDate: string;
  expiryDate?: string;
  incomeSource: string;
  incomeSourceOther?: string;
}

export interface CorporateCDDData {
  companyName: string;
  registeredAddress: string;
  incorporationNumber: string;
  incorporationState: string;
  incorporationDate: string;
  businessNature: string;
  companyType: string;
  companyTypeOther?: string;
  email: string;
  website: string;
  taxId?: string;
  telephone: string;
  directors: Director[];
  localBankName: string;
  localAccountNumber: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignBankName?: string;
  foreignAccountNumber?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  identificationDocument?: File;
  agreeToDataPrivacy: boolean;
  signature: string;
}

export interface NaicomCorporateCDDData extends CorporateCDDData {
  taxId: string; // Required for NAICOM
  naicomLicense?: File;
}

export interface PartnersCDDData {
  companyName: string;
  registeredAddress: string;
  city: string;
  state: string;
  country: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonNumber: string;
  taxId?: string;
  vatRegistrationNumber: string;
  incorporationNumber: string;
  incorporationDate: string;
  incorporationState: string;
  businessNature: string;
  bvn: string;
  directors: Director[];
  localAccountNumber: string;
  localBankName: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignAccountNumber?: string;
  foreignBankName?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  certificateOfIncorporation?: File;
  directorId1?: File;
  directorId2?: File;
  cacStatusReport?: File;
  vatRegistrationLicense?: File;
  taxClearanceCertificate?: File;
  agreeToDataPrivacy: boolean;
  signature: string;
}

// KYC Form Types
export interface IndividualKYCData {
  // Personal Info
  officeLocation: string;
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  contactAddress: string;
  occupation: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  mothersMaidenName: string;
  employersName?: string;
  employersTelephone?: string;
  employersAddress?: string;
  city: string;
  state: string;
  country: string;
  nationality: 'Nigerian' | 'Foreign' | 'Both';
  residentialAddress: string;
  mobileNumber: string;
  email: string;
  taxId?: string;
  bvn: string;
  idType: 'passport' | 'nimc' | 'driversLicense' | 'votersCard' | 'nin';
  identificationNumber: string;
  issuingCountry: string;
  issuedDate: string;
  expiryDate?: string;
  sourceOfIncome: 'salary' | 'investments' | 'other';
  sourceOfIncomeOther?: string;
  annualIncomeRange: 'lessThan1M' | '1M-4M' | '4.1M-10M' | 'moreThan10M';
  premiumPaymentSource: 'salary' | 'investments' | 'other';
  premiumPaymentSourceOther?: string;
  
  // Account Details
  localBankName: string;
  localAccountNumber: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignBankName?: string;
  foreignAccountNumber?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  
  // Upload
  identificationDocument?: File;
  
  // Privacy & Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

export interface CorporateKYCData {
  // Company Info
  nemBranchOffice: string;
  insured: string;
  officeAddress: string;
  ownershipOfCompany: 'Nigerian' | 'Foreign' | 'Both';
  contactPerson: string;
  website: string;
  incorporationNumber: string;
  incorporationState: string;
  incorporationDate: string;
  bvn: string;
  contactPersonMobile: string;
  taxId?: string;
  email: string;
  businessType: string;
  estimatedTurnover: 'lessThan10M' | '11M-50M' | '51M-200M' | 'moreThan200M';
  premiumPaymentSource: 'salary' | 'investments' | 'other';
  premiumPaymentSourceOther?: string;
  
  // Director Info
  directors: Array<{
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    placeOfBirth: string;
    nationality: string;
    country: string;
    occupation: string;
    email: string;
    phoneNumber: string;
    bvn: string;
    employersName?: string;
    employersPhone?: string;
    residentialAddress: string;
    taxIdNumber?: string;
    idType: 'passport' | 'nimc' | 'driversLicense' | 'votersCard';
    identificationNumber: string;
    issuingBody: string;
    issuedDate: string;
    expiryDate?: string;
    sourceOfIncome: 'salary' | 'investments' | 'other';
    sourceOfIncomeOther?: string;
  }>;
  
  // Account Details & Verification
  companyVerificationDocument: 'incorporation' | 'cacStatus' | 'boardResolution' | 'powerOfAttorney';
  verificationDocumentUpload?: File;
  
  // Privacy & Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Claims Form Types
export interface MotorClaimData {
  claimantName: string;
  claimantPhone: string;
  claimantEmail: string;
  claimantAddress: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleRegistration: string;
  chassisNumber: string;
  engineNumber: string;
  policyNumber: string;
  policyStartDate: string;
  policyEndDate: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  damageDescription: string;
  claimAmount: number;
  thirdPartyInvolved: 'yes' | 'no';
  policeReportFiled: 'yes' | 'no';
  policeReported: boolean;
  policeStation?: string;
  policeReportNumber?: string;
  estimatedDamage: number;
  driverName: string;
  driverLicense: string;
  witnessName?: string;
  witnessPhone?: string;
  vehiclePhotos?: File[];
  policeReport?: File;
  vehicleRegistrationDoc?: File;
  signature: string;
  agreeToTerms: boolean;
}

export interface ProfessionalIndemnityClaimData {
  policyNumber: string;
  coverageFromDate: string;
  coverageToDate: string;
  insuredName: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  claimantName: string;
  claimantAddress: string;
  contractDetails: string;
  contractWritten: boolean;
  contractDocument?: File;
  contractTerms?: string;
  workPerformedFrom: string;
  workPerformedTo: string;
  workPerformedBy: string;
  claimNature: string;
  claimAwarenessDate: string;
  claimIntimationDate: string;
  intimationType: string;
  intimationDocument?: File;
  intimationDetails?: string;
  amountClaimed: number;
  responseComments: string;
  quantumComments: string;
  estimatedLiability: number;
  additionalInfo: boolean;
  additionalDetails?: string;
  additionalDocument?: File;
  solicitorInstructed: boolean;
  solicitorName?: string;
  solicitorAddress?: string;
  solicitorCompany?: string;
  solicitorRates?: string;
  agreeToDataPrivacy: boolean;
  signature: string;
}

export interface PublicLiabilityClaimData {
  policyNumber: string;
  coverageFromDate: string;
  coverageToDate: string;
  companyName?: string;
  address: string;
  phone: string;
  email: string;
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  accidentDescription: string;
  witnesses?: Array<{
    name: string;
    address: string;
    isEmployee: boolean;
  }>;
  employeeActivity: string;
  causedByName: string;
  causedByAddress: string;
  causedByEmployer?: string;
  policeInvolved: boolean;
  policeStation?: string;
  policeOfficerNumber?: string;
  otherInsurance: boolean;
  otherInsuranceDetails?: string;
  claimantName: string;
  claimantAddress: string;
  injuryDescription: string;
  claimReceived: boolean;
  claimReceivedFrom?: string;
  claimReceivedWhen?: string;
  claimReceivedForm?: string;
  claimDocument?: File;
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Employers Liability Claim Types
export interface Witness {
  name: string;
  address: string;
  phone?: string;
}

export interface EarningsMonth {
  monthEnding: string;
  wagesAndBonus: number;
  monthlyAllowances: number;
}

export interface EmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  insuredName: string;
  insuredAddress: string;
  insuredPhone: string;
  insuredEmail: string;
  
  // Injured Party Details
  injuredPartyName: string;
  injuredPartyAge: number;
  injuredPartyAddress: string;
  averageMonthlyEarnings: number;
  occupation: string;
  dateOfEmployment: string;
  maritalStatus: string;
  numberOfChildren: number;
  agesOfChildren?: string;
  previousAccidents: boolean;
  previousAccidentsDetails?: string;
  
  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;
  supervisorName: string;
  supervisorPosition: string;
  
  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  dateReported: string;
  reportedBy: string;
  dateStoppedWork: string;
  descriptionOfWork: string;
  howAccidentOccurred: string;
  soberOrIntoxicated: boolean;
  
  // Medical
  receivingTreatment: boolean;
  hospitalName?: string;
  hospitalAddress?: string;
  doctorName: string;
  doctorAddress: string;
  
  // Disablement
  totallyDisabled: boolean;
  dateStoppedWorking: string;
  estimatedDurationOfDisablement: string;
  ableToDoAnyDuties: boolean;
  dutiesDetails?: string;
  claimMadeOnYou: boolean;
  
  // Witnesses
  witnesses?: Witness[];
  
  // Other Insurers
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;
  
  // Statement of Earnings
  earnings: EarningsMonth[];
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Combined GPA & Employers Liability Claim Types
export interface CombinedGPAEmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  insuredName: string;
  insuredAddress: string;
  insuredPhone: string;
  insuredEmail: string;
  
  // Injured Party Details
  injuredPartyName: string;
  injuredPartyAge: number;
  injuredPartyAddress: string;
  averageMonthlyEarnings: number;
  occupation: string;
  dateOfEmployment: string;
  notDirectlyEmployed: boolean;
  employerName?: string;
  employerAddress?: string;
  durationEmployed: string;
  maritalStatus: string;
  previousAccidents: boolean;
  previousAccidentsDetails?: string;
  
  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;
  
  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  dateReported: string;
  dateTimeStoppedWork: string;
  workAtTime: string;
  howItOccurred: string;
  
  // Medical
  receivingTreatment: boolean;
  hospitalName?: string;
  hospitalAddress?: string;
  stillInHospital: boolean;
  dischargeDate?: string;
  ableToDoduties: boolean;
  dutiesDetails?: string;
  dateNatureResumedWork?: string;
  
  // Doctor Details
  doctorName: string;
  
  // Disablement
  totallyDisabled: boolean;
  estimatedDuration: string;
  
  // Witnesses
  witnesses?: Witness[];
  
  // Other Insurers
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;
  
  // Statement of Earnings
  earnings: EarningsMonth[];
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Burglary, Housebreaking and Larceny Claim Types
export interface PropertyItem {
  description: string;
  costPrice: number;
  purchaseDate: string;
  estimatedValue: number;
  netAmountClaimed: number;
}

export interface BurglaryClaimData {
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
  
  // Details of Loss
  premisesAddress: string;
  premisesTelephone: string;
  dateOfTheft: string;
  timeOfTheft: string;
  howEntryEffected: string;
  roomsEntered: string;
  premisesOccupied: boolean;
  lastOccupiedDate?: string;
  lastOccupiedTime?: string;
  suspicionsOnAnyone: boolean;
  suspicionName?: string;
  policeInformed: boolean;
  policeDate?: string;
  policeStationAddress?: string;
  soleOwner: boolean;
  ownerName?: string;
  ownerAddress?: string;
  otherInsurance: boolean;
  otherInsurerDetails?: string;
  totalContentsValue: number;
  sumInsuredFirePolicy: number;
  firePolicyInsurerName?: string;
  firePolicyInsurerAddress?: string;
  previousBurglaryLoss: boolean;
  previousLossExplanation?: string;
  
  // Property Details
  propertyItems: PropertyItem[];
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// NAICOM Partners CDD Types
export interface NaicomPartnersCDDData {
  // Company Info
  companyName: string;
  registeredAddress: string;
  city: string;
  state: string;
  country: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonNumber: string;
  taxId: string;
  vatRegistrationNumber: string;
  incorporationNumber: string;
  incorporationDate: string;
  incorporationState: string;
  businessNature: string;
  bvn: string;
  naicomLicenseIssuingDate: string;
  naicomLicenseExpiryDate: string;
  
  // Directors
  directors: Director[];
  
  // Account Details
  localAccountNumber: string;
  localBankName: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignAccountNumber?: string;
  foreignBankName?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  
  // Documents
  certificateOfIncorporation?: File;
  directorId1?: File;
  directorId2?: File;
  cacStatusReport?: File;
  vatRegistrationLicense?: File;
  taxClearanceCertificate?: File;
  naicomLicenseCertificate?: File;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Individual CDD Types
export interface IndividualCDDData {
  // Personal Info
  title: string;
  firstName: string;
  lastName: string;
  contactAddress: string;
  gender: 'male' | 'female';
  residenceCountry: string;
  dateOfBirth: string;
  placeOfBirth: string;
  email: string;
  mobileNumber: string;
  residentialAddress: string;
  nationality: string;
  occupation: string;
  position?: string;
  
  // Additional Info
  businessType: 'soleProprietor' | 'limitedLiability' | 'publicLimited' | 'jointVenture' | 'other';
  businessTypeOther?: string;
  employerEmail: string;
  employerName?: string;
  employerTelephone?: string;
  employerAddress?: string;
  taxId?: string;
  bvn: string;
  idType: 'passport' | 'nimc' | 'driversLicense' | 'votersCard' | 'nin';
  identificationNumber: string;
  issuingCountry: string;
  issuedDate: string;
  expiryDate?: string;
  
  // Account Details & Uploads
  annualIncomeRange: 'lessThan1M' | '1M-4M' | '4.1M-10M' | 'moreThan10M';
  premiumPaymentSource: 'salary' | 'investments' | 'other';
  premiumPaymentSourceOther?: string;
  identificationDocument?: File;
  signature: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
}

// Agents CDD Types
export interface AgentsCDDData {
  // Personal Info
  firstName: string;
  middleName?: string;
  lastName: string;
  residentialAddress: string;
  gender: 'male' | 'female';
  position: string;
  dateOfBirth: string;
  placeOfBirth: string;
  otherSourceOfIncome: 'salary' | 'investments' | 'other';
  otherSourceOfIncomeOther?: string;
  nationality: string;
  phoneNumber: string;
  bvn: string;
  taxIdNumber?: string;
  occupation: string;
  email: string;
  validMeansOfId: 'passport' | 'nimc' | 'driversLicense' | 'votersCard';
  identificationNumber: string;
  issuedDate: string;
  expiryDate?: string;
  issuingBody: string;
  
  // Additional Info
  agentName: string;
  agentsOfficeAddress: string;
  naicomLicenseNumber: string;
  licenseIssuedDate: string;
  licenseExpiryDate: string;
  emailAddress: string;
  website: string;
  mobileNumber: string;
  taxIdentificationNumber?: string;
  arianMembershipNumber: string;
  listOfAgentsApprovedPrincipals: string;
  
  // Financial Info
  localAccountNumber: string;
  localBankName: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignAccountNumber?: string;
  foreignBankName?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}
