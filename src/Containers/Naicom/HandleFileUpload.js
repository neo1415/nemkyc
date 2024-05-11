// import React, { useState } from 'react';
// import { Controller, useFormContext,useForm } from 'react-hook-form';
// import { storage } from '../../APi';
// import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import React,{useState} from 'react';
// import { useForm,FormProvider } from 'react-hook-form';
// import HandleFileUpload from '../HandleFileUpload';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import {Controller} from 'react-hook-form';
// import { storage } from '../../../APi';

// const HandleFileUpload = ({ name }) => {

//   const [perc, setPerc] = useState(null)

//   const [open, setOpen] = useState(false);

//   const methods = useForm();

//     const showSuccessToast = () => {
//         toast.success('Your file has been uploaded successfully!');
//       };
    
//       const showErrorToast = (message) => {
//         toast.error(message, {
//           position: toast.POSITION.TOP_RIGHT,
//           autoClose: 3000, // Adjust the duration as needed
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: false,
//           draggable: true,
//           progress: undefined,
//         });
//       };
    
//       const handleFileUpload = async (file, fieldName) => {
//         if (file) {
//           // File type validation: check if the file is a PDF, JPG, or PNG
//           const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
//           if (!allowedTypes.includes(file.type)) {
//             showErrorToast('Please upload a PDF, JPG, or PNG file.');
//             return;
//           }
        
//           // File size validation: check if the file size is within the limit (5MB)
//           const maxSize = 2 * 1024 * 1024; // 5MB in bytes
//           if (file.size > maxSize) {
//             showErrorToast('File size exceeds the limit (2MB). Please upload a smaller file.');
//             return;
//           }
    
//           // Generate a unique filename using a timestamp
    
//           const timestamp = Date.now();
//           const fileName = `${timestamp}_${file.name}`;
//           setFileNames(prevState => ({...prevState, [fieldName]: file.name}));
        
        
//           // Construct the storage path
//           const storagePath = `corporate-kyc-file-submissions/${fieldName}/${fileName}`;
//           const storageRef = ref(storage, storagePath);
//           setOpen(true);
//           const uploadTask = uploadBytesResumable(storageRef, file);
//           uploadTask.on(
//             'state_changed',
//             (snapshot) => {
//               const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    
//               console.log('Upload is ' + progress + '% done');
//               setPerc(progress);
    
//             },
//             (error) => {
//               // console.log(error);
//               showErrorToast('An error occurred during file upload. Please try again.'); // Show error toast for upload error
//               // Close the dialog
//               setOpen(false);
//             },
//             () => {
//                 getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
//                   // Update the fileUrls state and then trigger validation
//                   setFileUrls(prevState => {
//                     const updatedState = {...prevState, [fieldName]: downloadURL};
//                     console.log(`File uploaded: ${fieldName} URL: ${downloadURL}`);
                    
//                     // Trigger validation after state update
//                     trigger(fieldName);
                
//                     return updatedState;
//                   });
                
//                 showSuccessToast();
//                   // Close the dialog
//                 setOpen(false);
        
//                 // Reset the progress state after upload is completed
//                 setPerc(0);
//               });
//             }
//           );
//         }
//       };
      
//     };
    
      

// export default HandleFileUpload