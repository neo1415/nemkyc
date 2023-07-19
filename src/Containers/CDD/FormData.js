import { useState } from 'react';

const initialFormData = {
  companyName: '',
  // commercialName: '',
  // city:'',
  // state:'',
  // comapanyCountry:'',
  registeredCompanyAddress: '',
  incorporationNumber: '',
  incorporationState:'',
  companyLegalForm:'',
  dateOfIncorporationRegistration:'',
  emailAddress: '',
  website: '',
  companyType:[],
  taxIdentificationNumber: '',
  telephoneNumber:'',
  firstName: '',
  lastName:'',
  dob:'',
  // position:'',
  placeOfBirth:'',
  nationality:'',
  country:'',
  occupation:'',
  BVNNumber:'',
  employersName:'',
  phoneNumber:'',
  residentialAddress:'',
  email:'',
  taxIDNumber: '',
  intPassNo:'',
  passCountry:'',
  idType:[],
  idNumber:'',
  issuingBody:'',
  issuedDate:'',
  expiryDate:'',
  sourceOfIncome:[],                                                                                                                                                                                                                                         
  firstName2: '',
  lastName2:'',
  dob2:'',
  position2:'',
  placeOfBirth2:'',
  nationality2:'',
  country2:'',
  occupation2:'',
  BVNNumber2:'',
  EmployersName2:'',
  phoneNumber2:'',
  residentialAddress2:'',
  email2:'',
  taxIdNumber2: '',
  intPassNo2:'',
  passCountry2:'',
  idType2:[],
  idNumber2:'',
  issuingBod2y:'',
  issuedDate2:'',
  expiryDate2:'',
  sourceOfIncome2:[],
  accountNumber:'',
  bankName:'',
  bankBranch:'',
  accountOpeningDate:'',
  accountNumber2:'',
  bankName2:'',
  bankBranch2:'',
  accountOpeningDate2:'',
  identification:null,
  cac:null,
  tax:null,
  cacForm:null,
  privacy:false,
};

const useFormData = () => {
  const [formData, setFormData] = useState(initialFormData);

  return { formData, setFormData };
};

export default useFormData;
