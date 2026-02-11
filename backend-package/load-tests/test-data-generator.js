/**
 * Test Data Generator for Load Testing
 * Generates realistic test data for Artillery load tests
 */

const { faker } = require('@faker-js/faker');

/**
 * Generate test data for verification requests
 */
function generateTestData(context, events, done) {
  // Generate test NIN (11 digits)
  context.vars.nin = faker.string.numeric(11);
  
  // Generate test token (simulate valid token)
  context.vars.token = faker.string.alphanumeric(32);
  
  // Generate test auth token
  context.vars.authToken = 'test-admin-token-' + faker.string.alphanumeric(16);
  
  return done();
}

/**
 * Generate test list data
 */
function generateListData(context, events, done) {
  // Generate list name
  context.vars.listName = `Load Test ${faker.company.name()} ${Date.now()}`;
  
  // Generate test entries (10 entries per list)
  const entries = [];
  for (let i = 0; i < 10; i++) {
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
  }
  
  context.vars.entries = entries;
  context.vars.authToken = 'test-admin-token-' + faker.string.alphanumeric(16);
  
  return done();
}

/**
 * Generate test list ID for retrieval
 */
function generateListId(context, events, done) {
  context.vars.listId = faker.string.alphanumeric(20);
  context.vars.authToken = 'test-admin-token-' + faker.string.alphanumeric(16);
  
  return done();
}

module.exports = {
  generateTestData,
  generateListData,
  generateListId
};
