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
  expiryDate: Yup.string().required('Expiry date is required'),
  
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
  companyName: Yup.string().min(3).max(50).required('Company name is required'),
  registeredAddress: Yup.string().min(3).max(60).required('Registered address is required'),
  incorporationNumber: Yup.string().min(7).max(15).required('Incorporation number is required'),
  incorporationState: Yup.string().min(3).max(50).required('Incorporation state is required'),
  incorporationDate: dateStringSchema,
  businessNature: Yup.string().min(3).max(60).required('Business nature is required'),
  companyType: Yup.string().required('Company type is required'),
  companyTypeOther: optionalString(),
  email: Yup.string().email().min(5).max(50).required('Email is required'),
  website: Yup.string().required('Website is required'),
  taxId: Yup.string().min(6).max(15).notRequired(),
  telephone: Yup.string().min(5).max(11).required('Telephone is required'),
  
  // Directors
  directors: Yup.array().of(Yup.object({
    firstName: Yup.string().min(3).max(30).required('First name is required'),
    middleName: Yup.string().min(3).max(30).notRequired(),
    lastName: Yup.string().min(3).max(30).required('Last name is required'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: Yup.string().min(3).max(30).required('Place of birth is required'),
    nationality: requiredString('Nationality'),
    country: requiredString('Country'),
    occupation: Yup.string().min(3).max(30).required('Occupation is required'),
    email: Yup.string().email().min(6).max(30).required('Email is required'),
    phoneNumber: Yup.string().min(5).max(11).required('Phone number is required'),
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: Yup.string().min(2).max(50).notRequired(),
    employerPhone: Yup.string().min(5).max(11).notRequired(),
    residentialAddress: requiredString('Residential address'),
    taxIdNumber: optionalString(),
    idType: Yup.string().required('ID type is required'),
    identificationNumber: Yup.string().min(1).max(20).required('Identification number is required'),
    issuingBody: Yup.string().min(1).max(50).required('Issuing body is required'),
    issuedDate: dateStringSchema,
    expiryDate: Yup.string().notRequired(),
    incomeSource: Yup.string().required('Income source is required'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: Yup.string().min(3).max(50).required('Bank name is required'),
  localAccountNumber: Yup.string().min(7).max(10).required('Account number is required'),
  localBankBranch: Yup.string().min(3).max(30).required('Bank branch is required'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignBankName: optionalString(),
  foreignAccountNumber: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: Yup.string().notRequired(),
  
  // Documents
  cacCertificate: fileSchema.required('CAC Certificate is required'),
  identificationMeans: fileSchema.required('Identification document is required'),
});

export const naicomCorporateCDDSchema = Yup.object({
  // Company Info
  companyName: Yup.string().min(3).max(50).required('Company name is required'),
  registeredAddress: Yup.string().min(3).max(60).required('Registered address is required'),
  incorporationNumber: Yup.string().min(7).max(15).required('Incorporation number is required'),
  incorporationState: Yup.string().min(3).max(50).required('Incorporation state is required'),
  incorporationDate: dateStringSchema,
  businessNature: Yup.string().min(3).max(60).required('Business nature is required'),
  companyType: Yup.string().required('Company type is required'),
  companyTypeOther: optionalString(),
  email: Yup.string().email().min(5).max(50).required('Email is required'),
  website: Yup.string().required('Website is required'),
  taxId: Yup.string().min(6).max(15).required('Tax ID is required'),
  telephone: Yup.string().min(5).max(11).required('Telephone is required'),
  
  // Directors (same structure as corporate CDD)
  directors: Yup.array().of(Yup.object({
    firstName: Yup.string().min(3).max(30).required('First name is required'),
    middleName: Yup.string().min(3).max(30).notRequired(),
    lastName: Yup.string().min(3).max(30).required('Last name is required'),
    dateOfBirth: dateStringSchema,
    placeOfBirth: Yup.string().min(3).max(30).required('Place of birth is required'),
    nationality: requiredString('Nationality'),
    country: requiredString('Country'),
    occupation: Yup.string().min(3).max(30).required('Occupation is required'),
    email: Yup.string().email().min(6).max(30).required('Email is required'),
    phoneNumber: Yup.string().min(5).max(11).required('Phone number is required'),
    bvn: Yup.string().length(11).required('BVN is required'),
    employerName: Yup.string().min(2).max(50).notRequired(),
    employerPhone: Yup.string().min(5).max(11).notRequired(),
    residentialAddress: requiredString('Residential address'),
    taxIdNumber: optionalString(),
    idType: Yup.string().required('ID type is required'),
    identificationNumber: Yup.string().min(1).max(20).required('Identification number is required'),
    issuingBody: Yup.string().min(1).max(50).required('Issuing body is required'),
    issuedDate: dateStringSchema,
    expiryDate: Yup.string().notRequired(),
    incomeSource: Yup.string().required('Income source is required'),
    incomeSourceOther: optionalString(),
  })).min(1, 'At least one director is required'),
  
  // Account Details
  localBankName: Yup.string().min(3).max(50).required('Bank name is required'),
  localAccountNumber: Yup.string().min(7).max(10).required('Account number is required'),
  localBankBranch: Yup.string().min(3).max(30).required('Bank branch is required'),
  localAccountOpeningDate: dateStringSchema,
  
  foreignBankName: optionalString(),
  foreignAccountNumber: optionalString(),
  foreignBankBranch: optionalString(),
  foreignAccountOpeningDate: Yup.string().notRequired(),
  
  // Documents
  cacCertificate: fileSchema.required('CAC Certificate is required'),
  identificationMeans: fileSchema.required('Identification document is required'),
  naicomLicense: fileSchema.required('NAICOM License is required'),
});
