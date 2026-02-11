/**
 * Rate Limiting Test
 * Verifies that rate limiting works correctly
 */

const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const RATE_LIMIT = 50; // requests per minute
const TEST_REQUESTS = RATE_LIMIT + 10; // Send more than limit

/**
 * Test rate limiting
 */
async function testRateLimit() {
  console.log('=== Rate Limiting Test ===\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Rate Limit: ${RATE_LIMIT} requests/minute`);
  console.log(`Test: Sending ${TEST_REQUESTS} requests rapidly\n`);
  
  const results = {
    success: 0,
    rateLimited: 0,
    errors: 0,
    responseTimes: []
  };
  
  const startTime = Date.now();
  
  // Send requests rapidly
  console.log('Sending requests...');
  const requests = [];
  
  for (let i = 0; i < TEST_REQUESTS; i++) {
    const requestStart = Date.now();
    
    requests.push(
      axios.post(`${BASE_URL}/api/identity/verify/test-token-${i}`, {
        identityNumber: '12345678901'
      })
      .then(response => {
        const responseTime = Date.now() - requestStart;
        results.success++;
        results.responseTimes.push(responseTime);
        return { 
          status: response.status, 
          index: i,
          responseTime 
        };
      })
      .catch(error => {
        const responseTime = Date.now() - requestStart;
        
        if (error.response?.status === 429) {
          results.rateLimited++;
          return { 
            status: 429, 
            index: i,
            responseTime,
            message: error.response.data?.message 
          };
        } else {
          results.errors++;
          return { 
            status: error.response?.status || 'error', 
            index: i,
            responseTime,
            error: error.message 
          };
        }
      })
    );
  }
  
  // Wait for all requests
  const responses = await Promise.all(requests);
  
  const totalTime = Date.now() - startTime;
  
  console.log('\n=== Results ===');
  console.log(`Total time: ${(totalTime / 1000).toFixed(2)} seconds`);
  console.log(`Requests sent: ${TEST_REQUESTS}`);
  console.log(`Successful (200): ${results.success}`);
  console.log(`Rate Limited (429): ${results.rateLimited}`);
  console.log(`Errors: ${results.errors}`);
  console.log('');
  
  // Calculate response time statistics
  if (results.responseTimes.length > 0) {
    const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    const maxResponseTime = Math.max(...results.responseTimes);
    const minResponseTime = Math.min(...results.responseTimes);
    
    console.log('=== Response Times ===');
    console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Min: ${minResponseTime}ms`);
    console.log(`Max: ${maxResponseTime}ms`);
    console.log('');
  }
  
  // Show first few rate-limited responses
  const rateLimitedResponses = responses.filter(r => r.status === 429).slice(0, 3);
  if (rateLimitedResponses.length > 0) {
    console.log('=== Sample Rate Limited Responses ===');
    rateLimitedResponses.forEach(r => {
      console.log(`Request ${r.index}: ${r.message || 'Rate limit exceeded'}`);
    });
    console.log('');
  }
  
  // Evaluate rate limiting
  console.log('=== Evaluation ===');
  
  const checks = {
    'Rate limiting activated': results.rateLimited > 0,
    'Some requests succeeded': results.success > 0,
    'Rate limited count reasonable': results.rateLimited >= (TEST_REQUESTS - RATE_LIMIT),
    'No unexpected errors': results.errors === 0
  };
  
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? '✓' : '✗'} ${check}`);
    if (!passed) allPassed = false;
  }
  
  console.log('');
  
  if (!allPassed) {
    console.log('✗ Rate limiting test failed');
    return false;
  }
  
  console.log('✓ Rate limiting is working correctly\n');
  
  // Test rate limit reset
  console.log('=== Testing Rate Limit Reset ===');
  console.log('Waiting 60 seconds for rate limit window to reset...');
  
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  console.log('Testing request after rate limit reset...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/identity/verify/test-token-reset`, {
      identityNumber: '12345678901'
    });
    
    console.log(`✓ Request succeeded (status ${response.status})`);
    console.log('✓ Rate limit reset is working correctly\n');
    
    return true;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('✗ Request still rate limited after reset period');
      console.log('✗ Rate limit reset is NOT working correctly\n');
      return false;
    } else {
      console.log(`✗ Request failed with error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Test queue system
 */
async function testQueueSystem() {
  console.log('=== Queue System Test ===\n');
  console.log('Testing that rate-limited requests are queued...\n');
  
  const results = {
    queued: 0,
    processed: 0,
    failed: 0
  };
  
  // Send requests that should be queued
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(
      axios.post(`${BASE_URL}/api/identity/verify/queue-test-${i}`, {
        identityNumber: '12345678901'
      })
      .then(response => {
        results.processed++;
        return { success: true, index: i };
      })
      .catch(error => {
        if (error.response?.status === 429) {
          results.queued++;
          return { queued: true, index: i };
        } else {
          results.failed++;
          return { failed: true, index: i, error: error.message };
        }
      })
    );
  }
  
  await Promise.all(requests);
  
  console.log('Results:');
  console.log(`  Processed immediately: ${results.processed}`);
  console.log(`  Queued (429): ${results.queued}`);
  console.log(`  Failed: ${results.failed}`);
  console.log('');
  
  if (results.queued > 0) {
    console.log('✓ Queue system is working (requests are being rate limited)');
  } else {
    console.log('✗ Queue system may not be working (no requests queued)');
  }
  
  return results.queued > 0;
}

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('Starting rate limiting tests...\n');
    
    // Test 1: Basic rate limiting
    const rateLimitPassed = await testRateLimit();
    
    // Test 2: Queue system
    const queuePassed = await testQueueSystem();
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Rate Limiting: ${rateLimitPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Queue System: ${queuePassed ? 'PASSED' : 'FAILED'}`);
    console.log('');
    
    if (rateLimitPassed && queuePassed) {
      console.log('✓ All rate limiting tests passed!');
      process.exit(0);
    } else {
      console.log('✗ Some rate limiting tests failed');
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
