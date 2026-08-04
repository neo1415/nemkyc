/**
 * Bulk Verification Load Test
 * Tests bulk verification endpoint with 1000 entries
 */

const axios = require('axios');
const { faker } = require('@faker-js/faker');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'test-admin-token';

/**
 * Create a test list with specified number of entries
 */
async function createTestList(entryCount = 1000) {
  console.log(`Creating test list with ${entryCount} entries...`);
  
  // Generate test entries
  const entries = [];
  for (let i = 0; i < entryCount; i++) {
    entries.push({
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      nin: faker.string.numeric(11),
      bvn: faker.string.numeric(11),
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      phoneNumber: '0' + faker.string.numeric(10),
      address: faker.location.streetAddress(),
      policyNumber: 'POL-' + faker.string.numeric(8)
    });
    
    // Log progress every 100 entries
    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${entryCount} entries...`);
    }
  }
  
  console.log('Sending list creation request...');
  
  // Create list
  const response = await axios.post(
    `${BASE_URL}/api/identity/lists`,
    {
      name: `Load Test ${Date.now()}`,
      columns: Object.keys(entries[0]),
      entries: entries,
      emailColumn: 'email',
      listType: 'individual',
      uploadMode: 'template'
    },
    {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      timeout: 60000 // 60 second timeout
    }
  );
  
  console.log(`List created successfully: ${response.data.listId}`);
  console.log(`Entry count: ${response.data.entryCount}\n`);
  
  return response.data.listId;
}

/**
 * Run bulk verification on a list
 */
async function runBulkVerification(listId) {
  console.log('Starting bulk verification...');
  console.log(`List ID: ${listId}`);
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/identity/lists/${listId}/bulk-verify`,
      {},
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        timeout: 900000 // 15 minute timeout
      }
    );
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n=== Bulk Verification Complete ===');
    console.log(`Duration: ${duration.toFixed(2)} seconds (${(duration / 60).toFixed(2)} minutes)`);
    console.log(`Processed: ${response.data.processed}`);
    console.log(`Verified: ${response.data.verified}`);
    console.log(`Failed: ${response.data.failed}`);
    console.log(`Skipped: ${response.data.skipped}`);
    console.log(`Average time per entry: ${(duration / response.data.processed).toFixed(3)} seconds`);
    console.log(`Throughput: ${(response.data.processed / duration).toFixed(2)} entries/second`);
    
    return {
      duration,
      ...response.data
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.error('\n=== Bulk Verification Failed ===');
    console.error(`Duration before failure: ${duration.toFixed(2)} seconds`);
    console.error(`Error: ${error.message}`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    throw error;
  }
}

/**
 * Measure memory usage
 */
function measureMemoryUsage() {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(used.external / 1024 / 1024 * 100) / 100
  };
}

/**
 * Display memory usage
 */
function displayMemoryUsage(label) {
  const memory = measureMemoryUsage();
  console.log(`${label}:`);
  console.log(`  RSS: ${memory.rss} MB`);
  console.log(`  Heap Total: ${memory.heapTotal} MB`);
  console.log(`  Heap Used: ${memory.heapUsed} MB`);
  console.log(`  External: ${memory.external} MB`);
}

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('=== Bulk Verification Load Test ===\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test started at: ${new Date().toISOString()}\n`);
    
    // Measure initial memory
    displayMemoryUsage('Initial memory');
    const initialMemory = measureMemoryUsage();
    console.log('');
    
    // Create test list
    const listId = await createTestList(1000);
    
    // Measure memory after list creation
    displayMemoryUsage('Memory after list creation');
    console.log('');
    
    // Run bulk verification
    const results = await runBulkVerification(listId);
    console.log('');
    
    // Measure final memory
    displayMemoryUsage('Final memory');
    const finalMemory = measureMemoryUsage();
    console.log('');
    
    // Calculate metrics
    const successRate = (results.verified / results.processed) * 100;
    const failureRate = (results.failed / results.processed) * 100;
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log('=== Test Summary ===');
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`Failure Rate: ${failureRate.toFixed(2)}%`);
    console.log(`Memory Increase: ${memoryIncrease.toFixed(2)} MB`);
    console.log('');
    
    // Evaluate results
    console.log('=== Evaluation ===');
    
    const checks = {
      'All entries processed': results.processed === 1000,
      'Duration < 15 minutes': results.duration < 900,
      'Average time < 1 second': (results.duration / results.processed) < 1,
      'Memory increase < 500 MB': memoryIncrease < 500,
      'Success rate > 95%': successRate > 95
    };
    
    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✓' : '✗'} ${check}`);
      if (!passed) allPassed = false;
    }
    
    console.log('');
    
    if (allPassed) {
      console.log('✓ All checks passed! System is ready for production.');
      process.exit(0);
    } else {
      console.log('✗ Some checks failed. Review results and optimize before production.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error(`Error: ${error.message}`);
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the test
runTest();
