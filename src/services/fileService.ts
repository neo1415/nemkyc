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
    
    // Get the download URL with retry logic for 412 errors
    const downloadURL = await getDownloadURLWithRetry(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Get download URL with retry logic to handle 412 Precondition Failed errors
 * This can happen when Firebase Storage hasn't fully propagated the file yet
 */
async function getDownloadURLWithRetry(
  storageRef: any,
  maxRetries: number = 5,
  initialDelayMs: number = 1500
): Promise<string> {
  let lastError: any;
  let delayMs = initialDelayMs;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const downloadURL = await getDownloadURL(storageRef);
      if (attempt > 0) {
        console.log(`✓ Successfully retrieved download URL after ${attempt + 1} attempts`);
      }
      return downloadURL;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a 412 error or storage/unknown error
      // Firebase wraps 412 errors as storage/unknown
      const is412Error = error?.code === 'storage/unknown' || 
                         error?.customData?.serverResponse?.status === 412 ||
                         error?.message?.includes('412') ||
                         error?.message?.includes('Precondition Failed');
      
      if (is412Error && attempt < maxRetries - 1) {
        console.log(`⚠ Attempt ${attempt + 1}/${maxRetries} failed with 412 Precondition Failed error. Retrying in ${delayMs}ms...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // Exponential backoff with jitter to avoid thundering herd
        delayMs = Math.floor(delayMs * 1.5 + Math.random() * 500);
      } else if (!is412Error) {
        // If it's not a 412 error, throw immediately
        console.error('Non-412 error encountered:', error);
        throw error;
      }
    }
  }
  
  // If all retries failed, throw the last error
  console.error(`❌ All ${maxRetries} retry attempts failed for getDownloadURL:`, lastError);
  throw lastError;
}

export const uploadFormFiles = async (files: Record<string, File>, formType: string): Promise<Record<string, string>> => {
  const uploadPromises = Object.entries(files).map(async ([key, file]) => {
    const url = await uploadFile(file, `${formType}/${key}`);
    return [key, url];
  });
  
  const results = await Promise.all(uploadPromises);
  return Object.fromEntries(results);
};