import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

const today = new Date();
const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

export const schema1 = yup.object().shape({
  officeLocation:(yup.string().transform(sanitizeString)).required('Office Locatioon is required'),
    insured: yup.string().required('insured is required').transform(sanitizeString),
    contactAddress: yup.string().required('Contact Address is required').transform(sanitizeString),
    occupation: yup.string().required('Occupation is required').transform(sanitizeString),
    gender: yup.string().required('Gender is required').transform(sanitizeString), 
    dateOfBirth:  yup.date()
    .max(eighteenYearsAgo, 'You must be at least 18 years old')
    .required('Date of Birth is required'),
    mothersMaidenName: yup.string().transform(sanitizeString),
    employersName: yup.string().transform(sanitizeString),
    employersTelephoneNumber: yup.string().transform(sanitizeString),
    employersAddress: yup.string().transform(sanitizeString),
    city: yup.string().required('City is required').min(3).max(60).transform(sanitizeString),
    state: yup.string().required('State is required').min(3).max(60).transform(sanitizeString),
    country: yup.string().required('Country is required').min(3).max(60).transform(sanitizeString),
    nationality: yup.string().required('Nationality is required').transform(sanitizeString),
    residentialAddress: yup.string().required('Residential Address is required').transform(sanitizeString),
    GSMno: yup.string().required('GSM Number is required').transform(sanitizeString),
    emailAddress: yup.string().email().required('Email Address is required').transform(sanitizeEmail),
    identificationType: yup.string().required('Identification Type is required').transform(sanitizeString),
    idNumber: yup.string().required('Identification Number is required').transform(sanitizeString),
    issuedDate: yup.date().required('Issued Date is required'),
    expiryDate: yup.date()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : new Date(originalValue);
    })
    .nullable(true)
    .notRequired()
    .min(new Date(), 'expired means of ID')
    .test('is-date', 'expiryDate2 must be a valid date', value => !value || !isNaN(Date.parse(value))),
    sourceOfIncome: yup.string().required('Source of Income is required'),
    annualIncomeRange: yup.string().required('Annual Income Range is required').transform(sanitizeString),
    premiumPaymentSource: yup.string().transform(sanitizeString).required('Premium Payment Source is required'),
});

export const schema2 = yup.object().shape({
   
    signature1: yup.string().required('Full Name is required'),
});

export const schema3 = yup.object().shape({
    // signature: yup.string().required('Full Name(s) is required').transform(sanitizeString),
  // signature1: yup.string().required('Full Name is required'),
// checkbox: yup.boolean()
// .required('You must accept the terms and conditions')
// .oneOf([true], 'You must accept the terms and conditions'),
})