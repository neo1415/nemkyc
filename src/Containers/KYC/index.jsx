import React, { useState } from 'react';
import './KYC.scss'
import { db,storage } from '../../APi';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { setDoc,doc } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion";
import { images } from '../../Constants';
import { Link } from 'react-router-dom';
import useFormData from './FormData';
import PersonalInfo from './Inputs/PersonalInfo';
import AdditionalInfo from './Inputs/AdditionalInfo';
import FinancialInfo from './Inputs/FinancialInfo';
import SubmitModal from '../Modals/SubmitModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { endpoints } from '../../Admin/Authentication/Points';


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
  const [isUploading, setIsUploading] = useState(false);
  

  const handleFileUpload = async (file, fieldName) => {
    if (file) {
      // Generate a unique filename using a timestamp
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      setIsUploading(true);
    
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
      const storagePath = `individual-kyc-file-submissions/${fieldName}/${fileName}`;
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
          setIsUploading(false); 
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setFormData((prev) => ({ ...prev, [fieldName]: downloadURL })); // Use fieldName here
            showSuccessToast();
            setIsUploading(false); 
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

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  

    if (type === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      // Only trigger validation error if the input is not in progress
      if (value.trim() !== '' && value.indexOf('com') !== -1 && !emailRegex.test(value)) {
        setFormErrors({ ...formErrors, [name]: 'Please enter a valid email address' });
      } else {
        setFormErrors({ ...formErrors, [name]: null });
        sanitizedValue = value.trim();
      }
    } else if (type === 'number') {
      if (name === 'accountNumber' || name === 'contactTelephoneNumber' || name ==='GSMno') {
        sanitizedValue = value.replace(/[^+0-9]/g, "");
  
        if (sanitizedValue.length > 11) {
          setFormErrors({ ...formErrors, [name]: `${name} must be at most 11 digits long` });
          sanitizedValue = sanitizedValue.slice(0, 11);
        }
      } else {
        sanitizedValue = value.replace(/[^+0-9]/g, "");
      }
    } else if (type === 'text') {
      // Allow spaces and sanitize HTML
      sanitizedValue = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  
      // Validate text input, allowing only certain characters
      const textRegex = /^[a-zA-Z0-9,\s]*$/; // Allow alphanumeric, commas, and spaces
      if (value.trim() !== '' && !textRegex.test(value)) {
        setFormErrors({ ...formErrors, [name]: 'Invalid characters in the text field' });
        return;
      }
  
      const maxLength = 120; // Adjust the maximum length as needed
      if (sanitizedValue.length > maxLength) {
        setFormErrors({ ...formErrors, [name]: `Maximum ${maxLength} characters allowed` });
        sanitizedValue = sanitizedValue.slice(0, maxLength);
      } else {
        setFormErrors({ ...formErrors, [name]: null }); // Clear error for valid input
      }
    }
  
    // Other field types (file, checkbox)
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
    e.preventDefault();
  
    const requiredFields = Array.from(document.querySelectorAll('input[required]'));
    const privacyCheckbox = document.querySelector('input[name="privacy"]');
    
    const allFieldsFilled = requiredFields.every(field => field.value);
    const privacyChecked = privacyCheckbox.checked;
  
    const newFormErrors = requiredFields.reduce((errors, field) => {
      const fieldName = field.getAttribute('name');
      return field.value ? errors : { ...errors, [fieldName]: `${fieldName} is required` };
    }, {});
  
    if (!privacyChecked) {
      newFormErrors.privacyPolicy = 'Privacy policy must be accepted';
    }
  
    setFormErrors(newFormErrors);
  
    if (!allFieldsFilled || !privacyChecked) {
      return;
    }
  
    try {
      setIsSubmitted(true);
      const response = await axios.post(endpoints.submitIndividualForm, formData);
  
      if (response.status === 201) {
        console.log('Form submitted successfully');
        showSuccessToast('Form Submitted succesfully.'); 
      } else {
        console.error('Error during form submission:', response.statusText);
      }
    } catch (err) {
      console.error('server error during form submission:', err);
      showErrorToast('An error occurred during submission. Please try again.'); 
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
    //  if (!allFieldsFilled) {
    //    return;
    //  }
 
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
          <img src={images.form4} className='form-img' alt='fixed' />
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
            {isUploading && (
        <Backdrop open={isUploading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress color="inherit" />
            <p>Uploading File</p>
          </div>
        </Backdrop>
      )}
        <h3>Financial Details</h3>\
        <p className='file-type'>Uploads should not be more than 5mb</p>
        <p className='file-type'>Only pdf, jpg and png files are allowed</p>
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