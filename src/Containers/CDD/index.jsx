import React, { useState,useEffect } from 'react';
import './CDD.scss'
import { db,storage } from '../../APi';
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { HiCloudUpload } from 'react-icons/hi';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"
import image from './form2.jpg'
import { HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';

function CDD() {
  const [step, setStep] = useState(1);
  const [identification, setIdentification] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [cac, setCac] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [tax, setTax] = useState('');
  const [cacForm, setcacForm] = useState('');
  const [per, setPerc] = useState(null)
  const [error , setError]= useState(null)
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
    position:'',
    placeOfBirth:'',
    occupation:'',
    taxIDNumber:'',
    sourceOfIncome:[],
    nationality:'',
   phoneNumber:'',
   email:'',
   idType:[],
   idNumber:'',
   issuedDate:'',
   expiryDate:'',                                                                                                                                                                                                                                         
    issuingBody:'',
    dob2:'',
    firstName2: '',
    lastName2:'',
    residentialAddress2:'', 
    position2:'',
    placeOfBirth2:'',
    occupation2:'',
    taxIDNumber2:'',
    sourceOfIncome2:[],
    nationality2:'',
   phoneNumber2:'',
   email2:'',
   idType2:[],
   idNumber2:'',
   issuedDate2:'',
   expiryDate2:'',                                                                                                                                                                                                                                                
    issuingBody2:'',
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
  });

  const types= ['application/pdf'];

  useEffect(() => {
    const uploadCac = () =>{
      const name = cac.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, cac);
    
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
      setFormData((prev)=>({...prev, cac:downloadURL}))
    });
  }
);

    }
      cac && uploadCac();
  }, [cac]);

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

  useEffect(() => {
    const uploadtax = () =>{
      const name = tax.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, tax);
    
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
      setFormData((prev)=>({...prev, tax:downloadURL}))
    });
  }
);

    }
      tax && uploadtax();
  }, [tax]);

  useEffect(() => {
    const uploadCacForm = () =>{
      const name = cacForm.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, cacForm);
    
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
      setFormData((prev)=>({...prev, cacForm:downloadURL}))
    });
  }
);

    }
      cacForm && uploadCacForm();
  }, [cacForm]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
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

  const changeHandler = (e) => {
    let selected = e.target.files[0];
    if (selected && types.includes(selected.type)) {
      if (e.target.name === "identification") {
        setIdentification(selected);
        setError('');
      } else if (e.target.name === "cac") {
        setCac(selected);
        setError('');
      }
      else if (e.target.name === "tax") {
        setTax(selected);
        setError('');
      }
      else if (e.target.name === "cacForm") {
        setcacForm(selected);
        setError('');
      }
    } else {
      if (e.target.name === "identification") {
        setIdentification(null);
        setError('Please select a PDF document');
      } else if (e.target.name === "identification") {
        setIdentification(null);
        setError('Please select a PDF document');
      }else if (e.target.name === "tax") {
        setTax(null);
        setError('Please select a PDF document');
    }else if (e.target.name === "cacForm") {
      setTax(null);
      setError('Please select a PDF document');
    }
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
      position:'',
      placeOfBirth:'',
      occupation:'',
      taxIDNumber:'',
      sourceOfIncome:[],
      nationality:'',
     phoneNumber:'',
     email:'',
     idType:[],
     idNumber:'',
     issuedDate:'',
     expiryDate:'',                                                                                                                                                                                                                                         
      issuingBody:'',
      dob2:'',
      firstName2: '',
      lastName2:'',
      residentialAddress2:'', 
      position2:'',
      placeOfBirth2:'',
      occupation2:'',
      taxIDNumber2:'',
      sourceOfIncome2:[],
      nationality2:'',
     phoneNumber2:'',
     email2:'',
     idType2:[],
     idNumber2:'',
     issuedDate2:'',
     expiryDate2:'',                                                                                                                                                                                                                                                
      issuingBody2:'',
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
     })
         setIsSubmitted(false)
    }

      const closeModal = () => {
    // setFormData({ date: '' });
    setIsSubmitted(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault()
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
        occupation: formData.occupation,
        taxIDNumber: formData.taxIDNumber,
        position: formData.position,
        nationality: formData.nationality,
        placeOfBirth: formData.placeOfBirth,
        phoneNumber: formData.phoneNumber,
        idType: formData.idType,
        idNumber: formData.idNumber,
        issuedDate: formData.issuedDate,
        expiryDate: formData.expiryDate,
        email: formData.email,
        sourceOfIncome: formData.sourceOfIncome,
        residentialAddress: formData.residentialAddress,
        issuingBody: formData.issuingBody,
        dob2: formData.dob2,
        firstName2: formData.firstName2,
        lastName2: formData.lastName2,
        occupation2: formData.occupation2,
        taxIDNumber2: formData.taxIDNumber2,
        position2: formData.position2,
        nationality2: formData.nationality2,
        placeOfBirth2: formData.placeOfBirth2,
        phoneNumber2: formData.phoneNumber2,
        idType2: formData.idType2,
        idNumber2: formData.idNumber2,
        issuedDate2: formData.issuedDate2,
        expiryDate2: formData.expiryDate2,
        email2: formData.email2,
        sourceOfIncome2: formData.sourceOfIncome2,
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
        identification: formData.identification,
        cac: formData.cac,
        tax: formData.tax,
        cacForm: formData.cacForm,
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
    <div style={{display:'flex', justifyContent:'flex-start',marginTop:'-40px'}}>
           <div className='picture'>
              <img src={image} className='form-img' />
            </div>
    <div className='form-page'>

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
            {formErrors.companyName && <span className="error-message">{formErrors.companyName}</span>}

            <input type="text" id="registeredCompanyAddress" placeholder='Registered Company Address' name="registeredCompanyAddress" value={formData.registeredCompanyAddress} onChange={handleChange} required />
            {formErrors.registeredCompanyAddress && <span className="error-message">{formErrors.registeredCompanyAddress}</span>}

            <input type="text" id="contactTelephoneNumber" placeholder='Contact Telephone Number' name="contactTelephoneNumber" value={formData.contactTelephoneNumber} onChange={handleChange} required />
            {formErrors.contactTelephoneNumber && <span className="error-message">{formErrors.contactTelephoneNumber}</span>}

            <input type="email" id="emailAddress" placeholder='Email Address' name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}

            <input type="email" id="website" placeholder='Website' name="website" value={formData.website} onChange={handleChange} required />
            {formErrors.website && <span className="error-message">{formErrors.website}</span>}

            <input type="text" id="contactPerson" name="contactPerson" placeholder='Contact Person' value={formData.contactPerson} onChange={handleChange} required />
            {formErrors.contactPerson && <span className="error-message">{formErrors.contactPerson}</span>}
            </div>

            <div className='flex-two'>

            <input type="text" id="taxIdentificationNumber" placeholder='Tax Identification Number' name="taxIdentificationNumber" value={formData.taxIdentificationNumber} onChange={handleChange} required />
            {formErrors.taxIdentificationNumber && <span className="error-message">{formErrors.taxIdentificationNumber}</span>}
            
            <input type="text" id="VATRegistrationNumber" placeholder='VAT Registration Number' name="VATRegistrationNumber" value={formData.VATRegistrationNumber} onChange={handleChange} required />
            {formErrors.VATRegistrationNumber && <span className="error-message">{formErrors.VATRegistrationNumber}</span>}

            <label htmlFor="dateOfIncorporationRegistration">Date of Incorporation Registration:</label>
            <input type="date" id="dateOfIncorporationRegistration" name="dateOfIncorporationRegistration" value={formData.dateOfIncorporationRegistration} onChange={handleChange} required />
            {formErrors.dateOfIncorporationRegistration && <span className="error-message">{formErrors.dateOfIncorporationRegistration}</span>}

            <input type="text" placeholder='Incorporation State' id="incorporationState" name="incorporationState" value={formData.incorporationState} onChange={handleChange} required />
            {formErrors.incorporationState && <span className="error-message">{formErrors.incorporationState}</span>}
            
            <select id="companyType" name="companyType"
             value={formData.companyType} onChange={handleChange} required >
                <option value="Choose Company Type">Company Type</option>
                <option value="Sole-Proprietor">Sole Proprietor</option>
                <option value="Limited-Liability-Company">Limited Liability Company</option>
                <option value="Joint-Venture">Joint Venture</option>
            </select> 
            {formErrors.companyType && <span className="error-message">{formErrors.companyType}</span>}
        </div>
            </div>
            <div className='button-flex'>
            <Link to='/'>
              <button type='button'>Home page</button>
            </Link>
            <button type="button"  onClick={nextStep} >Next</button>
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
             <h3>Director's Profile 1</h3>
        <div className='flexer'>
     
          <div className='flex-one'>
   
            <input type="text" id=" firstName" placeholder='First Name' name="firstName" value={formData.firstName} onChange={handleChange} />
          

            <input type="text" placeholder='Last Name' id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
       

            <label htmlFor="dob">Date of Birth:</label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
          
            
            <input type="text" id="placeOfBirth" placeholder='Place Of Birth' name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />

            <input type="text" id="residentialAddress" placeholder='Residential Address' name="residentialAddress" value={formData.residentialAddress} onChange={handleChange}/>

            <input type="text" id="position" placeholder='Position' name="position" value={formData.position} onChange={handleChange} />

          
           
            <input type="text" id="occupation" placeholder='Occupation' name="occupation" value={formData.occupation} onChange={handleChange} />

            <input type="text" id="taxIDNumber" placeholder='Tax ID Number' name="taxIDNumber" value={formData.taxIDNumber} onChange={handleChange} />

            <select id="sourceOfIncome" name="sourceOfIncome" size=""
             value={formData.sourceOfIncome} onChange={handleChange} >
                <option value="Choose Income Source">Source Of Income</option>
                <option value="salaryOrBusinessIncome">Salary or Business Income</option>
                <option value="investmentsOrDividends">Investments or Dividends</option>
            </select> 
    
</div>
     <div className='flex-two'>
        
            <input type="email" id="email" placeholder='Email' name="email" value={formData.email} onChange={handleChange} />

            <input type="text" id="phoneNumber" placeholder='Phone Number' name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />

            

       
            <input type="text" id="nationality" placeholder='Nationality' name="nationality" value={formData.nationality} onChange={handleChange} />

            <select id="idType" name="idType"
             value={formData.idType} onChange={handleChange} >
                <option value="Choose ID Type">Choose ID Type</option>
                <option value="international passport">International passport</option>
                <option value="NIMC">NIMC</option>
                <option value="Drivers licence">Drivers Licence</option>
                <option value="Voters Card">Voters Card</option>
            </select> 

            <input type="text" id="idNumber" placeholder='ID Number' name="idNumber" value={formData.idNumber} onChange={handleChange}/>

            <label htmlFor="issuedDate">Issued Date</label>
            <input type="date" id="issuedDate" placeholder='Issued Date' name="issuedDate" value={formData.issuedDate} onChange={handleChange} />

            <label htmlFor="expiryDate">Expiry date:</label>
            <input type="date" id="expiryDate" placeholder='Expiry Date' name="expiryDate" value={formData.expiryDate} onChange={handleChange} />

            <input type="text" id="issuingBody" placeholder='Issuing Body' name="issuingBody" value={formData.issuingBody} onChange={handleChange} />
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
       <h3>Director's Profile 2</h3>
       <div className='flexer'>
        <div className='flex-one'>
           
            <input type="text" id=" firstName2" placeholder='First Name' name="firstName2" value={formData.firstName2} onChange={handleChange} />

            <input type="text" placeholder='Last Name' id="lastName2" name="lastName2" value={formData.lastName2} onChange={handleChange} />

            <label htmlFor="dob2">Date of Birth:</label>
            <input type="date" id="dob2" name="dob2" value={formData.dob2} onChange={handleChange} />
            
            <input type="text" id="placeOfBirth2" placeholder='Place Of Birth' name="placeOfBirth2" value={formData.placeOfBirth2} onChange={handleChange} />

            <input type="text" id="residentialAddress2" placeholder='Residential Address' name="residentialAddress2" value={formData.residentialAddress2} onChange={handleChange} />

            <input type="text" id="position2" placeholder='Position' name="position2" value={formData.position2} onChange={handleChange} />

            <input type="text" id="occupation2" placeholder='Occupation' name="occupation2" value={formData.occupation2} onChange={handleChange} />

            <input type="text" id="taxIDNumber2" placeholder='Tax ID Number' name="taxIDNumber2" value={formData.taxIDNumber2} onChange={handleChange} />
    
            <select id="sourceOfIncome2" name="sourceOfIncome2" size=""
             value={formData.sourceOfIncome} onChange={handleChange} >
                <option value="Choose Income Source">Source Of Income</option>
                <option value="salaryOrBusinessIncome2">Salary or Business Income</option>
                <option value="investmentsOrDividends2">Investments or Dividends</option>
            </select> 
           
            </div>
            <div className='flex-two'>
        
            <input type="email" id="email2" placeholder='Email' name="email2" value={formData.email2} onChange={handleChange} />

            <input type="text" id="phoneNumber2" placeholder='Phone Number' name="phoneNumber2" value={formData.phoneNumber2} onChange={handleChange} />

            <input type="text" id="nationality2" placeholder='Nationality' name="nationality2" value={formData.nationality2} onChange={handleChange} />

            <select id="idType2" name="idType2"
             value={formData.idType2} onChange={handleChange} >
                <option value="Choose ID Type2">Choose ID Type</option>
                <option value="international passport2">International passport</option>
                <option value="NIMC2">NIMC</option>
                <option value="Drivers licence2">Drivers Licence</option>
                <option value="Voters Card2">Voters Card</option>
            </select> 

            <input type="text" id="idNumber2" placeholder='ID Number' name="idNumber2" value={formData.idNumber2} onChange={handleChange} />

            <label htmlFor="issuedDate2">Issued Date</label>
            <input type="date" id="issuedDate2" placeholder='Issued Date' name="issuedDate2" value={formData.issuedDate2} onChange={handleChange} />

            <label htmlFor="expiryDate2">Expiry date:</label>
            <input type="date" id="expiryDate2" placeholder='Expiry Date' name="expiryDate2" value={formData.expiryDate2} onChange={handleChange} />

            <input type="text" id="issuingBody2" placeholder='Issuing Body' name="issuingBody2" value={formData.issuingBody2} onChange={handleChange} />

            </div>
            </div>
            <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button" onClick={nextStep}>Next</button>
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
      <div className='flexer'>
      <div className='flex-one'>
        <h3>Naira Account Details</h3>

<input type="text" id="accountNumber" placeholder='Account Number' name="accountNumber" value={formData.accountNumber} onChange={handleChange} required />
{formErrors.accountNumber && <span className="error-message">{formErrors.accountNumber}</span>}
<input type="text" placeholder='Bank Name' id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />
{formErrors.bankName && <span className="error-message">{formErrors.bankName}</span>}

<input type="text" id="bankBranch" placeholder='Bank Branch Body' name="bankBranch" value={formData.bankBranch} onChange={handleChange} required />
{formErrors.bankBranch && <span className="error-message">{formErrors.bankBranch}</span>}

<input type="date" id="accountOpeningDate" placeholder='Account Opening Date' name="accountOpeningDate" value={formData.accountOpeningDate} onChange={handleChange} required />
{formErrors.accountOpeningDate && <span className="error-message">{formErrors.accountOpeningDate}</span>}
</div>
<div className='flex-two'>
        <h3> Dollar Account Details</h3>

            <input type="text" id="accountNumber2" placeholder='Account Number' name="accountNumber2" value={formData.accountNumber2} onChange={handleChange} required />
            {formErrors.accountNumber2 && <span className="error-message">{formErrors.accountNumber2}</span>}

            <input type="text" placeholder='Bank Name' id="bankName2" name="bankName2" value={formData.bankName2} onChange={handleChange} required />
            {formErrors.bankName2 && <span className="error-message">{formErrors.bankName}</span>}

            <input type="text" id="bankBranch2" placeholder='Bank Branch Body' name="bankBranch2" value={formData.bankBranch2} onChange={handleChange} required />
            {formErrors.bankBranch2 && <span className="error-message">{formErrors.bankBranch2}</span>}

            <input type="date" id="accountOpeningDate2" placeholder='Account Opening Date' name="accountOpeningDate2" value={formData.accountOpeningDate2} onChange={handleChange} required />
            {formErrors.accountOpeningDate2 && <span className="error-message">{formErrors.accountOpeningDate2}</span>}

            </div>

            </div>
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="button" onClick={nextStep}>Next</button>

        </div>
      </motion.div>
      </div>
      
    )}

    {step === 5 && (
      <motion.div
        initial={{ opacity: 0, x: 50}}
            animate={{ opacity: 1, x: 0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}
      className="form-step">
       <h3>File Uploads</h3>
        <div className='upload-form'>
        <div className='uploader'>
        <label htmlFor="cac" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your CAC Certificate</h4> 
         
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
           
            <input type="file" id="cac" name="cac" onChange={changeHandler} />
            <div className='Output'>
            {error && <div className='error'>{error}</div>}
            {cac && <div className='error'>{cac.name}</div>}
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
            </label>
  
            <input type="file" id="identification" name="identification" onChange={changeHandler}  />
            <div className='Output'>
            {error && <div className='error'>{error}</div>}
                {identification && <div className='error'>{identification.name}</div>}
              </div>
              </div>
              </div>
              <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="tax" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload Your Tax Card</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="tax" name="tax" onChange={changeHandler} />
            <div className='Output'>
            {error && <div className='error'>{error}</div>}
             {tax && <div className='error'>{tax.name}</div>}
              </div>
            </div>
            </div>
            <div className='upload-form'>
        <div className='uploader'>
            <label htmlFor="cacForm" className='upload'>
            <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
           <h4>Upload CAC Form 02 and 07</h4> 
           <div className='upload-icon'>
           <HiCloudUpload />   
           </div>
            </div>
            </label>
            <input type="file" id="cacForm" name="cacForm" onChange={changeHandler}  />
            <div className='Output'>
            <div className='Output'>
                {error && <div className='error'>{error}</div>}
                {cacForm && <div className='error'>{cacForm.name}</div>}
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
            </div>
            
         
            <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button" onClick={nextStep}>Next</button>
        </div>

            </motion.div>
      
    )}

    {step === 6 && (
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
      )}
</motion.div>
  </div>
  </div>
)
}

export default CDD;