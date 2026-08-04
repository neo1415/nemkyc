import { describe, expect, it } from 'vitest';
import { maskIdentifier, maskSensitiveRecord } from '../utils/sensitiveDataMasking';

describe('admin sensitive data masking', () => {
  it('shows only the first four identifier characters', () => {
    expect(maskIdentifier('80021234567')).toBe('8002*******');
  });

  it('masks nested directors and bank account identifiers recursively', () => {
    const masked = maskSensitiveRecord({
      ticketId: 'IKY-1234',
      NIN: '80021234567',
      accountNumber: '0123456789',
      directors: [{ BVNNumber: '22223333444', idNumber: 'A12345678', firstName: 'Ada' }],
    });

    expect(masked.ticketId).toBe('IKY-1234');
    expect(masked.NIN).toBe('8002*******');
    expect(masked.accountNumber).toBe('0123******');
    expect(masked.directors[0].BVNNumber).toBe('2222*******');
    expect(masked.directors[0].idNumber).toBe('A123*****');
    expect(masked.directors[0].firstName).toBe('Ada');
  });

  it('does not redact public corporate registration or operational ticket identifiers', () => {
    const masked = maskSensitiveRecord({
      cacNumber: 'RC6971',
      incorporationNumber: 'RC6971',
      documentId: 'firestore-document-id',
    });

    expect(masked).toEqual({
      cacNumber: 'RC6971',
      incorporationNumber: 'RC6971',
      documentId: 'firestore-document-id',
    });
  });
});
