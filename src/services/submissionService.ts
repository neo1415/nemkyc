import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';


const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';

interface SubmissionData {
  [key: string]: any;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any) => {
  const csrfToken = await getCSRFToken();
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': Date.now().toString(),
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
};

// Determine if form is claims-related
const isClaimsForm = (formType: string): boolean => {
  const claimsKeywords = [
    'claim', 'motor', 'burglary', 'fire', 'allrisk', 'goods', 'money',
    'employers', 'public', 'professional', 'fidelity', 'contractors',
    'group', 'rent', 'combined'
  ];
  
  return claimsKeywords.some(keyword => 
    formType.toLowerCase().includes(keyword)
  );
};

// Send email notifications
const sendEmailNotifications = async (formType: string, formData: SubmissionData, userEmail: string) => {
  try {
    // Send confirmation email to user
    await makeAuthenticatedRequest(`${API_BASE_URL}/send-to-user`, {
      userEmail,
      formType
    });

    // Send alert email to appropriate team
    if (isClaimsForm(formType)) {
      await makeAuthenticatedRequest(`${API_BASE_URL}/send-to-admin-and-claims`, {
        formType,
        formData
      });
    } else {
      // KYC/CDD forms go to admin and compliance
      await makeAuthenticatedRequest(`${API_BASE_URL}/send-to-admin-and-compliance`, {
        formType,
        formData
      });
    }

    toast.success('Email notifications sent successfully');
  } catch (error) {
    console.error('Error sending email notifications:', error);
    toast.error('Failed to send email notifications');
  }
};

// Main submission function
export const submitFormWithNotifications = async (
  formData: SubmissionData,
  formType: string,
  userEmail: string
) => {
  try {
    // Add metadata to form data
   const submissionData = {
  ...formData,
  timestamp: serverTimestamp(),
  createdAt: new Date().toLocaleDateString('en-GB'),
  submittedAt: serverTimestamp(), // ✅ change from ISO string to Firestore Timestamp
  submittedBy: userEmail,
  status: 'pending'
};

    // Submit to Firestore
    const collectionName = getFirestoreCollection(formType);
    await addDoc(collection(db, collectionName), submissionData);

    toast.success('Form submitted successfully!');

    // Send email notifications
    await sendEmailNotifications(formType, submissionData, userEmail);

  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('Failed to submit form. Please try again.');
    throw error;
  }
};

// Helper function to determine Firestore collection based on form type
const getFirestoreCollection = (formType: string): string => {
  const formTypeLower = formType.toLowerCase();
  
  // Claims forms
  if (formTypeLower.includes('motor')) return 'motor-claims';
  if (formTypeLower.includes('burglary')) return 'burglaryClaims';
  if (formTypeLower.includes('fire')) return 'fire-special-perils-claims';
  if (formTypeLower.includes('allrisk') || formTypeLower.includes('all risk')) return 'all-risk-claims';
  if (formTypeLower.includes('goods')) return 'goods-in-transit-claims';
  if (formTypeLower.includes('money')) return 'money-insurance-claims';
  if (formTypeLower.includes('employers')) return 'employers-liability-claims';
  if (formTypeLower.includes('public')) return 'public-liability-claims';
  if (formTypeLower.includes('professional')) return 'professional-indemnity-claims';
  if (formTypeLower.includes('fidelity')) return 'fidelity-guarantee-claims';
  if (formTypeLower.includes('contractors')) return 'contractors-claims';
  if (formTypeLower.includes('group')) return 'group-personal-accident-claims';
  if (formTypeLower.includes('rent')) return 'rent-assurance-claims';
  if (formTypeLower.includes('combined')) return 'combined-gpa-employers-liability-claims';
  
  // KYC forms
  if (formTypeLower.includes('individual') && formTypeLower.includes('kyc')) return 'Individual-kyc-form';
  if (formTypeLower.includes('corporate') && formTypeLower.includes('kyc')) return 'corporate-kyc-form';
  
  // CDD forms
  if (formTypeLower.includes('individual') && formTypeLower.includes('cdd')) return 'individualCDD';
  if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) return 'corporateCDD';
  if (formTypeLower.includes('agents') && formTypeLower.includes('cdd')) return 'agentsCDD';
  if (formTypeLower.includes('brokers') && formTypeLower.includes('cdd')) return 'brokersCDD';
  if (formTypeLower.includes('partners') && formTypeLower.includes('cdd')) return 'partnersCDD';
  
  // Default fallback
  return 'formSubmissions';
};
