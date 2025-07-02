
import { sendSubmissionConfirmation, sendClaimApprovedNotification } from './emailService';
import { sendSubmissionSMS, sendClaimApprovedSMS } from './smsService';
import { User } from '../types';

export const notifySubmission = async (user: User, formType: string) => {
  try {
    if (user.notificationPreference === 'email') {
      await sendSubmissionConfirmation(user.email, formType);
    } else if (user.notificationPreference === 'sms' && user.phone) {
      await sendSubmissionSMS(user.phone, formType);
    }
  } catch (error) {
    console.error('Failed to send submission notification:', error);
  }
};

export const notifyClaimApproved = async (user: User, claimType: string) => {
  try {
    if (user.notificationPreference === 'email') {
      await sendClaimApprovedNotification(user.email, claimType);
    } else if (user.notificationPreference === 'sms' && user.phone) {
      await sendClaimApprovedSMS(user.phone, claimType);
    }
  } catch (error) {
    console.error('Failed to send claim approval notification:', error);
  }
};
