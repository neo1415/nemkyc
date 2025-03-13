import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

const today = new Date();
const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
today.setHours(0, 0, 0, 0);

export const schema1 = yup.object().shape({
  officeLocation:(yup.string().transform(sanitizeString)).required('Office Locatioon is required'),
  title: yup.string().required('Title is required').transform(sanitizeString),
  firstName: yup.string().required('First Name is required').transform(sanitizeString),
  middleName: yup.string().required('Middle Name is required').transform(sanitizeString),
  lastName: yup.string().required('Last Name is required').transform(sanitizeString),
    contactAddress: yup.string().required('Contact Address is required').transform(sanitizeString),
    occupation: yup.string().required('Occupation is required').transform(sanitizeString),
    gender: yup.string().required('Gender is required').transform(sanitizeString), 
    dateOfBirth:  yup.mixed()
    .test('not-empty', 'Date of Birth is required', value => value !== '')
    .test('is-valid-date', 'Date of Birth must be a valid date', value => value === null || !isNaN(Date.parse(value)))
    .test('is-18', 'You must be at least 18 years old', value => {
      if (value === null || value === '') return true;
      return new Date(value) <= eighteenYearsAgo;
    }),
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
    taxIDNo: yup.string().transform(sanitizeString),
    BVN: yup.string().required('BVN is required').transform(sanitizeString),
    identificationType: yup.string().required('Identification Type is required').transform(sanitizeString),
    idNumber: yup.string().required('Identification Number is required').transform(sanitizeString),
    issuedDate:  yup.mixed()
    .test('not-empty', 'Date is required', value => value !== '')
    .test('is-valid-date', 'Date must be a valid date', value => value === null || !isNaN(Date.parse(value)))
    .test('not-in-future', 'The date cannot be in the future', value => {
      if (value === null || value === '') return true;
      return new Date(value) <= today;
    })
    .required('Date is required'),
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
  accountNumber: yup.string().required('Account Number is required').matches(/^[0-9]+$/, 'Account Number must be numeric').min(10).max(10).transform(sanitizeString),
  bankName: yup.string().required('Bank Name is required').transform(sanitizeString),
  accountOpeningDate:  yup.mixed()
  .test('not-empty', 'Date is required', value => value !== '')
  .test('is-valid-date', 'Date must be a valid date', value => value === null || !isNaN(Date.parse(value)))
  .test('not-in-future', 'The date cannot be in the future', value => {
    if (value === null || value === '') return true;
    return new Date(value) <= today;
  })
  .required('Date is required'),
  bankBranch: yup.string().required('Bank Branch is required').transform(sanitizeString),

  accountNumber2: yup.string().notRequired().max(10).transform(sanitizeString),
  accountOpeningDate2: yup.date()
  .transform((value, originalValue) => {
    return originalValue === "" ? null : new Date(originalValue);
  })
  .nullable()
  .notRequired()
  .test('is-date', 'Date must be a valid date', value => !value || !isNaN(Date.parse(value)))
  .test('is-not-future', 'The date cannot be in the future', value => !value || value <= today),  bankBranch2: yup.string().transform(sanitizeString),

   
});

export const schema3 = yup.object().shape({
   
    signature1: yup.string().required('Full Name is required'),
});
