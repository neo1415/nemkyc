/**
 * Data Fetcher Service
 * 
 * Handles paginated data retrieval for analytics reports.
 * Fetches ALL data including audit logs and broker attribution
 * with retry logic and progress callbacks.
 * 
 * Requirements: 1.5, 1.6, 5.1, 5.2, 5.3, 6.1, 6.2
 */

import type { AuditLogEntry, BrokerUsage } from '../../types/analytics';

interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  cursor?: string;
  offset?: number;
  total?: number;
}

interface FetchOptions {
  maxRecords?: number;
  onProgress?: (status: string, fetched: number, total?: number) => void;
}

export class DataFetcher {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 1000;

  /**
   * Fetches all audit logs within date range, handling pagination
   * 
   * Requirements: 1.5, 1.6, 5.1, 5.2
   */
  async fetchAllAuditLogs(
    startDate: Date,
    endDate: Date,
    options: FetchOptions = {}
  ): Promise<AuditLogEntry[]> {
    const { maxRecords = 10000, onProgress } = options;

    const fetchFn = async (cursor?: string, offset?: number): Promise<PaginatedResponse<AuditLogEntry>> => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '100', // Fetch 100 records per page
      });

      if (cursor) {
        params.append('cursor', cursor);
      } else if (offset !== undefined) {
        params.append('offset', offset.toString());
      }

      const response = await fetch(`/api/audit/logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert timestamp strings to Date objects
      const data = result.logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));

      return {
        data,
        hasMore: result.hasMore || false,
        cursor: result.cursor,
        offset: result.offset,
        total: result.total,
      };
    };

    return this.fetchPaginated(fetchFn, maxRecords, onProgress);
  }

  /**
   * Fetches all broker attribution data, handling pagination
   * 
   * Requirements: 6.1, 6.2
   */
  async fetchAllBrokerAttribution(
    startDate: Date,
    endDate: Date,
    options: FetchOptions = {}
  ): Promise<BrokerUsage[]> {
    const { maxRecords = 10000, onProgress } = options;

    const fetchFn = async (cursor?: string, offset?: number): Promise<PaginatedResponse<BrokerUsage>> => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '100', // Fetch 100 records per page
      });

      if (cursor) {
        params.append('cursor', cursor);
      } else if (offset !== undefined) {
        params.append('offset', offset.toString());
      }

      const response = await fetch(`/api/analytics/user-attribution?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch broker attribution: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert lastActivity strings to Date objects
      const data = result.brokers.map((broker: any) => ({
        ...broker,
        lastActivity: new Date(broker.lastActivity),
      }));

      return {
        data,
        hasMore: result.hasMore || false,
        cursor: result.cursor,
        offset: result.offset,
        total: result.total,
      };
    };

    return this.fetchPaginated(fetchFn, maxRecords, onProgress);
  }

  /**
   * Generic pagination handler with retry logic
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  private async fetchPaginated<T>(
    fetchFn: (cursor?: string, offset?: number) => Promise<PaginatedResponse<T>>,
    maxRecords: number,
    onProgress?: (status: string, fetched: number, total?: number) => void
  ): Promise<T[]> {
    const allData: T[] = [];
    let cursor: string | undefined;
    let offset: number | undefined = 0;
    let hasMore = true;
    let pageNumber = 1;

    while (hasMore && allData.length < maxRecords) {
      try {
        // Fetch with retry logic
        const response = await this.retryWithBackoff(
          () => fetchFn(cursor, offset),
          this.MAX_RETRIES
        );

        allData.push(...response.data);
        
        // Update pagination state
        cursor = response.cursor;
        offset = response.offset !== undefined ? response.offset + response.data.length : undefined;
        hasMore = response.hasMore && allData.length < maxRecords;

        // Report progress
        if (onProgress) {
          onProgress(
            `Fetching page ${pageNumber}...`,
            allData.length,
            response.total
          );
        }

        pageNumber++;

        // Stop if no more data
        if (response.data.length === 0) {
          hasMore = false;
        }
      } catch (error) {
        console.error('Error fetching paginated data:', error);
        throw error;
      }
    }

    // Sort audit logs by timestamp descending (newest first)
    if (allData.length > 0 && 'timestamp' in allData[0]) {
      allData.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    return allData;
  }

  /**
   * Retry logic with exponential backoff
   * 
   * Requirements: 5.3
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Calculate delay with exponential backoff: 1s, 2s, 4s
        const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
        
        console.warn(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
          error
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Failed after retries');
  }
}

// Export singleton instance
export const dataFetcher = new DataFetcher();
