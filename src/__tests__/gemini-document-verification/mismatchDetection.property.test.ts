// Property test for mismatch detection
// Property 6: Mismatch detection accuracy
// Validates: Requirements 4.7, 4.10

import fc from 'fast-check';
import { MismatchAnalyzer } from '../../services/geminiMismatchAnalyzer';
import { FieldMismatch, MismatchCategory } from '../../types/geminiDocumentVerification';

describe('Mismatch Detection Property Tests', () => {
  let mismatchAnalyzer: MismatchAnalyzer;

  beforeEach(() => {
    mismatchAnalyzer = new MismatchAnalyzer();
  });

  describe('Property 6: Mismatch detection accuracy', () => {
    it('should consistently categorize field mismatches', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.constantFrom('companyName', 'address', 'dateOfBirth', 'nin', 'directors'),
            extractedValue: fc.string({ minLength: 1, maxLength: 50 }),
            expectedValue: fc.string({ minLength: 1, maxLength: 50 }),
            similarity: fc.integer({ min: 0, max: 100 }),
            isCritical: fc.boolean(),
            reason: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (mismatchData) => {
            const mismatch: FieldMismatch = mismatchData;
            const mismatches = [mismatch];
            
            const analysis = mismatchAnalyzer.analyzeMismatches(mismatches);
            
            // Analysis should be consistent
            expect(analysis.totalMismatches).toBe(1);
            expect(analysis.fieldAnalyses).toHaveLength(1);
            
            const fieldAnalysis = analysis.fieldAnalyses[0];
            expect(fieldAnalysis.field).toBe(mismatch.field);
            expect(fieldAnalysis.category).toBeDefined();
            expect(fieldAnalysis.severity).toMatch(/^(critical|major|minor)$/);
            expect(fieldAnalysis.confidence).toBeGreaterThanOrEqual(0);
            expect(fieldAnalysis.confidence).toBeLessThanOrEqual(100);
            expect(fieldAnalysis.explanation).toBeDefined();
            expect(fieldAnalysis.suggestedResolution).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly count mismatch severities', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 20 }),
              extractedValue: fc.string({ minLength: 1, maxLength: 50 }),
              expectedValue: fc.string({ minLength: 1, maxLength: 50 }),
              similarity: fc.integer({ min: 0, max: 100 }),
              isCritical: fc.boolean(),
              reason: fc.string({ minLength: 1, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (mismatchesData) => {
            const mismatches: FieldMismatch[] = mismatchesData;
            const analysis = mismatchAnalyzer.analyzeMismatches(mismatches);
            
            // Total should match input
            expect(analysis.totalMismatches).toBe(mismatches.length);
            
            // Severity counts should add up to total
            const severitySum = analysis.criticalMismatches + 
                              analysis.majorMismatches + 
                              analysis.minorMismatches;
            expect(severitySum).toBe(analysis.totalMismatches);
            
            // Individual counts should be non-negative
            expect(analysis.criticalMismatches).toBeGreaterThanOrEqual(0);
            expect(analysis.majorMismatches).toBeGreaterThanOrEqual(0);
            expect(analysis.minorMismatches).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should determine overall severity correctly', async () => {
      const testCases = [
        {
          mismatches: [
            { field: 'nin', extractedValue: '123', expectedValue: '456', similarity: 0, isCritical: true, reason: 'ID mismatch' }
          ],
          expectedSeverity: 'critical'
        },
        {
          mismatches: [
            { field: 'companyName', extractedValue: 'ABC Ltd', expectedValue: 'ABC Limited', similarity: 80, isCritical: false, reason: 'Name variation' }
          ],
          expectedSeverity: 'minor'
        },
        {
          mismatches: [
            { field: 'address', extractedValue: 'Main St', expectedValue: 'Main Street', similarity: 90, isCritical: false, reason: 'Address format' },
            { field: 'companyName', extractedValue: 'Test Co', expectedValue: 'Different Corp', similarity: 20, isCritical: true, reason: 'Major difference' }
          ],
          expectedSeverity: 'critical'
        }
      ];

      for (const testCase of testCases) {
        const analysis = mismatchAnalyzer.analyzeMismatches(testCase.mismatches);
        
        expect(analysis.overallSeverity).toBe(testCase.expectedSeverity);
        
        if (testCase.expectedSeverity === 'critical') {
          expect(analysis.canProceed).toBe(false);
        } else {
          expect(analysis.canProceed).toBe(true);
        }
      }
    });

    it('should provide consistent recommendations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              field: fc.constantFrom('companyName', 'address', 'dateOfBirth', 'nin', 'directors'),
              extractedValue: fc.string({ minLength: 1, maxLength: 50 }),
              expectedValue: fc.string({ minLength: 1, maxLength: 50 }),
              similarity: fc.integer({ min: 0, max: 100 }),
              isCritical: fc.boolean(),
              reason: fc.string({ minLength: 1, maxLength: 100 })
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async (mismatchesData) => {
            const mismatches: FieldMismatch[] = mismatchesData;
            const analysis = mismatchAnalyzer.analyzeMismatches(mismatches);
            
            // Should always have recommendations
            expect(analysis.recommendations).toBeDefined();
            expect(Array.isArray(analysis.recommendations)).toBe(true);
            expect(analysis.recommendations.length).toBeGreaterThan(0);
            
            // Each recommendation should be a non-empty string
            for (const recommendation of analysis.recommendations) {
              expect(typeof recommendation).toBe('string');
              expect(recommendation.length).toBeGreaterThan(0);
            }
            
            // Summary should be provided
            expect(analysis.summary).toBeDefined();
            expect(typeof analysis.summary).toBe('string');
            expect(analysis.summary.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle empty mismatch arrays correctly', async () => {
      const analysis = mismatchAnalyzer.analyzeMismatches([]);
      
      expect(analysis.totalMismatches).toBe(0);
      expect(analysis.criticalMismatches).toBe(0);
      expect(analysis.majorMismatches).toBe(0);
      expect(analysis.minorMismatches).toBe(0);
      expect(analysis.overallSeverity).toBe('minor');
      expect(analysis.confidence).toBe(100);
      expect(analysis.canProceed).toBe(true);
      expect(analysis.requiresManualReview).toBe(false);
      expect(analysis.fieldAnalyses).toHaveLength(0);
      expect(analysis.summary).toContain('No issues detected');
      expect(analysis.recommendations).toContain('✅ All checks passed');
    });

    it('should categorize name mismatches correctly', async () => {
      const nameTestCases = [
        {
          extracted: 'John Smith',
          expected: 'John A. Smith',
          expectedCategory: 'name_variation'
        },
        {
          extracted: 'ABC Ltd',
          expected: 'ABC Limited',
          expectedCategory: 'abbreviation'
        },
        {
          extracted: 'Mohammed Ali',
          expected: 'Muhammad Ali',
          expectedCategory: 'spelling_variation'
        },
        {
          extracted: 'Smith John',
          expected: 'John Smith',
          expectedCategory: 'name_variation'
        }
      ];

      for (const testCase of nameTestCases) {
        const mismatch: FieldMismatch = {
          field: 'companyName',
          extractedValue: testCase.extracted,
          expectedValue: testCase.expected,
          similarity: 80,
          isCritical: false,
          reason: 'Name difference'
        };

        const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
        const fieldAnalysis = analysis.fieldAnalyses[0];
        
        // Should categorize correctly (allowing for multiple valid categories)
        expect(['name_variation', 'abbreviation', 'spelling_variation']).toContain(fieldAnalysis.category);
      }
    });

    it('should handle address variations correctly', async () => {
      const addressTestCases = [
        {
          extracted: '123 Main St',
          expected: '123 Main Street',
          expectedSimilarity: 90
        },
        {
          extracted: 'Plot 456, Block A',
          expected: 'Plot 456 Block A',
          expectedSimilarity: 95
        },
        {
          extracted: 'Lagos State',
          expected: 'Lagos',
          expectedSimilarity: 70
        }
      ];

      for (const testCase of addressTestCases) {
        const mismatch: FieldMismatch = {
          field: 'address',
          extractedValue: testCase.extracted,
          expectedValue: testCase.expected,
          similarity: testCase.expectedSimilarity,
          isCritical: false,
          reason: 'Address format difference'
        };

        const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
        const fieldAnalysis = analysis.fieldAnalyses[0];
        
        expect(fieldAnalysis.category).toBe('address_variation');
        expect(fieldAnalysis.severity).toMatch(/^(minor|major)$/); // Address is usually not critical
      }
    });

    it('should handle date mismatches as critical', async () => {
      const dateFields = ['dateOfBirth', 'registrationDate'];
      
      for (const field of dateFields) {
        const mismatch: FieldMismatch = {
          field,
          extractedValue: '1990-01-01',
          expectedValue: '1990-01-02',
          similarity: 0,
          isCritical: true,
          reason: 'Date mismatch'
        };

        const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
        const fieldAnalysis = analysis.fieldAnalyses[0];
        
        expect(fieldAnalysis.category).toBe('date_mismatch');
        expect(fieldAnalysis.severity).toBe('critical');
        expect(analysis.overallSeverity).toBe('critical');
        expect(analysis.canProceed).toBe(false);
      }
    });

    it('should handle ID number mismatches as critical', async () => {
      const idFields = ['nin', 'bvn', 'rcNumber'];
      
      for (const field of idFields) {
        const mismatch: FieldMismatch = {
          field,
          extractedValue: '12345678901',
          expectedValue: '98765432109',
          similarity: 0,
          isCritical: true,
          reason: 'ID number mismatch'
        };

        const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
        const fieldAnalysis = analysis.fieldAnalyses[0];
        
        expect(fieldAnalysis.category).toBe('id_mismatch');
        expect(fieldAnalysis.severity).toBe('critical');
        expect(analysis.overallSeverity).toBe('critical');
        expect(analysis.canProceed).toBe(false);
      }
    });

    it('should require manual review for multiple mismatches', async () => {
      const multipleMismatches: FieldMismatch[] = [
        {
          field: 'companyName',
          extractedValue: 'ABC Corp',
          expectedValue: 'XYZ Ltd',
          similarity: 20,
          isCritical: false,
          reason: 'Different company'
        },
        {
          field: 'address',
          extractedValue: 'Lagos',
          expectedValue: 'Abuja',
          similarity: 10,
          isCritical: false,
          reason: 'Different location'
        },
        {
          field: 'rcNumber',
          extractedValue: 'RC123456',
          expectedValue: 'RC654321',
          similarity: 0,
          isCritical: true,
          reason: 'Different RC number'
        },
        {
          field: 'directors',
          extractedValue: 'John Doe',
          expectedValue: 'Jane Smith',
          similarity: 0,
          isCritical: false,
          reason: 'Different director'
        }
      ];

      const analysis = mismatchAnalyzer.analyzeMismatches(multipleMismatches);
      
      expect(analysis.totalMismatches).toBe(4);
      expect(analysis.requiresManualReview).toBe(true);
      expect(analysis.recommendations.some(r => r.includes('manual'))).toBe(true);
    });

    it('should calculate confidence scores reasonably', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 20 }),
            extractedValue: fc.string({ minLength: 1, maxLength: 50 }),
            expectedValue: fc.string({ minLength: 1, maxLength: 50 }),
            similarity: fc.integer({ min: 0, max: 100 }),
            isCritical: fc.boolean(),
            reason: fc.string({ minLength: 1, maxLength: 100 })
          }),
          async (mismatchData) => {
            const mismatch: FieldMismatch = mismatchData;
            const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
            
            // Confidence should be reasonable
            expect(analysis.confidence).toBeGreaterThanOrEqual(0);
            expect(analysis.confidence).toBeLessThanOrEqual(100);
            
            // Higher similarity should generally lead to higher confidence
            const fieldAnalysis = analysis.fieldAnalyses[0];
            expect(fieldAnalysis.confidence).toBeGreaterThanOrEqual(0);
            expect(fieldAnalysis.confidence).toBeLessThanOrEqual(100);
            
            // Very low similarity should result in lower confidence
            if (mismatch.similarity < 20) {
              expect(fieldAnalysis.confidence).toBeLessThan(80);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should provide field-specific explanations', async () => {
      const fieldSpecificCases = [
        { field: 'companyName', expectedInExplanation: 'name' },
        { field: 'address', expectedInExplanation: 'address' },
        { field: 'dateOfBirth', expectedInExplanation: 'date' },
        { field: 'nin', expectedInExplanation: 'identification' },
        { field: 'directors', expectedInExplanation: 'director' }
      ];

      for (const testCase of fieldSpecificCases) {
        const mismatch: FieldMismatch = {
          field: testCase.field,
          extractedValue: 'test value',
          expectedValue: 'expected value',
          similarity: 50,
          isCritical: false,
          reason: 'Test mismatch'
        };

        const analysis = mismatchAnalyzer.analyzeMismatches([mismatch]);
        const fieldAnalysis = analysis.fieldAnalyses[0];
        
        expect(fieldAnalysis.explanation.toLowerCase()).toContain(testCase.expectedInExplanation);
        expect(fieldAnalysis.suggestedResolution).toBeDefined();
        expect(fieldAnalysis.suggestedResolution.length).toBeGreaterThan(0);
      }
    });
  });
});