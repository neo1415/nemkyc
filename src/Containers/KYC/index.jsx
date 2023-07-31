import React, { useState,useEffect } from 'react';
import './KYC.scss'
import { db,storage } from '../../APi';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion";
import { images } from '../../Constants';
import { HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import useFormData from './FormData';
import PersonalInfo from './Inputs/PersonalInfo';
import AdditionalInfo from './Inputs/AdditionalInfo';
import FinancialInfo from './Inputs/FinancialInfo';
import SubmitModal from '../Modals/SubmitModal';

function KYC() {
  const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState({});
  const [identification, setIdentification] = useState('');
  const [signature, setSignature] = useState('');
  const [per, setPerc] = useState(null)
  const [error , setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formData, setFormData } = useFormData();
  const [showOtherField, setShowOtherField] = useState(false);
  const [showOtheridentificationType, setShowOtheridentificationType] = useState(false);

  const types= ['application/pdf'];

  useEffect(() => {
    const handleFileUpload = async (file, name) => {
      if (file) {
        const storageRef = ref(storage, name);
        const uploadTask = uploadBytesResumable(storageRef, file);
  
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            setPerc(progress);
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
            console.log(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              setFormData((prev) => ({ ...prev, [name]: downloadURL }));
            });
          }
        );
      }
    };
  
    const fileFields = [
      { field: signature, name: 'signature' },
      { field: identification, name: 'identification' },
    ];
  
    fileFields.forEach(({ field, name }) => {
      handleFileUpload(field, name);
    });
  }, [signature, identification]);
  
  const changeHandler = (e) => {
    const selectedFile = e.target.files[0];
    const fieldName = e.target.name;
  
    const isPDF = selectedFile && types.includes(selectedFile.type);
    const errorMessage = isPDF ? '' : 'Please select a PDF document';
  
    setError(errorMessage);
  
    switch (fieldName) {
      case "identification":
        setIdentification(isPDF ? selectedFile : null);
        break;
      case "signature":
        setSignature(isPDF ? selectedFile : null);
        break;
      default:
        break;
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
  
    // Input validation and sanitization
    let sanitizedValue = value;
    if (type === 'email') {
      // Validate email format using regex
      // const emailRegex = /^([a-z\d.]+)@([a-z\d]+)(\.[a-z]{2,5})(\.[a-z]{2,5})?$/;
      // if (!emailRegex.test(value)) {
      //   // Invalid email format
      //   setFormErrors({ ...formErrors, [name]: 'Please enter a valid email address' });
      // }
      // Sanitize the email value if desired (e.g., remove leading/trailing spaces)
      sanitizedValue = value.trim();
    } else if (type === 'number') {
      // Ensure only numbers are allowed in the field
      // You can use regex or other techniques to validate/sanitize numbers if needed
    setFormErrors({ ...formErrors, [name]: 'Please enter a valid number' });
      sanitizedValue = value.replace(/[^0-9]/g, '');
    }
  
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      const updatedArray = checked
        ? [...(Array.isArray(formData[name]) ? formData[name] : []), sanitizedValue]
        : (Array.isArray(formData[name]) ? formData[name].filter((item) => item !== sanitizedValue) : []);
      setFormData({ ...formData, [name]: updatedArray });
    } else {
      setFormData({ ...formData, [name]: sanitizedValue });
    }
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show the text field
    setShowOtherField(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  const handleidentificationTypeChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtheridentificationType(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  const resetForm = () => {
    window.location.reload(false);
  };

  const closeModal = () => {
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
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
    
      return `${day}/${month}/${year}`;
    };
    try {
      setIsSubmitted(true);
      const now = new Date();
      const formattedDate = formatDate(now);
      await setDoc(doc(db, "individuals", uuidv4()), {
        ...formData,
        createdAt: formattedDate,
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
 
    //  // if any required field is not filled, prevent form from moving to next step
     if (!allFieldsFilled) {
       return;
     }
 
    //  // if all required fields are filled, move to next step
     setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  console.log(formData)

  return (
    <div className='forms' style={{display:'flex',flexDirection:'column' }}>
      <div className='forms-page'>
        <div className='picture'>
          <img src={images.form4} className='form-img' alt='fixed-image' />
        </div>
      <motion.div
        initial={{ opacity: 0, x: 0}}
        animate={{ opacity: 1, x: 0 }}
        transition= {{ duration:.5, ease:'easeOut' }}
        exit={{ opacity: 0, x: 0 }}
        className="multisteps-form">

        {isSubmitted ? (
          <div className="modal">
         <SubmitModal closeModal={closeModal} resetForm={resetForm} />
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
              <PersonalInfo handleChange={handleChange} formData={formData} formErrors={formErrors} />
     
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

            <h3>Additional Details</h3>
            <AdditionalInfo 
            handleChange={handleChange} 
            formData={formData} 
            formErrors={formErrors} 
            showOtherField={showOtherField}
            handleSelectChange={handleSelectChange}
            handleidentificationTypeChange={handleidentificationTypeChange}
            showOtheridentificationType={showOtheridentificationType}
            />

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

        <h3>Financial Details</h3>
          <FinancialInfo 
            changeHandler={changeHandler} 
            handleChange={handleChange} 
            formData={formData}
            formErrors={formErrors}
            signature={signature}
            identification={identification} />

      <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="submit" disabled={per !== null && per < 100}  onClick={handleSubmit}>Submit</button>
      </div>
      </motion.div>
      
    )} 
      
  </form>
      )
}
    </motion.div>

    </div>
    </div>
);
}

export default KYC;