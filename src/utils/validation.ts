
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

export const dateValidation = Yup.date()
  .required('Date is required')
  .typeError('Please enter a valid date');

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
  incidentDate: dateValidation,
  incidentTime: Yup.string().required('Incident time is required'),
  incidentLocation: Yup.string().required('Incident location is required'),
  incidentDescription: Yup.string().required('Incident description is required'),
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
