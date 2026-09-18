/**
 * Email Template Service
 * 
 * Generates HTML email templates for user management operations.
 * Templates use inline CSS for maximum email client compatibility.
 * 
 * Templates:
 * - Welcome email: Sent when a new user account is created
 * - Password reset email: Sent when a super admin resets a user's password
 * 
 * Branding: NEM Forms (burgundy #800020 and gold #DAA520)
 */

/**
 * Escapes HTML to prevent XSS attacks in email templates
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates welcome email HTML for new user accounts
 * 
 * @param {Object} userData - User data for email
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.temporaryPassword - Temporary password (plaintext)
 * @param {string} userData.loginUrl - URL to login page
 * @returns {string} HTML email template
 * 
 * @example
 * const html = generateWelcomeEmail({
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   temporaryPassword: 'aB3$xY9!mN2@',
 *   loginUrl: 'https://app.example.com/auth/signin'
 * });
 */
function generateWelcomeEmail(userData) {
  const { fullName, email, temporaryPassword, loginUrl } = userData;
  
  // Escape user-provided data to prevent XSS
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);
  const safeLoginUrl = escapeHtml(loginUrl);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NEM Forms</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to NEM Forms</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #800020; margin-top: 0; font-size: 24px;">Hello ${safeName},</h2>
      
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Your account has been created by a system administrator. You can now access NEM Forms using the credentials below.
      </p>
      
      <!-- Credentials Box -->
      <div style="background-color: #f5f5f5; border: 2px solid #800020; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; font-weight: bold; text-transform: uppercase;">
          Your Login Credentials
        </p>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">Email Address:</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold;">${safeEmail}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">Temporary Password:</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px; border-radius: 4px;">${safePassword}</p>
        </div>
      </div>
      
      <!-- Important Notice -->
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">
          ⚠️ Important: You must change your password on first login
        </p>
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 13px;">
          This temporary password will expire in 7 days. For security reasons, you will be required to create a new password when you first log in.
        </p>
      </div>
      
      <!-- Login Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${safeLoginUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
          Login Now
        </a>
      </div>
      
      <!-- Security Notice -->
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">
          🔒 Security Notice
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 13px; line-height: 1.6;">
          <li>Never share your password with anyone</li>
          <li>NEM Forms staff will never ask for your password</li>
          <li>If you did not request this account, please contact support immediately</li>
          <li>This email contains sensitive information - please delete it after changing your password</li>
        </ul>
      </div>
      
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions or need assistance, please contact our support team.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
        This is an automated email from NEM Forms. Please do not reply to this message.
      </p>
      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} NEM Forms. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates password reset email HTML for admin-initiated resets
 * 
 * @param {Object} userData - User data for email
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.temporaryPassword - New temporary password (plaintext)
 * @param {string} userData.loginUrl - URL to login page
 * @param {string} userData.resetBy - Name of admin who initiated reset (optional)
 * @returns {string} HTML email template
 * 
 * @example
 * const html = generatePasswordResetEmail({
 *   fullName: 'John Doe',
 *   email: 'john@example.com',
 *   temporaryPassword: 'aB3$xY9!mN2@',
 *   loginUrl: 'https://app.example.com/auth/signin',
 *   resetBy: 'Admin User'
 * });
 */
function generatePasswordResetEmail(userData) {
  const { fullName, email, temporaryPassword, loginUrl, resetBy } = userData;
  
  // Escape user-provided data to prevent XSS
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeResetBy = resetBy ? escapeHtml(resetBy) : 'a system administrator';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - NEM Forms</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Password Reset</h1>
    </div>
    
    <!-- Body -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #800020; margin-top: 0; font-size: 24px;">Hello ${safeName},</h2>
      
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        Your password has been reset by ${safeResetBy}. You can now log in using the temporary password below.
      </p>
      
      <!-- Credentials Box -->
      <div style="background-color: #f5f5f5; border: 2px solid #800020; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px; font-weight: bold; text-transform: uppercase;">
          Your New Login Credentials
        </p>
        <div style="margin-bottom: 15px;">
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">Email Address:</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold;">${safeEmail}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px 0; color: #666666; font-size: 12px;">Temporary Password:</p>
          <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 10px; border-radius: 4px;">${safePassword}</p>
        </div>
      </div>
      
      <!-- Important Notice -->
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">
          ⚠️ Important: You must change this password on your next login
        </p>
        <p style="margin: 10px 0 0 0; color: #856404; font-size: 13px;">
          This temporary password will expire in 7 days. You will be required to create a new password when you log in.
        </p>
      </div>
      
      <!-- Login Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${safeLoginUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-size: 16px; font-weight: bold;">
          Login Now
        </a>
      </div>
      
      <!-- Security Notice -->
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">
          🔒 Security Notice
        </p>
        <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 13px; line-height: 1.6;">
          <li>If you did not request this password reset, please contact support immediately</li>
          <li>Never share your password with anyone</li>
          <li>NEM Forms staff will never ask for your password</li>
          <li>This email contains sensitive information - please delete it after changing your password</li>
        </ul>
      </div>
      
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions or need assistance, please contact our support team.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
        This is an automated email from NEM Forms. Please do not reply to this message.
      </p>
      <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} NEM Forms. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


/**
 * Email sent when an account was created from a customer form submission. Contains only the
 * single-use "set your password" link (never a password).
 */
function generateSetPasswordEmail(userData) {
  const { fullName, email, setPasswordUrl, ticketId, formType } = userData;
  const safeName = escapeHtml(fullName || 'there');
  const safeEmail = escapeHtml(email);
  const safeUrl = escapeHtml(setPasswordUrl);
  const safeTicket = escapeHtml(ticketId || '');
  const safeFormType = escapeHtml(formType || 'form');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Set your NEM Forms password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: bold;">Your NEM Forms account</h1>
    </div>
    <div style="padding: 40px 30px;">
      <h2 style="color: #800020; margin-top: 0; font-size: 22px;">Hello ${safeName},</h2>
      <p style="color: #333333; font-size: 16px; line-height: 1.6;">
        We created a NEM Forms account for <strong>${safeEmail}</strong> when you submitted your ${safeFormType}${safeTicket ? ` (reference <strong>${safeTicket}</strong>)` : ''}.
        With it you can track the progress of your submission and respond to any requests from our team.
      </p>
      <p style="color: #333333; font-size: 16px; line-height: 1.6;">Choose a password to finish setting up your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safeUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Set my password</a>
      </div>
      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        This link works once and expires in 1 hour. If it has expired, open the sign-in page and choose "Forgot password" to request a new one.
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        If you did not submit a form to NEM Insurance, you can ignore this email; no one can sign in without setting a password.
      </p>
    </div>
    <div style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="color: #999999; font-size: 12px; margin: 0;">NEM Insurance Plc &middot; 199 Ikorodu Road, Obanikoro, Lagos</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}


/**
 * One template for every claim lifecycle stage. `offer`, `outstandingDocuments` and `reason`
 * are optional and rendered only when present.
 */
function generateClaimStageEmail(input) {
  const {
    fullName, ticketId, formType, stage, stepLabel, customerMessage, note, reason,
    outstandingDocuments = [], offer = null, link
  } = input;
  const safe = (v) => escapeHtml(String(v == null ? '' : v));
  const money = (amount, currency = 'NGN') => {
    const n = Number(amount);
    return Number.isFinite(n) ? `${currency} ${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
  };
  const stageNames = { report: 'Report', submit: 'Submit', review: 'Review', accept: 'Accept', pay: 'Pay', closed: 'Closed', declined: 'Declined' };
  const rail = ['report', 'submit', 'review', 'accept', 'pay'].map((s) => {
    const active = s === stage;
    return `<td style="padding:6px 4px;text-align:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${active ? '#800020' : '#999999'};font-weight:${active ? 'bold' : 'normal'};border-top:3px solid ${active ? '#DAA520' : '#e0e0e0'}">${stageNames[s]}</td>`;
  }).join('');
  const docs = outstandingDocuments.length ? `
      <p style="color:#333;font-size:15px;margin:18px 0 6px;"><strong>Documents we need from you</strong></p>
      <ul style="color:#333;font-size:15px;line-height:1.6;padding-left:20px;margin:0;">
        ${outstandingDocuments.map((d) => `<li>${safe(d.label)}${d.required === false ? ' (optional)' : ''}</li>`).join('')}
      </ul>` : '';
  const offerBlock = offer ? `
      <div style="border:1px solid #e0e0e0;border-radius:6px;padding:16px;margin:18px 0;">
        <p style="margin:0 0 6px;color:#800020;font-size:15px;"><strong>Settlement offer${offer.version > 1 ? ` (revised, version ${offer.version})` : ''}</strong></p>
        <p style="margin:0;font-size:22px;color:#1a1a1a;"><strong>${safe(money(offer.amount, offer.currency))}</strong></p>
        ${offer.basis ? `<p style="margin:8px 0 0;color:#333;font-size:14px;">${safe(offer.basis)}</p>` : ''}
        ${offer.excess != null ? `<p style="margin:6px 0 0;color:#666;font-size:13px;">Excess: ${safe(money(offer.excess, offer.currency))}</p>` : ''}
        ${Array.isArray(offer.deductions) && offer.deductions.length ? `<p style="margin:6px 0 0;color:#666;font-size:13px;">Deductions: ${offer.deductions.map((d) => `${safe(d.label)} ${safe(money(d.amount, offer.currency))}`).join('; ')}</p>` : ''}
        <p style="margin:10px 0 0;color:#333;font-size:14px;">Sign in to accept the offer or query it.</p>
      </div>` : '';
  const reasonBlock = reason ? `
      <div style="background:#fff4f4;border-left:4px solid #A02020;padding:12px 16px;margin:18px 0;">
        <p style="margin:0;color:#6e1322;font-size:14px;"><strong>Reason</strong></p>
        <p style="margin:6px 0 0;color:#333;font-size:14px;line-height:1.6;">${safe(reason)}</p>
      </div>` : '';
  const noteBlock = note ? `<p style="color:#333;font-size:15px;line-height:1.6;margin:18px 0 0;"><strong>Message from our claims team:</strong><br>${safe(note)}</p>` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${safe(formType)} claim update</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <div style="background:linear-gradient(90deg,#800020,#DAA520);padding:26px 20px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">${safe(formType)} claim update</h1>
      <p style="color:#fff;opacity:.9;margin:6px 0 0;font-size:14px;">Claim number ${safe(ticketId)}</p>
    </div>
    <div style="padding:32px 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;"><tr>${rail}</tr></table>
      <h2 style="color:#800020;margin:0 0 10px;font-size:20px;">Hello ${safe(fullName)},</h2>
      <p style="color:#1a1a1a;font-size:16px;margin:0;"><strong>${safe(stepLabel)}</strong></p>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:8px 0 0;">${safe(customerMessage)}</p>
      ${reasonBlock}${docs}${offerBlock}${noteBlock}
      <div style="text-align:center;margin:28px 0 6px;">
        <a href="${safe(link)}" style="display:inline-block;background-color:#800020;color:#ffffff;padding:13px 30px;text-decoration:none;border-radius:5px;font-size:15px;font-weight:bold;">View my claim</a>
      </div>
    </div>
    <div style="background-color:#f8f8f8;padding:18px 30px;text-align:center;border-top:1px solid #e0e0e0;">
      <p style="color:#999;font-size:12px;margin:0;">NEM Insurance Plc &middot; 199 Ikorodu Road, Obanikoro, Lagos &middot; Claims line +234-811-793-5563</p>
    </div>
  </div>
</body>
</html>`.trim();
}

module.exports = {
  generateWelcomeEmail,
  generatePasswordResetEmail,
  generateSetPasswordEmail,
  generateClaimStageEmail,
  escapeHtml
};
