// Document Security Service - handles encryption, access control, and secure cleanup

import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ProcessedDocument } from '../types/geminiDocumentVerification';
import { GeminiErrorHandler, ErrorCode } from '../utils/geminiErrorHandling';

interface EncryptedDocument {
  encryptedContent: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  metadata: {
    algorithm: string;
    keyDerivation: string;
    timestamp: Date;
  };
}

interface AccessControlContext {
  userId: string;
  role: 'user' | 'broker' | 'admin' | 'super_admin';
  permissions: string[];
  sessionId: string;
  organizationId?: string;
  clientIds?: string[]; // For brokers - list of client IDs they can access
}

interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface RoleDefinition {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

export class GeminiDocumentSecurity {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationAlgorithm = 'pbkdf2';
  private readonly iterations = 100000;
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  
  // In production, this should come from secure environment variables
  private readonly masterKey = import.meta.env.VITE_DOCUMENT_ENCRYPTION_KEY || 'default-master-key-change-in-production';

  // Role-based access control definitions
  private readonly roleDefinitions: Record<string, RoleDefinition> = {
    user: {
      name: 'user',
      permissions: [
        { resource: 'document', action: 'read', conditions: { owner: 'self' } },
        { resource: 'document', action: 'upload', conditions: { owner: 'self' } },
        { resource: 'verification', action: 'request', conditions: { owner: 'self' } }
      ]
    },
    broker: {
      name: 'broker',
      permissions: [
        { resource: 'document', action: 'read', conditions: { owner: 'client' } },
        { resource: 'document', action: 'upload', conditions: { owner: 'client' } },
        { resource: 'verification', action: 'request', conditions: { owner: 'client' } },
        { resource: 'client', action: 'manage' },
        { resource: 'analytics', action: 'view', conditions: { scope: 'own_clients' } }
      ],
      inherits: ['user']
    },
    admin: {
      name: 'admin',
      permissions: [
        { resource: 'document', action: 'read' },
        { resource: 'verification', action: 'view' },
        { resource: 'analytics', action: 'view' },
        { resource: 'user', action: 'manage' },
        { resource: 'audit', action: 'view' }
      ],
      inherits: ['broker']
    },
    super_admin: {
      name: 'super_admin',
      permissions: [
        { resource: '*', action: '*' } // Full access
      ],
      inherits: ['admin']
    }
  };

  /**
   * Encrypt document content using AES-256-GCM
   */
  async encryptDocument(document: ProcessedDocument): Promise<EncryptedDocument> {
    try {
      // Generate random IV
      const iv = randomBytes(this.ivLength);
      
      // Derive encryption key from master key
      const salt = randomBytes(32);
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create cipher
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      // Encrypt content
      const encrypted = Buffer.concat([
        cipher.update(document.processedContent),
        cipher.final()
      ]);
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine salt and encrypted content
      const encryptedContent = Buffer.concat([salt, encrypted]);
      
      return {
        encryptedContent,
        iv,
        authTag,
        metadata: {
          algorithm: this.algorithm,
          keyDerivation: this.keyDerivationAlgorithm,
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.STORAGE_ERROR,
        'Failed to encrypt document',
        error
      );
    }
  }

  /**
   * Decrypt document content
   */
  async decryptDocument(encryptedDoc: EncryptedDocument): Promise<Buffer> {
    try {
      // Extract salt from encrypted content
      const salt = encryptedDoc.encryptedContent.slice(0, 32);
      const encrypted = encryptedDoc.encryptedContent.slice(32);
      
      // Derive decryption key
      const key = await this.deriveKey(this.masterKey, salt);
      
      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, encryptedDoc.iv);
      decipher.setAuthTag(encryptedDoc.authTag);
      
      // Decrypt content
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted;
      
    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.STORAGE_ERROR,
        'Failed to decrypt document',
        error
      );
    }
  }

  /**
   * Check if user has permission for a specific resource and action
   */
  async checkPermission(
    context: AccessControlContext,
    resource: string,
    action: string,
    resourceData?: any
  ): Promise<boolean> {
    try {
      // Get all permissions for the user's role
      const permissions = this.getAllPermissions(context.role);
      
      // Check for wildcard permissions (super admin)
      if (permissions.some(p => p.resource === '*' && p.action === '*')) {
        return true;
      }

      // Check for specific resource permissions
      const applicablePermissions = permissions.filter(p => 
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === '*')
      );

      if (applicablePermissions.length === 0) {
        return false;
      }

      // Check conditions for each applicable permission
      for (const permission of applicablePermissions) {
        if (await this.checkPermissionConditions(permission, context, resourceData)) {
          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Permission check failed:', error);
      return false; // Fail securely
    }
  }

  /**
   * Check if user has access to document
   */
  async checkDocumentAccess(
    documentId: string,
    context: AccessControlContext,
    operation: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      // Get document metadata for ownership check
      const documentData = await this.getDocumentMetadata(documentId);
      
      return await this.checkPermission(context, 'document', operation, {
        documentId,
        ownerId: documentData?.ownerId,
        organizationId: documentData?.organizationId
      });

    } catch (error) {
      console.error('Document access check failed:', error);
      return false;
    }
  }

  /**
   * Check API access permissions
   */
  async checkApiAccess(
    context: AccessControlContext,
    endpoint: string,
    method: string
  ): Promise<boolean> {
    const apiPermissions: Record<string, { resource: string; action: string }> = {
      'POST /api/documents/upload': { resource: 'document', action: 'upload' },
      'GET /api/documents/:id': { resource: 'document', action: 'read' },
      'DELETE /api/documents/:id': { resource: 'document', action: 'delete' },
      'POST /api/verification/request': { resource: 'verification', action: 'request' },
      'GET /api/analytics/dashboard': { resource: 'analytics', action: 'view' },
      'GET /api/audit/logs': { resource: 'audit', action: 'view' },
      'POST /api/users/create': { resource: 'user', action: 'create' },
      'PUT /api/users/:id': { resource: 'user', action: 'update' },
      'DELETE /api/users/:id': { resource: 'user', action: 'delete' }
    };

    const key = `${method} ${endpoint}`;
    const permission = apiPermissions[key];
    
    if (!permission) {
      // Unknown endpoint - deny access
      return false;
    }

    return await this.checkPermission(context, permission.resource, permission.action);
  }

  /**
   * Get user permissions for UI rendering
   */
  getUserPermissions(context: AccessControlContext): {
    canUploadDocuments: boolean;
    canViewAnalytics: boolean;
    canManageUsers: boolean;
    canViewAuditLogs: boolean;
    canAccessAdminPanel: boolean;
  } {
    const permissions = this.getAllPermissions(context.role);
    
    return {
      canUploadDocuments: this.hasPermission(permissions, 'document', 'upload'),
      canViewAnalytics: this.hasPermission(permissions, 'analytics', 'view'),
      canManageUsers: this.hasPermission(permissions, 'user', 'manage'),
      canViewAuditLogs: this.hasPermission(permissions, 'audit', 'view'),
      canAccessAdminPanel: this.hasPermission(permissions, 'admin', 'access')
    };
  }

  /**
   * Validate user session and permissions
   */
  async validateSession(
    sessionId: string,
    requiredPermissions?: { resource: string; action: string }[]
  ): Promise<{
    valid: boolean;
    context?: AccessControlContext;
    error?: string;
  }> {
    try {
      // In production, this would validate against a session store
      const context = await this.getSessionContext(sessionId);
      
      if (!context) {
        return { valid: false, error: 'Invalid session' };
      }

      // Check if session is expired
      if (await this.isSessionExpired(sessionId)) {
        return { valid: false, error: 'Session expired' };
      }

      // Check required permissions if specified
      if (requiredPermissions) {
        for (const perm of requiredPermissions) {
          const hasPermission = await this.checkPermission(context, perm.resource, perm.action);
          if (!hasPermission) {
            return { valid: false, error: 'Insufficient permissions' };
          }
        }
      }

      return { valid: true, context };

    } catch (error) {
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Generate secure document hash for integrity verification
   */
  generateDocumentHash(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify document integrity
   */
  verifyDocumentIntegrity(content: Buffer, expectedHash: string): boolean {
    const actualHash = this.generateDocumentHash(content);
    return actualHash === expectedHash;
  }

  /**
   * Secure document cleanup - overwrite memory and schedule deletion
   */
  async secureCleanup(document: ProcessedDocument): Promise<void> {
    try {
      // Overwrite buffer content with random data
      if (document.processedContent && document.processedContent.length > 0) {
        const randomData = randomBytes(document.processedContent.length);
        randomData.copy(document.processedContent);
        
        // Zero out the buffer
        document.processedContent.fill(0);
      }

      // Schedule cleanup after 24 hours
      setTimeout(() => {
        this.finalizeCleanup(document.id);
      }, 24 * 60 * 60 * 1000);

    } catch (error) {
      console.error('Secure cleanup failed:', error);
      // Continue with cleanup even if overwriting fails
    }
  }

  /**
   * Sanitize document metadata for logging
   */
  sanitizeMetadataForLogging(document: ProcessedDocument): any {
    return {
      id: document.id,
      fileName: this.maskFileName(document.metadata.fileName),
      fileSize: document.metadata.fileSize,
      mimeType: document.metadata.mimeType,
      processingTimestamp: document.processingTimestamp,
      // Exclude actual content and sensitive metadata
    };
  }

  /**
   * Check for PII in document content (basic implementation)
   */
  async detectPII(content: Buffer): Promise<{
    hasPII: boolean;
    detectedTypes: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const textContent = content.toString('utf8').toLowerCase();
    const detectedTypes: string[] = [];

    // Basic PII patterns (in production, use more sophisticated detection)
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      bankAccount: /\b\d{10,12}\b/g
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(textContent)) {
        detectedTypes.push(type);
      }
    }

    const hasPII = detectedTypes.length > 0;
    const riskLevel = detectedTypes.length > 2 ? 'high' : 
                     detectedTypes.length > 0 ? 'medium' : 'low';

    return { hasPII, detectedTypes, riskLevel };
  }

  /**
   * Create audit trail entry for security events
   */
  async logSecurityEvent(event: {
    type: 'access_granted' | 'access_denied' | 'encryption' | 'decryption' | 'cleanup';
    documentId: string;
    userId: string;
    details?: any;
    timestamp?: Date;
  }): Promise<void> {
    const auditEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
      sessionId: this.generateSessionId()
    };

    // In production, this would write to a secure audit log
    console.log('[SECURITY AUDIT]', auditEntry);
  }

  /**
   * Derive encryption key from master key and salt
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      crypto.pbkdf2(masterKey, salt, this.iterations, this.keyLength, 'sha256', (err: any, derivedKey: Buffer) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  /**
   * Get all permissions for a role (including inherited permissions)
   */
  private getAllPermissions(roleName: string): Permission[] {
    const role = this.roleDefinitions[roleName];
    if (!role) {
      return [];
    }

    let permissions = [...role.permissions];

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        permissions = permissions.concat(this.getAllPermissions(inheritedRole));
      }
    }

    return permissions;
  }

  /**
   * Check if permissions array contains a specific permission
   */
  private hasPermission(permissions: Permission[], resource: string, action: string): boolean {
    return permissions.some(p => 
      (p.resource === resource || p.resource === '*') &&
      (p.action === action || p.action === '*')
    );
  }

  /**
   * Check permission conditions
   */
  private async checkPermissionConditions(
    permission: Permission,
    context: AccessControlContext,
    resourceData?: any
  ): Promise<boolean> {
    if (!permission.conditions) {
      return true; // No conditions to check
    }

    for (const [condition, value] of Object.entries(permission.conditions)) {
      switch (condition) {
        case 'owner':
          if (value === 'self' && resourceData?.ownerId !== context.userId) {
            return false;
          }
          if (value === 'client' && !await this.isClientOfBroker(resourceData?.ownerId, context.userId)) {
            return false;
          }
          break;
          
        case 'scope':
          if (value === 'own_clients' && context.role === 'broker') {
            // Broker can only access their own clients' data
            if (resourceData?.ownerId && !await this.isClientOfBroker(resourceData.ownerId, context.userId)) {
              return false;
            }
          }
          break;
          
        case 'organization':
          if (resourceData?.organizationId !== context.organizationId) {
            return false;
          }
          break;
      }
    }

    return true;
  }

  /**
   * Get document metadata for access control
   */
  private async getDocumentMetadata(documentId: string): Promise<{
    ownerId: string;
    organizationId?: string;
  } | null> {
    // In production, this would query the database
    // For now, return mock data
    return {
      ownerId: 'user123',
      organizationId: 'org456'
    };
  }

  /**
   * Get session context from session ID
   */
  private async getSessionContext(sessionId: string): Promise<AccessControlContext | null> {
    // In production, this would query the session store
    // For now, return mock context
    return {
      userId: 'user123',
      role: 'user',
      permissions: [],
      sessionId,
      organizationId: 'org456'
    };
  }

  /**
   * Check if session is expired
   */
  private async isSessionExpired(sessionId: string): Promise<boolean> {
    // In production, this would check session expiration
    return false;
  }

  /**
   * Check if user is a client of the broker
   */
  private async isClientOfBroker(clientId: string, brokerId: string): Promise<boolean> {
    // In production, this would query the broker-client relationship
    return true;
  }

  /**
   * Mask file name for logging
   */
  private maskFileName(fileName: string): string {
    if (fileName.length <= 4) {
      return '*'.repeat(fileName.length);
    }
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    
    if (nameWithoutExt.length <= 4) {
      return '*'.repeat(nameWithoutExt.length) + '.' + extension;
    }
    
    return nameWithoutExt.substring(0, 2) + 
           '*'.repeat(nameWithoutExt.length - 4) + 
           nameWithoutExt.substring(nameWithoutExt.length - 2) + 
           '.' + extension;
  }

  /**
   * Generate session ID for audit trail
   */
  private generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Finalize cleanup (called after 24 hours)
   */
  private finalizeCleanup(documentId: string): void {
    // In production, this would remove any remaining references
    // and ensure complete cleanup from storage systems
    console.log(`Final cleanup completed for document: ${documentId}`);
  }
}

// Export singleton instance
export const documentSecurity = new GeminiDocumentSecurity();