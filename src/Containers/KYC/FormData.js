import { useState } from 'react';

const initialFormData = {
    insured: '',
    contactAddress: '',
    gender: '',
    country:'',  
    dateOfBirth: '',
    placeOfBirth:'',
    occupation: '',
    premiumPaymentSource:[],
    GSMno:'',
    residentialAddress:'',
    emailAddress:'',
    identificationNumber:'',
    BVNNumber:"",
    identificationType:[],
    issuingCountry:'',
    issuedDate:'',
    expiryDate:'',
    intPassNo:'',
    passCountry:'',
    employersName: '',
    employersAddress:'',
    employersTelephoneNumber:'',
    employersEmail:'',
    businessType:'',
    // mothersMaidenName: '',
    // city: '',
    // state:'',                                                                                                                                                                                                                                       
    // nationality:'',
    // officeAddress:'',
    annualIncomeRange:[],
    date: '',
    signature: null,
    identification:null,
    privacy:false,
};

const useFormData = () => {
  const [formData, setFormData] = useState(initialFormData);

  return { formData, setFormData };
};

export default useFormData;