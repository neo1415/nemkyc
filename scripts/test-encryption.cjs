/**
 * Quick test script to verify encryption/decryption works correctly
 * 
 * Usage: node scripts/test-encryption.cjs
 */

const { 
  encryptData, 
  decryptData, 
  isEncrypted,
  generateEncryptionKey 
} = require('../server-utils/encryption.cjs');

console.log('🔐 Testing Encryption Utilities');
console.log('================================\n');

// Check if encryption key is set
if (!process.env.ENCRYPTION_KEY) {
  console.log('⚠️  ENCRYPTION_KEY not set in environment');
  console.log('Generating a test key...\n');
  const testKey = generateEncryptionKey();
  process.env.ENCRYPTION_KEY = testKey;
  console.log(`Test key: ${testKey}`);
  console.log('(Add this to your .env file for production use)\n');
}

// Test data
const testCases = [
  { name: 'NIN', value: '12345678901' },
  { name: 'BVN', value: '22334455667' },
  { name: 'CAC', value: 'RC123456' },
  { name: 'Short string', value: 'test' },
  { name: 'Long string', value: 'This is a longer test string with spaces and numbers 123' }
];

let allTestsPassed = true;

console.log('Running encryption/decryption tests...\n');

for (const testCase of testCases) {
  try {
    console.log(`Testing: ${testCase.name}`);
    console.log(`  Original: ${testCase.value}`);
    
    // Encrypt
    const encrypted = encryptData(testCase.value);
    console.log(`  Encrypted: ${encrypted.encrypted.substring(0, 20)}...`);
    console.log(`  IV: ${encrypted.iv}`);
    
    // Check if recognized as encrypted
    if (!isEncrypted(encrypted)) {
      throw new Error('isEncrypted() returned false for encrypted data');
    }
    console.log(`  ✓ Recognized as encrypted`);
    
    // Decrypt
    const decrypted = decryptData(encrypted.encrypted, encrypted.iv);
    console.log(`  Decrypted: ${decrypted}`);
    
    // Verify
    if (decrypted !== testCase.value) {
      throw new Error(`Decryption mismatch! Expected: ${testCase.value}, Got: ${decrypted}`);
    }
    console.log(`  ✓ Decryption successful\n`);
    
  } catch (error) {
    console.error(`  ❌ Test failed: ${error.message}\n`);
    allTestsPassed = false;
  }
}

// Test IV uniqueness
console.log('Testing IV uniqueness...');
const value = '12345678901';
const encrypted1 = encryptData(value);
const encrypted2 = encryptData(value);

if (encrypted1.iv === encrypted2.iv) {
  console.error('  ❌ IVs are not unique!');
  allTestsPassed = false;
} else {
  console.log('  ✓ IVs are unique');
}

if (encrypted1.encrypted === encrypted2.encrypted) {
  console.error('  ❌ Encrypted values are identical (should be different due to unique IVs)!');
  allTestsPassed = false;
} else {
  console.log('  ✓ Encrypted values are different\n');
}

// Test error handling
console.log('Testing error handling...');

try {
  encryptData('');
  console.error('  ❌ Should have thrown error for empty string');
  allTestsPassed = false;
} catch (error) {
  console.log('  ✓ Correctly rejects empty string');
}

try {
  decryptData('invalid', 'invalid');
  console.error('  ❌ Should have thrown error for invalid encrypted data');
  allTestsPassed = false;
} catch (error) {
  console.log('  ✓ Correctly rejects invalid encrypted data');
}

try {
  const encrypted = encryptData('test');
  decryptData(encrypted.encrypted, 'wrongiv');
  console.error('  ❌ Should have thrown error for wrong IV');
  allTestsPassed = false;
} catch (error) {
  console.log('  ✓ Correctly rejects wrong IV\n');
}

// Summary
console.log('================================');
if (allTestsPassed) {
  console.log('✅ All tests passed!');
  console.log('\nEncryption utilities are working correctly.');
  console.log('You can now use them in your application.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  console.log('\nPlease review the errors above and fix any issues.');
  process.exit(1);
}
