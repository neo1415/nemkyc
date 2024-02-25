import * as yup from 'yup';
import { sanitizeEmail, sanitizeString } from '../../Components/SanitizationUtils';

export const schema1 = yup.object().shape({
    title: yup.string().required('Title is required').transform(sanitizeString),
    firstName: yup.string().required('First Name is required').transform(sanitizeString),
    lastName: yup.string().required('Last Name is required').transform(sanitizeString),
    contactAddress: yup.string().required('Contact Address is required').transform(sanitizeString),
    gender: yup.string().required('Gender is required').transform(sanitizeString),
    country: yup.string().required('Country is required').transform(sanitizeString),
    dateOfBirth: yup.date().required('Date of Birth is required'),
    placeOfBirth: yup.string().required('Place of Birth is required').transform(sanitizeString),
    emailAddress: yup.string().email().required('Email Address is required').transform(sanitizeEmail),
    GSMno: yup.string().required('GSM Number is required').transform(sanitizeString),
    residentialAddress: yup.string().required('Residential Address is required').transform(sanitizeString),
    nationality: yup.string().required('Nationality is required').transform(sanitizeString),
    occupation: yup.string().required('Occupation is required').transform(sanitizeString),
    position: yup.string().required('Position is required').transform(sanitizeString),
});

export const schema2 = yup.object().shape({
    businessType:(yup.string().transform(sanitizeString)).required('Business Type is required'),
    employersEmail: yup.string().email().transform(sanitizeEmail),
    employersName: yup.string().transform(sanitizeString),
    employersTelephoneNumber: yup.string().transform(sanitizeString),
    employersAddress: yup.string().transform(sanitizeString),
    taxIDNumber: yup.string().transform(sanitizeString),
    BVNNumber: yup.string().required('BVN Number is required').transform(sanitizeString),
    identificationType: yup.string().transform(sanitizeString).required('Identification Type is required'),
    identificationNumber: yup.string().required('Identification Number is required').transform(sanitizeString),
    issuingCountry: yup.string().required('Issuing Country is required').transform(sanitizeString),
    issuedDate: yup.date().required('Issued Date is required'),
    expiryDate: yup.date(),
});

export const schema3 = yup.object().shape({
annualIncomeRange: yup.string().transform(sanitizeString).required('Annual Income Range is required'),
premiumPaymentSource: yup.string().transform(sanitizeString).required('Premium Payment Source is required'),
checkbox: yup.boolean()
.required('You must accept the terms and conditions')
.oneOf([true], 'You must accept the terms and conditions'),
})