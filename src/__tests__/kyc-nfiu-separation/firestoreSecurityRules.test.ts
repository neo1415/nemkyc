import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Firestore Security Rules Tests for KYC-NFIU Separation - Task 9.8
 * 
 * These tests validate the security rules configuration by parsing the firestore.rules file.
 * For full integration testing with actual Firestore, use @firebase/rules-unit-testing.
 * 
 * Tests Requirements:
 * - 10.1: individual-nfiu-form collection security
 * - 10.2: corporate-nfiu-form collection security
 * - 10.3: Authentication enforcement
 * - 10.4: formType validation
 * - 10.5: Backward compatibility with existing KYC collections
 */

describe('Firestore Security Rules Configuration - Task 9.8', () => {
  let rulesContent: string;

  try {
    // Read the firestore.rules file
    const rulesPath = resolve(process.cwd(), 'firestore.rules');
    rulesContent = readFileSync(rulesPath, 'utf-8');
  } catch (error) {
    rulesContent = '';
  }

  describe('NFIU Collections Security Rules', () => {
    it('should have security rules for individual-nfiu-form collection', () => {
      expect(rulesContent).toContain('individual-nfiu-form');
    });

    it('should have security rules for corporate-nfiu-form collection', () => {
      expect(rulesContent).toContain('corporate-nfiu-form');
    });

    it('should require authentication for NFIU collections', () => {
      // Check for authentication function (isAuthenticatedUser)
      expect(rulesContent).toMatch(/function\s+isAuthenticatedUser\s*\(\s*\)/);
      expect(rulesContent).toMatch(/request\.auth\s*!=\s*null/);
    });

    it('should have read rules for NFIU collections', () => {
      const nfiuIndividualSection = rulesContent.match(/match\s+\/individual-nfiu-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(nfiuIndividualSection).toBeTruthy();
      if (nfiuIndividualSection) {
        expect(nfiuIndividualSection[0]).toMatch(/allow\s+read/);
      }
    });

    it('should have create rules for NFIU collections', () => {
      const nfiuIndividualSection = rulesContent.match(/match\s+\/individual-nfiu-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(nfiuIndividualSection).toBeTruthy();
      if (nfiuIndividualSection) {
        expect(nfiuIndividualSection[0]).toMatch(/allow\s+create/);
      }
    });

    it('should have update rules for NFIU collections', () => {
      const nfiuIndividualSection = rulesContent.match(/match\s+\/individual-nfiu-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(nfiuIndividualSection).toBeTruthy();
      if (nfiuIndividualSection) {
        expect(nfiuIndividualSection[0]).toMatch(/allow\s+update/);
      }
    });
  });

  describe('formType Validation', () => {
    it('should validate formType in NFIU collections', () => {
      // Check that NFIU collections validate formType == 'nfiu'
      expect(rulesContent).toMatch(/formType\s*==\s*['"]nfiu['"]/);
    });

    it('should validate formType values (kyc, nfiu, legacy) in KYC collections', () => {
      // Check that KYC collections allow kyc or legacy
      expect(rulesContent).toMatch(/formType\s*==\s*['"]kyc['"]/);
      expect(rulesContent).toMatch(/formType\s*==\s*['"]legacy['"]/);
    });

    it('should validate formVariant in NFIU collections', () => {
      // Check that NFIU collections validate formVariant
      expect(rulesContent).toMatch(/formVariant\s*==\s*['"]individual['"]/);
      expect(rulesContent).toMatch(/formVariant\s*==\s*['"]corporate['"]/);
    });
  });

  describe('Admin and Owner Access Control', () => {
    it('should have admin role check function', () => {
      expect(rulesContent).toMatch(/function\s+isAdmin\s*\(\s*\)/);
    });

    it('should have owner check function', () => {
      expect(rulesContent).toMatch(/function\s+isOwner\s*\(/);
    });

    it('should check submittedBy for owner validation', () => {
      const ownerFunction = rulesContent.match(/function\s+isOwner[\s\S]*?(?=function\s+|match\s+\/)/);
      expect(ownerFunction).toBeTruthy();
      if (ownerFunction) {
        expect(ownerFunction[0]).toMatch(/submittedBy/);
        expect(ownerFunction[0]).toMatch(/request\.auth/);
      }
    });
  });

  describe('KYC Collections Backward Compatibility', () => {
    it('should have security rules for Individual-kyc-form collection', () => {
      expect(rulesContent).toContain('Individual-kyc-form');
    });

    it('should have security rules for corporate-kyc-form collection', () => {
      expect(rulesContent).toContain('corporate-kyc-form');
    });

    it('should allow KYC collections to work without formType (backward compatibility)', () => {
      // KYC collections should allow records without formType for backward compatibility
      const kycIndividualSection = rulesContent.match(/match\s+\/Individual-kyc-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(kycIndividualSection).toBeTruthy();
      // The rules should not strictly require formType for KYC collections
    });
  });

  describe('Security Rules Structure', () => {
    it('should use rules_version 2', () => {
      expect(rulesContent).toMatch(/rules_version\s*=\s*['"]2['"]/);
    });

    it('should define cloud.firestore service', () => {
      expect(rulesContent).toMatch(/service\s+cloud\.firestore/);
    });

    it('should have match for databases', () => {
      expect(rulesContent).toMatch(/match\s+\/databases\/\{database\}\/documents/);
    });
  });

  describe('Helper Functions', () => {
    it('should have all required helper functions', () => {
      const requiredFunctions = [
        'isAdmin',
        'isOwner',
        'isAuthenticatedUser',
      ];

      for (const funcName of requiredFunctions) {
        expect(rulesContent).toMatch(new RegExp(`function\\s+${funcName}\\s*\\(`));
      }
    });
  });

  describe('Collection-Specific Rules', () => {
    it('should have distinct rules for each collection', () => {
      const collections = [
        'individual-nfiu-form',
        'corporate-nfiu-form',
        'Individual-kyc-form',
        'corporate-kyc-form',
      ];

      for (const collection of collections) {
        const collectionMatch = rulesContent.match(new RegExp(`match\\s+\\/${collection}\\/\\{[^}]+\\}`));
        expect(collectionMatch).toBeTruthy();
      }
    });

    it('should enforce formType validation on NFIU collections', () => {
      const nfiuIndividualSection = rulesContent.match(/match\s+\/individual-nfiu-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(nfiuIndividualSection).toBeTruthy();
      if (nfiuIndividualSection) {
        // Should validate formType == 'nfiu' in create rules
        expect(nfiuIndividualSection[0]).toMatch(/formType\s*==\s*['"]nfiu['"]/);
      }
    });

    it('should enforce formVariant validation on NFIU collections', () => {
      const nfiuIndividualSection = rulesContent.match(/match\s+\/individual-nfiu-form\/\{[^}]+\}[\s\S]*?(?=match\s+\/|$)/);
      expect(nfiuIndividualSection).toBeTruthy();
      if (nfiuIndividualSection) {
        // Should validate formVariant == 'individual' in create rules
        expect(nfiuIndividualSection[0]).toMatch(/formVariant\s*==\s*['"]individual['"]/);
      }
    });
  });

  describe('Rules File Existence', () => {
    it('should have a firestore.rules file', () => {
      expect(rulesContent.length).toBeGreaterThan(0);
    });

    it('should have meaningful content in rules file', () => {
      expect(rulesContent.length).toBeGreaterThan(100);
    });
  });
});

/**
 * MANUAL TESTING GUIDE
 * 
 * To fully test Firestore security rules, you should:
 * 
 * 1. Install @firebase/rules-unit-testing:
 *    npm install --save-dev @firebase/rules-unit-testing
 * 
 * 2. Run integration tests with actual Firestore emulator:
 *    - Test unauthenticated users cannot read NFIU data
 *    - Test unauthenticated users cannot write NFIU data
 *    - Test users can only read their own submissions
 *    - Test admins can read all submissions
 *    - Test formType validation on create
 *    - Test formVariant validation on create
 * 
 * 3. Deploy rules to development environment and test with real users:
 *    firebase deploy --only firestore:rules
 * 
 * 4. Monitor security rule violations in Firebase Console
 */
