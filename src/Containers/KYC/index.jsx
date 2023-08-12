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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function KYC() {
  const [step, setStep] = useState(1);
    const [formErrors, setFormErrors] = useState({});
  const [identification, setIdentification] = useState('');
  const [signature, setSignature] = useState('');
  const [perc, setPerc] = useState(null)
  const [error , setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formData, setFormData } = useFormData();
  const [showOtherField, setShowOtherField] = useState(false);
  const [showOtheridentificationType, setShowOtheridentificationType] = useState(false);
  const [uploading, setUploading] = useState(false); 

  const types= ['application/pdf'];

  const handleFileUpload = async (file, fieldName) => {
    if (file) {
      // Generate a unique filename using a timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
    
      // File type validation: check if the file is a PDF, JPG, or PNG
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        showErrorToast('Please upload a PDF, JPG, or PNG file.');
        return;
      }
    
      // File size validation: check if the file size is within the limit (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showErrorToast('File size exceeds the limit (5MB). Please upload a smaller file.');
        return;
      }
    
      // Construct the storage path
      const storagePath = `form_submissions/${fieldName}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
          setPerc(progress);
          // switch (snapshot.state) {
          //   case 'paused':
          //     console.log('Upload is paused');
          //     break;
          //   case 'running':
          //     console.log('Upload is running');
          //     break;
          //   default:
          //     break;
          // }
        },
        (error) => {
          // console.log(error);
          showErrorToast('An error occurred during file upload. Please try again.'); // Show error toast for upload error
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setFormData((prev) => ({ ...prev, [fieldName]: downloadURL })); // Use fieldName here
            showSuccessToast();
    
            // Set the uploading state back to false after the file is uploaded
            setUploading(false);
    
            // Reset the progress state after upload is completed
            setPerc(0);
          });
        }
      );
      setUploading(true);
    }
  };
  
  const showSuccessToast = () => {
    toast.success('Your file has been uploaded successfully!');
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: toast.POSITION.TOP_RIGHT,
      autoClose: 3000, // Adjust the duration as needed
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
    });
  };
  
  // Change handler
  const changeHandler = (e) => {
    const selectedFile = e.target.files[0];
    const fieldName = e.target.name;
  
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    
    const isTypeValid = selectedFile && allowedTypes.includes(selectedFile.type);
    const isSizeValid = selectedFile && selectedFile.size <= maxSize;
  
    if (!isTypeValid) {
      showErrorToast('Please select a PDF, JPG, or PNG file.');
    } else if (!isSizeValid) {
      showErrorToast('File size exceeds the limit (5MB). Please upload a smaller file.');
    }  else {
      setError('');
    switch (fieldName) {
      case 'identification':
        setIdentification(selectedFile);
        break;
      case 'signature':
        setSignature(selectedFile);
        break;
      default:
        break;
    }
  
      handleFileUpload(selectedFile, fieldName);
  }
  };


  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
  
    // Input validation and sanitization
    let sanitizedValue = value;
    if (type === 'email') {
      // Validate email format using regex
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        // Invalid email format
        setFormErrors({ ...formErrors, [name]: 'Please enter a valid email address' });
      }
      // Sanitize the email value if desired (e.g., remove leading/trailing spaces)
      sanitizedValue = value.trim();
    } else if (type === 'number') {
      // Check if the field has a length limit
      if (name === 'accountNumber' || name ==='accountNumber2') {
        // Ensure only numbers are allowed in the field
        sanitizedValue = value.replace(/[^+0-9]/g, "");
  
        // Check if the value is longer than 11 characters
        if (sanitizedValue.length > 10) {
          setFormErrors({ ...formErrors, [name]: 'Number must be at most 10 digits long' });
          // Truncate the value to the first 11 digits if desired
          sanitizedValue = sanitizedValue.slice(0, 11);
        }
      } else {
        // Handle the other number field without a length limit here
        sanitizedValue = value.replace(/[^+0-9]/g, "");
      }
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
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show the text field
    setShowOtherField(value === 'Other');
    // Update the form data state, setting the value to empty if "Other" is selected
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };

  const handleidentificationTypeChange = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtheridentificationType(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
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
      showErrorToast('There was an error submitting your form. please try again');
      // console.log(err);

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

  // console.log(formData)

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
            {!uploading && perc === 100 && <div>File uploaded successfully!</div>}
        <h3>Financial Details</h3>
          <FinancialInfo 
            changeHandler={changeHandler} 
            handleChange={handleChange} 
            formData={formData}
            formErrors={formErrors}
            signature={signature}
            identification={identification} />
                <ToastContainer />

      <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="submit"  onClick={handleSubmit}>Submit</button>
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