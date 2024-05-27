import React, { useState } from 'react';
import './KYC.scss'
import { motion } from "framer-motion";
import { images } from '../../Constants';
import { Link } from 'react-router-dom';
import PersonalInfo from './Inputs/PersonalInfo';
import AdditionalInfo from './Inputs/AdditionalInfo';
import FinancialInfo from './Inputs/FinancialInfo';
import SubmitModal from '../Modals/SubmitModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import { endpoints } from '../../Admin/Authentication/Points';
import { schema1, schema2, schema3 } from './FormSchema';
import { csrfProtectedPost } from '../../Components/CsrfUtils';

function KYC() {
  const combinedSchema = yup.object().shape({
    ...schema1.fields,
    ...schema2.fields,
    ...schema3.fields,
});

const { register, formState: { errors, touchFields }, reset,trigger, watch, forceUpdate, control,setValue, getValues } = useForm({
 resolver: yupResolver(combinedSchema),
  mode: 'onChange' // This will ensure validation on change
});

const formValues = watch(); // Get all form values
const [step, setStep] = useState(1);
const [isSubmitted, setIsSubmitted] = useState(false);
const [fileUrls, setFileUrls] = useState({});
const [fileNames, setFileNames] = useState({});

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
        const formData = {...formValues, ...fileUrls};
        if (fileUrls.identification ) {
          setIsSubmitted(true);
          console.log('Form values:', formData);
          const response = await axios.post(endpoints.submitIndividualForm, formData);
        if (response.status === 201) {
            console.log('Form submitted successfully');
            showSuccessToast('Form Submitted successfully.');
            setFileUrls({}); 
            setFileNames({});
        } else {
            console.error('Error during form submission:', response.statusText);
          }
          } else {
            showErrorToast('Please ensure all files are uploaded before submitting.');
          }
        } catch (err) {
          console.error('Network error during form submission:', err);
          showErrorToast('An error occurred during submission. Please try again.');
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

            <h3>Personal Information</h3>
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
          initial={{ opacity: 0, x: 50}}
          animate={{ opacity: 1, x:0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>Additional Details</h3>
            <AdditionalInfo 
                register={register}
                errors={errors}
                watch={watch}
                control={control}
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
        <button type="submit"  onClick={handleSubmit}>Submit</button>
      </div>
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

export default KYC;