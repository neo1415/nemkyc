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
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  countryOfResidence: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  residentialAddress: string;
  mailingAddress?: string;
  identificationType: 'passport' | 'nationalId' | 'driversLicense';
  identificationNumber: string;
  issueDate: string;
  expiryDate: string;
  employmentStatus: 'employed' | 'selfEmployed' | 'unemployed' | 'retired' | 'student';
  occupation: string;
  employer?: string;
  annualIncome: number;
  identificationDocument?: File;
  proofOfAddress?: File;
  passport?: File;
}

export interface CorporateKYCData {
  companyName: string;
  registrationNumber: string;
  incorporationDate: string;
  countryOfIncorporation: string;
  businessType: string;
  industry: string;
  registeredAddress: string;
  businessAddress: string;
  phoneNumber: string;
  email: string;
  website?: string;
  annualRevenue: number;
  numberOfEmployees: number;
  directors: Array<{
    name: string;
    position: string;
    nationality: string;
    shareholding?: number;
  }>;
  certificateOfIncorporation?: File;
  memorandumOfAssociation?: File;
  auditedFinancialStatements?: File;
  boardResolution?: File;
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
