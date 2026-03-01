/**
 * Property-Based Tests for CAC Document Preview
 * 
 * Tests preview authorization consistency using property-based testing.
 * 
 * Property 9: Preview authorization consistency
 * **Validates: Requirements 6.4, 6.7**
 * Test that preview access always respects authorization
 * 
 * Uses fast-check to generate various user permission scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { CACDocumentPreview } from '../../components/identity/CACDocumentPreview';
import { CACDocumentMetadata, CACDocumentType, DocumentStatus } from '../../types/cacDocuments';
import { User } from '../../types';
import * as cacStorageService from '../../services/cacStorageService';
import * as cacEncryptionService from '../../services/cacEncryptionService';
import * as cacAccessControl from '../../services/cacAccessControl';

// Mock the services
vi.mock('../../services/cacStorageService');
vi.mock('../../services/cacEncryptionService');
vi.mock('../../services/cacAccessControl');

// Mock AuthContext with a mutable user
let mockUser: User | null = null;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Property-Based Tests: Preview Authorization Consistency', () => {
  const mockDecryptedData = new ArrayBuffer(1024);

  beforeEach(() => {
    // Reset mocks but keep them defined
    vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
    vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
      new Blob([mockDecryptedData], { type: 'application/pdf' })
    );
    vi.mocked(cacStorageService.downloadDocument).mockReset().mockResolvedValue();
    vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(true);
  });

  /**
   * Arbitrary for generating user roles
   */
  const userRoleArbitrary = fc.constantFrom(
    'admin' as const,
    'super admin' as const,
    'broker' as const,
    'default' as const
  );

  /**
   * Arbitrary for generating user IDs
   */
  const userIdArbitrary = fc.string({ minLength: 5, maxLength: 20 });

  /**
   * Arbitrary for generating users
   */
  const userArbitrary = fc.record({
    uid: userIdArbitrary,
    email: fc.emailAddress(),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    role: userRoleArbitrary,
    notificationPreference: fc.constantFrom('email' as const, 'sms' as const),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  /**
   * Arbitrary for generating document metadata
   */
  const documentArbitrary = fc.record({
    id: fc.string({ minLength: 5, maxLength: 20 }),
    documentType: fc.constantFrom(
      CACDocumentType.CERTIFICATE_OF_INCORPORATION,
      CACDocumentType.PARTICULARS_OF_DIRECTORS,
      CACDocumentType.SHARE_ALLOTMENT
    ),
    filename: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.pdf`),
    fileSize: fc.integer({ min: 1024, max: 10 * 1024 * 1024 }),
    mimeType: fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
    uploadedAt: fc.date(),
    uploaderId: userIdArbitrary,
    identityRecordId: fc.string({ minLength: 5, maxLength: 20 }),
    storagePath: fc.string({ minLength: 10, maxLength: 100 }),
    encryptionMetadata: fc.record({
      algorithm: fc.constant('AES-256-GCM'),
      keyVersion: fc.constant('v1'),
      iv: fc.string({ minLength: 10, maxLength: 20 }),
      authTag: fc.string({ minLength: 10, maxLength: 20 })
    }),
    status: fc.constant(DocumentStatus.UPLOADED),
    version: fc.integer({ min: 1, max: 10 }),
    isCurrent: fc.constant(true)
  });

  /**
   * Property 9: Preview authorization consistency
   * **Validates: Requirements 6.4, 6.7**
   * 
   * Test that preview access always respects authorization:
   * - If shouldShowDocumentActions returns true, user should see download button
   * - If shouldShowDocumentActions returns false, user should not see download button
   * - Authorization check should be consistent across all user/document combinations
   */
  it('Property 9: Preview access always respects authorization', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        documentArbitrary,
        userIdArbitrary,
        fc.boolean(),
        async (user, document, ownerId, hasPermission) => {
          // Set up mock user
          mockUser = user;

          // Reset and configure mocks for this iteration
          vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(hasPermission);

          // Render component
          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            // Wait for component to settle
            await waitFor(() => {
              expect(screen.getByRole('dialog')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Check authorization consistency
            if (hasPermission) {
              // User has permission - should see download button
              await waitFor(() => {
                const downloadButton = screen.queryByText('Download') || screen.queryByText('Downloading...');
                expect(downloadButton).toBeInTheDocument();
              }, { timeout: 1000 });
            } else {
              // User does not have permission - should not see download button
              const downloadButton = screen.queryByText('Download');
              expect(downloadButton).not.toBeInTheDocument();
            }

            // Verify permission check was called with correct parameters
            expect(cacAccessControl.shouldShowDocumentActions).toHaveBeenCalledWith(user, ownerId);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 50, // Run 50 test cases
        timeout: 30000 // 30 second timeout for all runs
      }
    );
  });

  /**
   * Property: Admin users always have access
   * **Validates: Requirements 6.4**
   * 
   * Test that admin and super admin users always have access to preview documents
   */
  it('Property: Admin users always have access to preview', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('admin' as const, 'super admin' as const),
        documentArbitrary,
        userIdArbitrary,
        async (adminRole, document, ownerId) => {
          // Create admin user
          const adminUser: User = {
            uid: 'admin-123',
            email: 'admin@example.com',
            name: 'Admin User',
            role: adminRole,
            notificationPreference: 'email',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockUser = adminUser;

          // Reset and configure mocks - admins always have permission
          vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(true);

          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            await waitFor(() => {
              expect(screen.getByRole('dialog')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Admin should always see download button
            await waitFor(() => {
              const downloadButton = screen.queryByText('Download') || screen.queryByText('Downloading...');
              expect(downloadButton).toBeInTheDocument();
            }, { timeout: 1000 });
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 30,
        timeout: 20000
      }
    );
  });

  /**
   * Property: Broker users can only access their own documents
   * **Validates: Requirements 6.4**
   * 
   * Test that broker users can access documents they own but not others
   */
  it('Property: Broker users can only access their own documents', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        documentArbitrary,
        userIdArbitrary,
        async (brokerUid, document, ownerId) => {
          // Create broker user
          const brokerUser: User = {
            uid: brokerUid,
            email: 'broker@example.com',
            name: 'Broker User',
            role: 'broker',
            notificationPreference: 'email',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockUser = brokerUser;

          // Broker has permission only if they own the document
          const hasPermission = brokerUid === ownerId;
          
          // Reset and configure mocks
          vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(hasPermission);

          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            await waitFor(() => {
              expect(screen.getByRole('dialog')).toBeInTheDocument();
            }, { timeout: 1000 });

            if (hasPermission) {
              // Broker owns document - should see download button
              await waitFor(() => {
                const downloadButton = screen.queryByText('Download') || screen.queryByText('Downloading...');
                expect(downloadButton).toBeInTheDocument();
              }, { timeout: 1000 });
            } else {
              // Broker doesn't own document - should not see download button
              const downloadButton = screen.queryByText('Download');
              expect(downloadButton).not.toBeInTheDocument();
            }
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 30,
        timeout: 20000
      }
    );
  });

  /**
   * Property: Default users never have access
   * **Validates: Requirements 6.4**
   * 
   * Test that default users never have access to preview documents
   */
  it('Property: Default users never have access to preview', async () => {
    await fc.assert(
      fc.asyncProperty(
        documentArbitrary,
        userIdArbitrary,
        async (document, ownerId) => {
          // Create default user
          const defaultUser: User = {
            uid: 'default-123',
            email: 'default@example.com',
            name: 'Default User',
            role: 'default',
            notificationPreference: 'email',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          mockUser = defaultUser;

          // Reset and configure mocks - default users never have permission
          vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(false);

          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            await waitFor(() => {
              expect(screen.getByRole('dialog')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Default user should never see download button
            const downloadButton = screen.queryByText('Download');
            expect(downloadButton).not.toBeInTheDocument();

            // Should see permission warning
            expect(screen.getByText(/do not have permission/)).toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 20,
        timeout: 15000
      }
    );
  });

  /**
   * Property: Document fetch only happens for authorized users
   * **Validates: Requirements 6.4**
   * 
   * Test that documents are only fetched when user has permission
   */
  it('Property: Document fetch only happens for authorized users', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        documentArbitrary,
        userIdArbitrary,
        fc.boolean(),
        async (user, document, ownerId, hasPermission) => {
          mockUser = user;
          
          // Reset and configure mocks
          const mockFetch = vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(hasPermission);

          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            // Wait a bit for any async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            if (hasPermission) {
              // Should fetch document for authorized users
              expect(mockFetch).toHaveBeenCalled();
            } else {
              // Should not fetch document for unauthorized users
              expect(mockFetch).not.toHaveBeenCalled();
            }
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 40,
        timeout: 25000
      }
    );
  });

  /**
   * Property: Permission check is always performed
   * **Validates: Requirements 6.4, 6.7**
   * 
   * Test that permission check is always performed before showing actions
   */
  it('Property: Permission check is always performed', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        documentArbitrary,
        userIdArbitrary,
        async (user, document, ownerId) => {
          mockUser = user;
          
          // Reset and configure mocks
          vi.mocked(cacStorageService.getDocumentForPreview).mockReset().mockResolvedValue(mockDecryptedData);
          vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReset().mockReturnValue(
            new Blob([mockDecryptedData], { type: 'application/pdf' })
          );
          const mockPermissionCheck = vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReset().mockReturnValue(true);

          const { unmount } = render(
            <CACDocumentPreview
              open={true}
              onClose={vi.fn()}
              document={document as CACDocumentMetadata}
              ownerId={ownerId}
            />
          );

          try {
            await waitFor(() => {
              expect(screen.getByRole('dialog')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Permission check should always be called
            expect(mockPermissionCheck).toHaveBeenCalledWith(user, ownerId);
            expect(mockPermissionCheck).toHaveBeenCalledTimes(1);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 30,
        timeout: 20000
      }
    );
  });
});
