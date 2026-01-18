/**
 * Email Template for Identity Verification Requests
 * 
 * This module provides dynamic email templates for both the Legacy Remediation System
 * and the new Identity Collection System.
 * 
 * The template dynamically adjusts based on verificationType (NIN or CAC) to provide
 * appropriate regulatory text and instructions for Individual or Corporate clients.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 * - Use "Dear Client" as greeting
 * - Include conditional text for NIN vs CAC
 * - Include full regulatory text from NAICOM
 * - Include contact information
 * - Dynamic content based on verificationType
 */

import { LegacyVerificationEmailData } from '../types/remediation';

/**
 * Verification type for identity collection
 */
export type VerificationType = 'NIN' | 'CAC';

/**
 * Email template parameters for Identity Collection System
 */
export interface IdentityVerificationEmailData {
  verificationType: VerificationType;
  customerName?: string;
  policyNumber?: string;
  verificationLink: string;
  expiresAt: Date;
}

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
 * Generates the HTML email content for Identity Collection System verification requests
 * 
 * This is the new dynamic template that adjusts based on verificationType (NIN or CAC).
 * It includes full NAICOM regulatory text and uses "Dear Client" as greeting.
 * 
 * The email includes:
 * - NEM Insurance branding header
 * - "Dear Client" greeting (regulatory requirement)
 * - Full NAICOM regulatory text about KYC requirements
 * - Dynamic content for NIN (Individual Clients) or CAC (Corporate Clients)
 * - Secure verification link with prominent CTA button
 * - Expiration date warning
 * - Contact information (nemsupport@nem-insurance.com, 0201-4489570-2)
 * 
 * @param data - The verification email data with verificationType
 * @returns The complete HTML email content
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */
export function generateIdentityVerificationEmailHtml(data: IdentityVerificationEmailData): string {
  const { verificationType, customerName, policyNumber, verificationLink, expiresAt } = data;

  // Dynamic content based on verification type
  const clientTypeText = verificationType === 'NIN' 
    ? "For Individual Clients: National Identification Number (NIN)"
    : "For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number";
  
  const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC Registration Number';

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
              <!-- Greeting (Regulatory Requirement: "Dear Client") -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear Client,
              </p>
              
              <!-- NAICOM Regulatory Text -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We write to inform you that, in line with the directives of the National Insurance Commission (NAICOM) 
                and ongoing regulatory requirements on Know Your Customer (KYC) and data integrity, all insurance companies 
                are mandated to obtain and update the identification details of their clients.
              </p>
              
              <!-- Client Type Specific Request -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Accordingly, we kindly request your cooperation in providing the following, as applicable:
              </p>
              
              <!-- Client Type Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND_COLORS.background}; border-left: 4px solid ${BRAND_COLORS.primary}; border-radius: 0 6px 6px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: ${BRAND_COLORS.primary}; font-size: 16px; font-weight: bold; margin: 0;">
                      ${escapeHtml(clientTypeText)}
                    </p>
                  </td>
                </tr>
              </table>
              
              ${policyNumber ? `
              <!-- Policy Information (if available) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND_COLORS.background}; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: ${BRAND_COLORS.lightText}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Policy Reference</p>
                    <p style="color: ${BRAND_COLORS.text}; font-size: 14px; font-weight: bold; margin: 0;">${escapeHtml(policyNumber)}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Secure Link Instructions -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                To ensure confidentiality and data protection, we have provided a secured link through which the required 
                information can be safely submitted. Kindly access the link below and complete the request at your earliest convenience:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${escapeHtml(verificationLink)}" 
                       style="display: inline-block; background-color: ${BRAND_COLORS.primary}; color: ${BRAND_COLORS.secondary}; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      Submit ${escapeHtml(documentType)}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff8e6; border-left: 4px solid #f0ad4e; border-radius: 0 4px 4px 0; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; margin: 0;">
                      <strong>⏰ Important:</strong> This link will expire on <strong>${escapeHtml(expiresAt.toLocaleDateString())}</strong>.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Regulatory Compliance Notice -->
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 25px 0 0 0;">
                Please note that failure to update these details may affect the continued administration of your policy, 
                in line with regulatory guidelines.
              </p>
              
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; line-height: 1.6; margin: 20px 0 25px 0;">
                We appreciate your understanding and continued support as we work to remain fully compliant with NAICOM regulations.
              </p>
              
              <!-- Alternative Link -->
              <p style="color: ${BRAND_COLORS.lightText}; font-size: 13px; line-height: 1.6; margin: 25px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: ${BRAND_COLORS.primary}; font-size: 13px; word-break: break-all; margin: 5px 0 25px 0;">
                <a href="${escapeHtml(verificationLink)}" style="color: ${BRAND_COLORS.primary};">${escapeHtml(verificationLink)}</a>
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
                Should you require any clarification or assistance, please do not hesitate to contact us via:
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 13px; margin: 5px 0;">
                📧 Email: <a href="mailto:nemsupport@nem-insurance.com" style="color: ${BRAND_COLORS.primary};">nemsupport@nem-insurance.com</a>
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 13px; margin: 5px 0;">
                📞 Telephone: <a href="tel:+2342014489570" style="color: ${BRAND_COLORS.primary};">0201-4489570-2</a>
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; margin: 20px 0 10px 0;">
                Thank you for your cooperation.
              </p>
              <p style="color: ${BRAND_COLORS.text}; font-size: 16px; margin: 0;">
                Yours faithfully,<br>
                <strong>NEM Insurance</strong>
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
 * Generates the plain text version of the Identity Collection verification email
 * 
 * This is used as a fallback for email clients that don't support HTML.
 * Includes full NAICOM regulatory text and dynamic content based on verificationType.
 * 
 * @param data - The verification email data with verificationType
 * @returns The plain text email content
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */
export function generateIdentityVerificationEmailText(data: IdentityVerificationEmailData): string {
  const { verificationType, customerName, policyNumber, verificationLink, expiresAt } = data;

  // Dynamic content based on verification type
  const clientTypeText = verificationType === 'NIN' 
    ? "For Individual Clients: National Identification Number (NIN)"
    : "For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number";
  
  const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC Registration Number';

  return `
NEM Insurance - Identity Verification Request
=============================================

Dear Client,

We write to inform you that, in line with the directives of the National Insurance Commission (NAICOM) and ongoing regulatory requirements on Know Your Customer (KYC) and data integrity, all insurance companies are mandated to obtain and update the identification details of their clients.

Accordingly, we kindly request your cooperation in providing the following, as applicable:

${clientTypeText}

${policyNumber ? `POLICY REFERENCE\n----------------\n${policyNumber}\n\n` : ''}To ensure confidentiality and data protection, we have provided a secured link through which the required information can be safely submitted. Kindly access the link below and complete the request at your earliest convenience:

${verificationLink}

IMPORTANT: This link will expire on ${expiresAt.toLocaleDateString()}.

Please note that failure to update these details may affect the continued administration of your policy, in line with regulatory guidelines.

We appreciate your understanding and continued support as we work to remain fully compliant with NAICOM regulations.

SECURITY NOTICE
---------------
This is a secure, one-time verification link unique to you. Do not share this link with anyone. NEM Insurance will never ask for your password or PIN via email.

NEED HELP?
----------
Should you require any clarification or assistance, please do not hesitate to contact us via:

Email: nemsupport@nem-insurance.com
Telephone: 0201-4489570-2

Thank you for your cooperation.

Yours faithfully,
NEM Insurance

© ${new Date().getFullYear()} NEM Insurance. All rights reserved.
  `.trim();
}

/**
 * Generates the email subject line for Identity Collection verification requests
 * 
 * @param verificationType - The type of verification (NIN or CAC)
 * @param policyNumber - The customer's policy number (optional)
 * @returns The email subject line
 * 
 * Requirements: 14.7
 */
export function generateIdentityVerificationEmailSubject(verificationType: VerificationType, policyNumber?: string): string {
  const documentType = verificationType === 'NIN' ? 'NIN' : 'CAC';
  const policyRef = policyNumber ? ` - Policy ${policyNumber}` : '';
  return `Action Required: ${documentType} Verification${policyRef} - NEM Insurance`;
}

/**
 * Complete email template data structure for Identity Collection System
 */
export interface IdentityVerificationEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generates the complete Identity Collection email template with subject, HTML, and plain text
 * 
 * This is the main function to use for the Identity Collection System.
 * It generates a dynamic email based on verificationType (NIN or CAC).
 * 
 * @param data - The verification email data with verificationType
 * @returns The complete email template
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */
export function generateIdentityVerificationEmail(data: IdentityVerificationEmailData): IdentityVerificationEmailTemplate {
  return {
    subject: generateIdentityVerificationEmailSubject(data.verificationType, data.policyNumber),
    html: generateIdentityVerificationEmailHtml(data),
    text: generateIdentityVerificationEmailText(data),
  };
}

/**
 * ============================================================================
 * LEGACY REMEDIATION SYSTEM FUNCTIONS (Backward Compatibility)
 * ============================================================================
 * The functions below are maintained for the Legacy Remediation System.
 * For the new Identity Collection System, use the functions above.
 */

/**
 * Generates the HTML email content for verification requests (Legacy System)
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
 * Requirements: 3.2 (Legacy)
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
