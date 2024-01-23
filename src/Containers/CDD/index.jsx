import React, { useState} from 'react';
import './CDD.scss'
import { storage } from '../../APi';
// import { setDoc,doc} from 'firebase/firestore'
// import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';
import useFormData from './FormData';
import CompanyDetails from './Inputs/CompanyDetails';
import Director1 from './Inputs/Director1';
import Director2 from './Inputs/Director2';
import AccountDetails from './Inputs/AccountDetails';
import Uploads from './Inputs/Uploads';
import { images } from '../../Constants';
import SubmitModal from '../Modals/SubmitModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import DOMPurify from 'dompurify';
import axios from 'axios';
import { endpoints } from '../../Admin/Authentication/Points';

function CDD() {
  const [step, setStep] = useState(1);
  const [identification, setIdentification] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [cac, setCac] = useState('');
  const [tax, setTax] = useState('');
  const [cacForm, setcacForm] = useState('');
  const [perc, setPerc] = useState(null)
  const [ setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formData, setFormData } = useFormData();
  const [showOtherField, setShowOtherField] = useState(false);
  const [showOtherIdType, setShowOtherIdType] = useState(false);
  const [showOtherSourceOfIncome, setShowOtherSourceOfIncome] = useState(false);
  const [showOtherSourceOfIncome2, setShowOtherSourceOfIncome2] = useState(false);
  const [showOtherField2, setShowOtherField2] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [isUploading, setIsUploading] = useState(false);


  const handleIdType2Change = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherField2(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };

  const handleSourceOfIncome2Change = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherSourceOfIncome2(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };


  const handleIdTypeChange = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherIdType(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };

  const handleSourceOfIncomeChange = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherSourceOfIncome(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };

  const handleSelectChange = (event) => {
    const { value, name } = event.target;
    // Check if the user selected "Other" option, then show the text field
    setShowOtherField(value === 'Other');
    // Update the form data state using the handleChange function
    const newValue = value === 'Other' ? '' : value;
    handleChange({ target: { name, value: newValue } });
  };

  //store files in firebase bucket
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
      const maxSize = 2 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showErrorToast('File size exceeds the limit (2MB). Please upload a smaller file.');
        return;
      }
    
      // Construct the storage path
      const storagePath = `corporate-kyc-file-submissions/${fieldName}/${fileName}`;
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

  //handle inputs
  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
  
    // Input validation and sanitization
    let sanitizedValue = value;

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
      if (name === 'accountNumber' || name === 'telephoneNumber' || name ==='employersPhoneNumber' || name ==='phoneNumber') {
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
      const textRegex = /^[a-zA-Z0-9,\s-]*$/; // Allow alphanumeric, commas, spaces, and dashes
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

  //handle files
  const changeHandler = (e) => {
    const selectedFile = e.target.files[0];
    const fieldName = e.target.name;
  
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    
    const isTypeValid = selectedFile && allowedTypes.includes(selectedFile.type);
    const isSizeValid = selectedFile && selectedFile.size <= maxSize;
  
    if (!isTypeValid) {
      showErrorToast('Please select a PDF, JPG, or PNG file.');
    } else if (!isSizeValid) {
      showErrorToast('File size exceeds the limit (2MB). Please upload a smaller file.');
    }  else {
      setError('');
      switch (fieldName) {
        case 'identification':
          setIdentification(selectedFile);
          break;
        case 'cac':
          setCac(selectedFile);
          break;
        case 'tax':
          setTax(selectedFile);
          break;
        case 'cacForm':
          setcacForm(selectedFile);
          break;
        default:
          break;
      }
      handleFileUpload(selectedFile, fieldName);
    }
  };
  
  //reset form 
  const resetForm = () => {
    //reload page
    window.location.reload(false);

  }

  const closeModal = () => {
    setIsSubmitted(false);
  };
// for server side
  const handleSubmit = async (e) => {
    e.preventDefault()
   
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
      const response = await axios.post(endpoints.submitCorporateForm, formData);
  
      if (response.status === 201) {
        console.log('Form submitted successfully');
        showSuccessToast('Form Submitted succesfully.'); 
      } else {
        console.error('Error during form submission:', response.statusText);
      }
    } catch (err) {
      console.error('Network error during form submission:', err);
      showErrorToast('An error occurred during submission. Please try again.'); 
    }
  };
  

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   const requiredFields = document.querySelectorAll('input[required]');
  //   let allFieldsFilled = true;
  //   requiredFields.forEach(field => {
  //     if (!field.value) {
  //       allFieldsFilled = false;
  //       const fieldName = field.getAttribute('name');
  //       setFormErrors({...formErrors, [fieldName]: `${fieldName} is required`});
  //     }
  //   });

  //   const privacyCheckbox = document.querySelector('input[name="privacy"]');
  //   if (!privacyCheckbox.checked) {
  //     allFieldsFilled = false;
  //     setFormErrors({...formErrors, privacyPolicy: `Privacy policy must be accepted`});
  //   }

  //   // if any required field is not filled, prevent form from moving to next step
  //   if (!allFieldsFilled) {
  //     return;
  //   }
  //   const formatDate = (date) => {
  //     const day = String(date.getDate()).padStart(2, '0');
  //     const month = String(date.getMonth() + 1).padStart(2, '0');
  //     const year = String(date.getFullYear());
    
  //     return `${day}/${month}/${year}`;
  //   };
  //   try {
  //     // console.log('it works')
  //     setIsSubmitted(true);
  //     const now = new Date();
  //     const formattedDate = formatDate(now);
  //     await setDoc(doc(db, "corporate-kyc", uuidv4()), {
  //       ...formData,
  //       createdAt: formattedDate,
  //       timestamp: serverTimestamp(),
        
  //     });
  //   } catch (err) {
  //     // console.log(err);
  //     showErrorToast('An error occurred during submission. Please try again.'); // Show error toast for upload error
  //   }
  // };
  

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

  // console.log(formData)

  return (
    <div style={{display:'flex', justifyContent:'flex-start',marginTop:'-100px'}}>
      <div className='picture'>
        <img src={images.form3} className='form-img' alt='cdd ' />
        </div>
    <div className='form-page'>

    <motion.div
    initial={{ opacity: 0, x: 0}}
    animate={{ opacity: 1, x: 0 }}
    transition= {{ duration:.5, ease:'easeOut' }}
    exit={{ opacity: 0, x: 0 }} className="multistep-form">

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

            <h3>Company Details</h3>
              <CompanyDetails handleChange={handleChange}
               formData={formData}
              formErrors={formErrors}
              showOtherField={showOtherField}
              handleSelectChange={handleSelectChange}
               />
           
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

           <h3>Director's Profile</h3>
            <Director1 handleChange={handleChange}
             formData={formData}
            formErrors={formErrors}
            handleIdTypeChange={handleIdTypeChange}
            handleSourceOfIncomeChange={handleSourceOfIncomeChange}
            showOtherIdType={showOtherIdType}
            showOtherSourceOfIncome={showOtherSourceOfIncome}
             />

        <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="button"  onClick={nextStep} >Next</button>
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
        <Director2 handleChange={handleChange} 
        formData={formData}
        formErrors={formErrors}
        showOtherSourceOfIncome2={showOtherSourceOfIncome2}
        showOtherField2={showOtherField2}
        handleIdType2Change={handleIdType2Change}
        handleSourceOfIncome2Change={handleSourceOfIncome2Change}
         />

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

        <AccountDetails handleChange={handleChange} formData={formData} formErrors={formErrors} />

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
        <p className='file-type'>Uploads should not be more than 5mb</p>
        <p className='file-type'>Only pdf, jpg and png files are allowed</p>
        {!uploading && perc === 100 && <div>File uploaded successfully!</div>}
        {isUploading && (
        <Backdrop open={isUploading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress color="inherit" />
            <p>Uploading File</p>
          </div>
        </Backdrop>
      )}
        <Uploads changeHandler={changeHandler} 
        formErrors={formErrors} 
        handleChange={handleChange}
        identification={identification}
         tax={tax} 
         cac={cac}
         cacForm={cacForm} />
       
       <ToastContainer />
       <div className='button-flex'>
          <button type="button" onClick={prevStep}>Previous</button>
          <button type="submit"  onClick={handleSubmit}>Submit</button>
        </div>

      </motion.div>
      
    )}

  </form>
      )}
</motion.div>
  </div>
  </div>
)
}

export default CDD;