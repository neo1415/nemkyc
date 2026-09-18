'use strict';

/**
 * Outbound email helpers, moved verbatim from server.js. `getTransporter` is read at call time so the
 * nodemailer transporter can still be created (or replaced by the fallback stub) after this factory runs.
 */
function createMailer({ getTransporter, admin, buildNotificationRoleQuery, isValidEmail, logAuditSecurityEvent, normalizeNotificationEmails, resolveAssignedClaimCollections, sanitizeEmail, sanitizeEmailSubject }) {
async function getAllAdminEmails() {
  return getEmailsByRoles(['compliance']);
}

// Function to send email to admins
async function sendEmailToAdmins(adminEmails, formType, formData) {
  const firstThreeDetails = Object.keys(formData).slice(0, 4).map(key => `${key}: ${formData[key]}`).join('<br/>');

  const emailContent = `
    <p>A new <strong>${formType}</strong> form has been successfully submitted.</p>
    <p>
    <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Log in to NEM Forms</a>
    </p>
    
    <p>Here is a brief summary for the submission:</p>
    <div style="background-color:#f4f4f4; padding:10px; border-radius:5px;">
      ${firstThreeDetails}
    </div>

    <p>Best regards,<br>NEM Customer Feedback Team</p>
  `;

  try {
    for (const email of adminEmails) {
      const mailOptions = {
        from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
        to: sanitizeEmail(email), 
        subject: sanitizeEmailSubject(`New ${formType} Submission`),
        html: emailContent,
      };
      
      // Validate email before sending
      if (!isValidEmail(email)) {
        console.error('❌ Invalid admin email address:', email);
        continue; // Skip this email and continue with others
      }
      
      await getTransporter().sendMail(mailOptions);
    }
    console.log('Emails sent to admins successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

//  Reusable helper
async function getEmailsByRoles(rolesArray) {
  try {
    const roles = buildNotificationRoleQuery(rolesArray);
    const usersSnapshot = await admin.firestore()
      .collection('userroles')
      .where('role', 'in', roles)
      .get();

    const emails = normalizeNotificationEmails(
      usersSnapshot.docs.map(doc => doc.data().email)
    );
    console.log(`Admin/staff notifications enabled for ${emails.length} recipient(s) with roles:`, roles);
    return emails;
  } catch (error) {
    console.error('Error fetching notification recipients from Firestore:', error);
    return [];
  }
}

/**
 * Staff who should hear about a claim in `collection`: every admin / super admin account plus
 * every claims officer whose unit assignment covers the collection (or who has claimAccessAll).
 * Driven by the userroles collection, so it always reflects current accounts, not a static list.
 */
async function getClaimStaffEmails(collection) {
  try {
    const roles = buildNotificationRoleQuery(['claims']);
    const snapshot = await admin.firestore().collection('userroles').where('role', 'in', roles).get();
    const target = String(collection || '').trim().toLowerCase();
    const emails = [];
    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      if (data.disabled === true || !data.email) continue;
      // Same resolver the authorization checks use: explicit assignedClaimCollections, claimAccessAll,
      // unit-list membership by email, and admin/compliance roles that see every unit.
      const allowed = resolveAssignedClaimCollections({
        email: data.email,
        role: data.role,
        assignedClaimCollections: data.assignedClaimCollections,
        claimAccessAll: data.claimAccessAll,
      });
      if (allowed === null || (Array.isArray(allowed) && allowed.map((c) => String(c).toLowerCase()).includes(target))) {
        emails.push(data.email);
      }
    }
    return normalizeNotificationEmails(emails);
  } catch (error) {
    console.error('Error resolving claim staff recipients:', error);
    return [];
  }
}

async function sendEmail(to, subject, html, attachments = []) {
  // Handle sending individual emails if 'to' is an array
  if (Array.isArray(to)) {
    const emailPromises = to.map(email => {
      const sanitizedEmail = sanitizeEmail(email);
      
      // Skip invalid emails
      if (!isValidEmail(sanitizedEmail)) {
        console.error('❌ Invalid email address in array:', email);
        return Promise.resolve(); // Skip this email
      }
      
      const mailOptions = {
        from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
        to: sanitizedEmail,
        subject: sanitizeEmailSubject(subject),
        html,
        attachments
      };
      return getTransporter().sendMail(mailOptions);
    });
    return Promise.all(emailPromises);
  }
  
  // Single email recipient
  const sanitizedEmail = sanitizeEmail(to);
  
  // Validate email before sending
  if (!isValidEmail(sanitizedEmail)) {
    console.error('❌ Invalid email address:', to);
    throw new Error('Invalid email address format');
  }
  
  const mailOptions = {
    from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
    to: sanitizedEmail,
    subject: sanitizeEmailSubject(subject),
    html,
    attachments
  };
  return getTransporter().sendMail(mailOptions);
}

/**
 * Helper function to send email with retry logic
 */
async function sendEmailWithRetry(emailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use existing email sending infrastructure
      await getTransporter().sendMail({
        from: '"NEM Insurance" <kyc@nem-insurance.com>',
        to: sanitizeEmail(emailData.to),
        subject: sanitizeEmailSubject(emailData.subject),
        html: emailData.html
      });

      console.log(`✅ Email sent successfully to ${emailData.to}`);
      return { success: true };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`❌ Failed to send email after ${maxRetries} attempts:`, error.message);

        await logAuditSecurityEvent({
          eventType: 'EMAIL_DELIVERY_FAILED',
          severity: 'high',
          description: `Failed to send email after ${maxRetries} attempts`,
          userId: emailData.userId,
          metadata: {
            to: emailData.to,
            error: error.message,
            attempts: maxRetries
          }
        });

        return { success: false, error: error.message };
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      console.log(`⏳ Retrying email send (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }
}

  return { getAllAdminEmails, sendEmailToAdmins, getEmailsByRoles, getClaimStaffEmails, sendEmail, sendEmailWithRetry };
}

module.exports = { createMailer };
