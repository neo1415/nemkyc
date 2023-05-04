import React, { useState } from 'react';
import './CDD.scss'
import { db } from '../../APi';
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"

function CDD() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    registeredCompanyAddress: '',
    contactTelephoneNumber: '',
    emailAddress: '',
    website: '',
    contactPerson: '',
    taxIdentificationNumber: '',
    VATRegistrationNumber:'',
    dateOfIncorporationRegistration:'',
    incorporationState:'',
    companyType:[],
    firstName: '',
    lastName:'',
    residentialAddress:'',                                                                                                                                                                                                                                               
    issuingBody:'',
    accountNumber:'',
    bankName:'',
    bankBranch:'',
    accountOpeningDate:'',
    // accountNumber:'',
    // bankName:'',
    // bankBranch:'',
    // accountOpeningDate:'',
    // profilePicture: null,
    // gender: '',
    // dob: '',
    // educationLevel: '',
    // employmentStatus: [],
    // howDidYouHear: []
  });

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      const updatedArray = checked
        ? [...formData[name], value]
        : formData[name].filter(item => item !== value);
      setFormData({ ...formData, [name]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
      console.log('Submitting form data...');
    try {
      console.log('it works')
      await setDoc(doc(db, "users", uuidv4()), {
        
        companyName: formData.companyName,
        registeredCompanyAddress: formData.registeredCompanyAddress,
        contactTelephoneNumber: formData.contactTelephoneNumber,
        emailAddress: formData.emailAddress,
        website: formData.website,
        contactPerson: formData.contactPerson,
        taxIdentificationNumber: formData.taxIdentificationNumber,
        VATRegistrationNumber: formData.VATRegistrationNumber,
        dateOfIncorporationRegistration: formData.dateOfIncorporationRegistration,
        incorporationState:formData.incorporationState,
        companyType: formData.companyType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        residentialAddress: formData.residentialAddress,
        issuingBody: formData.issuingBody,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        accountOpeningDate: formData.accountOpeningDate,
        // complete:'Pending',
        createdAt: Timestamp.now().toDate().toString(),
        timestamp: serverTimestamp()
        
      });
    } catch (err) {
      console.log(err);
    }
  };
  

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  console.log(formData)

  return (
    <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}className="multistep-form">
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <motion.div
          initial={{width:0}}
          animate={{width:'100%'}}
          exit={{x:window.innerWidth, transition:{duration:0.1}}}
           className="form-step">
            <h2>Company Details</h2>
            <div className='flex-form'>
            <div className='flex-one'>
            <input type="text" id="companyName" name="companyName" placeholder='Company Name' value={formData.companyName} onChange={handleChange} required />

            <input type="text" id="registeredCompanyAddress" placeholder='Registered Company Address' name="registeredCompanyAddress" value={formData.registeredCompanyAddress} onChange={handleChange} required />
            
            <input type="text" id="contactTelephoneNumber" placeholder='Contact Telephone Number' name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />

            <input type="email" id="emailAddress" placeholder='Email Address' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />

            <input type="email" id="website" placeholder='Website' name="website" value={formData.website} onChange={handleChange} required />
            
            <input type="text" id="contactPerson" name="contactPerson" placeholder='Contact Person' value={formData.contactPerson} onChange={handleChange} required />
            </div>

            <div className='flex-two'>

            <input type="text" id="taxIdentificationNumber" placeholder='Tax Identification Number' name="taxIdentificationNumber" value={formData.taxIdentificationNumber} onChange={handleChange} required />
            
            <input type="text" id="VATRegistrationNumber" placeholder='VAT Registration Number' name="VATRegistrationNumber" value={formData.VATRegistrationNumber} onChange={handleChange} required />

            <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration:</label>
            <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />

            <input type="text" placeholder='Incorporation State' id="incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required />
            
            <select id="companyType" name="companyType" size="1"
             value={formData.companyType} onChange={handleChange} required >
                <option value="Choose Company Type">Company Type</option>
                <option value="Sole-Proprietor">Sole Proprietor</option>
                <option value="Limited-Liability-Company">Limited Liability Company</option>
                <option value="Joint-Venture">Joint Venture</option>
            </select> 
        </div>
            </div>

            <button type="button" onClick={nextStep}>Next</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}} 
          className="form-step">
            <h2>Director's Profile</h2>
            <label htmlFor="dob">Date of Birth:</label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />

            <input type="text" id=" firstName" placeholder='First Name' name="firstName" value={formData.firstName} onChange={handleChange} required />

            <input type="text" placeholder='Last Name' id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />

            <input type="text" id="issuingBody" placeholder='Issuing Body' name="issuingBody" value={formData.issuingBody} onChange={handleChange} required />
        <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button" onClick={nextStep}>Next</button>
        </div>
      </motion.div>
    )}

    {step === 3 && (
      <motion.div
    initial={{width:0}}
    animate={{width:'100%'}}
    exit={{x:window.innerWidth, transition:{duration:0.1}}}
      className="form-step">
        <h2>Account Details</h2>

            <input type="text" id="accountNumber" placeholder='Account Number' name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />

            <input type="text" placeholder='Bank Name' id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />

            <input type="text" id="bankBranch" placeholder='Bank Branch Body' name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />

            <input type="date" id="accountOpeningDate" placeholder='Account Opening Date' name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" onClick={handleSubmit}>Submit</button>
        </div>
      </motion.div>
      
    )}

    {step === 4 && (
      <div className="form-step">
        <h2> Confirmation</h2>
        
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit">Submit</button>
        </div>
      </div>
      
    )}
  </form>
</motion.div>
);
}

export default CDD;