import React, { useState, useEffect } from 'react';
import './KYC.scss'
import { motion } from "framer-motion";
import { images } from '../../Constants';
import { Link } from 'react-router-dom';
import PersonalInfo from './Inputs/PersonalInfo';
// import AdditionalInfo from './Inputs/AdditionalInfo';
import FinancialInfo from './Inputs/FinancialInfo';
import SubmitModal from '../Modals/SubmitModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { CircularProgress } from '@mui/material';
import { endpoints } from '../../Admin/Authentication/Points';
import { schema1, schema2, schema3 } from './FormSchema';
import AccountDetails from './Inputs/AccountDetails';
import { csrfProtectedPost } from '../../Components/CsrfUtils';
// import { csrfProtectedPost } from '../../Components/CsrfUtils';

function IndividualKYC() {
  const combinedSchema = yup.object().shape({
    ...schema1.fields,
    ...schema2.fields,
    ...schema3.fields,
});

const [currentDate, setCurrentDate] = useState('');

useEffect(() => {
  const formatDate = (date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1; // Months are zero-indexed
    let year = date.getFullYear();

    // Add leading zero if day or month is less than 10
    day = day < 10 ? '0' + day : day;
    month = month < 10 ? '0' + month : month;

    return `${day}/${month}/${year}`;
  };

  const today = new Date();
  setCurrentDate(formatDate(today));
}, []);


const { register, formState: { errors},trigger, watch, forceUpdate, control,setValue } = useForm({
 resolver: yupResolver(combinedSchema),
  mode: 'onChange' // This will ensure validation on change
});

const formValues = watch(); // Get all form values
const [step, setStep] = useState(1);
const [isSubmitted, setIsSubmitted] = useState(false);
const [fileUrls, setFileUrls] = useState({});
const [fileNames, setFileNames] = useState({});
const [isLoading, setIsLoading] = useState(false);

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
  

  const resetForm = () => {
    window.location.reload(false);
  };

  const closeModal = () => {
    setIsSubmitted(false);
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const stepFields = {
      1: Object.keys(schema3.fields),
    };

    const result = await trigger(stepFields[step]);

    if (result) {
      try {
        setIsLoading(true); // Show loading spinner
        setIsSubmitted(false); // Ensure modal is closed during submission

        const formData = { ...formValues, ...fileUrls };
        if (fileUrls.identification) {
          const response = await csrfProtectedPost(endpoints.submitIndividualKYCForm, formData);
          if (response.status === 201) {
            console.log('Form submitted successfully');
            showSuccessToast('Form Submitted successfully.');
            setFileUrls({});
            setFileNames({});
            setIsSubmitted(true); // Open modal after successful submission
          } else {
            console.error('Error during form submission:', response.statusText);
            showErrorToast('An error occurred during submission. Please try again.');
          }
        } else {
          showErrorToast('Please ensure all files are uploaded before submitting.');
        }
      } catch (err) {
        console.error('Network error during form submission:', err);
        showErrorToast('An error occurred during submission. Please try again.');
      } finally {
        setIsLoading(false); // Hide loading spinner
      }
    }
  };
  
    const nextStep = async () => {
      // Define the fields for each step
      const stepFields = {
        1: Object.keys(schema1.fields),
        2: Object.keys(schema2.fields),
        3: Object.keys(schema3.fields),
      };
  
      // Trigger validation only for the fields of the current step
      const result = await trigger(stepFields[step]);
  
      console.log('Validation result:', result);
      console.log('Form errors:', errors);
  
      if (result) {
        setStep(step + 1);
      }
    };
  
  const prevStep = () => {
    setStep(step - 1);
  };

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

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 0}}
            animate={{ opacity: 1, x: 0 }}
            transition= {{ duration:.5, ease:'easeOut' }}
            exit={{ opacity: 0, x: 50 }}
            className="form-step">

            <h3>Individuals Details</h3>
      <div className='stretch'>
      Date <span className='date'>: {currentDate}</span>
    </div>
              <PersonalInfo
                register={register}
                errors={errors}
                watch={watch}
                control={control} />
     
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
          initial={{ opacity: 0, x: 0}}
          animate={{ opacity: 1, x: 0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>Account Details</h3>
              <AccountDetails
                register={register}
                errors={errors}
                watch={watch}
                control={control}
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
          animate={{ opacity: 1, x:0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>File Upload</h3>
            <p className='file-type'>Uploads should not be more than 2mb</p>
        <p className='file-type'>Only pdf, jpg and png files are allowed</p>
          <FinancialInfo 
                register={register}
                errors={errors}
                watch={watch}
                control={control}
                setValue={setValue}
                trigger={trigger}
                fileUrls={fileUrls}
                setFileUrls={setFileUrls}
                setFileNames={setFileNames}
                fileNames={fileNames}
                forceUpdate={forceUpdate}
                 />
                <ToastContainer />

      <div className='button-flex'>
        <button type="button" onClick={prevStep}>Previous</button>
        <button type="submit" disabled={isLoading} style={{ position: 'relative' }}>
                {isLoading ? <CircularProgress size={24} style={{ color: 'white', position: 'absolute' }} /> : 'Submit'}
              </button>
      </div>
      </motion.div>
    )}


 {step === 4 && (
  <motion.div
      initial={{ opacity: 0, x: 50}}
      animate={{ opacity: 1, x: 0 }}
      transition= {{ duration:.5, ease:'easeOut' }}
      exit={{ opacity: 0, x: 50 }}
      className="form-step">

        <h3>Declaration</h3>

      </motion.div>
      
    )} 
      
  </form>

    </motion.div>
    <SubmitModal 
      closeModal={closeModal} 
      resetForm={resetForm} 
      isSubmitted={isSubmitted} />
    </div>
    </div>
);
}

export default IndividualKYC;