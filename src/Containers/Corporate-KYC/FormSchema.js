import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';


const today = new Date();
today.setHours(0, 0, 0, 0);

export const schema1 = yup.object().shape({
    branchOffice: yup.string().transform(sanitizeString).required('Branch Office is required'),
    insured: yup.string().required('insured is required').transform(sanitizeString),
    officeAddress: yup.string().required('Office Address is required').transform(sanitizeString),
    ownershipOfCompany: yup.string().required('Ownership Of Company is required').transform(sanitizeString),
    contactPerson: yup.string().required('Contact Person is required').transform(sanitizeString),
    contactPersonNo: yup.string().required('Contact Person Number is required').transform(sanitizeString),
    emailAddress: yup.string().email().required('Email Address is required').transform(sanitizeEmail),
    natureOfBusiness: yup.string().required('nature Of Business is required').transform(sanitizeString), 
    estimatedTurnover: yup.string().required('Estimated Turnover is required').transform(sanitizeString),
    premiumPaymentSource: yup.string().required('Premium Payment Source is required').transform(sanitizeString),
    taxIDNo: yup.string().required('Tax ID Number is required').transform(sanitizeString),
    incorporationNumber: yup.string().required('Incorporation Number is required').min(1).max(50).transform(sanitizeString),
    incorporationState: yup.string().required('Incorporation State is required').min(2).max(50).transform(sanitizeString),
    dateOfIncorporationRegistration: yup.date().required('Date of Incorporation Registration is required'),
   website: yup.string().test('is-url', 'Website must be a valid URL', (value) => {
      if (value) {
        const urlPattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)\.([a-zA-Z]{2,})(\/\S*)?$/;
        return urlPattern.test(value);
      }
      return true; // Allow empty value
    }),
   BVNNumber: yup.string().required('BVN Number is required').min(11).max(11).transform(sanitizeString),
});

export const schema2 = yup.object().shape({
    companyNameVerificationDoc: yup.string().transform(sanitizeString).required('Verification Document is required'),
});

export const schema3 = yup.object().shape({
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
      
      
// checkbox: yup.boolean()
// .required('You must accept the terms and conditions')
// .oneOf([true], 'You must accept the terms and conditions'),
signature1:(yup.string().transform(sanitizeString)).required('Name is required'),
signature2: yup.string().transform(sanitizeString).required('Name Type is required'),
signature3: yup.string().transform(sanitizeString).required('Name Type is required'),
})