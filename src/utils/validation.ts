
import * as Yup from 'yup';

// Phone number validation
export const phoneSchema = Yup.string()
  .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .required('Phone number is required');

// Email validation
export const emailSchema = Yup.string()
  .email('Please enter a valid email address')
  .required('Email is required');

// Date validation for string dates (HTML date inputs)
export const dateStringSchema = Yup.string()
  .required('Date is required');

// File validation
export const fileSchema = Yup.mixed()
  .test('fileSize', 'File size must be less than 10MB', (value: any) => {
    return !value || (value && value.size <= 10 * 1024 * 1024);
  })
  .test('fileType', 'Only PDF, DOC, DOCX, JPG, PNG files are allowed', (value: any) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    return !value || (value && allowedTypes.includes(value.type));
  });

// Common field validations
export const requiredString = (fieldName: string) => 
  Yup.string().required(`${fieldName} is required`);

export const optionalString = () => Yup.string().notRequired();

export const requiredNumber = (fieldName: string) => 
  Yup.number().required(`${fieldName} is required`).positive(`${fieldName} must be positive`);

export const optionalNumber = () => Yup.number().notRequired().positive('Must be positive');

// KYC validation schemas
export const individualKYCSchema = Yup.object({
  // Personal Information
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  middleName: optionalString(),
  dateOfBirth: dateStringSchema,
  gender: Yup.string().oneOf(['male', 'female', 'other']).required('Gender is required'),
  nationality: requiredString('Nationality'),
  countryOfResidence: requiredString('Country of residence'),
  
  // Contact Information
  email: emailSchema,
  phoneNumber: phoneSchema,
  alternatePhone: optionalString(),
  residentialAddress: requiredString('Residential address'),
  mailingAddress: optionalString(),
  
  // Identification
  identificationType: Yup.string().oneOf(['passport', 'nationalId', 'driversLicense']).required('Identification type is required'),
  identificationNumber: requiredString('Identification number'),
  issueDate: dateStringSchema,
  expiryDate: Yup.string().notRequired(),
  
  // Employment
  employmentStatus: Yup.string().oneOf(['employed', 'selfEmployed', 'unemployed', 'retired', 'student']).required('Employment status is required'),
  occupation: requiredString('Occupation'),
  employer: optionalString(),
  annualIncome: requiredNumber('Annual income'),
  
  // Documents - all optional
  identificationDocument: fileSchema.notRequired(),
  proofOfAddress: fileSchema.notRequired(),
  passport: fileSchema.notRequired(),
});

export const corporateKYCSchema = Yup.object({
  // Company Information
  companyName: requiredString('Company name'),
  registrationNumber: requiredString('Registration number'),
  incorporationDate: dateStringSchema,
  countryOfIncorporation: requiredString('Country of incorporation'),
  businessType: requiredString('Business type'),
  industry: requiredString('Industry'),
  
  // Contact Information
  registeredAddress: requiredString('Registered address'),
  businessAddress: requiredString('Business address'),
  phoneNumber: phoneSchema,
  email: emailSchema,
  website: optionalString(),
  
  // Financial Information
  annualRevenue: requiredNumber('Annual revenue'),
  numberOfEmployees: requiredNumber('Number of employees'),
  
  // Directors and Shareholders
  directors: Yup.array().of(Yup.object({
    name: requiredString('Director name'),
    position: requiredString('Position'),
    nationality: requiredString('Nationality'),
    shareholding: optionalNumber(),
  })).min(1, 'At least one director is required'),
  
  // Documents - all optional
  certificateOfIncorporation: fileSchema.notRequired(),
  memorandumOfAssociation: fileSchema.notRequired(),
  auditedFinancialStatements: fileSchema.notRequired(),
  boardResolution: fileSchema.notRequired(),
});

// Motor claim schema
export const motorClaimSchema = Yup.object({
  // Claimant Information
  claimantName: requiredString('Claimant name'),
  claimantPhone: phoneSchema,
  claimantEmail: emailSchema,
  claimantAddress: requiredString('Address'),
  
  // Vehicle Information
  vehicleMake: requiredString('Vehicle make'),
  vehicleModel: requiredString('Vehicle model'),
  vehicleYear: Yup.number().required('Vehicle year is required').min(1900).max(new Date().getFullYear() + 1),
  vehicleRegistration: requiredString('Vehicle registration'),
  chassisNumber: requiredString('Chassis number'),
  engineNumber: requiredString('Engine number'),
  
  // Policy Information
  policyNumber: requiredString('Policy number'),
  policyStartDate: dateStringSchema,
  policyEndDate: dateStringSchema,
  
  // Incident Information
  incidentDate: dateStringSchema,
  incidentTime: requiredString('Incident time'),
  incidentLocation: requiredString('Incident location'),
  incidentDescription: requiredString('Incident description'),
  damageDescription: requiredString('Damage description'),
  
  // Claim Information
  claimAmount: requiredNumber('Claim amount'),
  thirdPartyInvolved: Yup.string().oneOf(['yes', 'no']).required('Please specify if third party was involved'),
  policeReportFiled: Yup.string().oneOf(['yes', 'no']).required('Please specify if police report was filed'),
  
  // Documents - all optional
  vehiclePhotos: fileSchema.notRequired(),
  policeReport: fileSchema.notRequired(),
  driverLicense: fileSchema.notRequired(),
  vehicleRegistrationDoc: fileSchema.notRequired(),
});

// Professional Indemnity claim schema
export const professionalIndemnityClaimSchema = Yup.object({
  // Policy Details
  policyNumber: requiredString('Policy number'),
  coverageFromDate: dateStringSchema,
  coverageToDate: dateStringSchema,
  
  // Insured Details
  insuredName: requiredString('Insured name'),
  companyName: optionalString(),
  title: requiredString('Title'),
  dateOfBirth: dateStringSchema,
  gender: requiredString('Gender'),
  address: requiredString('Address'),
  phone: phoneSchema,
  email: emailSchema,
  
  // Claimant Details
  claimantName: requiredString('Claimant name'),
  claimantAddress: requiredString('Claimant address'),
  
  // Contract Details
  contractDescription: requiredString('Contract description'),
  contractEvidenced: Yup.string().oneOf(['yes', 'no']).required('Contract evidence required'),
  contractDetails: optionalString(),
  workPerformed: requiredString('Work performed'),
  workPerformer: requiredString('Work performer'),
  
  // Claim Details
  claimNature: requiredString('Claim nature'),
  dateAware: dateStringSchema,
  dateClaimMade: dateStringSchema,
  intimationMethod: Yup.string().oneOf(['oral', 'written']).required('Intimation method required'),
  amountClaimed: requiredNumber('Amount claimed'),
  
  // Response
  responseComments: requiredString('Response comments'),
  quantumComments: requiredString('Quantum comments'),
  estimatedLiability: requiredNumber('Estimated liability'),
  additionalInfo: optionalString(),
  solicitorInstructed: Yup.string().oneOf(['yes', 'no']).required('Solicitor instruction required'),
  
  // Declaration
  signature: requiredString('Signature'),
  
  // Documents - all optional
  contractDocument: fileSchema.notRequired(),
  writtenIntimation: fileSchema.notRequired(),
  additionalDocuments: fileSchema.notRequired(),
});

// Public Liability claim schema
export const publicLiabilityClaimSchema = Yup.object({
  // Policy Details
  policyNumber: requiredString('Policy number'),
  coverageFromDate: dateStringSchema,
  coverageToDate: dateStringSchema,
  
  // Insured Details
  companyName: optionalString(),
  address: requiredString('Address'),
  phone: phoneSchema,
  email: emailSchema,
  
  // Loss Details
  accidentDate: dateStringSchema,
  accidentTime: requiredString('Accident time'),
  accidentPlace: requiredString('Accident place'),
  accidentDetails: requiredString('Accident details'),
  witnesses: Yup.array().of(Yup.object({
    name: requiredString('Witness name'),
    address: requiredString('Witness address'),
    isEmployee: Yup.string().oneOf(['yes', 'no']).required('Employee status required'),
  })).min(0),
  employeeActivity: requiredString('Employee activity'),
  accidentCauser: requiredString('Accident causer'),
  
  // Police and Insurance
  policeInvolved: Yup.string().oneOf(['yes', 'no']).required('Police involvement required'),
  otherPolicies: Yup.string().oneOf(['yes', 'no']).required('Other policies required'),
  
  // Claimant
  claimantName: requiredString('Claimant name'),
  claimantAddress: requiredString('Claimant address'),
  injuryNature: requiredString('Injury nature'),
  claimNoticeReceived: Yup.string().oneOf(['yes', 'no']).required('Claim notice required'),
  
  // Declaration
  signature: requiredString('Signature'),
  
  // Documents - all optional
  claimNoticeDocument: fileSchema.notRequired(),
});

// CDD validation schemas
export const corporateCDDSchema = Yup.object({
  // Company Info
  companyName: requiredString('Company name'),
  registeredAddress: requiredString('Registered address'),
  incorporationNumber: requiredString('Incorporation number'),
  incorporationState: requiredString('Incorporation state'),
  incorporationDate: dateStringSchema,
  businessNature: requiredString('Business nature'),
  companyType: requiredString('Company type'),
  companyTypeOther: optionalString(),
  email: emailSchema,
  website: requiredString('Website'),
  taxId: optionalString(),
  telephone: phoneSchema,
  
  // Directors
  directors: Yup.array().of(Yup.object({
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    nationality: requiredString('Nationality'),
    country: requiredString('Country'),
    occupation: requiredString('Occupation'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: optionalString(),
    employerPhone: optionalString(),
    residentialAddress: requiredString('Residential address'),
    taxIdNumber: optionalString(),
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuingBody: requiredString('Issuing body'),
    issuedDate: dateStringSchema,
    expiryDate: optionalString(),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: requiredString('Bank name'),
  localAccountNumber: requiredString('Account number'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignBankName: optionalString(),
  foreignAccountNumber: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Documents
  cacCertificate: fileSchema.required('CAC Certificate is required'),
  identificationMeans: fileSchema.required('Identification document is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});

export const naicomCorporateCDDSchema = Yup.object({
  // Company Info
  companyName: requiredString('Company name'),
  registeredAddress: requiredString('Registered address'),
  incorporationNumber: requiredString('Incorporation number'),
  incorporationState: requiredString('Incorporation state'),
  incorporationDate: dateStringSchema,
  businessNature: requiredString('Business nature'),
  companyType: requiredString('Company type'),
  companyTypeOther: optionalString(),
  email: emailSchema,
  website: requiredString('Website'),
  taxId: requiredString('Tax ID'),
  telephone: phoneSchema,
  
  // Directors
  directors: Yup.array().of(Yup.object({
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    nationality: requiredString('Nationality'),
    country: requiredString('Country'),
    occupation: requiredString('Occupation'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: optionalString(),
    employerPhone: optionalString(),
    residentialAddress: requiredString('Residential address'),
    taxIdNumber: optionalString(),
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuingBody: requiredString('Issuing body'),
    issuedDate: dateStringSchema,
    expiryDate: optionalString(),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: requiredString('Bank name'),
  localAccountNumber: requiredString('Account number'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignBankName: optionalString(),
  foreignAccountNumber: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Documents
  cacCertificate: fileSchema.required('CAC Certificate is required'),
  identificationMeans: fileSchema.required('Identification document is required'),
  naicomLicense: fileSchema.required('NAICOM License is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Partners CDD Schema
export const partnersCDDSchema = Yup.object({
  // Company Info
  companyName: requiredString('Company name'),
  registeredAddress: requiredString('Registered address'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: requiredString('Country'),
  email: emailSchema,
  website: requiredString('Website'),
  contactPersonName: requiredString('Contact person name'),
  contactPersonNumber: phoneSchema,
  taxId: optionalString(),
  vatRegistrationNumber: requiredString('VAT registration number'),
  incorporationNumber: requiredString('Incorporation number'),
  incorporationDate: dateStringSchema,
  incorporationState: requiredString('Incorporation state'),
  businessNature: requiredString('Business nature'),
  bvn: Yup.string().length(11).required('BVN is required'),
  
  // Directors
  directors: Yup.array().of(Yup.object({
    title: requiredString('Title'),
    gender: requiredString('Gender'),
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    residentialAddress: requiredString('Residential address'),
    position: requiredString('Position'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    occupation: requiredString('Occupation'),
    bvn: Yup.string().length(11).required('BVN is required'),
    taxIdNumber: optionalString(),
    passportNumber: requiredString('Passport number'),
    passportIssuedCountry: requiredString('Passport issued country'),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
    nationality: requiredString('Nationality'),
    phoneNumber: phoneSchema,
    email: emailSchema,
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuedDate: dateStringSchema,
    expiryDate: dateStringSchema,
    issuingBody: requiredString('Issuing body'),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localAccountNumber: requiredString('Account number'),
  localBankName: requiredString('Bank name'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignAccountNumber: optionalString(),
  foreignBankName: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Documents
  certificateOfIncorporation: fileSchema.required('Certificate of incorporation is required'),
  directorId1: fileSchema.required('Director 1 identification is required'),
  directorId2: fileSchema.required('Director 2 identification is required'),
  cacStatusReport: fileSchema.required('CAC status report is required'),
  vatRegistrationLicense: fileSchema.required('VAT registration license is required'),
  taxClearanceCertificate: fileSchema.required('Tax clearance certificate is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});

// NAICOM Partners CDD Schema
export const naicomPartnersCDDSchema = Yup.object({
  // Company Info  
  companyName: requiredString('Company name'),
  registeredAddress: requiredString('Registered address'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: requiredString('Country'),
  email: emailSchema,
  website: requiredString('Website'),
  contactPersonName: requiredString('Contact person name'),
  contactPersonNumber: phoneSchema,
  taxId: requiredString('Tax ID'),
  vatRegistrationNumber: requiredString('VAT registration number'),
  incorporationNumber: requiredString('Incorporation number'),
  incorporationDate: dateStringSchema,
  incorporationState: requiredString('Incorporation state'),
  businessNature: requiredString('Business nature'),
  bvn: Yup.string().length(11).required('BVN is required'),
  naicomLicenseIssuingDate: dateStringSchema,
  naicomLicenseExpiryDate: dateStringSchema,
  
  // Directors
  directors: Yup.array().of(Yup.object({
    title: requiredString('Title'),
    gender: requiredString('Gender'),
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    residentialAddress: requiredString('Residential address'),
    position: requiredString('Position'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    occupation: requiredString('Occupation'),
    bvn: Yup.string().length(11).required('BVN is required'),
    taxIdNumber: optionalString(),
    passportNumber: requiredString('Passport number'),
    passportIssuedCountry: requiredString('Passport issued country'),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
    nationality: requiredString('Nationality'),
    phoneNumber: phoneSchema,
    email: emailSchema,
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuedDate: dateStringSchema,
    expiryDate: dateStringSchema,
    issuingBody: requiredString('Issuing body'),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localAccountNumber: requiredString('Account number'),
  localBankName: requiredString('Bank name'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignAccountNumber: optionalString(),
  foreignBankName: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Documents
  certificateOfIncorporation: fileSchema.required('Certificate of incorporation is required'),
  directorId1: fileSchema.required('Director 1 identification is required'),
  directorId2: fileSchema.required('Director 2 identification is required'),
  cacStatusReport: fileSchema.required('CAC status report is required'),
  vatRegistrationLicense: fileSchema.required('VAT registration license is required'),
  taxClearanceCertificate: fileSchema.required('Tax clearance certificate is required'),
  naicomLicenseCertificate: fileSchema.notRequired(),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Brokers CDD Schema
export const brokersCDDSchema = Yup.object({
  // Company Info
  companyName: requiredString('Company name'),
  companyAddress: requiredString('Company address'),
  city: requiredString('City'),
  state: requiredString('State'),
  country: requiredString('Country'),
  incorporationNumber: requiredString('Incorporation number'),
  registrationNumber: requiredString('Registration number'),
  incorporationState: requiredString('Incorporation state'),
  companyType: requiredString('Company type'),
  companyTypeOther: optionalString(),
  incorporationDate: dateStringSchema,
  email: emailSchema,
  website: requiredString('Website'),
  businessType: requiredString('Business type'),
  taxNumber: requiredString('Tax number'),
  telephone: phoneSchema,
  
  // Directors
  directors: Yup.array().of(Yup.object({
    title: requiredString('Title'),
    gender: requiredString('Gender'),
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    nationality: requiredString('Nationality'),
    residenceCountry: requiredString('Residence country'),
    occupation: requiredString('Occupation'),
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: requiredString('Employer name'),
    phoneNumber: phoneSchema,
    address: requiredString('Address'),
    email: emailSchema,
    taxIdNumber: optionalString(),
    passportNumber: optionalString(),
    passportIssuedCountry: optionalString(),
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuedBy: requiredString('Issued by'),
    issuedDate: dateStringSchema,
    expiryDate: optionalString(),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: requiredString('Bank name'),
  localBankBranch: requiredString('Bank branch'),
  currentAccountNumber: requiredString('Account number'),
  localAccountOpeningDate: dateStringSchema,
  
  domiciliaryAccountNumber: optionalString(),
  foreignBankName: optionalString(),
  foreignBankBranch: optionalString(),
  currency: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Documents
  certificateOfIncorporation: fileSchema.required('Certificate of incorporation is required'),
  directorId1: fileSchema.required('Director 1 identification is required'),
  directorId2: fileSchema.required('Director 2 identification is required'),
  naicomLicenseCertificate: fileSchema.notRequired(),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Individual CDD Schema
export const individualCDDSchema = Yup.object({
  // Personal Info
  title: requiredString('Title'),
  firstName: requiredString('First name'),
  lastName: requiredString('Last name'),
  contactAddress: requiredString('Contact address'),
  gender: requiredString('Gender'),
  residenceCountry: requiredString('Residence country'),
  dateOfBirth: dateStringSchema,
  placeOfBirth: requiredString('Place of birth'),
  email: emailSchema,
  mobileNumber: phoneSchema,
  residentialAddress: requiredString('Residential address'),
  nationality: requiredString('Nationality'),
  occupation: requiredString('Occupation'),
  position: optionalString(),
  
  // Additional Info
  businessType: requiredString('Business type'),
  businessTypeOther: optionalString(),
  employerEmail: emailSchema,
  employerName: optionalString(),
  employerTelephone: optionalString(),
  employerAddress: optionalString(),
  taxId: optionalString(),
  bvn: Yup.string().length(11).required('BVN is required'),
  idType: requiredString('ID type'),
  identificationNumber: requiredString('Identification number'),
  issuingCountry: requiredString('Issuing country'),
  issuedDate: dateStringSchema,
  expiryDate: optionalString(),
  
  // Account Details & Uploads
  annualIncomeRange: requiredString('Annual income range'),
  premiumPaymentSource: requiredString('Premium payment source'),
  premiumPaymentSourceOther: optionalString(),
  identificationMeans: fileSchema.required('Identification document is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Agents CDD Schema
export const agentsCDDSchema = Yup.object({
  // Personal Info
  firstName: requiredString('First name'),
  middleName: optionalString(),
  lastName: requiredString('Last name'),
  residentialAddress: requiredString('Residential address'),
  gender: requiredString('Gender'),
  position: requiredString('Position'),
  dateOfBirth: dateStringSchema,
  placeOfBirth: requiredString('Place of birth'),
  incomeSource: requiredString('Income source'),
  incomeSourceOther: optionalString(),
  nationality: requiredString('Nationality'),
  phoneNumber: phoneSchema,
  bvn: Yup.string().length(11).required('BVN is required'),
  taxIdNumber: optionalString(),
  occupation: requiredString('Occupation'),
  email: emailSchema,
  idType: requiredString('ID type'),
  identificationNumber: requiredString('Identification number'),
  issuedDate: dateStringSchema,
  expiryDate: optionalString(),
  issuingBody: requiredString('Issuing body'),
  
  // Additional Info
  agentName: requiredString('Agent name'),
  agentOfficeAddress: requiredString('Agent office address'),
  naicomLicenseNumber: requiredString('NAICOM license number'),
  licenseIssuedDate: dateStringSchema,
  licenseExpiryDate: dateStringSchema,
  emailAddress: emailSchema,
  website: requiredString('Website'),
  mobileNumber: phoneSchema,
  taxIdentificationNumber: optionalString(),
  arianMembershipNumber: requiredString('ARIAN membership number'),
  approvedPrincipals: requiredString('Approved principals'),
  
  // Financial Info
  localAccountNumber: requiredString('Account number'),
  localBankName: requiredString('Bank name'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignAccountNumber: optionalString(),
  foreignBankName: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Individual KYC Updated Schema
export const individualKYCUpdatedSchema = Yup.object({
  // Personal Info
  officeLocation: requiredString('Office location'),
  title: requiredString('Title'),
  firstName: requiredString('First name'),
  middleName: requiredString('Middle name'),
  lastName: requiredString('Last name'),
  contactAddress: requiredString('Contact address'),
  occupation: requiredString('Occupation'),
  gender: requiredString('Gender'),
  dateOfBirth: dateStringSchema,
  motherMaidenName: requiredString('Mother maiden name'),
  employerName: optionalString(),
  employerTelephone: optionalString(),
  employerAddress: optionalString(),
  city: requiredString('City'),
  state: requiredString('State'),
  country: requiredString('Country'),
  nationality: requiredString('Nationality'),
  residentialAddress: requiredString('Residential address'),
  mobileNumber: phoneSchema,
  email: emailSchema,
  taxId: optionalString(),
  bvn: Yup.string().length(11).required('BVN is required'),
  idType: requiredString('ID type'),
  identificationNumber: requiredString('Identification number'),
  issuingCountry: requiredString('Issuing country'),
  issuedDate: dateStringSchema,
  expiryDate: optionalString(),
  incomeSource: requiredString('Income source'),
  incomeSourceOther: optionalString(),
  annualIncomeRange: requiredString('Annual income range'),
  premiumPaymentSource: requiredString('Premium payment source'),
  premiumPaymentSourceOther: optionalString(),
  
  // Account Details
  localBankName: requiredString('Bank name'),
  localAccountNumber: requiredString('Account number'),
  localBankBranch: requiredString('Bank branch'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignBankName: optionalString(),
  foreignAccountNumber: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: optionalString(),
  
  // Upload
  identificationMeans: fileSchema.required('Identification document is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});

// Corporate KYC Updated Schema
export const corporateKYCUpdatedSchema = Yup.object({
  // Company Info
  nemBranchOffice: requiredString('NEM branch office'),
  insured: requiredString('Insured'),
  officeAddress: requiredString('Office address'),
  ownershipType: requiredString('Ownership type'),
  contactPerson: requiredString('Contact person'),
  website: requiredString('Website'),
  incorporationNumber: requiredString('Incorporation number'),
  incorporationState: requiredString('Incorporation state'),
  incorporationDate: dateStringSchema,
  bvn: Yup.string().length(11).required('BVN is required'),
  contactPersonMobile: phoneSchema,
  taxId: optionalString(),
  email: emailSchema,
  businessType: requiredString('Business type'),
  estimatedTurnover: requiredString('Estimated turnover'),
  premiumPaymentSource: requiredString('Premium payment source'),
  premiumPaymentSourceOther: optionalString(),
  
  // Directors
  directors: Yup.array().of(Yup.object({
    firstName: requiredString('First name'),
    middleName: optionalString(),
    lastName: requiredString('Last name'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: requiredString('Place of birth'),
    nationality: requiredString('Nationality'),
    country: requiredString('Country'),
    occupation: requiredString('Occupation'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: optionalString(),
    employerPhone: optionalString(),
    residentialAddress: requiredString('Residential address'),
    taxIdNumber: optionalString(),
    idType: requiredString('ID type'),
    identificationNumber: requiredString('Identification number'),
    issuingBody: requiredString('Issuing body'),
    issuedDate: dateStringSchema,
    expiryDate: optionalString(),
    incomeSource: requiredString('Income source'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details & Verification
  verificationDocumentType: requiredString('Verification document type'),
  verificationDocument: fileSchema.required('Verification document is required'),
  
  // Declaration
  signature: requiredString('Signature'),
});
