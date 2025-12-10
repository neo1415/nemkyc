import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include',
    });
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
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

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await makeAuthenticatedRequest(`${API_BASE_URL}/api/send-email`, options);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email notification');
  }
};

export const sendSubmissionConfirmation = async (userEmail: string, formType: string) => {
  const subject = `Form Submission Confirmation - ${formType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #8B4513;">Thank you for your submission!</h2>
        <p>We have successfully received your <strong>${formType}</strong> form.</p>
        <p>Our team will review your submission and get back to you shortly.</p>
        <p>You can track the status of your submission in your dashboard.</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail({ to: userEmail, subject, html });
};

export const sendStatusUpdateNotification = async (userEmail: string, formType: string, status: string, userName?: string) => {
  try {
    console.log('📧 emailService: Sending request to /send-claim-approval-email');
    console.log('📧 emailService: Payload:', { userEmail, formType, status, userName });
    
    // Use the full API base URL
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/send-claim-approval-email`, {
      userEmail,
      formType,
      status,
      userName
    });
    
    const responseData = await response.text();
    console.log('✅ emailService: Email sent successfully:', responseData);
  } catch (error) {
    console.error('❌ emailService: Failed to send status update email:', error);
    console.log('📧 emailService: Error response:', error.response?.data);
    console.log('📧 emailService: Error status:', error.response?.status);
    throw new Error('Failed to send status update notification');
  }
};

export const sendClaimApprovedNotification = async (userEmail: string, claimType: string) => {
  const subject = `Claim Approved - ${claimType}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #22c55e;">Your claim has been approved! 🎉</h2>
        <p>Great news! Your <strong>${claimType}</strong> claim has been approved.</p>
        <p>You can view the details in your dashboard or contact our support team for more information.</p>
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail({ to: userEmail, subject, html });
};

export const emailService = {
  sendEmail,
  sendSubmissionConfirmation,
  sendClaimApprovedNotification,
  sendStatusUpdateNotification
};
