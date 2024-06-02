import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';
import { GridSignature } from '@mui/x-data-grid';

export const schema1 = yup.object().shape({
    firstName: yup.string().required('First Name is required').transform(sanitizeString),
    middleName: yup.string().transform(sanitizeString),
    lastName: yup.string().required('Last Name is required').transform(sanitizeString),
    residentialAddress: yup.string().required('Residential Address is required').transform(sanitizeString),
    gender: yup.string().required('Gender is required').transform(sanitizeString),
    position: yup.string().transform(sanitizeString),
    dateOfBirth: yup.date().required('Date of Birth is required'),
    placeOfBirth: yup.string().required('Place of Birth is required').transform(sanitizeString),
    sourceOfIncome: yup.string().required('Source of Income is required'),
    nationality: yup.string().required('Nationality is required').transform(sanitizeString),
    GSMno: yup.string().required('GSM Number is required').transform(sanitizeString),
    BVNNumber: yup.string().required('BVN Number is required').min(11).max(11).transform(sanitizeString),
    taxIDNumber: yup.string().transform(sanitizeString),
    occupation: yup.string().required('Occupation is required').transform(sanitizeString),
    emailAddress: yup.string().email().required('Email Address is required').transform(sanitizeEmail),
    idType: yup.string().required('ID Type is required'),
  idNumber: yup.string().required('ID Number is required').transform(sanitizeString),
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
  issuingBody: yup.string().required('Issuing Body is required').transform(sanitizeString),
   
});

export const schema2 = yup.object().shape({
    agentsName:(yup.string().transform(sanitizeString)).required('Agents Name is required'),
    agentsAddress: yup.string().required('Agents Address is required').transform(sanitizeString),
    naicomNo: yup.string().required('NAICOM Lisence Number is required').transform(sanitizeString),
    lisenceIssuedDate: yup.date().required('Issued Date is required'),
    lisenceExpiryDate: yup.date().required('Expiry Date is required').min(new Date(), 'expired Lisence'),
    agentsEmail: yup.string().required('Email is required').email().transform(sanitizeEmail),
    website: yup.string().test('is-url', 'Website must be a valid URL', (value) => {
        if (value) {
          const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})(\/\S*)?$/;
          return urlPattern.test(value);
        }
        return true; // Allow empty value
      }),
    mobileNo: yup.string().transform(sanitizeString),
    taxIDNo: yup.string().transform(sanitizeString),
    arian: yup.string().required('ARIAN Membership Number is required').transform(sanitizeString),
    listOfAgents: yup.string().transform(sanitizeString),

});

export const schema3 = yup.object().shape({
    accountNumber: yup.string().required('Account Number is required').matches(/^[0-9]+$/, 'Account Number must be numeric').min(10).max(10).transform(sanitizeString),
    bankName: yup.string().required('Bank Name is required').transform(sanitizeString),
    accountOpeningDate: yup.date().required('Date of account creation is required'),
    bankBranch: yup.string().required('Bank Branch is required').transform(sanitizeString),
  
    // accountNumber2: yup.string().transform(sanitizeString),
    bankName2: yup.string().transform(sanitizeString),
    accountOpeningDate2: yup.date()
    .transform((value, originalValue) => {
      return originalValue === "" ? null : new Date(originalValue);
    })
    .nullable(true)
    .notRequired()
    .test('is-date', 'dob2 must be a valid date', value => !value || !isNaN(Date.parse(value))),
  
    bankBranch2: yup.string().transform(sanitizeString),

    signature: yup.string().required('Full Name Name is required').transform(sanitizeString),
// checkbox: yup.boolean()
// .required('You must accept the terms and conditions')
// .oneOf([true], 'You must accept the terms and conditions'),
})