import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

export const schema1 = yup.object().shape({
  companyName: yup.string().required('Company Name is required').min(3).max(50).transform(sanitizeString),
  companyAddress: yup.string().required('Registered Company Address is required').min(3).max(60).transform(sanitizeString),
  city: yup.string().required('City is required').min(3).max(60).transform(sanitizeString),
  state: yup.string().required('State is required').min(3).max(60).transform(sanitizeString),
  country: yup.string().required('Country is required').min(3).max(60).transform(sanitizeString),
  incorporationNumber: yup.string().required('Incorporation Number is required').min(7).max(15).transform(sanitizeString),
  registrationNumber: yup.string().required('Registration Number is required').min(7).max(15).transform(sanitizeString),
  incorporationState: yup.string().required('Incorporation State is required').min(2).max(50).transform(sanitizeString),
  companyLegalForm: yup.string().required('Company Legal Form is required'),
  dateOfIncorporationRegistration: yup.date().required('Date of Incorporation Registration is required'),
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
  dob: yup.date().required('Date of Birth is required'),
  placeOfBirth: yup.string().required('Place of Birth is required').transform(sanitizeString),
  nationality: yup.string().required('Nationality is required').transform(sanitizeString),
  residenceCountry: yup.string().required('Residence Country is required').transform(sanitizeString),
  occupation: yup.string().required('Occupation is required').transform(sanitizeString),
  BVNNumber: yup.string().required('BVN Number is required').min(11).max(11).transform(sanitizeString),
  employersName: yup.string().required('Employers Name is required').transform(sanitizeString),
  phoneNumber: yup.string().required('Phone Number is required').matches(/^[0-9]+$/, 'Phone Number must be numeric').min(5).max(11).transform(sanitizeString),
  address: yup.string().required('Address is required').transform(sanitizeString),
  email: yup.string().required('Email is required').email().transform(sanitizeEmail),
  taxIDNumber: yup.string().transform(sanitizeString),
  intPassNumber: yup.string().required('International Passport Number is required').transform(sanitizeString),
  passIssuedCountry: yup.string().required('Passport Issued Country is required').transform(sanitizeString),
  idType: yup.string().required('ID Type is required'),
  idNumber: yup.string().required('ID Number is required').transform(sanitizeString),
  issuedBy: yup.string().required('Issued By(issuing Country) is required').transform(sanitizeString),
  issuedDate: yup.date().required('Issued Date is required'),
  expiryDate: yup.date(),
  sourceOfIncome: yup.string().required('Source of Income is required'),
});

export const schema3 = yup.object().shape({
  // title2: yup.string().transform(sanitizeString),
  // gender2: yup.string().transform(sanitizeString),
  // firstName2: yup.string().transform(sanitizeString),
  // middleName2: yup.string().transform(sanitizeString),
  // lastName2: yup.string().transform(sanitizeString),
  // dob2: yup.date(),
  // placeOfBirth2: yup.string().transform(sanitizeString),
  // nationality2: yup.string().transform(sanitizeString),
  // residenceCountry2: yup.string().transform(sanitizeString),
  // occupation2: yup.string().transform(sanitizeString),
  // BVNNumber2: yup.string().min(11).max(11).transform(sanitizeString),
  // employersName2: yup.string().transform(sanitizeString),
  // phoneNumber2: yup.string().matches(/^[0-9]+$/, 'Phone Number must be numeric').min(5).max(11).transform(sanitizeString),
  // address2: yup.string().transform(sanitizeString),
  // email2: yup.string().email().transform(sanitizeEmail),
  // taxIDNumber2: yup.string().transform(sanitizeString),
  // intPassNumber2: yup.string().transform(sanitizeString),
  // passIssuedCountry2: yup.string().transform(sanitizeString),
  // idType2: yup.string(),
  // idNumber2: yup.string().transform(sanitizeString),
  // issuedBy2: yup.string().transform(sanitizeString),
  // issuedDate2: yup.date(),
  // expiryDate2: yup.date(),
  // sourceOfIncome2: yup.string(),
});

  export const schema4 = yup.object().shape({
  
  localBankName: yup.string().required('Local Bank Name is required').transform(sanitizeString),
  bankBranch: yup.string().required('Bank Branch is required').transform(sanitizeString),
  currentAccountNumber: yup.string().required('Current Account Number is required').matches(/^[0-9]+$/, 'Account Number must be numeric').min(10).max(10).transform(sanitizeString),
  bankBranchName: yup.string().required('Bank Branch Name is required').transform(sanitizeString),
  accountOpeningDate: yup.date().required('Date of account creation is required'),
 
  foreignbankName: yup.string().transform(sanitizeString),
  domAccountNumber: yup.string().matches(/^[0-9]+$/, 'Domicilliary Account Number must be numeric').min(10).max(10).transform(sanitizeString),
  bankBranchName2: yup.string().transform(sanitizeString),
  currency: yup.string().transform(sanitizeString),
  accountOpeningDate2: yup.date(),
});

export const schema5 = yup.object().shape({
 
  checkbox: yup.boolean()
  .required('You must accept the terms and conditions')
  .oneOf([true], 'You must accept the terms and conditions'),

})

