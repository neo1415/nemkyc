import React, { useState } from 'react';
import './CDD.scss'
import { db } from '../../APi';
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"
import image from './form2.jpg'
import { HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

function CDD() {
  const [step, setStep] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);
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
    dob:'',
    firstName: '',
    lastName:'',
    residentialAddress:'',                                                                                                                                                                                                                                               
    issuingBody:'',
    dob2:'',
    firstName2: '',
    lastName2:'',
    residentialAddress2:'',                                                                                                                                                                                                                                               
    issuingBody2:'',
    accountNumber:'',
    bankName:'',
    bankBranch:'',
    accountOpeningDate:'',
    accountNumber2:'',
    bankName2:'',
    bankBranch2:'',
    accountOpeningDate2:'',
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

    const resetForm = () => {
    setFormData({
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
    dob:'',
    firstName: '',
    lastName:'',
    residentialAddress:'',                                                                                                                                                                                                                                               
    issuingBody:'',
    dob2:'',
    firstName2: '',
    lastName2:'',
    residentialAddress2:'',                                                                                                                                                                                                                                               
    issuingBody2:'',
    accountNumber:'',
    bankName:'',
    bankBranch:'',
    accountOpeningDate:'',
    accountNumber2:'',
    bankName2:'',
    bankBranch2:'',
    accountOpeningDate2:'',
     })
         setIsSubmitted(false)
    }

      const closeModal = () => {
    // setFormData({ date: '' });
    setIsSubmitted(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
      console.log('Submitting form data...');
    try {
      console.log('it works')
      setIsSubmitted(true);
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
        dob: formData.dob,
        firstName: formData.firstName,
        lastName: formData.lastName,
        residentialAddress: formData.residentialAddress,
        issuingBody: formData.issuingBody,
        dob2: formData.dob2,
        firstName2: formData.firstName2,
        lastName2: formData.lastName2,
        residentialAddress2: formData.residentialAddress2,
        issuingBody2: formData.issuingBody2,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        bankBranch: formData.bankBranch,
        accountOpeningDate: formData.accountOpeningDate,
        accountNumber2: formData.accountNumber2,
        bankName2: formData.bankName2,
        bankBranch2: formData.bankBranch2,
        accountOpeningDate2: formData.accountOpeningDate2,
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
    <div className='form-page'>
       <div className='picture'>
              <img src={image} className='form-img' />
            </div>
    <motion.div
        initial={{ opacity: 0, x: 0}}
        animate={{ opacity: 1, x: 0 }}
        transition= {{ duration:.5, ease:'easeOut' }}
        exit={{ opacity: 0, x: 0 }} className="multistep-form">

        {isSubmitted ? (
        <div className="modal">
          <div className="modal-content">
          <div className='close' onClick={closeModal}><p><HiXCircle /> </p></div>
            <h2>Thank you!</h2>
            <p>Your form has been successfully submitted.</p>
            <button onClick={resetForm}>Submit another form</button>
          </div>
        </div>
      ) : (
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <motion.div
               initial={{ opacity: 0, x: 0}}
            animate={{ opacity: 1, x: 0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}
           className="form-step">
            <h3>Company Details</h3>
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
            
            <select id="companyType" name="companyType"
             value={formData.companyType} onChange={handleChange} required >
                <option value="Choose Company Type">Company Type</option>
                <option value="Sole-Proprietor">Sole Proprietor</option>
                <option value="Limited-Liability-Company">Limited Liability Company</option>
                <option value="Joint-Venture">Joint Venture</option>
            </select> 
        </div>
            </div>
            <div className='button-flex'>
            <Link to='/'>
              <button type='button'>Home page</button>
            </Link>
            <button type="button" onClick={nextStep}>Next</button>
            </div>
          </motion.div>

        )}

        {step === 2 && (
          <motion.div
     initial={{ opacity: 0, x: 50}}
            animate={{ opacity: 1, x:0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}

          className="form-step">
        <div className='flexer'>
          <div className='flex-one'>
   
            <h3>Director's Profile 1</h3>
            <label htmlFor="dob">Date of Birth:</label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />

            <input type="text" id=" firstName" placeholder='First Name' name="firstName" value={formData.firstName} onChange={handleChange} required />

            <input type="text" placeholder='Last Name' id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />

            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />

            <input type="text" id="issuingBody" placeholder='Issuing Body' name="issuingBody" value={formData.issuingBody} onChange={handleChange} required />
          </div>
          
          <div className='flex-two'>
            <h3>Director's Profile 2</h3>
            <label htmlFor="dob">Date of Birth:</label>
            <input type="date" id="dob2" name="dob2" value={formData.dob2} onChange={handleChange} required />

            <input type="text" id=" firstName2" placeholder='First Name' name="firstName2" value={formData.firstName2} onChange={handleChange} required />

            <input type="text" placeholder='Last Name' id="lastName2" name="lastName2" value={formData.lastName2} onChange={handleChange} required />

            <input type="text" id="residentialAddress2" placeholder='Residential Address' name="residentialAddress2" value={formData.residentialAddress2} onChange={handleChange} required />

            <input type="text" id="issuingBody2" placeholder='Issuing Body' name="issuingBody2" value={formData.issuingBody2} onChange={handleChange} required />
            </div>
            </div>

        <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button" onClick={nextStep}>Next</button>
        </div>
      </motion.div>
    )}

    {step === 3 && (
      <motion.div
        initial={{ opacity: 0, x: 50}}
            animate={{ opacity: 1, x: 0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}
      className="form-step">
        <h3>Account Details</h3>

            <input type="text" id="accountNumber" placeholder='Account Number' name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />

            <input type="text" placeholder='Bank Name' id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />

            <input type="text" id="bankBranch" placeholder='Bank Branch Body' name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />

            <input type="date" id="accountOpeningDate" placeholder='Account Opening Date' name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" onClick={nextStep}>Next</button>
        </div>
      </motion.div>
      
    )}

    {step === 4 && (
      <div className="form-step">
        <motion.div
        initial={{ opacity: 0, x: 50}}
            animate={{ opacity: 1, x: 0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}
      className="form-step">
        <h3> Dollar Account Details</h3>

            <input type="text" id="accountNumber2" placeholder='Account Number' name="accountNumber2" value={formData.accountNumber2} onChange={handleChange} required />

            <input type="text" placeholder='Bank Name' id="bankName2" name="bankName2" value={formData.bankName2} onChange={handleChange} required />

            <input type="text" id="bankBranch2" placeholder='Bank Branch Body' name="bankBranch2" value={formData.bankBranch2} onChange={handleChange} required />

            <input type="date" id="accountOpeningDate2" placeholder='Account Opening Date' name="accountOpeningDate2" value={formData.accountOpeningDate2} onChange={handleChange} required />
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" onClick={handleSubmit}>Submit</button>

        </div>
      </motion.div>
      </div>
      
    )}
  </form>
      )}
</motion.div>
  </div>
);
}

export default CDD;