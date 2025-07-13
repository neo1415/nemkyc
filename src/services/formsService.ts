import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface FormSubmission {
  id: string;
  [key: string]: any;
}

export const FORM_COLLECTIONS = {
  'Individual KYC': 'individual-kyc',
  'Corporate KYC': 'corporate-kyc',
  'Individual KYC Form': 'Individual-kyc-form',
  'Corporate KYC Form': 'corporate-kyc-form',
  'Agents KYC': 'agents-kyc',
  'Brokers KYC': 'brokers-kyc',
  'NAICOM Partners CDD': 'naicom-partners-cdd',
  'User Roles': 'userroles',
  'Burglary Claims': 'burglary-claims',
  'All Risk Claims': 'all-risk-claims'
};

export const getFormData = async (collectionName: string): Promise<FormSubmission[]> => {
  try {
    const dataRef = collection(db, collectionName);
    const q = query(dataRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return data;
  } catch (error) {
    console.error(`Error fetching data from ${collectionName}:`, error);
    return [];
  }
};

export const getAllFormsData = async (): Promise<Record<string, FormSubmission[]>> => {
  const allData: Record<string, FormSubmission[]> = {};
  
  for (const [formName, collectionName] of Object.entries(FORM_COLLECTIONS)) {
    try {
      allData[formName] = await getFormData(collectionName);
    } catch (error) {
      console.error(`Error fetching ${formName}:`, error);
      allData[formName] = [];
    }
  }
  
  return allData;
};

export const updateFormStatus = async (collectionName: string, docId: string, status: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating form status:', error);
    throw error;
  }
};
