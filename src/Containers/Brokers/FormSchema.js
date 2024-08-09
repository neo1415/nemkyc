import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

const today = new Date();
const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
today.setHours(0, 0, 0, 0);

export const schema1 = yup.object().shape({
  companyName: yup.string().required('Company Name is required').min(3).max(50).transform(sanitizeString),
  companyAddress: yup.string().required('Registered Company Address is required').min(3).max(60).transform(sanitizeString),
  city: yup.string().required('City is required').min(3).max(60).transform(sanitizeString),
  state: yup.string().required('State is required').min(3).max(60).transform(sanitizeString),
  country: yup.string().required('Country is required').min(3).max(60).transform(sanitizeString),
  incorporationNumber: yup.string().required('Incorporation Number is required').min(2).max(50).transform(sanitizeString),
  registrationNumber: yup.string().transform(sanitizeString),
  incorporationState: yup.string().required('Incorporation State is required').min(2).max(50).transform(sanitizeString),
  companyLegalForm: yup.string().required('Company Legal Form is required'),
  dateOfIncorporationRegistration:  yup.mixed()
  .test('not-empty', 'Date is required', value => value !== '')
  .test('is-valid-date', 'Date must be a valid date', value => value === null || !isNaN(Date.parse(value)))
  .test('not-in-future', 'The date cannot be in the future', value => {
    if (value === null || value === '') return true;
    return new Date(value) <= today;
  })
  .required('Date is required'),

  emailAddress: yup.string().required('Email Address is required').email().transform(sanitizeEmail),
  website: yup.string().test('is-url', 'Website must be a valid URL', (value) => {
    if (value) {
      const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})(\/\S*)?$/;
      return urlPattern.test(value);
    }
    return true; // Allow empty value
  }),
  natureOfBusiness:yup.string().required('Nature of business is required').min(2).max(50).transform(sanitizeString),
  taxIdentificationNumber: yup.string().required('Tax Identification Number is required').transform(sanitizeString),
  telephoneNumber: yup.string().required('Telephone Number is required').matches(/^[0-9]+$/, 'Telephone Number must be numeric').min(5).max(11).transform(sanitizeString),
});

export const schema2 = yup.object().shape({
  title: yup.string().required('Title is required').transform(sanitizeString),
  gender: yup.string().required('Gender is required').transform(sanitizeString),
  firstName: yup.string().required('First Name is required').transform(sanitizeString),
  middleName: yup.string().transform(sanitizeString),
  lastName: yup.string().required('Last Name is required').transform(sanitizeString),
  dob:  yup.mixed()
  .test('not-empty', 'Date of Birth is required', value => value !== '')
  .test('is-valid-date', 'Date of Birth must be a valid date', value => value === null || !isNaN(Date.parse(value)))
  .test('is-18', 'You must be at least 18 years old', value => {
    if (value === null || value === '') return true;
    return new Date(value) <= eighteenYearsAgo;
  }),
  placeOfBirth: yup.string().required('Place of Birth is required').transform(sanitizeString),
  nationality: yup.string().required('Nationality is required').transform(sanitizeString),
  residenceCountry: yup.string().required('Residence Country is required').transform(sanitizeString),
  occupation: yup.string().required('Occupation is required').transform(sanitizeString),
  BVNNumber: yup.string().required('BVN Number is required').min(11).max(11).transform(sanitizeString),
  employersName: yup.string().transform(sanitizeString),
  phoneNumber: yup.string().required('Phone Number is required').matches(/^[0-9]+$/, 'Phone Number must be numeric').min(5).max(11).transform(sanitizeString),
  address: yup.string().required('Address is required').transform(sanitizeString),
  email: yup.string().required('Email is required').email().transform(sanitizeEmail),
  taxIDNumber: yup.string().transform(sanitizeString),
  intPassNo: yup.string().transform(sanitizeString),
  passIssuedCountry: yup.string().transform(sanitizeString),
  idType: yup.string().required('ID Type is required'),
  idNumber: yup.string().required('ID Number is required').transform(sanitizeString),
  issuedBy: yup.string().required('Issued By(issuing Country) is required').transform(sanitizeString),
  issuedDate:   yup.mixed()
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
});

export const schema3 = yup.object().shape({
  title2: yup.string().transform(sanitizeString),
  gender2: yup.string().transform(sanitizeString),
  firstName2: yup.string().transform(sanitizeString),
  middleName2: yup.string().transform(sanitizeString),
  lastName2: yup.string().transform(sanitizeString),
  dob2: yup.date()
  .transform((value, originalValue) => {
    return originalValue === "" ? null : new Date(originalValue);
  })
  .nullable()
  .notRequired()
  .test('is-date', 'Date of Birth must be a valid date', value => !value || !isNaN(Date.parse(value)))
  .test('is-18', 'You must be at least 18 years old', value => !value || value <= eighteenYearsAgo),

  placeOfBirth2: yup.string().transform(sanitizeString),
  nationality2: yup.string().transform(sanitizeString),
  residenceCountry2: yup.string().transform(sanitizeString),
  occupation2: yup.string().transform(sanitizeString),
  // BVNNumber2: yup.string().min(11).max(11).transform(sanitizeString),
  employersName2: yup.string().transform(sanitizeString),
  // phoneNumber2: yup.string().min(5).max(11).transform(sanitizeString),
  address2: yup.string().transform(sanitizeString),
  email2: yup.string().email().transform(sanitizeEmail),
  taxIDNumber2: yup.string().transform(sanitizeString),
  intPassNo2: yup.string().transform(sanitizeString),
  passIssuedCountry2: yup.string().transform(sanitizeString),
  idType2: yup.string(),
  idNumber2: yup.string().transform(sanitizeString),
  issuedBy2: yup.string().transform(sanitizeString),
  issuedDate2: yup.date()
  .transform((value, originalValue) => {
    return originalValue === "" ? null : new Date(originalValue);
  })
  .nullable()
  .notRequired()
  .test('is-date', 'Date must be a valid date', value => !value || !isNaN(Date.parse(value)))
  .test('is-not-future', 'The date cannot be in the future', value => !value || value <= today),
  expiryDate2: yup.date()
  .transform((value, originalValue) => {
    return originalValue === "" ? null : new Date(originalValue);
  })
  .nullable(true)
  .notRequired()
  .min(new Date(), 'expired means of ID')
  .test('is-date', 'expiryDate2 must be a valid date', value => !value || !isNaN(Date.parse(value))),
  sourceOfIncome2: yup.string(),
});

  export const schema4 = yup.object().shape({
  
  localBankName: yup.string().required('Local Bank Name is required').transform(sanitizeString),
  bankBranch: yup.string().required('Bank Branch is required').transform(sanitizeString),
  currentAccountNumber: yup.string().required('Current Account Number is required').matches(/^[0-9]+$/, 'Account Number must be numeric').min(10).max(10).transform(sanitizeString),
  accountOpeningDate: yup.mixed()
  .test('not-empty', 'Date is required', value => value !== '')
  .test('is-valid-date', 'Date must be a valid date', value => value === null || !isNaN(Date.parse(value)))
  .test('not-in-future', 'The date cannot be in the future', value => {
    if (value === null || value === '') return true;
    return new Date(value) <= today;
  })
  .required('Date is required'),
  foreignbankName: yup.string().transform(sanitizeString),
  domAccountNumber: yup.string().matches(/^[0-9]+$/, 'Domicilliary Account Number must be numeric').min(10).max(10).transform(sanitizeString),
  bankBranchName2: yup.string().transform(sanitizeString),
  currency: yup.string().transform(sanitizeString),
  accountOpeningDate2:yup.date()
  .transform((value, originalValue) => {
    return originalValue === "" ? null : new Date(originalValue);
  })
  .nullable()
  .notRequired()
  .test('is-date', 'Date must be a valid date', value => !value || !isNaN(Date.parse(value)))
  .test('is-not-future', 'The date cannot be in the future', value => !value || value <= today),
});

export const schema5 = yup.object().shape({
  signature: yup.string().required('Full Name(s) is required').transform(sanitizeString),
  // checkbox: yup.boolean()
  // .required('You must accept the terms and conditions')
  // .oneOf([true], 'You must accept the terms and conditions'),

})

