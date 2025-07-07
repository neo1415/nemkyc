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
  companyTypeOther: Yup.string().when('companyType', {
    is: 'Other',
    then: (schema) => schema.required('Please specify other company type'),
    otherwise: (schema) => schema.optional()
  }),
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
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});

// Individual KYC validation schema
export const individualKYCSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  middleName: Yup.string().optional(),
  dateOfBirth: dateValidation,
  gender: Yup.string().oneOf(['male', 'female', 'other']).required('Gender is required'),
  nationality: Yup.string().required('Nationality is required'),
  countryOfResidence: Yup.string().required('Country of residence is required'),
  email: emailValidation,
  phoneNumber: phoneValidation,
  alternatePhone: phoneValidation.optional(),
  residentialAddress: Yup.string().required('Residential address is required'),
  mailingAddress: Yup.string().optional(),
  identificationType: Yup.string().oneOf(['passport', 'nationalId', 'driversLicense']).required('Identification type is required'),
  identificationNumber: Yup.string().required('Identification number is required'),
  issueDate: dateValidation,
  expiryDate: dateValidation,
  employmentStatus: Yup.string().oneOf(['employed', 'selfEmployed', 'unemployed', 'retired', 'student']).required('Employment status is required'),
  occupation: Yup.string().required('Occupation is required'),
  employer: Yup.string().optional(),
  annualIncome: Yup.number().positive('Annual income must be positive').required('Annual income is required')
});

// Corporate KYC validation schema
export const corporateKYCSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  registrationNumber: Yup.string().required('Registration number is required'),
  incorporationDate: dateValidation,
  countryOfIncorporation: Yup.string().required('Country of incorporation is required'),
  businessType: Yup.string().required('Business type is required'),
  industry: Yup.string().required('Industry is required'),
  registeredAddress: Yup.string().required('Registered address is required'),
  businessAddress: Yup.string().required('Business address is required'),
  phoneNumber: phoneValidation,
  email: emailValidation,
  website: Yup.string().url('Please enter a valid website URL').optional(),
  annualRevenue: Yup.number().positive('Annual revenue must be positive').required('Annual revenue is required'),
  numberOfEmployees: Yup.number().positive('Number of employees must be positive').required('Number of employees is required'),
  directors: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Director name is required'),
      position: Yup.string().required('Director position is required'),
      nationality: Yup.string().required('Director nationality is required'),
      shareholding: Yup.number().min(0).max(100).optional()
    })
  ).min(1, 'At least one director is required')
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
  injuredPartyName: Yup.string().required('Name is required'),
  injuredPartyAge: Yup.number().positive('Age must be positive').required('Age is required'),
  injuredPartyAddress: Yup.string().required('Address is required'),
  averageMonthlyEarnings: Yup.number().positive('Earnings must be positive').required('Average monthly earnings is required'),
  occupation: Yup.string().required('Occupation is required'),
  dateOfEmployment: dateValidation,
  maritalStatus: Yup.string().required('Marital status is required'),
  numberOfChildren: Yup.number().min(0).required('Number of children is required'),
  agesOfChildren: Yup.string().optional(),
  previousAccidents: Yup.boolean().required('Previous accidents selection is required'),
  previousAccidentsDetails: Yup.string().when('previousAccidents', {
    is: true,
    then: (schema) => schema.required('Previous accidents details are required'),
    otherwise: (schema) => schema.optional()
  }),
  
  // Injury Details
  natureOfInjuries: Yup.string().required('Nature of injuries is required'),
  machineryInvolved: Yup.string().optional(),
  supervisorName: Yup.string().required('Supervisor name is required'),
  supervisorPosition: Yup.string().required('Supervisor position is required'),
  
  // Accident Details
  accidentDate: dateValidation,
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Accident place is required'),
  dateReported: dateValidation,
  reportedBy: Yup.string().required('Reported by is required'),
  dateStoppedWork: dateValidation,
  descriptionOfWork: Yup.string().required('Description of work is required'),
  howAccidentOccurred: Yup.string().required('How accident occurred is required'),
  soberOrIntoxicated: Yup.boolean().required('Sober or intoxicated selection is required'),
  
  // Medical
  receivingTreatment: Yup.boolean().required('Receiving treatment selection is required'),
  hospitalName: Yup.string().when('receivingTreatment', {
    is: true,
    then: (schema) => schema.required('Hospital name is required'),
    otherwise: (schema) => schema.optional()
  }),
  hospitalAddress: Yup.string().when('receivingTreatment', {
    is: true,
    then: (schema) => schema.required('Hospital address is required'),
    otherwise: (schema) => schema.optional()
  }),
  doctorName: Yup.string().required('Doctor name is required'),
  doctorAddress: Yup.string().required('Doctor address is required'),
  
  // Disablement
  totallyDisabled: Yup.boolean().required('Totally disabled selection is required'),
  dateStoppedWorking: dateValidation,
  estimatedDurationOfDisablement: Yup.string().required('Estimated duration of disablement is required'),
  ableToDoAnyDuties: Yup.boolean().required('Able to do any duties selection is required'),
  dutiesDetails: Yup.string().when('ableToDoAnyDuties', {
    is: true,
    then: (schema) => schema.required('Duties details are required'),
    otherwise: (schema) => schema.optional()
  }),
  claimMadeOnYou: Yup.boolean().required('Claim made on you selection is required'),
  
  // Witnesses
  witnesses: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Witness name is required'),
      address: Yup.string().required('Witness address is required'),
      phone: phoneValidation.optional()
    })
  ).optional(),
  
  // Other Insurers
  otherInsurerName: Yup.string().optional(),
  otherInsurerAddress: Yup.string().optional(),
  otherInsurerPolicyNumber: Yup.string().optional(),
  
  // Statement of Earnings (12 months)
  earnings: Yup.array().of(
    Yup.object({
      monthEnding: Yup.string().required('Month ending is required'),
      wagesAndBonus: Yup.number().min(0).required('Wages and bonus is required'),
      monthlyAllowances: Yup.number().min(0).required('Monthly allowances is required')
    })
  ).min(12, 'All 12 months must be completed').required('Statement of earnings is required'),
  
  // Declaration
  agreeToDataPrivacy: Yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: Yup.string().required('Signature is required')
});
