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

module.exports = {
  generateWelcomeEmail,
  generatePasswordResetEmail,
  escapeHtml
};
