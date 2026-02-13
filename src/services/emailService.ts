import { formatDateLong } from '../utils/dateFormatter';

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

/**
 * Interface for submission email data
 */
export interface SubmissionEmailData {
  userName: string;
  formType: string;
  ticketId: string;
  submissionDate: string;
  dashboardUrl: string;
}

/**
 * Generates the HTML template for submission confirmation emails
 * Includes ticket ID prominently and a "View or Track Submission" button
 * 
 * @param data - The submission email data
 * @returns HTML string for the email
 */
export const generateSubmissionConfirmationTemplate = (data: SubmissionEmailData): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #800020;">Thank you for your submission!</h2>
        <p>Dear ${data.userName},</p>
        <p>We have successfully received your <strong>${data.formType}</strong> form.</p>
        
        <div style="background: #fff; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Your Ticket ID</p>
          <h2 style="margin: 10px 0; color: #800020; font-size: 28px;">${data.ticketId}</h2>
          <p style="margin: 0; font-size: 12px; color: #666;">Please reference this ID in all future correspondence</p>
        </div>
        
        <p>Our team will review your submission and get back to you shortly.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background: #800020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View or Track Submission
          </a>
        </div>
        
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
};

/**
 * Sends a submission confirmation email with ticket ID
 * 
 * @param userEmail - The recipient's email address
 * @param formType - The type of form submitted
 * @param ticketId - The unique ticket ID for the submission
 * @param userName - The user's name (optional, defaults to 'Valued Customer')
 */
export const sendSubmissionConfirmation = async (
  userEmail: string, 
  formType: string,
  ticketId?: string,
  userName?: string
) => {
  const subject = `Form Submission Confirmation - ${formType}${ticketId ? ` [${ticketId}]` : ''}`;
  
  // Get the dashboard URL from environment or use default
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (import.meta.env.VITE_APP_URL || 'http://localhost:5173');
  // Add redirect parameter to ensure users are redirected to dashboard after sign-in
  const dashboardUrl = `${baseUrl}/auth/signin?redirect=dashboard`;
  
  const emailData: SubmissionEmailData = {
    userName: userName || 'Valued Customer',
    formType,
    ticketId: ticketId || 'N/A',
    submissionDate: formatDateLong(new Date()),
    dashboardUrl
  };
  
  const html = generateSubmissionConfirmationTemplate(emailData);
  
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
  sendStatusUpdateNotification,
  generateSubmissionConfirmationTemplate
};
