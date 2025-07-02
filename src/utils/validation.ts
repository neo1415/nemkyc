

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

export const optionalString = () => Yup.string().nullable().notRequired();

export const requiredNumber = (fieldName: string) => 
  Yup.number().required(`${fieldName} is required`).positive(`${fieldName} must be positive`);

export const optionalNumber = () => Yup.number().nullable().notRequired().positive('Must be positive');

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
  identificationDocument: fileSchema.nullable().notRequired(),
  proofOfAddress: fileSchema.nullable().notRequired(),
  passport: fileSchema.nullable().notRequired(),
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
  certificateOfIncorporation: fileSchema.nullable().notRequired(),
  memorandumOfAssociation: fileSchema.nullable().notRequired(),
  auditedFinancialStatements: fileSchema.nullable().notRequired(),
  boardResolution: fileSchema.nullable().notRequired(),
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
  vehiclePhotos: fileSchema.nullable().notRequired(),
  policeReport: fileSchema.nullable().notRequired(),
  driverLicense: fileSchema.nullable().notRequired(),
  vehicleRegistrationDoc: fileSchema.nullable().notRequired(),
});

