import React, { useState,useEffect } from 'react';
import './KYC.scss'
import { db,storage } from '../../APi';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion";
import image from './form2.jpg'
import { HiCloudUpload } from 'react-icons/hi';
import { HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import Footer from '../Footer';

function KYC() {
  const [step, setStep] = useState(1);
  const [identification, setIdentification] = useState('');
  const [signature, setSignature] = useState('');
  const [per, setPerc] = useState(null)
  const [error , setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    identificationType:[],
    identificationNumber:'',
    issuedDate:'',
    expiryDate:'',
    annualIncomeRange:[],
    premiumPaymentSource:[],
    date: '',
    signature: null,
    identification:null,
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

  useEffect(() => {
    const uploadIdentification = () =>{
      const name = identification.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, identification);
    
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
      setFormData((prev)=>({...prev, identification:downloadURL}))
    });
  }
);

    }
      identification && uploadIdentification();
  }, [identification]);
  
  // const uploadIdentification = () =>{
  //   const name = identification.name;
  //   const storageRef = ref(storage, name);
  //   const uploadTask = uploadBytesResumable(storageRef, identification);
  
  //   uploadTask.on('state_changed', 
  //     (snapshot) => {
  //       const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  //       console.log('Upload is ' + progress + '% done');
  //       setPerc(progress);
  //       switch (snapshot.state) {
  //         case 'paused':
  //           console.log('Upload is paused');
  //           break;
  //         case 'running':
  //           console.log('Upload is running');
  //           break;
  //         default:
  //           break;
  //       }
  //     }, 
  //     (error) => {
  //       console.log(error)
  //     }, 
  //     () => {
  //       getDownloadURL(storageRef).then((downloadURL) => {
  //         setFormData((prev)=>({...prev, identification:downloadURL}));
  //       });
  //     }
  //   );
  // }
  

  const changeHandler = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      if (e.target.name === "signature") {
        setSignature(selected);
        setError('');
      } else if (e.target.name === "identification") {
        setIdentification(selected);
        setError('');
       
      }
    } else {
      if (e.target.name === "signature") {
        setSignature(null);
        setError('Please select a PDF document');
      } else if (e.target.name === "identification") {
        setIdentification(null);
        setError('Please select a PDF document');
      }
    }
  };
  

  const idChangeHandler = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      setIdentification(selected);
      setError('');
    } else {
      setIdentification(null);
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

  const idChange = (event) => {
    const { name, value, type, checked, id } = event.target;
    if (type === 'id') {
      setFormData({ ...formData, [name]: id[0] });
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
      identificationType:[],
      identificationNumber:'',
      issuedDate:'',
      expiryDate:'',
      annualIncomeRange:[],
      premiumPaymentSource:[],
      date: '',
      signature: null,
      identification:null
     });
    setIsSubmitted(false);
  };

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
        identificationType:formData.identification,
        identificationNumber: formData.identificationNumber,
        issuedDate: formData.issuedDate,
        expiryDate: formData.expiryDate,
        annualIncomeRange: formData.annualIncomeRange,
        premiumPaymentSource: formData.premiumPaymentSource,
        date: formData.date,
        signature: formData.signature,
        identification: formData.identification,
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
    <div className='forms' style={{display:'flex',flexDirection:'column' }}>
    <div className='form-page'>
       <div className='picture'>
          <img src={image} className='form-img' />
        </div>
    <motion.div
     initial={{ opacity: 0, x: 0}}
        animate={{ opacity: 1, x: 0 }}
        transition= {{ duration:.5, ease:'easeOut' }}
        exit={{ opacity: 0, x: 0 }}
     className="multistep-form">

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
            <h3>Personal Information</h3>
            <div className='flex-form'>
            <div className='flex-one'>
            <input type="text" id="insured" placeholder='Insured' name="insured" value={formData.insured} onChange={handleChange} required />

            <input type="text" id="contactAddress" placeholder="Contact's Address" name="contactAddress" value={formData.contactAddress} onChange={handleChange} required />

            <input type="text" id="contactTelephoneNumber" placeholder="Contact's Telephone Number" name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />

            <input type="text" placeholder='Occupation' id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />

            <select id="gender" name="gender" size="1"
             value={formData.gender} onChange={handleChange} required >
                <option value="Gender">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select> 
            
            <label htmlFor="dateOfBirth">Date Of Birth:</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
            </div>

            <div className='flex-two'>
            <input type="text" id="mothersMaidenName" placeholder="Mother's Maiden Name" name="mothersMaidenName" value={formData.mothersMaidenName} onChange={handleChange} required />
            
            <input type="text" placeholder="Employer's Name" id="employersName" name="employersName" value={formData.employersName} onChange={handleChange} required />

            <input type="text" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" name="employersTelephoneNumber" value={formData.employersTelephoneNumber} onChange={handleChange} required />
            
            <input type="text" id="employer'sAddress" placeholder='Employers Address' name="employersAddress" value={formData.employersAddress} onChange={handleChange} required />

            <input type="text" placeholder='City' id=" city" name="city" value={formData.city} onChange={handleChange} required />
            
            <input type="text" id=" state" placeholder='State' name="state" value={formData.state} onChange={handleChange} required /> 
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
            <h3>Directors Profile</h3>
            <div className='flex-form'>
            <div className='flex-one'>
            <input type="text" id=" country" placeholder='Country' name="country" value={formData.country} onChange={handleChange} required />
            
            <input type="text" id=" nationality" placeholder='Nationality' name="nationality" value={formData.nationality} onChange={handleChange} required />
            
            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />
            
            <input type="text" id="officeAddress" placeholder='Office Address' name="officeAddress" value={formData.officeAddress} onChange={handleChange} required />

            <input type="text" id=" GSMno" placeholder='GSM Number' name="GSMno" value={formData.GSMno} onChange={handleChange} required />

            </div>
        
            <div className='flex-two'>

            <input type="email" id="emailAddress" placeholder='Email Address:' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />

            <select id="identificationType" name="identificationType" size="1"
             value={formData.identificationType} onChange={handleChange} required >
                <option value="Choose Identification Type">Identification Type</option>
                <option value="drivers licence">Drivers Licence</option>
                <option value="international passport">International Passport</option>
                <option value="national ID">National ID</option>
                <option value="voter's card">Voter's Card</option>
            </select> 
            
            <input type="text" id="identificationNumber" placeholder='Identification Number' name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} required />

            <label htmlFor="issuedDate">Issued Date:</label>
            <input type="date" id="issuedDate" name="issuedDate" value={formData.issuedDate} onChange={handleChange} required />

            <label htmlFor="expiryDate">expiry Date:</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />

           
          </div>
          </div>

        <div className='button-flex'>
            <button  onClick={prevStep}>Previous</button>
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
            <select id="annualIncomeRange" name="annualIncomeRange" size="1"
             value={formData.annualIncomeRange} onChange={handleChange} required >
                <option value="Choose Income Range">Annual Income Range</option>
                <option value="lessThanIMillion">Less Than 1 Million</option>
                <option value="1million-4million">1 Million - 4 Million</option>
                <option value="4.1million-10million">4.1 Million - 10 Million</option>
                <option value="morethan10million">More than 10 Million</option>
            </select> 

            <select id="premiumPaymentSource" name="premiumPaymentSource" size="1"
             value={formData.premiumPaymentSource} onChange={handleChange} required >
                <option value="Choose Income Source">Premium Payment Source</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 

            <label htmlFor=" date">Date:</label>
            <input type="date" id=" date" name="date" value={formData.date} onChange={handleChange} required />

            <label htmlFor="signature" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Signature</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="signature" name="signature" onChange={changeHandler} />

            <label htmlFor="identification" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Identification</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="identification" name="identification" onChange={changeHandler} />
            <div className='Output'>
                {error && <div className='error'>{error}</div>}
                {signature && <div className='error'>{signature.name}</div>}
                {identification && <div className='error'>{identification.name}</div>}
              </div>

              <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" disabled={per !== null && per < 100}  onClick={handleSubmit}>Submit</button>
        </div>
      </motion.div>
      
    )} 

    {step === 4 && (
      <div className="form-step">
        <h3> Confirmation</h3>
        
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit">Submit</button>
        </div>
      </div>
      
    )}
  </form>
      )
}
    </motion.div>

    </div>
    {/* <Footer /> */}
    </div>
);
}

export default KYC;