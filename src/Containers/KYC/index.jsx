import React, { useState,useEffect } from 'react';
import './KYC.scss'
import { db,storage } from '../../APi';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"

function KYC() {
  const [step, setStep] = useState(1);
  const [signature, setSignature] = useState('');
  const [per, setPerc] = useState(null)
  const [error , setError]= useState(null)
  const [formData, setFormData] = useState({
    insured: '',
    contactAddress: '',
    occupation: '',
    gender: '',
    dateOfBirth: '',
    mothersMaidenName: '',
    employersName: '',
    employersTelephoneNumber:'',
    employersAddress:'',
    city: '',
    state:'',
    country:'',                                                                                                                                                                                                                                               
    nationality:'',
    residentialAddress:'',
    officeAddress:'',
    GSMno:'',
    emailAddress:'',
    identification:[],
    identificationNumber:'',
    issuedDate:'',
    expiryDate:'',
    annualIncomeRange:[],
    premiumPaymentSource:[],
    date: '',
    signature: null,
  });

  const types= ['application/pdf'];

  useEffect(() => {
    const uploadsignature = () =>{
      const name = signature.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, signature);
    
// Register three observers:
// 1. 'state_changed' observer, called any time the state changes
// 2. Error observer, called on failure
// 3. Completion observer, called on successful completion
uploadTask.on('state_changed', 
  (snapshot) => {
    // Observe state change events such as progress, pause, and resume
    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
    setPerc(progress)
    switch (snapshot.state) {
      case 'paused':
        console.log('Upload is paused');
        break;
      case 'running':
        console.log('Upload is running');
        break;
        default:
          break;
    }
  }, 
  (error) => {
    console.log(error)
  }, 
  () => {
    // Handle successful uploads on complete
    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
    getDownloadURL(storageRef).then((downloadURL) => {
      setFormData((prev)=>({...prev, signature:downloadURL}))
    });
  }
);

    }
      signature && uploadsignature();
  }, [signature]);
  
  const changeHandler = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setSignature(selected);
      setError('');
    } else {
      setSignature(null);
      setError('Please select a PDF document');
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked, signatures } = event.target;
    if (type === 'signature') {
      setFormData({ ...formData, [name]: signatures[0] });
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
      await setDoc(doc(db, "individuals", uuidv4()), {
        
        insured: formData.insured,
        contactAddress: formData.contactAddress,
        contactTelephoneNumber: formData.contactTelephoneNumber,
        occupation: formData.occupation,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        mothersMaidenName: formData.mothersMaidenName,
        employersName: formData.employersName,
        employersTelephoneNumber: formData.employersTelephoneNumber,
        employersAddress:formData.employersAddress,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        nationality: formData.nationality,
        residentialAddress: formData.residentialAddress,
        officeAddress: formData.officeAddress,
        GSMno: formData.GSMno,
        emailAddress: formData.emailAddress,
        identification:formData.identification,
        identificationNumber: formData.identificationNumber,
        issuedDate: formData.issuedDate,
        expiryDate: formData.expiryDate,
        annualIncomeRange: formData.annualIncomeRange,
        premiumPaymentSource: formData.premiumPaymentSource,
        date: formData.date,
        signature: formData.signature,
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
    exit={{x:window.innerWidth, transition:{duration:0.1}}}
     className="multistep-form">
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="form-step">
            <h2>Step 1: Company Details</h2>
            <div className='flex-form'>
            <div className='flex-one'>
            <label htmlFor="insured">Insured:</label>
            <input type="text" id="insured" name="insured" value={formData.insured} onChange={handleChange} required />

            <label htmlFor="contactAddress">Contact Address:</label>
            <input type="text" id="contactAddress" name="contactAddress" value={formData.contactAddress} onChange={handleChange} required />

            <label htmlFor="contactTelephoneNumber">Contact Telephone Number:</label>
            <input type="text" id="contactTelephoneNumber" name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />

            <label htmlFor="occupation">Occupation:</label>
            <input type="email" id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />

            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" size="1"
             value={formData.gender} onChange={handleChange} required >
                <option value="Choose Company Type"></option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select> 
            
            <label htmlFor="dateOfBirth">Date Of Birth:</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
            </div>

            <div className='flex-two'>
            <label htmlFor="mothersMaidenName">Mother's Maiden Name:</label>
            <input type="text" id="mothersMaidenName" name="mothersMaidenName" value={formData.mothersMaidenName} onChange={handleChange} required />
            
            <label htmlFor="employersName">Employer's Name:</label>
            <input type="text" id="employersName" name="employersName" value={formData.employersName} onChange={handleChange} required />

            <label htmlFor="employersTelephoneNumber">Employer's Telephone Number:</label>
            <input type="text" id="employersTelephoneNumber" name="employersTelephoneNumber" value={formData.employersTelephoneNumber} onChange={handleChange} required />
            
            <label htmlFor="employersAddress">Employer's Address:</label>
            <input type="text" id="employersAddress" name="employersAddress" value={formData.employersAddress} onChange={handleChange} required />

            <label htmlFor=" city">City:</label>
            <input type="text" id=" city" name="city" value={formData.city} onChange={handleChange} required />
            
            <label htmlFor=" state">State:</label>
            <input type="text" id=" state" name="state" value={formData.state} onChange={handleChange} required /> 
        </div>
            </div>
     
            <button type="button" onClick={nextStep}>Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Step 2: Directors Prosignature</h2>

            <label htmlFor="country">Country:</label>
            <input type="text" id=" country" name="country" value={formData.country} onChange={handleChange} required />
            
            <label htmlFor=" nationality">Nationality:</label>
            <input type="text" id=" nationality" name="nationality" value={formData.nationality} onChange={handleChange} required />
            
            <label htmlFor="residentialAddress">Residential Address:</label>
            <input type="text" id="residentialAddress" name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />
            
            <label htmlFor="officeAddress">Office Address:</label>
            <input type="text" id="officeAddress" name="officeAddress" value={formData.officeAddress} onChange={handleChange} required />

            <label htmlFor=" GSMno">GSM Number:</label>
            <input type="text" id=" GSMno" name="GSMno" value={formData.GSMno} onChange={handleChange} required />

             <label htmlFor=" emailAddress">Email Address:</label>
            <input type="email" id="emailAddress" name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />

            <label htmlFor="identification">Gender</label>
            <select id="identification" name="identification" size="1"
             value={formData.identification} onChange={handleChange} required >
                <option value="Choose Identification Type"></option>
                <option value="drivers licence">Drivers Licence</option>
                <option value="international passport">International Passport</option>
                <option value="national ID">National ID</option>
                <option value="voter's card">Voter's Card</option>
            </select> 

            <label htmlFor="identificationNumber">Identification Number:</label>
            <input type="text" id="identificationNumber" name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} required />

            <label htmlFor="issuedDate">Issued Date:</label>
            <input type="date" id="issuedDate" name="issuedDate" value={formData.issuedDate} onChange={handleChange} required />

            <label htmlFor="expiryDate">expiry Date:</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />

            <label htmlFor="annualIncomeRange">Annual Income Range</label>
            <select id="annualIncomeRange" name="annualIncomeRange" size="1"
             value={formData.annualIncomeRange} onChange={handleChange} required >
                <option value="Choose Income Range"></option>
                <option value="lessThanIMillion">Less Than 1 Million</option>
                <option value="1million-4million">1 Million - 4 Million</option>
                <option value="4.1million-10million">4.1 Million - 10 Million</option>
                <option value="morethan10million">More than 10 Million</option>
            </select> 

            <label htmlFor="premiumPaymentSource">Premium Payment Source</label>
            <select id="premiumPaymentSource" name="premiumPaymentSource" size="1"
             value={formData.premiumPaymentSource} onChange={handleChange} required >
                <option value="Choose Income Source"></option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 

            <label htmlFor=" date">Date:</label>
            <input type="date" id=" date" name="date" value={formData.date} onChange={handleChange} required />

            <label htmlFor="signature">Signature:</label>
            <input type="file" id="signature" name="signature" onChange={changeHandler} />
            <div className='Output'>
                {error && <div className='error'>{error}</div>}
                {signature && <div className='error'>{signature.name}</div>}
              </div>
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
            <button disabled={per !== null && per < 100} type="button" onClick={prevStep}>Previous</button>
            <button type="submit" onClick={handleSubmit}>Submit</button>
        </div>
      </div>
    )}

    {/* {step === 3 && (
      <div className="form-step">
        <h2>Step 3: Account Details</h2> */}
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
        {/* <label htmlFor="accountNumber">Account Number:</label>
            <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />

            <label htmlFor="bankName">Bank Name:</label>
            <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />

            <label htmlFor="bankBranch">Bank Branch Body:</label>
            <input type="text" id="bankBranch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />

            <label htmlFor="accountOpeningDate">Account Opening Date:</label>
            <input type="date" id="accountOpeningDate" name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />

      </div>
      
    )} */}

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

export default KYC;