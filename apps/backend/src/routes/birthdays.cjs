'use strict';

module.exports = function register(app, ctx) {
  const {
    db,
    emailLimiter,
    isValidEmail,
    requireAuth,
    requireSuperAdmin,
    sanitizeEmail,
    sanitizeEmailSubject,
    transporter,
  } = ctx;

// ============= BIRTHDAY EMAIL SYSTEM =============

// Function to check if today is someone's birthday
const isBirthdayToday = (dateOfBirth) => {
  if (!dateOfBirth) return false;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  return today.getMonth() === birthDate.getMonth() && 
         today.getDate() === birthDate.getDate();
};

// Function to send birthday email
const sendBirthdayEmail = async (email, displayName) => {
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedDisplayName = displayName ? displayName.replace(/[\r\n\0]/g, '').trim() : 'Valued Customer';
  
  // Validate email before sending
  if (!isValidEmail(sanitizedEmail)) {
    console.error('❌ Invalid email address for birthday email:', email);
    return false;
  }
  
  const mailOptions = {
    from: 'kyc@nem-insurance.com',
    to: sanitizedEmail,
    subject: sanitizeEmailSubject(`🎉 Happy Birthday from NEM Insurance!`),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎂 Happy Birthday ${sanitizedDisplayName}! 🎂</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">Wishing you a wonderful day!</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            Happy Birthday to you from all of us at NEM Insurance! 🎉
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            We truly appreciate having you as a valued member of our community. 
            Your trust in us means the world, and we're committed to serving you with excellence.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            May this special day bring you joy, happiness, and wonderful memories. 
            Here's to another amazing year ahead! 🥳
          </p>
          <div style="margin: 30px 0; padding: 20px; background: white; border-left: 4px solid #DAA520;">
            <p style="font-style: italic; color: #666; margin: 0;">
              "Celebrate every moment, cherish every memory, and embrace every opportunity!"
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6;">
            Warmest wishes,<br>
            <strong>The NEM Insurance Team</strong>
          </p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated birthday greeting from NEM Insurance.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Birthday email sent to ${sanitizedEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send birthday email to ${email}:`, error);
    return false;
  }
};

// Endpoint to check and send birthday emails (can be called by cron job)
app.post('/api/check-birthdays', requireAuth, requireSuperAdmin, emailLimiter, async (req, res) => {
  try {
    console.log('🎂 Checking for birthdays today...');
    
    // Get all users from userroles collection
    const usersSnapshot = await db.collection('userroles').get();
    
    let birthdayCount = 0;
    let emailsSent = 0;
    const birthdayUsers = [];
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      if (isBirthdayToday(userData.dateOfBirth)) {
        birthdayCount++;
        birthdayUsers.push({
          email: userData.email,
          displayName: userData.displayName || userData.name || 'Valued Customer'
        });
        
        const sent = await sendBirthdayEmail(
          userData.email, 
          userData.displayName || userData.name || 'Valued Customer'
        );
        
        if (sent) emailsSent++;
      }
    }
    
    console.log(`🎉 Found ${birthdayCount} birthdays today. Sent ${emailsSent} emails.`);
    
    res.status(200).json({ 
      success: true,
      message: `Found ${birthdayCount} birthdays today`,
      birthdaysFound: birthdayCount,
      emailsSent: emailsSent,
      users: birthdayUsers
    });
    
  } catch (error) {
    console.error('❌ Error checking birthdays:', error);
    res.status(500).json({ error: 'Failed to check birthdays', details: error.message });
  }
});

// Test endpoint to send birthday email to a specific user
app.post('/api/test-birthday-email', requireAuth, requireSuperAdmin, emailLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    console.log(`🧪 Testing birthday email for ${email}`);
    
    // Find user by email
    const usersSnapshot = await db.collection('userroles')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = usersSnapshot.docs[0].data();
    const displayName = userData.displayName || userData.name || 'Valued Customer';
    
    const sent = await sendBirthdayEmail(email, displayName);
    
    if (sent) {
      res.status(200).json({ 
        success: true, 
        message: `Test birthday email sent to ${email}`,
        user: {
          email: email,
          displayName: displayName,
          dateOfBirth: userData.dateOfBirth || 'Not set'
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
    
  } catch (error) {
    console.error('❌ Error sending test birthday email:', error);
    res.status(500).json({ error: 'Failed to send test email', details: error.message });
  }
});

// ============= END BIRTHDAY EMAIL SYSTEM =============
};
