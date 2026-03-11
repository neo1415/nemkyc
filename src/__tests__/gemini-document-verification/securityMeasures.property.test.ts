// Property test for document security measures
// Property 4: Document security and cleanup
// Validates: Requirements 9.1, 9.2

import fc from 'fast-check';
import { GeminiDocumentSecurity } from '../../services/geminiDocumentSecurity';
import { ProcessedDocument } from '../../types/geminiDocumentVerification';

describe('Document Security Measures Property Tests', () => {
  let documentSecurity: GeminiDocumentSecurity;

  beforeEach(() => {
    documentSecurity = new GeminiDocumentSecurity();
  });

  describe('Property 4: Document security and cleanup', () => {
    it('should maintain encryption/decryption round-trip consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          async (contentArray, fileName, mimeType) => {
            // Create test document
            const processedContent = Buffer.from(contentArray);
            const document: ProcessedDocument = {
              id: `test_${Date.now()}`,
              originalFile: new File([processedContent], fileName, { type: mimeType }),
              processedContent,
              metadata: {
                fileName,
                fileSize: processedContent.length,
                mimeType,
                processingDuration: 0
              },
              processingTimestamp: new Date()
            };

            // Encrypt document
            const encrypted = await documentSecurity.encryptDocument(document);
            
            // Verify encryption properties
            expect(encrypted.encryptedContent).toBeDefined();
            expect(encrypted.iv).toBeDefined();
            expect(encrypted.authTag).toBeDefined();
            expect(encrypted.metadata.algorithm).toBe('aes-256-gcm');
            
            // Decrypt document
            const decrypted = await documentSecurity.decryptDocument(encrypted);
            
            // Verify round-trip consistency
            expect(decrypted.equals(processedContent)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should generate consistent document hashes for identical content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (contentArray) => {
            const content = Buffer.from(contentArray);
            
            // Generate hash multiple times
            const hash1 = documentSecurity.generateDocumentHash(content);
            const hash2 = documentSecurity.generateDocumentHash(content);
            const hash3 = documentSecurity.generateDocumentHash(content);
            
            // Hashes should be identical for same content
            expect(hash1).toBe(hash2);
            expect(hash2).toBe(hash3);
            
            // Hash should be 64 characters (SHA-256 hex)
            expect(hash1).toMatch(/^[a-f0-9]{64}$/);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate different hashes for different content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (contentArray1, contentArray2) => {
            fc.pre(!Buffer.from(contentArray1).equals(Buffer.from(contentArray2)));
            
            const content1 = Buffer.from(contentArray1);
            const content2 = Buffer.from(contentArray2);
            
            const hash1 = documentSecurity.generateDocumentHash(content1);
            const hash2 = documentSecurity.generateDocumentHash(content2);
            
            // Different content should produce different hashes
            expect(hash1).not.toBe(hash2);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should correctly verify document integrity', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (contentArray) => {
            const content = Buffer.from(contentArray);
            const hash = documentSecurity.generateDocumentHash(content);
            
            // Valid hash should verify correctly
            expect(documentSecurity.verifyDocumentIntegrity(content, hash)).toBe(true);
            
            // Invalid hash should fail verification
            const invalidHash = hash.slice(0, -1) + (hash.slice(-1) === 'a' ? 'b' : 'a');
            expect(documentSecurity.verifyDocumentIntegrity(content, invalidHash)).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should properly sanitize metadata for logging', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10000000 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          async (fileName, fileSize, mimeType) => {
            const document: ProcessedDocument = {
              id: `test_${Date.now()}`,
              originalFile: new File([new Uint8Array(100)], fileName, { type: mimeType }),
              processedContent: Buffer.from(new Uint8Array(100)),
              metadata: {
                fileName,
                fileSize,
                mimeType,
                processingDuration: 0
              },
              processingTimestamp: new Date()
            };

            const sanitized = documentSecurity.sanitizeMetadataForLogging(document);
            
            // Should include safe metadata
            expect(sanitized.id).toBe(document.id);
            expect(sanitized.fileSize).toBe(fileSize);
            expect(sanitized.mimeType).toBe(mimeType);
            expect(sanitized.processingTimestamp).toBeDefined();
            
            // Should mask filename
            expect(sanitized.fileName).toBeDefined();
            expect(sanitized.fileName).not.toBe(fileName); // Should be masked
            
            // Should not include sensitive content
            expect(sanitized.processedContent).toBeUndefined();
            expect(sanitized.originalFile).toBeUndefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should detect PII patterns consistently', async () => {
      const testCases = [
        { content: 'Contact john.doe@example.com for details', expectedTypes: ['email'] },
        { content: 'Call 555-123-4567 or email test@domain.org', expectedTypes: ['phone', 'email'] },
        { content: 'SSN: 123-45-6789', expectedTypes: ['ssn'] },
        { content: 'Card: 4532 1234 5678 9012', expectedTypes: ['creditCard'] },
        { content: 'Account: 1234567890', expectedTypes: ['bankAccount'] },
        { content: 'No sensitive data here', expectedTypes: [] }
      ];

      for (const testCase of testCases) {
        const content = Buffer.from(testCase.content, 'utf8');
        const result = await documentSecurity.detectPII(content);
        
        expect(result.hasPII).toBe(testCase.expectedTypes.length > 0);
        
        for (const expectedType of testCase.expectedTypes) {
          expect(result.detectedTypes).toContain(expectedType);
        }
        
        // Risk level should be appropriate
        if (testCase.expectedTypes.length === 0) {
          expect(result.riskLevel).toBe('low');
        } else if (testCase.expectedTypes.length > 2) {
          expect(result.riskLevel).toBe('high');
        } else {
          expect(result.riskLevel).toBe('medium');
        }
      }
    });

    it('should handle access control decisions consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom('user', 'broker', 'admin', 'super_admin'),
          fc.constantFrom('read', 'write', 'delete'),
          async (documentId, role, operation) => {
            const context = {
              userId: 'test-user',
              role: role as any,
              permissions: [],
              sessionId: 'test-session'
            };

            const hasAccess = await documentSecurity.checkDocumentAccess(
              documentId,
              context,
              operation
            );

            // Super admins should always have access
            if (role === 'super_admin') {
              expect(hasAccess).toBe(true);
            }
            
            // Admins should have read access
            if (role === 'admin' && operation === 'read') {
              expect(hasAccess).toBe(true);
            }
            
            // Access decision should be boolean
            expect(typeof hasAccess).toBe('boolean');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should perform secure cleanup without throwing errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (contentArray, fileName) => {
            const processedContent = Buffer.from(contentArray);
            const document: ProcessedDocument = {
              id: `test_${Date.now()}`,
              originalFile: new File([processedContent], fileName),
              processedContent,
              metadata: {
                fileName,
                fileSize: processedContent.length,
                mimeType: 'application/octet-stream',
                processingDuration: 0
              },
              processingTimestamp: new Date()
            };

            // Secure cleanup should not throw
            await expect(documentSecurity.secureCleanup(document)).resolves.not.toThrow();
            
            // Buffer should be zeroed out after cleanup
            const isZeroed = document.processedContent.every(byte => byte === 0);
            expect(isZeroed).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain encryption metadata consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 500 }),
          async (contentArray) => {
            const processedContent = Buffer.from(contentArray);
            const document: ProcessedDocument = {
              id: `test_${Date.now()}`,
              originalFile: new File([processedContent], 'test.txt'),
              processedContent,
              metadata: {
                fileName: 'test.txt',
                fileSize: processedContent.length,
                mimeType: 'text/plain',
                processingDuration: 0
              },
              processingTimestamp: new Date()
            };

            const encrypted = await documentSecurity.encryptDocument(document);
            
            // Metadata should be consistent
            expect(encrypted.metadata.algorithm).toBe('aes-256-gcm');
            expect(encrypted.metadata.keyDerivation).toBe('pbkdf2');
            expect(encrypted.metadata.timestamp).toBeInstanceOf(Date);
            
            // IV should be correct length (16 bytes for AES-GCM)
            expect(encrypted.iv.length).toBe(16);
            
            // Auth tag should be present (16 bytes for GCM)
            expect(encrypted.authTag.length).toBe(16);
            
            // Encrypted content should be different from original
            expect(encrypted.encryptedContent.equals(processedContent)).toBe(false);
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});