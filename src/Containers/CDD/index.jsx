import React, { useState,useEffect } from 'react';
import './CDD.scss'
import { db,storage } from '../../APi';
import { setDoc,doc, Timestamp } from 'firebase/firestore'
import { serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { motion } from "framer-motion"
import { HiXCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import useFormData from './FormData';
import CompanyDetails from './Inputs/CompanyDetails';
import Director1 from './Inputs/Director1';
import Director2 from './Inputs/Director2';
import AccountDetails from './Inputs/AccountDetails';
import Uploads from './Inputs/Uploads';
import { images } from '../../Constants';
import SubmitModal from '../Modals/SubmitModal';
import { FormDataProvider } from '../../Context/FormContext';

function CDD() {
  const [step, setStep] = useState(1);
  const [identification, setIdentification] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [cac, setCac] = useState('');
  const [tax, setTax] = useState('');
  const [cacForm, setcacForm] = useState('');
  const [per, setPerc] = useState(null)
  const [error , setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { formData, setFormData } = useFormData();
  const [showOtherField, setShowOtherField] = useState(false);
  const [showOtherIdType, setShowOtherIdType] = useState(false);
  const [showOtherSourceOfIncome, setShowOtherSourceOfIncome] = useState(false);
  const [showOtherSourceOfIncome2, setShowOtherSourceOfIncome2] = useState(false);
  const [showOtherField2, setShowOtherField2] = useState(false);


  const handleIdType2Change = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherField2(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  const handleSourceOfIncome2Change = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherSourceOfIncome2(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };


  const handleIdTypeChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherIdType(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  const handleSourceOfIncomeChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show/hide the text field accordingly
    setShowOtherSourceOfIncome(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };

  const handleSelectChange = (event) => {
    const { value } = event.target;
    // Check if the user selected "Other" option, then show the text field
    setShowOtherField(value === 'Other');
    // Update the form data state using the handleChange function
    handleChange(event);
  };


  const types= ['application/pdf'];


  //store files in firebase bucket
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
      { field: cac, name: 'cac' },
      { field: identification, name: 'identification' },
      { field: tax, name: 'tax' },
      { field: cacForm, name: 'cacForm' },
    ];
  
    fileFields.forEach(({ field, name }) => {
      handleFileUpload(field, name);
    });
  }, [cac, identification, tax, cacForm]);
  
  //handle inputs
  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;
  
    // Input validation and sanitization
    let sanitizedValue = value;
    if (type === 'email') {
      // Validate email format using regex
      const emailRegex = /^([a-z\d.]+)@([a-z\d]+)(\.[a-z]{2,5})(\.[a-z]{2,5})?$/;
      if (!emailRegex.test(value)) {
        // Invalid email format
        setFormErrors({ ...formErrors, [name]: 'Please enter a valid email address' });
      }
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

  //handle files
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
      case "cac":
        setCac(isPDF ? selectedFile : null);
        break;
      case "tax":
        setTax(isPDF ? selectedFile : null);
        break;
      case "cacForm":
        setcacForm(isPDF ? selectedFile : null);
        break;
      default:
        break;
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
        ...formData,
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
    <div style={{display:'flex', justifyContent:'flex-start',marginTop:'-100px'}}>
      <div className='picture'>
        <img src={images.form3} className='form-img' />
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
        <Uploads changeHandler={changeHandler} 
        formErrors={formErrors} 
        handleChange={handleChange}
        identification={identification}
         tax={tax} 
         cac={cac}
         cacForm={cacForm} />
       
       <div className='button-flex'>
          <button type="button" onClick={prevStep}>Previous</button>
          <button type="submit" disabled={per !== null && per < 100}  onClick={handleSubmit}>Submit</button>
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