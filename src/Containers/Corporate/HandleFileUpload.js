import React, { useState } from 'react';
import { Controller, useFormContext,useForm } from 'react-hook-form';
import { storage } from '../../APi';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HandleFileUpload = ({ name }) => {
  const methods = useForm();
  const [step, setStep] = useState(1);
  const [identification, setIdentification] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [cac, setCac] = useState('');
  const [tax, setTax] = useState('');
  const [cacForm, setcacForm] = useState('');
  const [perc, setPerc] = useState(null)
  const [ error,setError]= useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { control, setValue } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

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
                methods.setValue(name, downloadURL); ; // Use the field name here
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

      return (
        <Controller
          control={control}
          name={name}
          defaultValue=""
          render={({ field }) => (
            <input
              type="file"
              onChange={(e) => {
                field.onChange(e);
                handleFileUpload(e.target.files[0]);
              }}
            />
          )}
        />
      );
    };
    
      

export default HandleFileUpload