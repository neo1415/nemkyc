/**
 * Configure CORS for Firebase Storage
 * This script uses the Google Cloud Storage Node.js client to set CORS configuration
 * 
 * Run: node scripts/configure-storage-cors.cjs
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Storage with service account
const storage = new Storage({
  projectId: 'nem-customer-feedback-8d3fb',
  keyFilename: path.join(__dirname, '../serviceAccountKey.json')
});

const bucketName = 'nem-customer-feedback-8d3fb.appspot.com';

const corsConfiguration = [
  {
    origin: ['http://localhost:8080', 'https://nemforms.com'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'X-Requested-With']
  }
];

async function configureCORS() {
  try {
    console.log(`🔧 Configuring CORS for bucket: ${bucketName}`);
    
    const bucket = storage.bucket(bucketName);
    await bucket.setCorsConfiguration(corsConfiguration);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('📋 Configuration:', JSON.stringify(corsConfiguration, null, 2));
    
    // Verify the configuration
    const [metadata] = await bucket.getMetadata();
    console.log('\n✅ Current CORS configuration:');
    console.log(JSON.stringify(metadata.cors, null, 2));
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    
    if (error.message.includes('Could not load the default credentials')) {
      console.error('\n💡 Make sure serviceAccountKey.json exists in the project root');
    }
    
    process.exit(1);
  }
}

configureCORS();
