// Monitoring and alerting service for Gemini Document Verification

import { GeminiError, ErrorCode } from '@/utils/geminiErrorHandling';
import { ProcessingStatus, DocumentVerificationResult } from '@/types/geminiDocumentVerification';

export interface PerformanceMetrics {
  processingTime: number;
  queueLength: number;
  successRate: number;
  errorRate: number;
  apiQuotaUsage: number;
  concurrentProcessing: number;
}

export interface AlertThresholds {
  maxProcessingTime: number;
  maxQueueLength: number;
  minSuccessRate: number;
  maxErrorRate: number;
  maxApiQuotaUsage: number;
  maxConcurrentProcessing: number;
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'quota' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

export class GeminiMonitoring {
  private metrics: PerformanceMetrics = {
    processingTime: 0,
    queueLength: 0,
    successRate: 100,
    errorRate: 0,
    apiQuotaUsage: 0,
    concurrentProcessing: 0
  };

  private thresholds: AlertThresholds = {
    maxProcessingTime: 30000, // 30 seconds
    maxQueueLength: 50,
    minSuccessRate: 85, // 85%
    maxErrorRate: 15, // 15%
    maxApiQuotaUsage: 90, // 90%
    maxConcurrentProcessing: 10
  };

  private alerts: Alert[] = [];
  private processingHistory: Array<{
    timestamp: Date;
    processingTime: number;
    success: boolean;
    errorCode?: string;
  }> = [];

  private alertCallbacks: Array<(alert: Alert) => void> = [];

  /**
   * Record processing completion
   */
  recordProcessing(result: DocumentVerificationResult): void {
    const record = {
      timestamp: new Date(),
      processingTime: result.processingTime,
      success: result.success,
      errorCode: result.error?.code
    };

    this.processingHistory.push(record);

    // Keep only last 1000 records
    if (this.processingHistory.length > 1000) {
      this.processingHistory = this.processingHistory.slice(-1000);
    }

    this.updateMetrics();
    this.checkAlerts();
  }

  /**
   * Record error occurrence
   */
  recordError(error: GeminiError, context?: any): void {
    const record = {
      timestamp: new Date(),
      processingTime: 0,
      success: false,
      errorCode: error.code
    };

    this.processingHistory.push(record);
    this.updateMetrics();

    // Create error-specific alerts
    this.createErrorAlert(error, context);
    this.checkAlerts();
  }

  /**
   * Update queue metrics
   */
  updateQueueMetrics(queueLength: number, concurrentProcessing: number): void {
    this.metrics.queueLength = queueLength;
    this.metrics.concurrentProcessing = concurrentProcessing;
    this.checkAlerts();
  }

  /**
   * Update API quota usage
   */
  updateApiQuotaUsage(usage: number): void {
    this.metrics.apiQuotaUsage = usage;
    this.checkAlerts();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Subscribe to alert notifications
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Configure alert thresholds
   */
  configureThresholds(thresholds: Partial<AlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Update performance metrics based on processing history
   */
  private updateMetrics(): void {
    const recentHistory = this.getRecentHistory(300000); // Last 5 minutes

    if (recentHistory.length === 0) {
      return;
    }

    // Calculate success rate
    const successCount = recentHistory.filter(r => r.success).length;
    this.metrics.successRate = (successCount / recentHistory.length) * 100;
    this.metrics.errorRate = 100 - this.metrics.successRate;

    // Calculate average processing time
    const successfulProcessing = recentHistory.filter(r => r.success && r.processingTime > 0);
    if (successfulProcessing.length > 0) {
      const totalTime = successfulProcessing.reduce((sum, r) => sum + r.processingTime, 0);
      this.metrics.processingTime = totalTime / successfulProcessing.length;
    }
  }

  /**
   * Get processing history for a time window
   */
  private getRecentHistory(windowMs: number): typeof this.processingHistory {
    const cutoff = new Date(Date.now() - windowMs);
    return this.processingHistory.filter(r => r.timestamp >= cutoff);
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(): void {
    // Processing time alert
    if (this.metrics.processingTime > this.thresholds.maxProcessingTime) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `Processing time (${Math.round(this.metrics.processingTime)}ms) exceeds threshold (${this.thresholds.maxProcessingTime}ms)`,
        metadata: { processingTime: this.metrics.processingTime }
      });
    }

    // Queue length alert
    if (this.metrics.queueLength > this.thresholds.maxQueueLength) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Queue length (${this.metrics.queueLength}) exceeds threshold (${this.thresholds.maxQueueLength})`,
        metadata: { queueLength: this.metrics.queueLength }
      });
    }

    // Success rate alert
    if (this.metrics.successRate < this.thresholds.minSuccessRate) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `Success rate (${this.metrics.successRate.toFixed(1)}%) below threshold (${this.thresholds.minSuccessRate}%)`,
        metadata: { successRate: this.metrics.successRate }
      });
    }

    // Error rate alert
    if (this.metrics.errorRate > this.thresholds.maxErrorRate) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        message: `Error rate (${this.metrics.errorRate.toFixed(1)}%) exceeds threshold (${this.thresholds.maxErrorRate}%)`,
        metadata: { errorRate: this.metrics.errorRate }
      });
    }

    // API quota alert
    if (this.metrics.apiQuotaUsage > this.thresholds.maxApiQuotaUsage) {
      this.createAlert({
        type: 'quota',
        severity: 'critical',
        message: `API quota usage (${this.metrics.apiQuotaUsage}%) exceeds threshold (${this.thresholds.maxApiQuotaUsage}%)`,
        metadata: { quotaUsage: this.metrics.apiQuotaUsage }
      });
    }

    // Concurrent processing alert
    if (this.metrics.concurrentProcessing > this.thresholds.maxConcurrentProcessing) {
      this.createAlert({
        type: 'system',
        severity: 'medium',
        message: `Concurrent processing (${this.metrics.concurrentProcessing}) exceeds threshold (${this.thresholds.maxConcurrentProcessing})`,
        metadata: { concurrentProcessing: this.metrics.concurrentProcessing }
      });
    }
  }

  /**
   * Create error-specific alert
   */
  private createErrorAlert(error: GeminiError, context?: any): void {
    let severity: Alert['severity'] = 'medium';

    // Determine severity based on error type
    if ([ErrorCode.API_AUTHENTICATION_FAILED, ErrorCode.API_QUOTA_EXCEEDED].includes(error.code)) {
      severity = 'critical';
    } else if ([ErrorCode.API_UNAVAILABLE, ErrorCode.NETWORK_ERROR].includes(error.code)) {
      severity = 'high';
    } else if ([ErrorCode.OCR_FAILED, ErrorCode.EXTRACTION_FAILED].includes(error.code)) {
      severity = 'medium';
    }

    this.createAlert({
      type: 'error',
      severity,
      message: `${error.code}: ${error.message}`,
      metadata: { error: error.code, context }
    });
  }

  /**
   * Create a new alert
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    // Check if similar alert already exists and is not resolved
    const existingAlert = this.alerts.find(alert => 
      !alert.resolved && 
      alert.type === alertData.type && 
      alert.message === alertData.message
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify subscribers
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: PerformanceMetrics;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const issues: string[] = [];

    if (criticalAlerts.length > 0) {
      status = 'unhealthy';
      issues.push(...criticalAlerts.map(a => a.message));
    } else if (highAlerts.length > 0 || this.metrics.successRate < 90) {
      status = 'degraded';
      issues.push(...highAlerts.map(a => a.message));
    }

    return {
      status,
      issues,
      metrics: this.getMetrics()
    };
  }

  /**
   * Generate performance report
   */
  generateReport(timeWindowMs: number = 3600000): {
    timeWindow: string;
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    errorBreakdown: Record<string, number>;
    recommendations: string[];
  } {
    const history = this.getRecentHistory(timeWindowMs);
    const totalProcessed = history.length;
    const successCount = history.filter(r => r.success).length;
    const successRate = totalProcessed > 0 ? (successCount / totalProcessed) * 100 : 0;

    const successfulProcessing = history.filter(r => r.success && r.processingTime > 0);
    const averageProcessingTime = successfulProcessing.length > 0
      ? successfulProcessing.reduce((sum, r) => sum + r.processingTime, 0) / successfulProcessing.length
      : 0;

    // Error breakdown
    const errorBreakdown: Record<string, number> = {};
    history.filter(r => !r.success && r.errorCode).forEach(r => {
      errorBreakdown[r.errorCode!] = (errorBreakdown[r.errorCode!] || 0) + 1;
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (successRate < 90) {
      recommendations.push('Success rate is below 90%. Consider investigating common error patterns.');
    }
    if (averageProcessingTime > 15000) {
      recommendations.push('Average processing time is high. Consider optimizing document preprocessing.');
    }
    if (errorBreakdown[ErrorCode.API_RATE_LIMITED] > 0) {
      recommendations.push('API rate limiting detected. Consider implementing better request throttling.');
    }

    return {
      timeWindow: `${timeWindowMs / 60000} minutes`,
      totalProcessed,
      successRate,
      averageProcessingTime,
      errorBreakdown,
      recommendations
    };
  }
}

// Singleton instance
export const geminiMonitoring = new GeminiMonitoring();