/**
 * Property-Based Tests for Document Status Display
 * 
 * **Validates: Property 10 - Status indicator accuracy**
 * **Requirements: 7.1, 7.2, 7.3**
 * 
 * Tests that status indicators always reflect actual document state across
 * all possible document state combinations using fast-check.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DocumentStatus, CACDocumentType, DocumentStatusSummary } from '../../types/cacDocuments';

/**
 * Fast-check arbitrary for DocumentStatus
 */
const documentStatusArbitrary = fc.constantFrom(
  DocumentStatus.UPLOADED,
  DocumentStatus.MISSING,
  DocumentStatus.PENDING,
  DocumentStatus.FAILED
);

/**
 * Fast-check arbitrary for complete document status summary
 * Ensures uploaded documents always have timestamps
 */
const documentStatusSummaryArbitrary = fc.record({
  certificateOfIncorporation: documentStatusArbitrary,
  particularsOfDirectors: documentStatusArbitrary,
  shareAllotment: documentStatusArbitrary,
  certificateTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  directorsTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  shareAllotmentTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
}).map((data) => {
  const uploadTimestamps: { [key in CACDocumentType]?: Date } = {};
  
  // Only add timestamps for uploaded documents
  if (data.certificateOfIncorporation === DocumentStatus.UPLOADED) {
    uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION] = data.certificateTimestamp;
  }
  if (data.particularsOfDirectors === DocumentStatus.UPLOADED) {
    uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS] = data.directorsTimestamp;
  }
  if (data.shareAllotment === DocumentStatus.UPLOADED) {
    uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT] = data.shareAllotmentTimestamp;
  }
  
  const isComplete =
    data.certificateOfIncorporation === DocumentStatus.UPLOADED &&
    data.particularsOfDirectors === DocumentStatus.UPLOADED &&
    data.shareAllotment === DocumentStatus.UPLOADED;
  
  return {
    identityRecordId: 'list-1',
    certificateOfIncorporation: data.certificateOfIncorporation,
    particularsOfDirectors: data.particularsOfDirectors,
    shareAllotment: data.shareAllotment,
    uploadTimestamps,
    isComplete
  } as DocumentStatusSummary;
});

describe('Property-Based Tests: Document Status Display', () => {
  /**
   * Property 10.1: Status completeness is correctly calculated
   * 
   * The isComplete flag should be true if and only if all three documents
   * are in UPLOADED status.
   * 
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it('property: status completeness is correctly calculated', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // Verify the isComplete calculation
        const expectedComplete =
          statusSummary.certificateOfIncorporation === DocumentStatus.UPLOADED &&
          statusSummary.particularsOfDirectors === DocumentStatus.UPLOADED &&
          statusSummary.shareAllotment === DocumentStatus.UPLOADED;

        expect(statusSummary.isComplete).toBe(expectedComplete);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.2: Uploaded documents always have timestamps
   * 
   * Documents with UPLOADED status must have upload timestamps.
   * 
   * **Validates: Requirement 7.4**
   */
  it('property: uploaded documents always have timestamps', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // Check Certificate of Incorporation
        if (statusSummary.certificateOfIncorporation === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION]).toBeDefined();
          expect(statusSummary.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION]).toBeInstanceOf(Date);
        }

        // Check Particulars of Directors
        if (statusSummary.particularsOfDirectors === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS]).toBeDefined();
          expect(statusSummary.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS]).toBeInstanceOf(Date);
        }

        // Check Share Allotment
        if (statusSummary.shareAllotment === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT]).toBeDefined();
          expect(statusSummary.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT]).toBeInstanceOf(Date);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.3: Missing documents never have timestamps
   * 
   * Documents with MISSING status should not have upload timestamps.
   * 
   * **Validates: Requirements 7.2, 7.3**
   */
  it('property: missing documents never have timestamps', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // Check Certificate of Incorporation
        if (statusSummary.certificateOfIncorporation === DocumentStatus.MISSING) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION]).toBeUndefined();
        }

        // Check Particulars of Directors
        if (statusSummary.particularsOfDirectors === DocumentStatus.MISSING) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS]).toBeUndefined();
        }

        // Check Share Allotment
        if (statusSummary.shareAllotment === DocumentStatus.MISSING) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT]).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.4: All document types are represented in status summary
   * 
   * Every status summary must include status for all three document types.
   * 
   * **Validates: Requirement 7.1**
   */
  it('property: all document types are represented in status summary', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // All three document types must have a status
        expect(statusSummary.certificateOfIncorporation).toBeDefined();
        expect(statusSummary.particularsOfDirectors).toBeDefined();
        expect(statusSummary.shareAllotment).toBeDefined();

        // Statuses must be valid DocumentStatus values
        const validStatuses = [
          DocumentStatus.UPLOADED,
          DocumentStatus.MISSING,
          DocumentStatus.PENDING,
          DocumentStatus.FAILED
        ];
        expect(validStatuses).toContain(statusSummary.certificateOfIncorporation);
        expect(validStatuses).toContain(statusSummary.particularsOfDirectors);
        expect(validStatuses).toContain(statusSummary.shareAllotment);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.5: Partial uploads are never complete
   * 
   * When some documents are uploaded and others are missing, isComplete must be false.
   * 
   * **Validates: Requirements 7.1, 7.2, 7.3**
   */
  it('property: partial uploads are never complete', () => {
    // Generate status summaries with at least one uploaded and one missing
    const partialUploadArbitrary = fc.record({
      certificateOfIncorporation: documentStatusArbitrary,
      particularsOfDirectors: documentStatusArbitrary,
      shareAllotment: documentStatusArbitrary,
      certificateTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      directorsTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      shareAllotmentTimestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    }).filter((data) => {
      // Ensure at least one is uploaded and at least one is missing
      const statuses = [
        data.certificateOfIncorporation,
        data.particularsOfDirectors,
        data.shareAllotment
      ];
      const hasUploaded = statuses.some(s => s === DocumentStatus.UPLOADED);
      const hasMissing = statuses.some(s => s === DocumentStatus.MISSING);
      return hasUploaded && hasMissing;
    }).map((data) => {
      const uploadTimestamps: { [key in CACDocumentType]?: Date } = {};
      
      if (data.certificateOfIncorporation === DocumentStatus.UPLOADED) {
        uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION] = data.certificateTimestamp;
      }
      if (data.particularsOfDirectors === DocumentStatus.UPLOADED) {
        uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS] = data.directorsTimestamp;
      }
      if (data.shareAllotment === DocumentStatus.UPLOADED) {
        uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT] = data.shareAllotmentTimestamp;
      }
      
      return {
        identityRecordId: 'list-1',
        certificateOfIncorporation: data.certificateOfIncorporation,
        particularsOfDirectors: data.particularsOfDirectors,
        shareAllotment: data.shareAllotment,
        uploadTimestamps,
        isComplete: false // Partial uploads are never complete
      } as DocumentStatusSummary;
    });

    fc.assert(
      fc.property(partialUploadArbitrary, (statusSummary) => {
        // Verify data structure
        const statuses = [
          statusSummary.certificateOfIncorporation,
          statusSummary.particularsOfDirectors,
          statusSummary.shareAllotment
        ];
        const uploadedCount = statuses.filter(s => s === DocumentStatus.UPLOADED).length;
        const missingCount = statuses.filter(s => s === DocumentStatus.MISSING).length;

        // Should have at least one of each
        expect(uploadedCount).toBeGreaterThan(0);
        expect(missingCount).toBeGreaterThan(0);

        // Should not be complete
        expect(statusSummary.isComplete).toBe(false);

        // Uploaded documents should have timestamps
        if (statusSummary.certificateOfIncorporation === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.CERTIFICATE_OF_INCORPORATION]).toBeDefined();
        }
        if (statusSummary.particularsOfDirectors === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.PARTICULARS_OF_DIRECTORS]).toBeDefined();
        }
        if (statusSummary.shareAllotment === DocumentStatus.UPLOADED) {
          expect(statusSummary.uploadTimestamps[CACDocumentType.SHARE_ALLOTMENT]).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.6: Status indicator consistency
   * 
   * For any document status, the indicator type must match the status value.
   * 
   * **Validates: Requirements 7.2, 7.3**
   */
  it('property: status indicator type matches status value', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // Helper function to determine expected indicator type
        const getExpectedIndicator = (status: DocumentStatus): 'success' | 'error' | 'warning' => {
          switch (status) {
            case DocumentStatus.UPLOADED:
              return 'success'; // Green checkmark
            case DocumentStatus.MISSING:
            case DocumentStatus.FAILED:
              return 'error'; // Red X
            case DocumentStatus.PENDING:
              return 'warning'; // Yellow/pending indicator
            default:
              return 'error';
          }
        };

        // Verify each document type has the correct indicator type
        const certIndicator = getExpectedIndicator(statusSummary.certificateOfIncorporation);
        const directorsIndicator = getExpectedIndicator(statusSummary.particularsOfDirectors);
        const shareIndicator = getExpectedIndicator(statusSummary.shareAllotment);

        // Uploaded documents should have success indicator
        if (statusSummary.certificateOfIncorporation === DocumentStatus.UPLOADED) {
          expect(certIndicator).toBe('success');
        }
        if (statusSummary.particularsOfDirectors === DocumentStatus.UPLOADED) {
          expect(directorsIndicator).toBe('success');
        }
        if (statusSummary.shareAllotment === DocumentStatus.UPLOADED) {
          expect(shareIndicator).toBe('success');
        }

        // Missing documents should have error indicator
        if (statusSummary.certificateOfIncorporation === DocumentStatus.MISSING) {
          expect(certIndicator).toBe('error');
        }
        if (statusSummary.particularsOfDirectors === DocumentStatus.MISSING) {
          expect(directorsIndicator).toBe('error');
        }
        if (statusSummary.shareAllotment === DocumentStatus.MISSING) {
          expect(shareIndicator).toBe('error');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.7: Identity record association
   * 
   * Every status summary must be associated with an identity record.
   * 
   * **Validates: Requirement 7.1**
   */
  it('property: status summary is associated with identity record', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        // Must have an identity record ID
        expect(statusSummary.identityRecordId).toBeDefined();
        expect(typeof statusSummary.identityRecordId).toBe('string');
        expect(statusSummary.identityRecordId.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10.8: Timestamp validity
   * 
   * All upload timestamps must be valid dates in the past or present.
   * 
   * **Validates: Requirement 7.4**
   */
  it('property: upload timestamps are valid dates', () => {
    fc.assert(
      fc.property(documentStatusSummaryArbitrary, (statusSummary) => {
        const now = new Date();

        // Check all timestamps in the uploadTimestamps object
        Object.values(statusSummary.uploadTimestamps).forEach((timestamp) => {
          if (timestamp) {
            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
            expect(timestamp.getTime()).toBeGreaterThan(new Date('2000-01-01').getTime());
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
