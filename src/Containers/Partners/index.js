import React, { useState} from 'react';
import './CDD.scss'
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';
import CompanyDetails from './Input/CompanyDetails';
import { images } from '../../Constants';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { endpoints } from '../../Admin/Authentication/Points';
import FileUpload from './Input/Uploads';
import { useForm } from 'react-hook-form';
import Director1 from './Input/Director1';
import * as yup from 'yup';
import Director2 from './Input/Director2';
import AccountDetails from './Input/AccountDetails';
import { yupResolver } from '@hookform/resolvers/yup';
import { schema1, schema2, schema3, schema4, schema5 } from './FormSchema';
import SubmitModal from '../Modals/SubmitModal';
import { CircularProgress } from '@mui/material';
import { csrfProtectedPost } from '../../Components/CsrfUtils';


const Partners = () => {
    
    const combinedSchema = yup.object().shape({
        ...schema1.fields,
        ...schema2.fields,
        ...schema3.fields,
        ...schema4.fields,
        ...schema5.fields,
    });

    const { register, formState: { errors}, reset,trigger, watch, forceUpdate, control,setValue, getValues } = useForm({
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

    //reset form 
    const resetForm = () => {
     //reload page
    reset()
    }
    
    const closeModal = () => {
    setIsSubmitted(false);
      };
      
    const handleSubmit = async (e) => {

      e.preventDefault();
      const stepFields = {
        1: Object.keys(schema5.fields),
      };

      const result = await trigger(stepFields[step]);
      
      if (result) {
        try {      
          setIsLoading(true); // Show loading spinner
          setIsSubmitted(false); // Ensure modal is closed during submission

          const formData = {...formValues, ...fileUrls};
          if (fileUrls.Incorporation && fileUrls.identification ) {
         
            // console.log('Form values:', formData);
            const response = await csrfProtectedPost(endpoints.submitPartnersForm, formData);
          if (response.status === 201) {
              // console.log('Form submitted successfully');
              showSuccessToast('Form Submitted successfully.');
              setFileUrls({}); 
              setFileNames({});
              setIsSubmitted(true);
          } else {
              console.error('Error during form submission:', response.statusText);
            }
            } else {
              showErrorToast('Please ensure all files are uploaded before submitting.');
            }
          } catch (err) {
            console.error('Network error during form submission:', err);
            showErrorToast('An error occurred during submission. Please try again.');
          }  finally {
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
        4: Object.keys(schema4.fields),
        // 5: Object.keys(schema5.fields),
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
    <div style={{display:'flex', justifyContent:'flex-start',marginTop:'-100px'}}>
      <div className='picture'>
        <img src={images.partner} className='form-img' alt='cdd ' />
        </div>
    <div className='form-page'>

    <motion.div
    initial={{ opacity: 0, x: 0}}
    animate={{ opacity: 1, x: 0 }}
    transition= {{ duration:.5, ease:'easeOut' }}
    exit={{ opacity: 0, x: 0 }} className="multistep-form">

      <form onSubmit={handleSubmit}>
         {step === 1 && (
          <motion.div
          initial={{ opacity: 0, x: 0}}
          animate={{ opacity: 1, x: 0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>Company Details</h3>
              <CompanyDetails
                register={register}
                errors={errors}
                watch={watch}
                control={control}
                setValue={setValue}
                getValues={getValues}
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
          initial={{ opacity: 0, x: 0}}
          animate={{ opacity: 1, x: 0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>Director's Information</h3>
              <Director1
                register={register}
                errors={errors}
                watch={watch}
                control={control}
               />
           
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="button" onClick={nextStep} >Next</button>
            </div>
          </motion.div>

        )}

        {step === 3 && (
          <motion.div
          initial={{ opacity: 0, x: 0}}
          animate={{ opacity: 1, x: 0 }}
          transition= {{ duration:.5, ease:'easeOut' }}
          exit={{ opacity: 0, x: 50 }}
          className="form-step">

            <h3>Director's Information 2</h3>
              <Director2
                register={register}
                errors={errors}
                watch={watch}
                control={control}
               />
           
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="button" onClick={nextStep} >Next</button>
            </div>
          </motion.div>

        )}

        {step === 4 && (
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

        {step === 5 && (
      <motion.div
      initial={{ opacity: 0, x: 50}}
      animate={{ opacity: 1, x: 0 }}
      transition= {{ duration:.5, ease:'easeOut' }}
      exit={{ opacity: 0, x: 50 }}
      className="form-step">

        <h3>File Uploads</h3>
        <p className='file-type'>Uploads should not be more than 2mb</p>
        <p className='file-type'>Only pdf, jpg and png files are allowed</p>
    
        <FileUpload
        control={control}
        setValue={setValue}
        trigger={trigger}
        fileUrls={fileUrls}
        setFileUrls={setFileUrls}
        setFileNames={setFileNames}
        fileNames={fileNames}
        register={register}
        errors={errors}
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
        </form>
</motion.div>
<SubmitModal 
closeModal={closeModal} 
resetForm={resetForm} 
isSubmitted={isSubmitted} />
  </div>
  </div>
)
}
export default Partners