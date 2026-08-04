
# Load Testing Guide

## Overview

This document provides comprehensive instructions for conducting load testing on the Identity Collection System before production deployment. Load testing ensures the system can handle expected traffic volumes and identifies performance bottlenecks.

## Testing Objectives

1. **Verify system can handle 100 concurrent verifications**
2. **Test bulk verification with 1000 entries**
3. **Measure API response times under load**
4. **Identify performance bottlenecks**
5. **Validate rate limiting and queuing mechanisms**
6. **Ensure system stability under sustained load**

---

## Prerequisites

### Tools Required

1. **Artillery** - Load testing framework
   ```bash
   npm install -g artillery
   ```

2. **k6** - Alternative load testing tool (optional)
   ```bash
   # macOS
   brew install k6
   
   # Windows
   choco install k6
   
   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

3. **Test Data Generator**
   ```bash
   # Install faker for generating test data
   npm install --save-dev @faker-js/faker
   ```

### Environment Setup

1. **Use Staging Environment**
   - Never run load tests against production
   - Ensure staging environment mirrors production configuration
   - Use mock Datapro API to avoid costs

2. **Configure Test Environment**
   ```bash
   # .env.test
   NODE_ENV=test
   VERIFICATION_MODE=mock
   DATAPRO_SERVICE_ID=test-service-id
   ENCRYPTION_KEY=test-encryption-key-32-bytes-hex
   ```

3. **Prepare Test Database**
   - Use separate Firestore database for testing
   - Ensure database is empty or has known state
   - Configure cleanup scripts

---

## Test Scenarios

### Test 1: Concurrent Verifications (100 users)

**Objective**: Verify system can handle 100 concurrent verification requests

**Duration**: 5 minutes

**Expected Results**:
- All requests complete successfully
- Average response time < 3 seconds
- No errors or timeouts
- Rate limiting works correctly

#### Artillery Configuration

Create `load-tests/concurrent-verifications.yml`:

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 180
      arrivalRate: 30
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"
  processor: "./test-data-generator.js"
  
scenarios:
  - name: "Customer Verification Flow"
    flow:
      - function: "generateTestData"
      - post:
          url: "/api/identity/verify/{{ token }}"
          json:
            identityNumber: "{{ nin }}"
          capture:
            - json: "$.success"
              as: "verificationSuccess"
      - think: 2
```

#### Test Data Generator

Create `load-tests/test-data-generator.js`:

```javascript
const { faker } = require('@faker-js/faker');

function generateTestData(context, events, done) {
  // Generate test NIN (11 digits)
  context.vars.nin = faker.string.numeric(11);
  
  // Generate test token (simulate valid token)
  context.vars.token = faker.string.alphanumeric(32);
  
  return done();
}

module.exports = {
  generateTestData
};
```

#### Run Test

```bash
# Run concurrent verification test
artillery run load-tests/concurrent-verifications.yml --output report-concurrent.json

# Generate HTML report
artillery report report-concurrent.json --output report-concurrent.html
```

#### Success Criteria

- [ ] 95% of requests complete in < 3 seconds
- [ ] 99% of requests complete in < 5 seconds
- [ ] 0% error rate
- [ ] No server crashes or restarts
- [ ] Rate limiting activates correctly at 50 requests/minute

---

### Test 2: Bulk Verification (1000 entries)

**Objective**: Test bulk verification endpoint with large dataset

**Duration**: 10-15 minutes

**Expected Results**:
- All 1000 entries processed
- Progress tracking works correctly
- No memory leaks
- Queue system handles overflow

#### Test Script

Create `load-tests/bulk-verification-test.js`:

```javascript
const axios = require('axios');
const { faker } = require('@faker-js/faker');

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'test-admin-token'; // Get from test login

async function createTestList() {
  console.log('Creating test list with 1000 entries...');
  
  // Generate 1000 test entries
  const entries = [];
  for (let i = 0; i < 1000; i++) {
    entries.push({
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      nin: faker.string.numeric(11),
      bvn: faker.string.numeric(11),
      gender: faker.helpers.arrayElement(['Male', 'Female']),
      dateOfBirth: faker.date.birthdate().toISOString().split('T')[0],
      phoneNumber: '0' + faker.string.numeric(10)
    });
  }
  
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
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    }
  );
  
  return response.data.listId;
}

async function runBulkVerification(listId) {
  console.log('Starting bulk verification...');
  
  const startTime = Date.now();
  
  const response = await axios.post(
    `${BASE_URL}/api/identity/lists/${listId}/bulk-verify`,
    {},
    {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    }
  );
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('Bulk verification complete!');
  console.log(`Duration: ${duration} seconds`);
  console.log(`Processed: ${response.data.processed}`);
  console.log(`Verified: ${response.data.verified}`);
  console.log(`Failed: ${response.data.failed}`);
  console.log(`Skipped: ${response.data.skipped}`);
  console.log(`Average time per entry: ${(duration / response.data.processed).toFixed(2)} seconds`);
  
  return response.data;
}

async function measureMemoryUsage() {
  const used = process.memoryUsage();
  console.log('Memory Usage:');
  for (let key in used) {
    console.log(`  ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}

async function runTest() {
  try {
    console.log('=== Bulk Verification Load Test ===\n');
    
    // Measure initial memory
    console.log('Initial memory:');
    await measureMemoryUsage();
    console.log('');
    
    // Create test list
    const listId = await createTestList();
    console.log(`List created: ${listId}\n`);
    
    // Run bulk verification
    const results = await runBulkVerification(listId);
    console.log('');
    
    // Measure final memory
    console.log('Final memory:');
    await measureMemoryUsage();
    console.log('');
    
    // Calculate metrics
    const successRate = (results.verified / results.processed) * 100;
    console.log(`Success Rate: ${successRate.toFixed(2)}%`);
    
    // Check for memory leaks
    const memoryIncrease = process.memoryUsage().heapUsed;
    console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)} MB`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
```

#### Run Test

```bash
# Install dependencies
npm install axios @faker-js/faker

# Run bulk verification test
node load-tests/bulk-verification-test.js
```

#### Success Criteria

- [ ] All 1000 entries processed successfully
- [ ] Total processing time < 15 minutes
- [ ] Average time per entry < 1 second
- [ ] Memory usage increase < 500 MB
- [ ] No memory leaks detected
- [ ] Progress tracking updates correctly
- [ ] Queue system handles batching correctly

---

### Test 3: API Response Time Measurement

**Objective**: Measure response times for all critical endpoints

**Duration**: 10 minutes

**Expected Results**:
- All endpoints respond within acceptable time limits
- No timeouts
- Consistent performance

#### Artillery Configuration

Create `load-tests/response-time-test.yml`:

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 600
      arrivalRate: 10
  processor: "./test-data-generator.js"

scenarios:
  - name: "List Creation"
    weight: 20
    flow:
      - function: "generateListData"
      - post:
          url: "/api/identity/lists"
          json:
            name: "{{ listName }}"
            columns: ["email", "firstName", "lastName"]
            entries: "{{ entries }}"
            emailColumn: "email"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "List Retrieval"
    weight: 30
    flow:
      - get:
          url: "/api/identity/lists"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Entry Verification"
    weight: 40
    flow:
      - function: "generateTestData"
      - post:
          url: "/api/identity/verify/{{ token }}"
          json:
            identityNumber: "{{ nin }}"

  - name: "Export List"
    weight: 10
    flow:
      - get:
          url: "/api/identity/lists/{{ listId }}/export"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

#### Run Test

```bash
artillery run load-tests/response-time-test.yml --output report-response-time.json
artillery report report-response-time.json --output report-response-time.html
```

#### Success Criteria

- [ ] List creation: p95 < 2 seconds
- [ ] List retrieval: p95 < 1 second
- [ ] Entry verification: p95 < 3 seconds
- [ ] Export: p95 < 5 seconds
- [ ] No requests timeout (> 30 seconds)

---

### Test 4: Sustained Load Test

**Objective**: Verify system stability under sustained load

**Duration**: 30 minutes

**Expected Results**:
- System remains stable
- No performance degradation over time
- No memory leaks
- No connection pool exhaustion

#### Artillery Configuration

Create `load-tests/sustained-load-test.yml`:

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 1800  # 30 minutes
      arrivalRate: 20
  processor: "./test-data-generator.js"

scenarios:
  - name: "Mixed Workload"
    flow:
      - function: "generateTestData"
      - loop:
        - post:
            url: "/api/identity/verify/{{ token }}"
            json:
              identityNumber: "{{ nin }}"
        - think: 5
        count: 10
```

#### Run Test

```bash
artillery run load-tests/sustained-load-test.yml --output report-sustained.json
artillery report report-sustained.json --output report-sustained.html
```

#### Success Criteria

- [ ] Response times remain consistent throughout test
- [ ] No increase in error rate over time
- [ ] Memory usage remains stable
- [ ] CPU usage remains below 80%
- [ ] No connection errors

---

### Test 5: Rate Limiting Validation

**Objective**: Verify rate limiting works correctly

**Duration**: 5 minutes

**Expected Results**:
- Rate limiter activates at configured threshold
- Requests are queued correctly
- 429 status returned when appropriate
- System recovers after rate limit period

#### Test Script

Create `load-tests/rate-limit-test.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const RATE_LIMIT = 50; // requests per minute

async function testRateLimit() {
  console.log('=== Rate Limiting Test ===\n');
  console.log(`Sending ${RATE_LIMIT + 10} requests in rapid succession...\n`);
  
  const requests = [];
  const results = {
    success: 0,
    rateLimited: 0,
    errors: 0
  };
  
  // Send requests rapidly
  for (let i = 0; i < RATE_LIMIT + 10; i++) {
    requests.push(
      axios.post(`${BASE_URL}/api/identity/verify/test-token-${i}`, {
        identityNumber: '12345678901'
      })
      .then(response => {
        results.success++;
        return { status: response.status, index: i };
      })
      .catch(error => {
        if (error.response?.status === 429) {
          results.rateLimited++;
          return { status: 429, index: i };
        } else {
          results.errors++;
          return { status: error.response?.status || 'error', index: i };
        }
      })
    );
  }
  
  // Wait for all requests
  const responses = await Promise.all(requests);
  
  console.log('Results:');
  console.log(`  Successful: ${results.success}`);
  console.log(`  Rate Limited (429): ${results.rateLimited}`);
  console.log(`  Errors: ${results.errors}`);
  console.log('');
  
  // Check if rate limiting activated
  if (results.rateLimited > 0) {
    console.log('✓ Rate limiting is working correctly');
  } else {
    console.log('✗ Rate limiting did not activate');
  }
  
  // Wait for rate limit window to reset
  console.log('\nWaiting 60 seconds for rate limit to reset...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Test that requests work again
  console.log('Testing request after rate limit reset...');
  try {
    await axios.post(`${BASE_URL}/api/identity/verify/test-token-reset`, {
      identityNumber: '12345678901'
    });
    console.log('✓ Requests working after rate limit reset');
  } catch (error) {
    console.log('✗ Requests still failing after rate limit reset');
  }
}

testRateLimit();
```

#### Run Test

```bash
node load-tests/rate-limit-test.js
```

#### Success Criteria

- [ ] Rate limiter activates after 50 requests/minute
- [ ] 429 status returned for rate-limited requests
- [ ] Requests succeed after rate limit window resets
- [ ] No requests are lost (queued correctly)

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Single verification | < 2s | < 3s | > 5s |
| Bulk verification (100) | < 2min | < 3min | > 5min |
| List creation | < 1s | < 2s | > 3s |
| List retrieval | < 500ms | < 1s | > 2s |
| Export (1000 entries) | < 5s | < 10s | > 15s |
| Concurrent users | 100 | 75 | < 50 |
| Error rate | 0% | < 1% | > 5% |
| Memory usage | < 1GB | < 2GB | > 3GB |
| CPU usage | < 60% | < 80% | > 90% |

### Bottleneck Identification

Common bottlenecks to check:

1. **Database Queries**
   - Check Firestore query performance
   - Ensure indexes are created
   - Monitor read/write operations

2. **API Calls**
   - Monitor Datapro API response times
   - Check for API rate limiting
   - Verify retry logic works

3. **Encryption/Decryption**
   - Monitor encryption operation times
   - Check for CPU bottlenecks
   - Verify efficient key management

4. **Memory Leaks**
   - Monitor memory usage over time
   - Check for unclosed connections
   - Verify proper cleanup

5. **Connection Pools**
   - Monitor database connection pool
   - Check for connection exhaustion
   - Verify proper connection management

---

## Load Testing Checklist

### Pre-Test
- [ ] Staging environment is ready
- [ ] Test data is prepared
- [ ] Monitoring is enabled
- [ ] Baseline metrics recorded
- [ ] Team is notified

### During Test
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Monitor response times
- [ ] Monitor error rates
- [ ] Monitor database performance
- [ ] Record any anomalies

### Post-Test
- [ ] Generate test reports
- [ ] Analyze results
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Create optimization plan
- [ ] Clean up test data

---

## Test Results Template

```markdown
# Load Test Results - [Date]

## Test Configuration
- Environment: Staging
- Duration: [X] minutes
- Concurrent Users: [X]
- Total Requests: [X]

## Results Summary
- Success Rate: [X]%
- Average Response Time: [X]ms
- p95 Response Time: [X]ms
- p99 Response Time: [X]ms
- Error Rate: [X]%

## Performance Metrics
- CPU Usage: [X]%
- Memory Usage: [X] MB
- Database Queries: [X]
- API Calls: [X]

## Bottlenecks Identified
1. [Description]
2. [Description]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Action Items
- [ ] [Action item]
- [ ] [Action item]
```

---

## Optimization Recommendations

Based on load test results, consider these optimizations:

### Database Optimization
- Add indexes for frequently queried fields
- Implement caching for read-heavy operations
- Use batch operations where possible
- Optimize query patterns

### API Optimization
- Implement request batching
- Add caching layer for repeated requests
- Optimize retry logic
- Use connection pooling

### Application Optimization
- Implement lazy loading
- Optimize encryption operations
- Use worker threads for CPU-intensive tasks
- Implement request queuing

### Infrastructure Optimization
- Scale horizontally (add more servers)
- Increase server resources (CPU, memory)
- Use CDN for static assets
- Implement load balancing

---

## Continuous Load Testing

### Schedule
- Run load tests before each major release
- Run weekly performance regression tests
- Run monthly capacity planning tests

### Automation
Consider automating load tests:

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Artillery
        run: npm install -g artillery
      - name: Run Load Tests
        run: |
          artillery run load-tests/concurrent-verifications.yml
          artillery run load-tests/response-time-test.yml
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: report-*.html
```

---

**Last Updated**: [Date]

**Test Owner**: [Name/Team]

**Next Test Date**: [Date]
