# Load Testing Suite

This directory contains load testing scripts and configurations for the Identity Collection System.

## Prerequisites

1. **Install Dependencies**
   ```bash
   cd load-tests
   npm install
   ```

2. **Install Artillery Globally** (optional)
   ```bash
   npm install -g artillery
   ```

3. **Set Up Test Environment**
   - Use staging environment (never test against production)
   - Configure environment variables in `.env.test`
   - Ensure mock mode is enabled to avoid API costs

## Available Tests

### 1. Concurrent Verifications Test
Tests system with 100 concurrent verification requests.

```bash
npm run test:concurrent
```

**What it tests:**
- System handles concurrent load
- Response times remain acceptable
- No errors under load
- Rate limiting works correctly

**Duration:** ~6 minutes

### 2. Response Time Test
Measures response times for all critical endpoints.

```bash
npm run test:response-time
```

**What it tests:**
- List creation performance
- List retrieval performance
- Verification performance
- Export performance

**Duration:** ~10 minutes

### 3. Sustained Load Test
Tests system stability under sustained load.

```bash
npm run test:sustained
```

**What it tests:**
- System remains stable over time
- No performance degradation
- No memory leaks
- No connection pool exhaustion

**Duration:** ~30 minutes

### 4. Bulk Verification Test
Tests bulk verification with 1000 entries.

```bash
npm run test:bulk
```

**What it tests:**
- Large dataset processing
- Memory usage
- Processing time
- Queue system

**Duration:** ~10-15 minutes

### 5. Rate Limiting Test
Verifies rate limiting mechanisms.

```bash
npm run test:rate-limit
```

**What it tests:**
- Rate limiter activates correctly
- 429 status returned appropriately
- System recovers after rate limit
- Queue system works

**Duration:** ~2 minutes

### Run All Tests
```bash
npm run test:all
```

**Duration:** ~60 minutes

## Generating Reports

After running Artillery tests, generate HTML reports:

```bash
# Generate individual reports
npm run report:concurrent
npm run report:response-time
npm run report:sustained

# Generate all reports
npm run report:all
```

Reports are saved to `../reports/` directory.

## Environment Variables

Configure these in `.env.test`:

```bash
# Test Configuration
TEST_BASE_URL=http://localhost:3000
TEST_AUTH_TOKEN=your-test-admin-token
NODE_ENV=test

# Verification Mode
VERIFICATION_MODE=mock

# Test Credentials
DATAPRO_SERVICE_ID=test-service-id
ENCRYPTION_KEY=test-encryption-key-32-bytes-hex
```

## Interpreting Results

### Artillery Tests

**Key Metrics:**
- **RPS (Requests Per Second)**: Number of requests handled per second
- **Response Time**: Time taken to complete requests
  - **p50**: 50% of requests completed in this time
  - **p95**: 95% of requests completed in this time
  - **p99**: 99% of requests completed in this time
- **Error Rate**: Percentage of failed requests
- **Scenarios**: Number of complete user flows executed

**Good Results:**
- p95 < 3 seconds
- p99 < 5 seconds
- Error rate < 1%
- No timeouts

**Warning Signs:**
- p95 > 5 seconds
- Error rate > 5%
- Increasing response times over time
- Memory usage growing continuously

### Node.js Tests

**Bulk Verification:**
- All 1000 entries processed: ✓
- Duration < 15 minutes: ✓
- Average time < 1 second per entry: ✓
- Memory increase < 500 MB: ✓
- Success rate > 95%: ✓

**Rate Limiting:**
- Rate limiting activated: ✓
- Some requests succeeded: ✓
- Rate limited count reasonable: ✓
- No unexpected errors: ✓
- Rate limit reset works: ✓

## Troubleshooting

### Tests Failing

**Connection Errors:**
- Ensure server is running
- Check BASE_URL is correct
- Verify network connectivity

**Timeout Errors:**
- Increase timeout in test configuration
- Check server performance
- Verify database is responsive

**High Error Rates:**
- Check server logs for errors
- Verify test data is valid
- Check rate limiting configuration

**Memory Issues:**
- Monitor server memory usage
- Check for memory leaks
- Increase server resources if needed

### Performance Issues

**Slow Response Times:**
- Check database indexes
- Monitor API response times
- Check for N+1 queries
- Verify caching is working

**High CPU Usage:**
- Check for inefficient algorithms
- Monitor encryption operations
- Check for infinite loops

**Database Bottlenecks:**
- Check query performance
- Verify indexes exist
- Monitor connection pool

## Best Practices

1. **Always test in staging first**
   - Never run load tests against production
   - Use mock APIs to avoid costs

2. **Start small, scale up**
   - Begin with low load
   - Gradually increase
   - Monitor system behavior

3. **Monitor during tests**
   - Watch server resources (CPU, memory)
   - Check database performance
   - Monitor error logs

4. **Document results**
   - Save test reports
   - Note any issues found
   - Track improvements over time

5. **Test regularly**
   - Before major releases
   - After significant changes
   - Weekly regression tests

## Continuous Integration

To run load tests in CI/CD:

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
      
      - name: Install Dependencies
        run: |
          cd load-tests
          npm install
      
      - name: Run Load Tests
        run: |
          cd load-tests
          npm run test:concurrent
          npm run test:response-time
          npm run test:bulk
          npm run test:rate-limit
      
      - name: Generate Reports
        run: |
          cd load-tests
          npm run report:all
      
      - name: Upload Reports
        uses: actions/upload-artifact@v2
        with:
          name: load-test-reports
          path: reports/*.html
```

## Support

For questions or issues with load testing:
- Check the main documentation: `../docs/LOAD_TESTING_GUIDE.md`
- Review test logs for error details
- Contact the technical team

---

**Last Updated:** [Date]
