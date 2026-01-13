/**
 * Email Template for Identity Verification Requests (Legacy Remediation System)
 * 
 * This module provides the email template used to send verification links
 * to customers for the Legacy Identity Remediation System.
 * 
 * Note: The new Identity Collection System uses server-side email generation
 * in server.js. This template is maintained for backward compatibility.
 * 
 * Requirements: 3.2
 * - Include customer name, policy number, broker name
 * - Include verification link and expiration date
 * - Include NEM Insurance branding
 */

import { LegacyVerificationEmailData } from '../types/remediation';

/**
 * NEM Insurance brand colors
 */
const BRAND_COLORS = {
  primary: '#800020',      // Burgundy/Maroon
  secondary: '#FFD700',    // Gold
  background: '#f9f9f9',
  text: '#333333',
  lightText: '#666666',
  border: '#dddddd',
};

/**
 * Generates the HTML email content for verification requests
 * 
 * The email includes:
 * - NEM Insurance branding header
 * - Customer name for personalization
 * - Policy number for reference
 * - Broker name and authorization statement
 * - Secure verification link with prominent CTA button
 * - Expiration date warning
 * - Contact information
 * 
 * @param data - The verification email data
 * @returns The complete HTML email content
 * 
 * Requirements: 3.2
 */
export function generateVerificationEmailHtml(data: LegacyVerificationEmailData): string {
  const { customerName, policyNumber, brokerName, verificationUrl, expirationDate } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identity Verification Required - NEM Insurance</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with NEM Insurance Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, #600018 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="color: ${BRAND_COLORS.secondary}; margin: 0; font-size: 28px; font-weight: bold;">NEM Insurance</h1>
                    <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Identity Verification Request</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${escapeHtml(customerName)}</strong>,
              </p>
              
              <!-- Introduction -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                As part of our ongoing commitment to regulatory compliance and the security of your insurance policy, 
                we need to verify your identity information on file.
              </p>
              
              <!-- Policy Information Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND_COLORS.background}; border-radius: 6px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: ${BRAND_COLORS.lightText}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Policy Details</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">Policy Number:</span>
                        </td>
                        <td style="padding: 5px 0 5px 15px;">
                          <strong style="color: ${BRAND_COLORS.text}; font-size: 14px;">${escapeHtml(policyNumber)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: ${BRAND_COLORS.lightText}; font-size: 14px;">Broker:</span>
                        </td>
                        <td style="padding: 5px 0 5px 15px;">
                          <strong style="color: ${BRAND_COLORS.text}; font-size: 14px;">${escapeHtml(brokerName)}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Broker Authorization Statement -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                This verification request has been authorized by your broker, <strong>${escapeHtml(brokerName)}</strong>, 
                in accordance with regulatory requirements.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${escapeHtml(verificationUrl)}" 
                       style="display: inline-block; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.secondary}; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      Verify My Identity
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff8e6; border-left: 4px solid #f0ad4e; border-radius: 0 4px 4px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      <strong>⏰ Important:</strong> This verification link will expire on <strong>${escapeHtml(expirationDate)}</strong>. 
                      Please complete your verification before this date.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 25px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${BRAND_COLORS.primary}; font-size: 13px; word-break: break-all; margin: 5px 0 25px 0;">
                <a href="${escapeHtml(verificationUrl)}" style="color: ${BRAND_COLORS.primary};">${escapeHtml(verificationUrl)}</a>
              </p>
              
              <!-- Security Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top: 1px solid ${BRAND_COLORS.border}; margin-top: 25px;">
                <tr>
                  <td style="padding-top: 20px;">
                    <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 0;">
                      <strong>🔒 Security Notice:</strong> This is a secure, one-time verification link unique to you. 
                      Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND_COLORS.background}; padding: 25px 40px; border-radius: 0 0 8px 8px;">
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
                If you have any questions or need assistance, please contact your broker or reach out to us at:
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 13px; margin: 0;">
                📧 <a href="mailto:kyc@nem-insurance.com" style="color: ${BRAND_COLORS.primary};">kyc@nem-insurance.com</a>
              </p>
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 12px; margin: 20px 0 0 0;">
                © ${new Date().getFullYear()} NEM Insurance. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates the plain text version of the verification email
 * 
 * This is used as a fallback for email clients that don't support HTML.
 * 
 * @param data - The verification email data
 * @returns The plain text email content
 */
export function generateVerificationEmailText(data: LegacyVerificationEmailData): string {
  const { customerName, policyNumber, brokerName, verificationUrl, expirationDate } = data;

  return `
NEM Insurance - Identity Verification Request
=============================================

Dear ${customerName},

As part of our ongoing commitment to regulatory compliance and the security of your insurance policy, we need to verify your identity information on file.

POLICY DETAILS
--------------
Policy Number: ${policyNumber}
Broker: ${brokerName}

This verification request has been authorized by your broker, ${brokerName}, in accordance with regulatory requirements.

VERIFY YOUR IDENTITY
--------------------
Please click the link below to complete your identity verification:

${verificationUrl}

IMPORTANT: This verification link will expire on ${expirationDate}. Please complete your verification before this date.

SECURITY NOTICE
---------------
This is a secure, one-time verification link unique to you. Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.

NEED HELP?
----------
If you have any questions or need assistance, please contact your broker or reach out to us at:
Email: kyc@nem-insurance.com

© ${new Date().getFullYear()} NEM Insurance. All rights reserved.
  `.trim();
}

/**
 * Generates the email subject line for verification requests
 * 
 * @param policyNumber - The customer's policy number
 * @returns The email subject line
 */
export function generateVerificationEmailSubject(policyNumber: string): string {
  return `Action Required: Identity Verification for Policy ${policyNumber} - NEM Insurance`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * 
 * @param text - The text to escape
 * @returns The escaped text
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Complete email template data structure for sending
 */
export interface VerificationEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generates the complete email template with subject, HTML, and plain text
 * 
 * @param data - The verification email data
 * @returns The complete email template
 */
export function generateVerificationEmail(data: LegacyVerificationEmailData): VerificationEmailTemplate {
  return {
    subject: generateVerificationEmailSubject(data.policyNumber),
    html: generateVerificationEmailHtml(data),
    text: generateVerificationEmailText(data),
  };
}
