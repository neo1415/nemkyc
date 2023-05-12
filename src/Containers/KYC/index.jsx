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
    const [formErrors, setFormErrors] = useState({});
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
     privacy:false,
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
  

  const handleChange = (event) => {
    const { name, value, type, checked, signatures } = event.target;
    if (type === 'signature') {
      setFormData({ ...formData, [name]: signatures[0] });
    } else if (type === 'checkbox') {
      const updatedArray = checked
         ? [...(Array.isArray(formData[name]) ? formData[name] : []), value]
      : (Array.isArray(formData[name]) ? formData[name].filter(item => item !== value) : []);
      setFormData({ ...formData, [name]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
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
      const requiredFields = document.querySelectorAll('input[required]');
    let allFieldsFilled = true;
    requiredFields.forEach(field => {
      if (!field.value) {
        allFieldsFilled = false;
        const fieldName = field.getAttribute('name');
        setFormErrors({...formErrors, [fieldName]: `${fieldName} is required`});
      }
    });

    const privacyCheckbox = document.querySelector('input[name="privacy"]');
    if (!privacyCheckbox.checked) {
      allFieldsFilled = false;
      setFormErrors({...formErrors, privacyPolicy: `Privacy policy must be accepted`});
    }

    // if any required field is not filled, prevent form from moving to next step
    if (!allFieldsFilled) {
      return;
    }
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
        privacy:formData.privacy,
        // complete:'Pending',
        createdAt: Timestamp.now().toDate().toString(),
        timestamp: serverTimestamp()
        
      });
    } catch (err) {
      console.log(err);
    }
  };
  

  const nextStep = () => {
    // check if all required fields are filled
    const requiredFields = document.querySelectorAll('input[required]');
    let allFieldsFilled = true;
    requiredFields.forEach(field => {
      if (!field.value) {
        allFieldsFilled = false;
        const fieldName = field.getAttribute('name');
        setFormErrors({...formErrors, [fieldName]: `${fieldName} is required`});
      }
    });

    // if any required field is not filled, prevent form from moving to next step
    if (!allFieldsFilled) {
      return;
    }

    // if all required fields are filled, move to next step
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
             {formErrors.insured && <span className="error-message">{formErrors.insured}</span>}

            <input type="text" id="contactAddress" placeholder="Contact's Address" name="contactAddress" value={formData.contactAddress} onChange={handleChange} required />
             {formErrors.contactAddress && <span className="error-message">{formErrors.contactAddress}</span>}

            <input type="text" id="contactTelephoneNumber" placeholder="Contact's Telephone Number" name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />
             {formErrors.contactTelephoneNumber && <span className="error-message">{formErrors.contactTelephoneNumber}</span>}

            <input type="text" placeholder='Occupation' id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} required />
             {formErrors.occupation && <span className="error-message">{formErrors.occupation}</span>}

            <select id="gender" name="gender" size="1"
             value={formData.gender} onChange={handleChange} required >
                <option value="Gender">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
            </select> 
             {formErrors.gender && <span className="error-message">{formErrors.gender}</span>}

            <label htmlFor="dateOfBirth">Date Of Birth:</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
             {formErrors.dateOfBirth && <span className="error-message">{formErrors.dateOfBirth}</span>}

            </div>

            <div className='flex-two'>
            <input type="text" id="mothersMaidenName" placeholder="Mother's Maiden Name" name="mothersMaidenName" value={formData.mothersMaidenName} onChange={handleChange} required />
             {formErrors.mothersMaidenName && <span className="error-message">{formErrors.mothersMaidenName}</span>}

            <input type="text" placeholder="Employer's Name" id="employersName" name="employersName" value={formData.employersName} onChange={handleChange} required />
             {formErrors.employersName && <span className="error-message">{formErrors.employersName}</span>}

            <input type="text" id="employersTelephoneNumber" placeholder="Employer's Telephone Number" name="employersTelephoneNumber" value={formData.employersTelephoneNumber} onChange={handleChange} required />
             {formErrors.employersTelephoneNumber && <span className="error-message">{formErrors.employersTelephoneNumber}</span>}

            <input type="text" id="employer'sAddress" placeholder='Employers Address' name="employersAddress" value={formData.employersAddress} onChange={handleChange} required />
             {formErrors.emailAddress && <span className="error-message">{formErrors.emailAddress}</span>}

            <input type="text" placeholder='City' id=" city" name="city" value={formData.city} onChange={handleChange} required />
             {formErrors.city && <span className="error-message">{formErrors.city}</span>}

            <input type="text" id=" state" placeholder='State' name="state" value={formData.state} onChange={handleChange} required /> 
             {formErrors.state && <span className="error-message">{formErrors.state}</span>}

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
             {formErrors.country && <span className="error-message">{formErrors.country}</span>}

            <input type="text" id=" nationality" placeholder='Nationality' name="nationality" value={formData.nationality} onChange={handleChange} required />
             {formErrors.nationality && <span className="error-message">{formErrors.nationality}</span>}

            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} required />
             {formErrors.residentialAddress && <span className="error-message">{formErrors.residentialAddress}</span>}

            <input type="text" id="officeAddress" placeholder='Office Address' name="officeAddress" value={formData.officeAddress} onChange={handleChange} required />
             {formErrors.officeAddress && <span className="error-message">{formErrors.officeAddress}</span>}

            <input type="text" id=" GSMno" placeholder='GSM Number' name="GSMno" value={formData.GSMno} onChange={handleChange} required />
             {formErrors.GSMno && <span className="error-message">{formErrors.GSMno}</span>}

            </div>
        
            <div className='flex-two'>

            <input type="email" id="emailAddress" placeholder='Email Address:' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
             {formErrors.email && <span className="error-message">{formErrors.email}</span>}

            <select id="identificationType" name="identificationType" size="1"
             value={formData.identificationType} onChange={handleChange} required >
                <option value="Choose Identification Type">Identification Type</option>
                <option value="drivers licence">Drivers Licence</option>
                <option value="international passport">International Passport</option>
                <option value="national ID">National ID</option>
                <option value="voter's card">Voter's Card</option>
            </select> 
             {formErrors.identificationType && <span className="error-message">{formErrors.identificationType}</span>}

            <input type="text" id="identificationNumber" placeholder='Identification Number' name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} required />
             {formErrors.identificationNumber && <span className="error-message">{formErrors.identificationNumber}</span>}

            <label htmlFor="issuedDate">Issued Date:</label>
            <input type="date" id="issuedDate" name="issuedDate" value={formData.issuedDate} onChange={handleChange} required />
             {formErrors.issuedDate && <span className="error-message">{formErrors.issuedDate}</span>}

            <label htmlFor="expiryDate">expiry Date:</label>
            <input type="date" id="expiryDate" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
             {formErrors.expiryDate && <span className="error-message">{formErrors.expiryDate}</span>}

           
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
             {formErrors.annualIncomeRange && <span className="error-message">{formErrors.annualIncomeRange}</span>}

            <select id="premiumPaymentSource" name="premiumPaymentSource" size="1"
             value={formData.premiumPaymentSource} onChange={handleChange} required >
                <option value="Choose Income Source">Premium Payment Source</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 
             {formErrors.premiumPaymentSource && <span className="error-message">{formErrors.premiumPaymentSource}</span>}

            <label htmlFor=" date">Date:</label>
            <input type="date" id=" date" name="date" value={formData.date} onChange={handleChange} required />
               {formErrors.date && <span className="error-message">{formErrors.date}</span>}

              <div className='upload-section'>
               <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="signature" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Signature</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            <input type="file" id="signature" name="signature" onChange={changeHandler}  />
            </label>
            <div className='Output'>
            {error && <div className='error'>{error}</div>}
                {signature && <div className='error'>{signature.name}</div>}
              </div>
              </div>
              </div>
             <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="identification" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Means of Identification</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
             <input type="file" id="identification" name="identification" onChange={changeHandler}  />
            </label>
  
            <div className='Output'>
            {error && <div className='error'>{error}</div>}
                {identification && <div className='error'>{identification.name}</div>}
              </div>
              </div>
              </div>
</div>
            <label htmlFor="privacy">
            <input type="checkbox" id="privacy" name="privacy" onChange={handleChange} required />
            Please note that your data will be treated 
            with the utmost respect and privacy as required by law.
            By checking this box, you acknowledge and 
            agree to the purpose set-out in this clause 
            and our data privacy policy. Thank you.<span className="required-star">*</span>
          </label>
          {formErrors.privacy && <span className="error-message">{formErrors.privacy}</span>}

              <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="button" onClick={nextStep}>Next</button>
        </div>
      </motion.div>
      
    )} 

    {step === 4 && (
      <div className="form-step">
        <h3> Confirmation</h3>
        <h4 className='announce'>
        I/we hereby declare that all information provided are true and complete to the best of my
         knowledge and hereby agree that this information shall form the basis of the business relationship 
         between me/us and NEM Insurance Plc. If there is any addition or alteration in the information provided
         after the submission of this proposal form, the same shall be communicated to the Company.
         </h4>
        <label htmlFor="privacy">
        <input type="checkbox" id="privacy" className='conf' name="privacy" onChange={handleChange} required />
 I Agree.<span className="required-star">*</span>
</label>
{formErrors.privacy && <span className="error-message">{formErrors.privacy}</span>}
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="submit" disabled={per !== null && per < 100}  onClick={handleSubmit}>Submit</button>
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