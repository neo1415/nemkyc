import React,{useState} from 'react';
import { useForm,FormProvider } from 'react-hook-form';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Controller} from 'react-hook-form';
import { storage } from '../../../APi';
import { HiCloudUpload } from 'react-icons/hi';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import Fade from '@mui/material/Fade';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const FileUpload = ({control, setFileUrls, errors,fileNames, setFileNames, trigger}) => {
  
  const [perc, setPerc] = useState(null)

  const [open, setOpen] = useState(false);

  const methods = useForm();

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


  const handleFileUpload = async (file, fieldName) => {
    if (file) {
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

      // Generate a unique filename using a timestamp

      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      setFileNames(prevState => ({...prevState, [fieldName]: file.name}));
    
    
      // Construct the storage path
      const storagePath = `corporate-kyc-file-submissions/${fieldName}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      setOpen(true);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);

          // console.log('Upload is ' + progress + '% done');
          setPerc(progress);

        },
        (error) => {
          // console.log(error);
          showErrorToast('An error occurred during file upload. Please try again.'); // Show error toast for upload error
          // Close the dialog
          setOpen(false);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              // Update the fileUrls state and then trigger validation
              setFileUrls(prevState => {
                const updatedState = {...prevState, [fieldName]: downloadURL};
                // console.log(`File uploaded: ${fieldName} URL: ${downloadURL}`);
                
                // Trigger validation after state update
                trigger(fieldName);
            
                return updatedState;
              });
            
            showSuccessToast();
              // Close the dialog
            setOpen(false);
    
            // Reset the progress state after upload is completed
            setPerc(0);
          });
        }
      );
    }
  };
  

  return (
    <FormProvider {...methods}>
    <div>
       <div className='upload-flex'>
       <div className='flex-upload'>
        <div className='upload-form'>
          <Controller
        name="cac"
        control={control}
        rules={{
          validate: {
            required: value => value[0] || 'CAC Certificate is required',
          },
        }}
        render={({ field, fieldState: { error } }) => (
    <div className='uploader'>
      <label htmlFor="cac" className='upload'>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
          <h4>Upload Your CAC Certificate</h4>
          <div className='upload-icon'>
          <HiCloudUpload />   
          </div>
        </div>
      </label>
      <input
        {...field}
        type="file"
        id="cac"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleFileUpload(file, field.name);
          }
        }}
        style={{ display: 'none' }} // Hide the actual input but keep it functional
      />
     {error && !fileNames.cac && <span className="error-message">This field is required</span>}
      {/* Display the file name and errors here */}
      <div className='Output'>
      {fileNames.cac && <div>{fileNames.cac}</div>}
      </div>
    </div>
        )}
        />
          </div>
          <div className='upload-form'>
          <Controller
        name="identification"
        control={control}
        rules={{
    validate: {
      required: value => value.length > 0 || 'Identification is required',
    },
  }}
        render={({ field, fieldState: { error } }) => (
    <div className='uploader'>
      <label htmlFor="identification" className='upload'>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
          <h4>Upload Means of Identification</h4>
          <div className='upload-icon'>
          <HiCloudUpload />   
          </div>
        </div>
      </label>
      <input
        {...field}
        type="file"
        id="identification"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleFileUpload(file, field.name);
          }
        }}
        style={{ display: 'none' }} // Hide the actual input but keep it functional
      />
  {error && !fileNames.identification && <span className="error-message">This field is required</span>}
      {/* Display the file name and errors here */}
      <div className='Output'>
      {fileNames.identification && <div>{fileNames.identification}</div>}
    
      </div>
    </div>
        )}
        />
          </div>
        </div>
      
    </div>

    <div className='upload-flex'>
    <div className='upload-form'>
    <div className='uploader'>
    <h6>For NAICOM Regulated Companies</h6>
    <Controller
        name="cacForm"
        control={control}
        render={({ field, fieldState: { error } }) => (
    <div className='uploader'>
      <label htmlFor="cacForm" className='upload'>
        <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
          <h4>NAICOM License Certificate</h4>
          <div className='upload-icon'>
          <HiCloudUpload />   
          </div>
        </div>
      </label>
      <input
        {...field}
        type="file"
        id="cacForm"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            handleFileUpload(file, field.name);
          }
        }}
        style={{ display: 'none' }} // Hide the actual input but keep it functional
      />
      {error && !fileNames.cacForm && <span className="error-message">This field is required</span>}
      {/* Display the file name and errors here */}
      <div className='Output'>
      {fileNames.cacForm && <div>{fileNames.cacForm}</div>}
      </div>
    </div>
        )}
        />
        </div>
    </div>
    </div>
    <Controller
          name="checkbox"
          control={control}
          rules={{
    required: 'Checkbox is required' // This is the message that will be displayed if the checkbox is not checked
  }}
          render={({ field }) => (
            <FormControlLabel
            className='sub-checkbox'
              control={<Checkbox {...field} />}
              label="Please note that your data will be treated 
                with the utmost respect and privacy as required by law.
                By checking this box, you acknowledge and 
                agree to the purpose set-out in this clause 
                and our data privacy policy. Thank you."
            />
          )}
        />
       {errors.checkbox && <Typography className='checkerror' color="error">{errors.checkbox.message}</Typography>}
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
      <Box sx={{ 
  position: 'absolute', 
  top: '50%', 
  left: '50%', 
  transform: 'translate(-50%, -50%)', 
  bgcolor: 'background.paper', 
  boxShadow: 24, 
  p: 4,
  display: 'flex', // Set display to flex to use Flexbox
  flexDirection: 'column', // Stack children vertically
  alignItems: 'center', // Center children horizontally
  justifyContent: 'center' // Center children vertically
}}>
  <Typography id="modal-modal-title" variant="h6" component="h2">
    Uploading File
  </Typography>
  <CircularProgress variant="determinate" value={perc} />
  <Typography id="modal-modal-description" sx={{ mt: 2 }}>
    {`${perc}% completed`}
  </Typography>
</Box>

      </Fade>
    </Modal>
      </div>  
  
  </FormProvider>
  );
}

export default FileUpload;