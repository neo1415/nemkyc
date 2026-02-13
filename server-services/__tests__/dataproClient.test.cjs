const { verifyNIN, maskNIN, getUserFriendlyError, getTechnicalError, normalizeString, normalizeGender, parseDate, normalizePhone } = require('../dataproClient.cjs');

describe('Datapro Client - Unit Tests', () => {
  test('should handle empty NIN input', async () => {
    const result = await verifyNIN('');
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_INPUT');
  });

  test('maskNIN should mask NIN', () => {
    expect(maskNIN('12345678901')).toBe('1234*******');
  });

  test('getUserFriendlyError should return message', () => {
    expect(getUserFriendlyError('INVALID_INPUT')).toBe('NIN is required. Please provide a valid NIN.');
  });

  test('getTechnicalError should include error code', () => {
    expect(getTechnicalError('NETWORK_ERROR')).toContain('Error Code: NETWORK_ERROR');
  });

  test('normalizeString should work', () => {
    expect(normalizeString('JOHN')).toBe('john');
  });

  test('normalizeGender should work', () => {
    expect(normalizeGender('M')).toBe('male');
  });

  test('parseDate should work', () => {
    expect(parseDate('04/01/1980')).toBe('1980-01-04');
  });

  test('normalizePhone should work', () => {
    expect(normalizePhone('+2348012345678')).toBe('08012345678');
  });
});
