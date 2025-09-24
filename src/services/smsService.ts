
import axios from 'axios';

export interface SMSOptions {
  to: string;
  message: string;
}

export const sendSMS = async (options: SMSOptions): Promise<void> => {
  try {
    await axios.post('https://nem-server-rhdb.onrender.com/api/send-sms', options);
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS notification');
  }
};

export const sendSubmissionSMS = async (phoneNumber: string, formType: string) => {
  const message = `NEM Insurance: Your ${formType} form has been submitted successfully. We'll review and get back to you shortly.`;
  await sendSMS({ to: phoneNumber, message });
};

export const sendClaimApprovedSMS = async (phoneNumber: string, claimType: string) => {
  const message = `NEM Insurance: Great news! Your ${claimType} claim has been APPROVED. Check your dashboard for details.`;
  await sendSMS({ to: phoneNumber, message });
};
