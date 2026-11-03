import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const firestoreRules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const storageRules = readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8');

describe('deployed Firebase security rules', () => {
  it('does not let ordinary users list every KYC or CDD submission', () => {
    expect(firestoreRules).not.toContain(
      'allow read: if isAdminOrCompliance() || isClaims() || isDefault();',
    );
    expect(firestoreRules).toContain(
      'isClaimsOrAdminOrCompliance() || (isAuthenticatedUser() && isOwner())',
    );
  });

  it('leaves submission writes to the backend and status changes to staff', () => {
    const submissionRules = firestoreRules.slice(
      firestoreRules.indexOf('// ========== KYC & CDD Collections =========='),
      firestoreRules.indexOf('match /identity-lists/'),
    );
    const blocks = submissionRules.split(/\n\s*match \//).slice(1);
    expect(blocks.length).toBeGreaterThan(40);
    for (const block of blocks) {
      const name = block.slice(0, block.indexOf('/'));
      // A customer could otherwise forge a claim for someone else, or set their own status/offer.
      expect(block, name).toMatch(/allow create: if false;/);
      expect(block.match(/allow update:[^;]*;/)?.[0] ?? '', name).not.toContain('isOwner');
    }
  });

  it('prevents users from promoting their own userroles document or widening claim scope', () => {
    expect(firestoreRules).toContain(
      "affectedKeys().hasAny(['role', 'email', 'uid', 'createdBy', 'createdAt', 'claimAccessAll', 'assignedClaimCollections', 'disabled', 'mustChangePassword'])",
    );
  });

  it('keeps CAC document bytes off-limits to plain customers', () => {
    const cacBlock = storageRules.slice(storageRules.indexOf('match /cac-documents/'));
    expect(cacBlock).toMatch(/allow read: if isBroker\(\) \|\| isAdminOrCompliance\(\);/);
    expect(cacBlock).not.toMatch(/allow (read|delete): if request\.auth != null;/);
  });

  it('requires authentication for direct customer-document uploads', () => {
    expect(storageRules).toMatch(
      /function isValidFileType\(\)\s*\{\s*return request\.auth != null/,
    );
  });

  it('only leaves the explicit public assets folder anonymously readable', () => {
    const anonymousReads = storageRules.match(/allow read: if true;/g) ?? [];
    expect(anonymousReads).toHaveLength(1);
    expect(storageRules).toMatch(
      /match \/public\/\{fileName\}[\s\S]*?allow read: if true;/,
    );
  });
});
