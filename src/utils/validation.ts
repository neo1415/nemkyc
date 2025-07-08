import * as Yup from 'yup';

// Common validation rules
export const phoneValidation = Yup.string()
  .matches(/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number')
  .required('Phone number is required');

export const emailValidation = Yup.string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const bvnValidation = Yup.string()
  .matches(/^\d{11}$/, 'BVN must be exactly 11 digits')
  .required('BVN is required');

export const dateValidation = Yup.string()
  .required('Date is required');

// Director validation schema
export const directorSchema = Yup.object({
  firstName: Yup.string().min(3).max(30).required('First name is required'),
  middleName: Yup.string().min(3).max(30).optional(),
  lastName: Yup.string().min(3).max(30).required('Last name is required'),
  dateOfBirth: dateValidation,
  placeOfBirth: Yup.string().min(3).max(30).required('Place of birth is required'),
  nationality: Yup.string().required('Nationality is required'),
  country: Yup.string().required('Country is required'),
  occupation: Yup.string().min(3).max(30).required('Occupation is required'),
  email: emailValidation.max(30),
  phoneNumber: phoneValidation.max(11),
  bvn: bvnValidation,
  employerName: Yup.string().min(2).max(50).optional(),
  employerPhone: phoneValidation.optional(),
  residentialAddress: Yup.string().required('Residential address is required'),
  taxIdNumber: Yup.string().optional(),
  idType: Yup.string().required('ID type is required'),
  identificationNumber: Yup.string().min(1).max(20).required('Identification number is required'),
  issuingBody: Yup.string().min(1).max(50).required('Issuing body is required'),
  issuedDate: dateValidation,
  expiryDate: dateValidation.optional(),
  incomeSource: Yup.string().required('Income source is required'),
  incomeSourceOther: Yup.string().when('incomeSource', {
    is: 'Other',
    then: (schema) => schema.required('Please specify other income source'),
    otherwise: (schema) => schema.optional()
  })
});

// Corporate CDD validation schema
export const corporateCDDSchema = Yup.object({
  companyName: Yup.string().min(3).max(50).required('Company name is required'),
  registeredAddress: Yup.string().min(3).max(60).required('Registered address is required'),
  incorporationNumber: Yup.string().min(7).max(15).required('Incorporation number is required'),
  incorporationState: Yup.string().min(3).max(50).required('Incorporation state is required'),
  incorporationDate: dateValidation,
  businessNature: Yup.string().min(3).max(60).required('Nature of business is required'),
  companyType: Yup.string().required('Company type is required'),
  companyTypeOther: Yup.string().optional(),
  email: emailValidation.max(50),
  website: Yup.string().url('Please enter a valid website URL').required('Website is required'),
  taxId: Yup.string().min(6).max(15).optional(),
  telephone: phoneValidation.max(11),
  directors: Yup.array().of(directorSchema).min(1, 'At least one director is required'),
  localBankName: Yup.string().min(3).max(50).required('Bank name is required'),
  localAccountNumber: Yup.string().min(7).max(10).required('Account number is required'),
  localBankBranch: Yup.string().min(3).max(30).required('Bank branch is required'),
  localAccountOpeningDate: dateValidation,
  foreignBankName: Yup.string().optional(),
  foreignAccountNumber: Yup.string().optional(),
  foreignBankBranch: Yup.string().optional(),
  foreignAccountOpeningDate: dateValidation.optional(),
  identificationDocument: Yup.mixed().optional(),
  naicomLicense: Yup.mixed().optional(),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// NAICOM Corporate CDD validation schema
export const naicomCorporateCDDSchema = corporateCDDSchema.shape({
  taxId: Yup.string().min(6).max(15).required('Tax ID is required for NAICOM forms')
});

// Partners CDD validation schema
export const partnersCDDSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  registeredAddress: Yup.string().required('Registered address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  country: Yup.string().required('Country is required'),
  email: emailValidation,
  website: Yup.string().url('Please enter a valid website URL').required('Website is required'),
  contactPersonName: Yup.string().required('Contact person name is required'),
  contactPersonNumber: phoneValidation,
  taxId: Yup.string().optional(),
  vatRegistrationNumber: Yup.string().required('VAT registration number is required'),
  incorporationNumber: Yup.string().required('Incorporation number is required'),
  incorporationDate: dateValidation,
  incorporationState: Yup.string().required('Incorporation state is required'),
  businessNature: Yup.string().required('Nature of business is required'),
  bvn: bvnValidation,
  directors: Yup.array().of(directorSchema).min(1, 'At least one director is required'),
  localAccountNumber: Yup.string().required('Account number is required'),
  localBankName: Yup.string().required('Bank name is required'),
  localBankBranch: Yup.string().required('Bank branch is required'),
  localAccountOpeningDate: dateValidation,
  foreignAccountNumber: Yup.string().optional(),
  foreignBankName: Yup.string().optional(),
  foreignBankBranch: Yup.string().optional(),
  foreignAccountOpeningDate: dateValidation.optional(),
  certificateOfIncorporation: Yup.mixed().optional(),
  directorId1: Yup.mixed().optional(),
  directorId2: Yup.mixed().optional(),
  cacStatusReport: Yup.mixed().optional(),
  vatRegistrationLicense: Yup.mixed().optional(),
  taxClearanceCertificate: Yup.mixed().optional(),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Individual KYC validation schema
export const individualKYCSchema = Yup.object({
  officeLocation: Yup.string().required('Office location is required'),
  title: Yup.string().required('Title is required'),
  firstName: Yup.string().required('First name is required'),
  middleName: Yup.string().required('Middle name is required'),
  lastName: Yup.string().required('Last name is required'),
  contactAddress: Yup.string().required('Contact address is required'),
  occupation: Yup.string().required('Occupation is required'),
  gender: Yup.string().oneOf(['male', 'female']).required('Gender is required'),
  dateOfBirth: dateValidation,
  mothersMaidenName: Yup.string().required('Mother\'s maiden name is required'),
  employersName: Yup.string().optional(),
  employersTelephone: phoneValidation.optional(),
  employersAddress: Yup.string().optional(),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  country: Yup.string().required('Country is required'),
  nationality: Yup.string().oneOf(['Nigerian', 'Foreign', 'Both']).required('Nationality is required'),
  residentialAddress: Yup.string().required('Residential address is required'),
  mobileNumber: phoneValidation,
  email: emailValidation,
  taxId: Yup.string().optional(),
  bvn: bvnValidation,
  idType: Yup.string().oneOf(['passport', 'nimc', 'driversLicense', 'votersCard', 'nin']).required('ID type is required'),
  identificationNumber: Yup.string().required('Identification number is required'),
  issuingCountry: Yup.string().required('Issuing country is required'),
  issuedDate: dateValidation,
  expiryDate: dateValidation.optional(),
  sourceOfIncome: Yup.string().oneOf(['salary', 'investments', 'other']).required('Source of income is required'),
  sourceOfIncomeOther: Yup.string().when('sourceOfIncome', {
    is: 'other',
    then: (schema) => schema.required('Please specify other source of income'),
    otherwise: (schema) => schema.optional()
  }),
  annualIncomeRange: Yup.string().oneOf(['lessThan1M', '1M-4M', '4.1M-10M', 'moreThan10M']).required('Annual income range is required'),
  premiumPaymentSource: Yup.string().oneOf(['salary', 'investments', 'other']).required('Premium payment source is required'),
  premiumPaymentSourceOther: Yup.string().when('premiumPaymentSource', {
    is: 'other',
    then: (schema) => schema.required('Please specify other premium payment source'),
    otherwise: (schema) => schema.optional()
  }),
  localBankName: Yup.string().required('Local bank name is required'),
  localAccountNumber: Yup.string().required('Local account number is required'),
  localBankBranch: Yup.string().required('Local bank branch is required'),
  localAccountOpeningDate: dateValidation,
  foreignBankName: Yup.string().optional(),
  foreignAccountNumber: Yup.string().optional(),
  foreignBankBranch: Yup.string().optional(),
  foreignAccountOpeningDate: dateValidation.optional(),
  identificationDocument: Yup.mixed().required('Identification document is required'),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Corporate KYC validation schema
export const corporateKYCSchema = Yup.object({
  nemBranchOffice: Yup.string().required('NEM branch office is required'),
  insured: Yup.string().required('Insured is required'),
  officeAddress: Yup.string().required('Office address is required'),
  ownershipOfCompany: Yup.string().oneOf(['Nigerian', 'Foreign', 'Both']).required('Ownership of company is required'),
  contactPerson: Yup.string().required('Contact person is required'),
  website: Yup.string().url('Please enter a valid website URL').required('Website is required'),
  incorporationNumber: Yup.string().required('Incorporation number is required'),
  incorporationState: Yup.string().required('Incorporation state is required'),
  incorporationDate: dateValidation,
  bvn: bvnValidation,
  contactPersonMobile: phoneValidation,
  taxId: Yup.string().optional(),
  email: emailValidation,
  businessType: Yup.string().required('Business type is required'),
  estimatedTurnover: Yup.string().oneOf(['lessThan10M', '11M-50M', '51M-200M', 'moreThan200M']).required('Estimated turnover is required'),
  premiumPaymentSource: Yup.string().oneOf(['salary', 'investments', 'other']).required('Premium payment source is required'),
  premiumPaymentSourceOther: Yup.string().when('premiumPaymentSource', {
    is: 'other',
    then: (schema) => schema.required('Please specify other premium payment source'),
    otherwise: (schema) => schema.optional()
  }),
  directors: Yup.array().of(
    Yup.object({
      firstName: Yup.string().required('First name is required'),
      middleName: Yup.string().optional(),
      lastName: Yup.string().required('Last name is required'),
      dateOfBirth: dateValidation,
      placeOfBirth: Yup.string().required('Place of birth is required'),
      nationality: Yup.string().required('Nationality is required'),
      country: Yup.string().required('Country is required'),
      occupation: Yup.string().required('Occupation is required'),
      email: emailValidation,
      phoneNumber: phoneValidation,
      bvn: bvnValidation,
      employersName: Yup.string().optional(),
      employersPhone: phoneValidation.optional(),
      residentialAddress: Yup.string().required('Residential address is required'),
      taxIdNumber: Yup.string().optional(),
      idType: Yup.string().oneOf(['passport', 'nimc', 'driversLicense', 'votersCard']).required('ID type is required'),
      identificationNumber: Yup.string().required('Identification number is required'),
      issuingBody: Yup.string().required('Issuing body is required'),
      issuedDate: dateValidation,
      expiryDate: dateValidation.optional(),
      sourceOfIncome: Yup.string().oneOf(['salary', 'investments', 'other']).required('Source of income is required'),
      sourceOfIncomeOther: Yup.string().when('sourceOfIncome', {
        is: 'other',
        then: (schema) => schema.required('Please specify other source of income'),
        otherwise: (schema) => schema.optional()
      })
    })
  ).min(1, 'At least one director is required'),
  companyVerificationDocument: Yup.string().oneOf(['incorporation', 'cacStatus', 'boardResolution', 'powerOfAttorney']).required('Company verification document is required'),
  verificationDocumentUpload: Yup.mixed().required('Verification document upload is required'),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Professional Indemnity Claim validation schema
export const professionalIndemnityClaimSchema = Yup.object({
  policyNumber: Yup.string().required('Policy number is required'),
  coverageFromDate: dateValidation,
  coverageToDate: dateValidation,
  insuredName: Yup.string().required('Insured name is required'),
  companyName: Yup.string().optional(),
  title: Yup.string().required('Title is required'),
  dateOfBirth: dateValidation,
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  phone: phoneValidation,
  email: emailValidation,
  claimantName: Yup.string().required('Claimant name is required'),
  claimantAddress: Yup.string().required('Claimant address is required'),
  contractDetails: Yup.string().required('Contract details are required'),
  contractWritten: Yup.boolean().required('Contract type is required'),
  contractTerms: Yup.string().when('contractWritten', {
    is: false,
    then: (schema) => schema.required('Contract terms are required'),
    otherwise: (schema) => schema.optional()
  }),
  workPerformedFrom: dateValidation,
  workPerformedTo: dateValidation,
  workPerformedBy: Yup.string().required('Work performed by is required'),
  claimNature: Yup.string().required('Nature of claim is required'),
  claimAwarenessDate: dateValidation,
  claimIntimationDate: dateValidation,
  intimationType: Yup.string().required('Intimation type is required'),
  intimationDetails: Yup.string().when('intimationType', {
    is: 'oral',
    then: (schema) => schema.required('Intimation details are required'),
    otherwise: (schema) => schema.optional()
  }),
  amountClaimed: Yup.number().positive('Amount must be positive').required('Amount claimed is required'),
  responseComments: Yup.string().required('Response comments are required'),
  quantumComments: Yup.string().required('Quantum comments are required'),
  estimatedLiability: Yup.number().positive('Amount must be positive').required('Estimated liability is required'),
  additionalInfo: Yup.boolean().required('Additional info selection is required'),
  additionalDetails: Yup.string().when('additionalInfo', {
    is: true,
    then: (schema) => schema.required('Additional details are required'),
    otherwise: (schema) => schema.optional()
  }),
  solicitorInstructed: Yup.boolean().required('Solicitor instruction is required'),
  solicitorName: Yup.string().when('solicitorInstructed', {
    is: true,
    then: (schema) => schema.required('Solicitor name is required'),
    otherwise: (schema) => schema.optional()
  }),
  solicitorAddress: Yup.string().when('solicitorInstructed', {
    is: true,
    then: (schema) => schema.required('Solicitor address is required'),
    otherwise: (schema) => schema.optional()
  }),
  solicitorCompany: Yup.string().when('solicitorInstructed', {
    is: true,
    then: (schema) => schema.required('Solicitor company is required'),
    otherwise: (schema) => schema.optional()
  }),
  solicitorRates: Yup.string().when('solicitorInstructed', {
    is: true,
    then: (schema) => schema.required('Solicitor rates are required'),
    otherwise: (schema) => schema.optional()
  }),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Public Liability Claim validation schema
export const publicLiabilityClaimSchema = Yup.object({
  policyNumber: Yup.string().required('Policy number is required'),
  coverageFromDate: dateValidation,
  coverageToDate: dateValidation,
  companyName: Yup.string().optional(),
  address: Yup.string().required('Address is required'),
  phone: phoneValidation,
  email: emailValidation,
  accidentDate: dateValidation,
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Accident place is required'),
  accidentDescription: Yup.string().required('Accident description is required'),
  witnesses: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Witness name is required'),
      address: Yup.string().required('Witness address is required'),
      isEmployee: Yup.boolean().required('Employee status is required')
    })
  ).optional(),
  employeeActivity: Yup.string().required('Employee activity is required'),
  causedByName: Yup.string().required('Name of person who caused accident is required'),
  causedByAddress: Yup.string().required('Address of person who caused accident is required'),
  causedByEmployer: Yup.string().optional(),
  policeInvolved: Yup.boolean().required('Police involvement is required'),
  policeStation: Yup.string().when('policeInvolved', {
    is: true,
    then: (schema) => schema.required('Police station is required'),
    otherwise: (schema) => schema.optional()
  }),
  policeOfficerNumber: Yup.string().when('policeInvolved', {
    is: true,
    then: (schema) => schema.required('Police officer number is required'),
    otherwise: (schema) => schema.optional()
  }),
  otherInsurance: Yup.boolean().required('Other insurance selection is required'),
  otherInsuranceDetails: Yup.string().when('otherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance details are required'),
    otherwise: (schema) => schema.optional()
  }),
  claimantName: Yup.string().required('Claimant name is required'),
  claimantAddress: Yup.string().required('Claimant address is required'),
  injuryDescription: Yup.string().required('Injury description is required'),
  claimReceived: Yup.boolean().required('Claim received status is required'),
  claimReceivedFrom: Yup.string().when('claimReceived', {
    is: true,
    then: (schema) => schema.required('Claim received from is required'),
    otherwise: (schema) => schema.optional()
  }),
  claimReceivedWhen: Yup.string().when('claimReceived', {
    is: true,
    then: (schema) => schema.required('Claim received when is required'),
    otherwise: (schema) => schema.optional()
  }),
  claimReceivedForm: Yup.string().when('claimReceived', {
    is: true,
    then: (schema) => schema.required('Claim received form is required'),
    otherwise: (schema) => schema.optional()
  }),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Motor Claim validation schema
export const motorClaimSchema = Yup.object({
  claimantName: Yup.string().required('Claimant name is required'),
  claimantPhone: phoneValidation,
  claimantEmail: emailValidation,
  claimantAddress: Yup.string().required('Claimant address is required'),
  vehicleMake: Yup.string().required('Vehicle make is required'),
  vehicleModel: Yup.string().required('Vehicle model is required'),
  vehicleYear: Yup.number().min(1900).max(new Date().getFullYear()).required('Vehicle year is required'),
  vehicleRegistration: Yup.string().required('Vehicle registration is required'),
  chassisNumber: Yup.string().required('Chassis number is required'),
  engineNumber: Yup.string().required('Engine number is required'),
  policyNumber: Yup.string().required('Policy number is required'),
  policyStartDate: dateValidation,
  policyEndDate: dateValidation,
  incidentDate: dateValidation,
  incidentTime: Yup.string().required('Incident time is required'),
  incidentLocation: Yup.string().required('Incident location is required'),
  incidentDescription: Yup.string().required('Incident description is required'),
  damageDescription: Yup.string().required('Damage description is required'),
  claimAmount: Yup.number().positive('Amount must be positive').required('Claim amount is required'),
  thirdPartyInvolved: Yup.string().oneOf(['yes', 'no']).required('Third party involvement is required'),
  policeReportFiled: Yup.string().oneOf(['yes', 'no']).required('Police report status is required'),
  policeReported: Yup.boolean().required('Police report status is required'),
  policeStation: Yup.string().when('policeReported', {
    is: true,
    then: (schema) => schema.required('Police station is required'),
    otherwise: (schema) => schema.optional()
  }),
  policeReportNumber: Yup.string().when('policeReported', {
    is: true,
    then: (schema) => schema.required('Police report number is required'),
    otherwise: (schema) => schema.optional()
  }),
  estimatedDamage: Yup.number().positive('Amount must be positive').required('Estimated damage is required'),
  driverName: Yup.string().required('Driver name is required'),
  driverLicense: Yup.string().required('Driver license is required'),
  witnessName: Yup.string().optional(),
  witnessPhone: phoneValidation.optional(),
  signature: Yup.string().required('Signature is required'),
  agreeToTerms: Yup.boolean().oneOf([true], 'You must agree to the terms and conditions')
});

// Employers Liability Claim validation schema
export const employersLiabilityClaimSchema = Yup.object({
  // Policy Details
  policyNumber: Yup.string().required('Policy number is required'),
  periodOfCoverFrom: dateValidation,
  periodOfCoverTo: dateValidation,
  
  // Insured Details
  insuredName: Yup.string().required('Name is required'),
  insuredAddress: Yup.string().required('Address is required'),
  insuredPhone: phoneValidation,
  insuredEmail: emailValidation,
  
  // Injured Party Details
  injuredPartyName: Yup.string().required('Injured party name is required'),
  injuredPartyAge: Yup.number().min(1).max(120).required('Age is required'),
  injuredPartyAddress: Yup.string().required('Address is required'),
  averageMonthlyEarnings: Yup.number().min(0).required('Average monthly earnings is required'),
  occupation: Yup.string().required('Occupation is required'),
  dateOfEmployment: dateValidation,
  notDirectlyEmployed: Yup.boolean().required('Direct employment status is required'),
  employerName: Yup.string().optional(),
  employerAddress: Yup.string().optional(),
  durationEmployed: Yup.string().optional(),
  maritalStatus: Yup.string().optional(),
  agesOfChildren: Yup.string().optional(),
  previousAccidents: Yup.boolean().required('Previous accidents status is required'),
  previousAccidentsDetails: Yup.string().optional(),
  
  // Injury Details
  natureOfInjuries: Yup.string().required('Nature of injuries is required'),
  machineryInvolved: Yup.string().optional(),
  
  // Accident Details
  accidentDate: dateValidation,
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Accident place is required'),
  dateReported: dateValidation,
  dateTimeStoppedWork: Yup.string().required('Date/time stopped work is required'),
  workAtTime: Yup.string().required('Work at time is required'),
  howItOccurred: Yup.string().required('How it occurred is required'),
  
  // Medical
  receivingTreatment: Yup.boolean().required('Receiving treatment status is required'),
  hospitalName: Yup.string().optional(),
  hospitalAddress: Yup.string().optional(),
  stillInHospital: Yup.boolean().optional(),
  dischargeDate: Yup.string().optional(),
  ableToDoduties: Yup.boolean().optional(),
  dutiesDetails: Yup.string().optional(),
  dateNatureResumedWork: Yup.string().optional(),
  
  // Doctor Details
  doctorName: Yup.string().required('Doctor name is required'),
  
  // Disablement
  totallyDisabled: Yup.boolean().required('Total disability status is required'),
  estimatedDuration: Yup.string().optional(),
  
  // Witnesses
  witnesses: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Witness name is required'),
      address: Yup.string().required('Witness address is required')
    })
  ).optional(),
  
  // Other Insurers
  otherInsurerName: Yup.string().optional(),
  otherInsurerAddress: Yup.string().optional(),
  otherInsurerPolicyNumber: Yup.string().optional(),
  
  // Earnings
  earnings: Yup.array().of(
    Yup.object({
      monthEnding: Yup.string().optional(),
      wagesAndBonus: Yup.number().min(0).optional(),
      monthlyAllowances: Yup.number().min(0).optional()
    })
  ).optional(),
  
  // Declaration
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Combined GPA & Employers Liability Claim validation schema
export const combinedGPAEmployersLiabilityClaimSchema = Yup.object({
  // Policy Details
  policyNumber: Yup.string().required('Policy number is required'),
  periodOfCoverFrom: dateValidation,
  periodOfCoverTo: dateValidation,
  
  // Insured Details
  insuredName: Yup.string().required('Name is required'),
  insuredAddress: Yup.string().required('Address is required'),
  insuredPhone: phoneValidation,
  insuredEmail: emailValidation,
  
  // Injured Party Details
  injuredPartyName: Yup.string().required('Injured party name is required'),
  injuredPartyAge: Yup.number().min(1).max(120).required('Age is required'),
  injuredPartyAddress: Yup.string().required('Address is required'),
  averageMonthlyEarnings: Yup.number().min(0).required('Average monthly earnings is required'),
  occupation: Yup.string().required('Occupation is required'),
  dateOfEmployment: dateValidation,
  notDirectlyEmployed: Yup.boolean().required('Direct employment status is required'),
  employerName: Yup.string().optional(),
  employerAddress: Yup.string().optional(),
  durationEmployed: Yup.string().optional(),
  maritalStatus: Yup.string().optional(),
  previousAccidents: Yup.boolean().required('Previous accidents status is required'),
  previousAccidentsDetails: Yup.string().optional(),
  
  // Injury Details
  natureOfInjuries: Yup.string().required('Nature of injuries is required'),
  machineryInvolved: Yup.string().optional(),
  
  // Accident Details
  accidentDate: dateValidation,
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Accident place is required'),
  dateReported: dateValidation,
  dateTimeStoppedWork: Yup.string().required('Date/time stopped work is required'),
  workAtTime: Yup.string().required('Work at time is required'),
  howItOccurred: Yup.string().required('How it occurred is required'),
  
  // Medical
  receivingTreatment: Yup.boolean().required('Receiving treatment status is required'),
  hospitalName: Yup.string().optional(),
  hospitalAddress: Yup.string().optional(),
  stillInHospital: Yup.boolean().optional(),
  dischargeDate: Yup.string().optional(),
  ableToDoduties: Yup.boolean().optional(),
  dutiesDetails: Yup.string().optional(),
  dateNatureResumedWork: Yup.string().optional(),
  
  // Doctor Details
  doctorName: Yup.string().required('Doctor name is required'),
  
  // Disablement
  totallyDisabled: Yup.boolean().required('Total disability status is required'),
  estimatedDuration: Yup.string().optional(),
  
  // Witnesses
  witnesses: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Witness name is required'),
      address: Yup.string().required('Witness address is required')
    })
  ).optional(),
  
  // Other Insurers
  otherInsurerName: Yup.string().optional(),
  otherInsurerAddress: Yup.string().optional(),
  otherInsurerPolicyNumber: Yup.string().optional(),
  
  // Earnings
  earnings: Yup.array().of(
    Yup.object({
      monthEnding: Yup.string().optional(),
      wagesAndBonus: Yup.number().min(0).optional(),
      monthlyAllowances: Yup.number().min(0).optional()
    })
  ).optional(),
  
  // Declaration
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Burglary Claim validation schema
export const burglaryClaimSchema = Yup.object({
  // Policy Details
  policyNumber: Yup.string().required('Policy number is required'),
  periodOfCoverFrom: dateValidation,
  periodOfCoverTo: dateValidation,
  
  // Insured Details
  nameOfInsured: Yup.string().required('Name of insured is required'),
  companyName: Yup.string().optional(),
  title: Yup.string().required('Title is required'),
  dateOfBirth: dateValidation,
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  phone: phoneValidation,
  email: emailValidation,
  
  // Details of Loss
  premisesAddress: Yup.string().required('Premises address is required'),
  premisesTelephone: phoneValidation,
  dateOfTheft: dateValidation,
  timeOfTheft: Yup.string().required('Time of theft is required'),
  howEntryEffected: Yup.string().required('How entry was effected is required'),
  roomsEntered: Yup.string().required('Rooms entered is required'),
  premisesOccupied: Yup.boolean().required('Premises occupied status is required'),
  lastOccupiedDateTime: Yup.string().when('premisesOccupied', {
    is: false,
    then: (schema) => schema.required('Last occupied date/time is required'),
    otherwise: (schema) => schema.optional()
  }),
  suspicionOnAnyone: Yup.boolean().required('Suspicion status is required'),
  suspicionName: Yup.string().when('suspicionOnAnyone', {
    is: true,
    then: (schema) => schema.required('Name of suspected person is required'),
    otherwise: (schema) => schema.optional()
  }),
  policeInformed: Yup.boolean().required('Police informed status is required'),
  policeDate: dateValidation.when('policeInformed', {
    is: true,
    then: (schema) => schema.required('Police report date is required'),
    otherwise: (schema) => schema.optional()
  }),
  policeStation: Yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required('Police station is required'),
    otherwise: (schema) => schema.optional()
  }),
  soleOwner: Yup.boolean().required('Sole owner status is required'),
  ownerName: Yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Owner name is required'),
    otherwise: (schema) => schema.optional()
  }),
  ownerAddress: Yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Owner address is required'),
    otherwise: (schema) => schema.optional()
  }),
  otherInsurance: Yup.boolean().required('Other insurance status is required'),
  otherInsurerDetails: Yup.string().when('otherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurer details are required'),
    otherwise: (schema) => schema.optional()
  }),
  totalContentsValue: Yup.number().min(0).required('Total contents value is required'),
  sumInsuredFirePolicy: Yup.number().min(0).required('Sum insured under fire policy is required'),
  firePolicyInsurerName: Yup.string().required('Fire policy insurer name is required'),
  firePolicyInsurerAddress: Yup.string().required('Fire policy insurer address is required'),
  firePolicyNumber: Yup.string().required('Fire policy number is required'),
  previousBurglaryLoss: Yup.boolean().required('Previous burglary loss status is required'),
  previousLossExplanation: Yup.string().when('previousBurglaryLoss', {
    is: true,
    then: (schema) => schema.required('Previous loss explanation is required'),
    otherwise: (schema) => schema.optional()
  }),
  
  // Property Details
  propertyItems: Yup.array().of(
    Yup.object({
      description: Yup.string().required('Description is required'),
      costPrice: Yup.number().min(0).required('Cost price is required'),
      purchaseDate: Yup.string().required('Purchase date is required'),
      estimatedValue: Yup.number().min(0).required('Estimated value is required'),
      netAmountClaimed: Yup.number().min(0).required('Net amount claimed is required')
    })
  ).min(1, 'At least one property item is required').required('Property items are required'),
  
  // Declaration
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Group Personal Accident Claim validation schema
export const groupPersonalAccidentSchema = Yup.object({
  policyNumber: Yup.string().required('Policy number is required'),
  periodOfCoverFrom: dateValidation,
  periodOfCoverTo: dateValidation,
  companyName: Yup.string().required('Company name is required'),
  address: Yup.string().required('Address is required'),
  phone: phoneValidation,
  email: emailValidation,
  accidentDate: dateValidation,
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Accident place is required'),
  incidentDescription: Yup.string().required('Incident description is required'),
  particularsOfInjuries: Yup.string().required('Particulars of injuries is required'),
  witnesses: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Witness name is required'),
      address: Yup.string().required('Witness address is required')
    })
  ).optional(),
  doctorName: Yup.string().required('Doctor name is required'),
  doctorAddress: Yup.string().required('Doctor address is required'),
  isUsualDoctor: Yup.boolean().required('Please specify if this is your usual doctor'),
  totalIncapacityFrom: dateValidation.optional(),
  totalIncapacityTo: dateValidation.optional(),
  partialIncapacityFrom: dateValidation.optional(),
  partialIncapacityTo: dateValidation.optional(),
  otherInsurerName: Yup.string().required('Other insurer name is required'),
  otherInsurerAddress: Yup.string().required('Other insurer address is required'),
  otherPolicyNumber: Yup.string().required('Other policy number is required'),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Fire and Special Perils Claim validation schema
export const fireSpecialPerilsSchema = Yup.object({
  policyNumber: Yup.string().required('Policy number is required'),
  periodOfCoverFrom: dateValidation,
  periodOfCoverTo: dateValidation,
  name: Yup.string().required('Name is required'),
  companyName: Yup.string().optional(),
  title: Yup.string().required('Title is required'),
  dateOfBirth: dateValidation,
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  phone: phoneValidation,
  email: emailValidation,
  premisesAddress: Yup.string().required('Premises address is required'),
  premisesTelephone: phoneValidation,
  dateOfOccurrence: dateValidation,
  timeOfOccurrence: Yup.string().required('Time of occurrence is required'),
  incidentDescription: Yup.string().required('Incident description is required'),
  causeOfFire: Yup.string().required('Cause of fire is required'),
  usedAsPerPolicy: Yup.boolean().required('Please specify if premises was used as per policy'),
  usageDetails: Yup.string().when('usedAsPerPolicy', {
    is: false,
    then: (schema) => schema.required('Usage details are required'),
    otherwise: (schema) => schema.optional()
  }),
  purposeOfUse: Yup.string().required('Purpose of use is required'),
  unallowedRiskIntroduced: Yup.boolean().required('Please specify if unallowed risk was introduced'),
  unallowedRiskDetails: Yup.string().when('unallowedRiskIntroduced', {
    is: true,
    then: (schema) => schema.required('Unallowed risk details are required'),
    otherwise: (schema) => schema.optional()
  }),
  measuresWhenDiscovered: Yup.string().required('Measures taken when discovered is required'),
  soleOwner: Yup.boolean().required('Please specify if you are sole owner'),
  otherOwnersName: Yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owners name is required'),
    otherwise: (schema) => schema.optional()
  }),
  otherOwnersAddress: Yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owners address is required'),
    otherwise: (schema) => schema.optional()
  }),
  hasOtherInsurance: Yup.boolean().required('Please specify if you have other insurance'),
  otherInsurerDetails: Yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurer details are required'),
    otherwise: (schema) => schema.optional()
  }),
  premisesContentsValue: Yup.number().positive('Amount must be positive').required('Premises contents value is required'),
  hasPreviousClaim: Yup.boolean().required('Please specify if you have previous claim'),
  previousClaimDate: dateValidation.when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required('Previous claim date is required'),
    otherwise: (schema) => schema.optional()
  }),
  previousClaimAmount: Yup.number().positive('Amount must be positive').when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required('Previous claim amount is required'),
    otherwise: (schema) => schema.optional()
  }),
  itemsLost: Yup.array().of(
    Yup.object({
      description: Yup.string().required('Description is required'),
      costPrice: Yup.number().positive('Cost price must be positive').required('Cost price is required'),
      purchaseDate: dateValidation,
      estimatedValue: Yup.number().positive('Estimated value must be positive').required('Estimated value is required'),
      salvageValue: Yup.number().min(0, 'Salvage value cannot be negative').required('Salvage value is required'),
      netAmountClaimed: Yup.number().positive('Net amount claimed must be positive').required('Net amount claimed is required')
    })
  ).min(1, 'At least one item must be added'),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Individual CDD Validation Schema
export const individualCDDSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  contactAddress: Yup.string().required('Contact address is required'),
  gender: Yup.string().oneOf(['male', 'female'], 'Gender must be either male or female').required('Gender is required'),
  residenceCountry: Yup.string().required('Residence country is required'),
  dateOfBirth: dateValidation,
  placeOfBirth: Yup.string().required('Place of birth is required'),
  email: emailValidation,
  mobileNumber: phoneValidation,
  residentialAddress: Yup.string().required('Residential address is required'),
  nationality: Yup.string().required('Nationality is required'),
  occupation: Yup.string().required('Occupation is required'),
  position: Yup.string().optional(),
  businessType: Yup.string().oneOf(['soleProprietor', 'limitedLiability', 'publicLimited', 'jointVenture', 'other'], 'Invalid business type').required('Business type is required'),
  businessTypeOther: Yup.string().when('businessType', {
    is: 'other',
    then: (schema) => schema.required('Please specify business type'),
    otherwise: (schema) => schema.optional()
  }),
  employerEmail: emailValidation,
  employerName: Yup.string().optional(),
  employerTelephone: phoneValidation.optional(),
  employerAddress: Yup.string().optional(),
  taxId: Yup.string().optional(),
  bvn: Yup.string().matches(/^\d{11}$/, 'BVN must be 11 digits').required('BVN is required'),
  idType: Yup.string().oneOf(['passport', 'nimc', 'driversLicense', 'votersCard', 'nin'], 'Invalid ID type').required('ID type is required'),
  identificationNumber: Yup.string().required('Identification number is required'),
  issuingCountry: Yup.string().required('Issuing country is required'),
  issuedDate: dateValidation,
  expiryDate: dateValidation.optional(),
  annualIncomeRange: Yup.string().oneOf(['lessThan1M', '1M-4M', '4.1M-10M', 'moreThan10M'], 'Invalid income range').required('Annual income range is required'),
  premiumPaymentSource: Yup.string().oneOf(['salary', 'investments', 'other'], 'Invalid payment source').required('Premium payment source is required'),
  premiumPaymentSourceOther: Yup.string().when('premiumPaymentSource', {
    is: 'other',
    then: (schema) => schema.required('Please specify payment source'),
    otherwise: (schema) => schema.optional()
  }),
  identificationDocument: Yup.mixed().required('Identification document is required'),
  signature: Yup.string().required('Signature is required'),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
});

// Agents CDD Validation Schema
export const agentsCDDSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  middleName: Yup.string().optional(),
  lastName: Yup.string().required('Last name is required'),
  residentialAddress: Yup.string().required('Residential address is required'),
  gender: Yup.string().oneOf(['male', 'female'], 'Gender must be either male or female').required('Gender is required'),
  position: Yup.string().required('Position is required'),
  dateOfBirth: dateValidation,
  placeOfBirth: Yup.string().required('Place of birth is required'),
  otherSourceOfIncome: Yup.string().oneOf(['salary', 'investments', 'other'], 'Invalid income source').required('Other source of income is required'),
  otherSourceOfIncomeOther: Yup.string().when('otherSourceOfIncome', {
    is: 'other',
    then: (schema) => schema.required('Please specify income source'),
    otherwise: (schema) => schema.optional()
  }),
  nationality: Yup.string().required('Nationality is required'),
  phoneNumber: phoneValidation,
  bvn: Yup.string().matches(/^\d{11}$/, 'BVN must be 11 digits').required('BVN is required'),
  taxIdNumber: Yup.string().optional(),
  occupation: Yup.string().required('Occupation is required'),
  email: emailValidation,
  validMeansOfId: Yup.string().oneOf(['passport', 'nimc', 'driversLicense', 'votersCard'], 'Invalid ID type').required('Valid means of ID is required'),
  identificationNumber: Yup.string().required('Identification number is required'),
  issuedDate: dateValidation,
  expiryDate: dateValidation.optional(),
  issuingBody: Yup.string().required('Issuing body is required'),
  agentName: Yup.string().required('Agent name is required'),
  agentsOfficeAddress: Yup.string().required('Agent office address is required'),
  naicomLicenseNumber: Yup.string().required('NAICOM license number is required'),
  licenseIssuedDate: dateValidation,
  licenseExpiryDate: dateValidation,
  emailAddress: emailValidation,
  website: Yup.string().url('Invalid URL format').required('Website is required'),
  mobileNumber: phoneValidation,
  taxIdentificationNumber: Yup.string().optional(),
  arianMembershipNumber: Yup.string().required('ARIAN membership number is required'),
  listOfAgentsApprovedPrincipals: Yup.string().required('List of agents approved principals is required'),
  localAccountNumber: Yup.string().required('Local account number is required'),
  localBankName: Yup.string().required('Local bank name is required'),
  localBankBranch: Yup.string().required('Local bank branch is required'),
  localAccountOpeningDate: dateValidation,
  foreignAccountNumber: Yup.string().optional(),
  foreignBankName: Yup.string().optional(),
  foreignBankBranch: Yup.string().optional(),
  foreignAccountOpeningDate: dateValidation.optional(),
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required'),
});
