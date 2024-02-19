import React, { useState} from 'react';
import './CDD.scss'
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';
import CompanyDetails from './Input/CompanyDetails';
import { images } from '../../Constants';
import SubmitModal from '../Modals/SubmitModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import axios from 'axios';
import { endpoints } from '../../Admin/Authentication/Points';
import FileUpload from './Input/Uploads';
import { useForm } from 'react-hook-form';
import Director1 from './Input/Director1';
import Director2 from './Input/Director2';
import AccountDetails from './Input/AccountDetails';

const Corporate = () => {
    const { register, formState: { errors }, trigger, watch, control,setValue, getValues } = useForm({
        mode: 'onChange' // This will ensure validation on change
      });
    
    const formValues = watch(); // Get all form values
    const [step, setStep] = useState(1);
    const [perc, setPerc] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [uploading, setUploading] = useState(false); 
    const [isUploading, setIsUploading] = useState(false);
    const [fileUrls, setFileUrls] = useState({});

      //store files in firebase bucket

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
    window.location.reload(false);
      }
    
    const closeModal = () => {
    setIsSubmitted(false);
      };

    const handleSubmit = async (e) => {
        e.preventDefault()
      
        try {
            setIsSubmitted(true);
            const formData = {...formValues, ...fileUrls};
            console.log('Form values:', formData); 
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

    const nextStep = async () => {
      const result = await trigger(); // Trigger validation for the current step
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

            <h3>Director's Information</h3>
              <Director2
                register={register}
                errors={errors}
                watch={watch}
                control={control}
                setValue={setValue}
                getValues={getValues}
               />
           
            <div className='button-flex'>
            <button type="button" onClick={prevStep}>Previous</button>
            <button type="button"  onClick={nextStep} >Next</button>
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
        {!uploading && perc === 100 && <div>File uploaded successfully!</div>}
        {isUploading && (
        <Backdrop open={isUploading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress color="inherit" />
            <p>Uploading File</p>
          </div>
        </Backdrop>
      )}
        <FileUpload
        control={control}
        setValue={setValue}
        fileUrls={fileUrls}
        setFileUrls={setFileUrls}
        errors={errors}
         />
       
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
export default Corporate