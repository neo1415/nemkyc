// Script to completely remove all MFA code from server.js
const fs = require('fs');

console.log('Reading server.js...');
let content = fs.readFileSync('server.js', 'utf8');

console.log('Removing all MFA code...');

// Find the start of MFA code section (after userData is defined)
const mfaStartMarker = '    // ============================================================================\n    // MANDATORY MFA FOR PRIVILEGED ROLES';
const mfaEndMarker = '    // Log successful token exchange';

// Find the positions
const startPos = content.indexOf(mfaStartMarker);
const endPos = content.indexOf(mfaEndMarker);

if (startPos !== -1 && endPos !== -1) {
  console.log(`Found MFA code from position ${startPos} to ${endPos}`);
  
  // Replace the entire MFA section with simple login tracking
  const before = content.substring(0, startPos);
  const after = content.substring(endPos);
  
  const replacement = `    // Simple login tracking (MFA removed)
    const loginMetaRef = db.collection('loginMetadata').doc(uid);
    const loginMetaDoc = await loginMetaRef.get();
    
    let loginCount = 1;
    if (loginMetaDoc.exists) {
      const metaData = loginMetaDoc.data();
      loginCount = (metaData.loginCount || 0) + 1;
    }
    
    await loginMetaRef.set({
      loginCount: loginCount,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
      role: userData.role
    }, { merge: true });
    
    console.log('✅ Login #' + loginCount + ' for user:', email);
    
    `;
  
  content = before + replacement + after;
  console.log('✅ Replaced MFA section with simple login tracking');
} else {
  console.log('⚠️  Could not find MFA section markers');
}

// Remove MFA verification endpoint
const mfaVerifyStart = content.indexOf('// MFA verification endpoint - DISABLED');
const mfaVerifyEnd = content.indexOf('// Send MFA code via email');

if (mfaVerifyStart !== -1 && mfaVerifyEnd !== -1) {
  console.log('Removing MFA verification endpoint...');
  const before = content.substring(0, mfaVerifyStart);
  const after = content.substring(mfaVerifyEnd);
  content = before + after;
  console.log('✅ Removed MFA verification endpoint');
}

// Remove MFA email endpoint
const mfaEmailStart = content.indexOf('// Send MFA code via email');
const mfaEmailEnd = content.indexOf('// MFA enrollment check endpoint');

if (mfaEmailStart !== -1 && mfaEmailEnd !== -1) {
  console.log('Removing MFA email endpoint...');
  const before = content.substring(0, mfaEmailStart);
  const after = content.substring(mfaEmailEnd);
  content = before + after;
  console.log('✅ Removed MFA email endpoint');
}

// Verify no unclosed comments
const openComments = (content.match(/\/\*/g) || []).length;
const closeComments = (content.match(/\*\//g) || []).length;
console.log(`\nComment blocks: ${openComments} open, ${closeComments} close`);

if (openComments === closeComments) {
  console.log('✅ All comment blocks balanced!');
  fs.writeFileSync('server.js', content, 'utf8');
  console.log('✅ server.js cleaned and saved!');
  console.log('\n🎉 All MFA code removed successfully!');
} else {
  console.log('❌ Warning: Comment blocks unbalanced');
  console.log('Saving anyway...');
  fs.writeFileSync('server.js', content, 'utf8');
}
