/**
 * Test script to verify CAC decryption endpoint works in production
 * Run this in browser console on production site
 */

async function testCACDecryption() {
  console.log('🧪 Testing CAC decryption endpoints...');
  
  // Test data (dummy encrypted data and IV)
  const testData = {
    encryptedData: 'dGVzdCBkYXRh', // base64 encoded "test data"
    iv: 'dGVzdCBpdg==' // base64 encoded "test iv"
  };
  
  const endpoints = [
    `${window.location.origin}/api/cac-documents/decrypt`,
    'https://nem-server-rhdb.onrender.com/api/cac-documents/decrypt',
    '/api/cac-documents/decrypt'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        credentials: 'include'
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      
      const responseText = await response.text();
      console.log(`📊 Response preview: ${responseText.substring(0, 200)}`);
      
      if (response.ok) {
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          console.log('❌ HTML response detected (routing issue)');
        } else {
          try {
            const result = JSON.parse(responseText);
            console.log('✅ Valid JSON response received');
            console.log('📊 Response keys:', Object.keys(result));
          } catch (e) {
            console.log('❌ Invalid JSON response');
          }
        }
      } else {
        console.log('❌ Error response');
      }
      
      console.log('---');
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
      console.log('---');
    }
  }
}

// Run the test
testCACDecryption();