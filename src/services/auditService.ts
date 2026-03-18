/**
 * Client-side Audit Service
 * 
 * Handles audit logging for form interactions from the client side.
 * Sends audit events to the server for centralized logging.
 */

import { getDeviceInfo, getLocationFromIP } from '@/utils/deviceDetection';

export interface AuditLogParams {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  formType: string;
  formVariant?: string;
  action: string;
  submissionId?: string;
  documentType?: string;
  fileName?: string;
  fileSize?: number;
  ipAddress?: string;
  deviceInfo?: any;
  location?: any;
  formData?: any;
}

class AuditService {
  private apiEndpoint = 'http://localhost:3001/api/audit';

  /**
   * Log form view event
   */
  async logFormView(params: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    formType: string;
    formVariant: string;
  }): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const location = await getLocationFromIP();

      await this.sendAuditLog({
        ...params,
        action: 'form_view',
        deviceInfo,
        location
      });
    } catch (error) {
      // Silently fail - audit logging is non-critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Failed to log form view (non-critical)');
      }
    }
  }

  /**
   * Log form submission event
   */
  async logFormSubmission(params: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    formType: string;
    formVariant: string;
    submissionId: string;
    formData?: any;
  }): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const location = await getLocationFromIP();

      await this.sendAuditLog({
        ...params,
        action: 'form_submission',
        deviceInfo,
        location
      });
    } catch (error) {
      // Silently fail - audit logging is non-critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Failed to log form submission (non-critical)');
      }
    }
  }

  /**
   * Log document upload event
   */
  async logDocumentUpload(params: {
    userId?: string;
    userRole?: string;
    userEmail?: string;
    formType: string;
    documentType: string;
    fileName: string;
    fileSize: number;
  }): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const location = await getLocationFromIP();

      await this.sendAuditLog({
        ...params,
        action: 'document_upload',
        deviceInfo,
        location
      });
    } catch (error) {
      // Silently fail - audit logging is non-critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Failed to log document upload (non-critical)');
      }
    }
  }

  /**
   * Log admin action event
   */
  async logAdminAction(params: {
    adminUserId: string;
    adminRole?: string;
    adminEmail?: string;
    formType: string;
    formVariant?: string;
    submissionId: string;
    action: string;
    changedFields?: string[];
    oldValues?: any;
    newValues?: any;
  }): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const location = await getLocationFromIP();

      await this.sendAuditLog({
        ...params,
        action: 'admin_action',
        deviceInfo,
        location
      });
    } catch (error) {
      // Silently fail - audit logging is non-critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Failed to log admin action (non-critical)');
      }
    }
  }

  /**
   * Send audit log to server
   */
  private async sendAuditLog(params: AuditLogParams): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/${params.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      // Silently ignore 403 Forbidden errors - endpoint may not be configured
      if (response.status === 403) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AuditService] Audit endpoint returned 403 Forbidden - endpoint may not be configured (non-critical)');
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Audit log failed: ${response.statusText}`);
      }
    } catch (error) {
      // Silently ignore 403 errors
      if (error instanceof Error && error.message.includes('403')) {
        return;
      }
      
      // Only log in development mode to avoid console noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuditService] Failed to send audit log (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      }
      // Don't throw - audit logging failures shouldn't break the app
    }
  }
}

export const auditService = new AuditService();
