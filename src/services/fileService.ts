import { storage } from '@/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, fullPath);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const uploadFormFiles = async (files: Record<string, File>, formType: string): Promise<Record<string, string>> => {
  const uploadPromises = Object.entries(files).map(async ([key, file]) => {
    const url = await uploadFile(file, `${formType}/${key}`);
    return [key, url];
  });
  
  const results = await Promise.all(uploadPromises);
  return Object.fromEntries(results);
};