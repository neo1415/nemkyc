import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

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
});

export const schema2 = yup.object().shape({
    companyNameVerificationDoc: yup.string().transform(sanitizeString).required('Verification Document is required'),
});

export const schema3 = yup.object().shape({
// checkbox: yup.boolean()
// .required('You must accept the terms and conditions')
// .oneOf([true], 'You must accept the terms and conditions'),
signature1:(yup.string().transform(sanitizeString)).required('Name is required'),
signature2: yup.string().transform(sanitizeString).required('Name Type is required'),
signature3: yup.string().transform(sanitizeString).required('Name Type is required'),
})