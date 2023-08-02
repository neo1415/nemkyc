import { useState } from 'react';

const initialFormData = {
    title: '',
    firstName: '',
    lastName: '',
    contactAddress: '',
    gender: '',
    nationality:'',
    country:'',  
    dateOfBirth: '',
    placeOfBirth:'',
    occupation: '',
    position:'',
    premiumPaymentSource:[],
    GSMno:'',
    residentialAddress:'',
    emailAddress:'',
    taxIDNumber:'',
    BVNNumber:"",
    identificationType:[],
    identificationNumber:'',
    issuingCountry:'',
    issuedDate:'',
    expiryDate:'',
    intPassNo:'',
    // passCountry:'',
    businessType:[],
    employersName: '',
    employersAddress:'',
    employersTelephoneNumber:'',
    employersEmail:'',
    // mothersMaidenName: '',
                                                                                                                                                                                                                                     
    // city: '',
    // state:'',  
    // officeAddress:'',
    annualIncomeRange:[],
    // date: '',
    signature: null,
    identification:null,
    privacy:false,
};

const useFormData = () => {
  const [formData, setFormData] = useState(initialFormData);

  return { formData, setFormData };
};

export default useFormData;