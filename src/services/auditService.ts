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
  private apiEndpoint = '/api/audit';

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
      console.error('[AuditService] Failed to log form view:', error);
      // Don't throw - audit logging failures shouldn't break the app
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
      console.error('[AuditService] Failed to log form submission:', error);
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
      console.error('[AuditService] Failed to log document upload:', error);
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
      console.error('[AuditService] Failed to log admin action:', error);
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
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Audit log failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[AuditService] Failed to send audit log:', error);
      // Don't throw - audit logging failures shouldn't break the app
    }
  }
}

export const auditService = new AuditService();
