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
          <div className="form-step">
            <h2>Step 1: Company Details</h2>
            <div className='flex-form'>
            <div className='flex-one'>
            <label htmlFor="companyName">Company Name:</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />

            <label htmlFor="registeredCompanyAddress">Registered Company Address:</label>
            <input type="text" id="registeredCompanyAddress" name="registeredCompanyAddress" value={formData.registeredCompanyAddress} onChange={handleChange} required />
            
            <label htmlFor="contactTelephoneNumber">Contact Telephone Number:</label>
            <input type="text" id="contactTelephoneNumber" name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />

            <label htmlFor="emailAddress">Email Address:</label>
            <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />

            <label htmlFor="website">Website:</label>
            <input type="email" id="website" name="website" value={formData.website} onChange={handleChange} required />
            
            <label htmlFor="contactPerson">Contact Person:</label>
            <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required />
            </div>

            <div className='flex-two'>
            <label htmlFor="taxIdentificationNumber">Tax Identification Number:</label>
            <input type="text" id="taxIdentificationNumber" name="taxIdentificationNumber" value={formData.taxIdentificationNumber} onChange={handleChange} required />
            
            <label htmlFor="VATRegistrationNumber">VAT Registration Number:</label>
            <input type="text" id="VATRegistrationNumber" name="VATRegistrationNumber" value={formData.VATRegistrationNumber} onChange={handleChange} required />

            <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration:</label>
            <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />
            
            <label htmlFor="incorporationState">Incorporation:</label>
            <input type="text" id="incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required />

{/* 
            <label htmlFor=" incorporationState">incorporation State:</label>
            <input type="text" id=" incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required /> */}
            
            <label htmlFor="companyType">Company Type</label>
            <select id="companyType" name="companyType" size="1"
             value={formData.companyType} onChange={handleChange} required >
                <option value="Choose Company Type"></option>
                <option value="Sole-Proprietor">Sole Proprietor</option>
                <option value="Limited-Liability-Company">Limited Liability Company</option>
                <option value="Joint-Venture">Joint Venture</option>
            </select> 
        </div>
            </div>
     
            {/* <label htmlFor="profilePicture">Profile Picture:</label>
            <input type="file" id="profilePicture" name="profilePicture" onChange={handleChange} /> */}

            {/* <label htmlFor="gender">Gender:</label>
            <div className="radio-group">
              <label htmlFor="male">
                <input type="radio" id="male" name="gender" value="male" onChange={handleChange} required />
                Male
              </label>
              <label htmlFor="female">
                <input type="radio" id="female" name="gender" value="female" onChange={handleChange} required />
                Female
              </label>
              <label htmlFor="other">
                <input type="radio" id="other" name="gender" value="other" onChange={handleChange} required />
                Other
              </label>
            </div> */}

            <button type="button" onClick={nextStep}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Step 2: Directors Profile</h2>
            <label htmlFor="dob">Date of Birth:</label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />

            <label htmlFor=" firstName">First Name:</label>
            <input type="text" id=" firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />

             <label htmlFor=" lastName">Last Name:</label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <label htmlFor="residentialAddress">Residential Address:</label>
            <input type="text" id="residentialAddress" name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />

            <label htmlFor="issuingBody">Issuing Body:</label>
            <input type="text" id="issuingBody" name="issuingBody" value={formData.issuingBody} onChange={handleChange} required />
{/* 
        <label htmlFor="employmentStatus">Employment Status:</label>
        <div className="checkbox-group">
          <label htmlFor="employed">
            <input type="checkbox" id="employed" name="employmentStatus" value="employed" onChange={handleChange} />
            Employed
          </label>
          <label htmlFor="unemployed">
            <input type="checkbox" id="unemployed" name="employmentStatus" value="unemployed" onChange={handleChange} />
            Unemployed
          </label>
          <label htmlFor="student">
            <input type="checkbox" id="student" name="employmentStatus" value="student" onChange={handleChange} />
            Student
          </label>
        </div> */}
        <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button" onClick={nextStep}>Next</button>
        </div>
      </div>
    )}

    {step === 3 && (
      <div className="form-step">
        <h2>Step 3: Account Details</h2>
        {/* <label htmlFor="social-media">Social Media:</label>
        <select id="social-media" name="howDidYouHear" value={formData.howDidYouHear} onChange={handleChange} multiple required>
          <option value="">Select all that apply</option>
          <option value="facebook">Facebook</option>
          <option value="twitter">Twitter</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
        </select>

        <label htmlFor="other-source">Other Source:</label>
        <input type="text" id="other-source" name="howDidYouHear" value={formData.howDidYouHear} onChange={handleChange} />

       */}
        <label htmlFor="accountNumber">Account Number:</label>
            <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />

            <label htmlFor="bankName">Bank Name:</label>
            <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />

            <label htmlFor="bankBranch">Bank Branch Body:</label>
            <input type="text" id="bankBranch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />

            <label htmlFor="accountOpeningDate">Account Opening Date:</label>
            <input type="date" id="accountOpeningDate" name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
      
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