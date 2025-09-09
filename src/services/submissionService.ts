import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'sonner';
import { generateDynamicPDF } from './dynamicPdfService';


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

// Helper function to make authenticated requests with fresh timestamp
const makeAuthenticatedRequest = async (url: string, data: any) => {
  // Get fresh CSRF token and timestamp for each request to prevent "Request too old" error
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  
  console.log(`📤 Making request to ${url} with timestamp: ${timestamp}`);
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': timestamp,
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

// Helper function to make fresh authenticated request (gets new CSRF token each time)
const makeFreshAuthenticatedRequest = async (url: string, data: any) => {
  // Get completely fresh CSRF token and timestamp for each request
  const csrfToken = await getCSRFToken();
  const timestamp = Date.now().toString();
  
  console.log(`📤 Making fresh request to ${url} with timestamp: ${timestamp}`);
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken,
      'x-timestamp': timestamp,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });
};

// Send email notifications with PDF attachments
const sendEmailNotifications = async (formType: string, formData: SubmissionData, userEmail: string, fullFormData: SubmissionData) => {
  try {
    console.log('📧 Sending user confirmation email...');
    console.log('📧 User email data:', { userEmail, formType });
    
    // Send confirmation email to user (no PDF attachment) - use fresh request
    const userResponse = await makeFreshAuthenticatedRequest(`${API_BASE_URL}/send-to-user`, {
      userEmail,
      formType
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ User email failed:', userResponse.status, errorText);
    } else {
      console.log('✅ User confirmation email sent successfully');
    }

    // Generate PDF for admin emails
    let pdfAttachment = null;
    try {
      console.log('Generating PDF for admin emails...');
      const pdfData = {
        ...fullFormData,
        formType,
        collection: formData.collectionName
      };
      
      const pdfBlob = await generateDynamicPDF(pdfData);
      
      // Convert blob to base64 for email attachment
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Generate filename
      const primaryName = fullFormData.companyName || 
                         fullFormData.nameOfInsured || 
                         fullFormData.insuredName ||
                         fullFormData.policyHolderName ||
                         fullFormData.fullName || 
                         fullFormData.firstName ||
                         fullFormData.name ||
                         'submission';
      
      const filename = `${String(primaryName).trim().replace(/\s+/g, '-')}-${String(formType).trim().replace(/\s+/g, '-')}.pdf`;
      
      pdfAttachment = {
        filename,
        content: base64,
        encoding: 'base64'
      };
      
      console.log('PDF generated successfully for admin emails');
    } catch (pdfError) {
      console.error('Failed to generate PDF for admin emails:', pdfError);
      // Continue without PDF if generation fails
    }

    // Send alert email to appropriate team with PDF attachment - use fresh request
    console.log('📧 Sending admin notification emails...');
    if (isClaimsForm(formType)) {
      const adminResponse = await makeFreshAuthenticatedRequest(`${API_BASE_URL}/send-to-admin-and-claims`, {
        formType,
        formData,
        pdfAttachment
      });
      
      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.error('❌ Claims admin email failed:', adminResponse.status, errorText);
      } else {
        console.log('✅ Claims admin emails sent successfully');
      }
    } else {
      // KYC/CDD forms go to admin and compliance - use fresh request
      const adminResponse = await makeFreshAuthenticatedRequest(`${API_BASE_URL}/send-to-admin-and-compliance`, {
        formType,
        formData,
        pdfAttachment
      });
      
      if (!adminResponse.ok) {
        const errorText = await adminResponse.text();
        console.error('❌ Compliance admin email failed:', adminResponse.status, errorText);
      } else {
        console.log('✅ Compliance admin emails sent successfully');
      }
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
    console.log('SubmissionService: writing to collection', collectionName, 'for formType', formType);
    const docRef = await addDoc(collection(db, collectionName), submissionData);
    console.log('SubmissionService: document written with ID', docRef.id);

    try {
      const savedSnap = await getDoc(docRef);
      console.log('SubmissionService: verify saved:', savedSnap.exists(), 'path:', `${collectionName}/${docRef.id}`);
    } catch (e) {
      console.warn('SubmissionService: verification read failed', e);
    }

    toast.success('Form submitted successfully!');

    // Send email notifications with PDF
    sendEmailNotifications(formType, { documentId: docRef.id, collectionName }, userEmail, submissionData).catch((e) =>
      console.warn('SubmissionService: email notification skipped/error', e)
    );

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
  if (formTypeLower.includes('combined')) return 'combined-gpa-employers-liability-claims';
  if (formTypeLower.includes('motor')) return 'motor-claims';
  if (formTypeLower.includes('burglary')) return 'burglary-claims';
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
