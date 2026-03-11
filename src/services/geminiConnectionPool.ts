// Connection pooling service for external API calls

export interface ConnectionConfig {
  maxConnections: number;
  maxIdleTime: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface Connection {
  id: string;
  created: Date;
  lastUsed: Date;
  inUse: boolean;
  requests: number;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
  totalRequests: number;
  averageResponseTime: number;
}

export class GeminiConnectionPool {
  private connections: Map<string, Connection> = new Map();
  private requestQueue: Array<{
    resolve: (connection: Connection) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];

  private config: ConnectionConfig = {
    maxConnections: 10,
    maxIdleTime: 300000, // 5 minutes
    connectionTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000
  };

  private stats = {
    totalRequests: 0,
    totalResponseTime: 0,
    requestTimes: [] as number[]
  };

  constructor(config?: Partial<ConnectionConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      // Try to find an available connection
      const availableConnection = this.findAvailableConnection();
      
      if (availableConnection) {
        availableConnection.inUse = true;
        availableConnection.lastUsed = new Date();
        availableConnection.requests++;
        resolve(availableConnection);
        return;
      }

      // Create new connection if under limit
      if (this.connections.size < this.config.maxConnections) {
        const newConnection = this.createConnection();
        resolve(newConnection);
        return;
      }

      // Queue the request
      this.requestQueue.push({
        resolve,
        reject,
        timestamp: new Date()
      });

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex(req => req.resolve === resolve);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Connection request timeout'));
        }
      }, this.config.connectionTimeout);
    });
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = new Date();

      // Process queued requests
      if (this.requestQueue.length > 0) {
        const queuedRequest = this.requestQueue.shift();
        if (queuedRequest) {
          connection.inUse = true;
          connection.requests++;
          queuedRequest.resolve(connection);
        }
      }
    }
  }

  /**
   * Execute a request with connection pooling
   */
  async executeRequest<T>(
    requestFn: (connection: Connection) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let connection: Connection | null = null;

    try {
      connection = await this.acquireConnection();
      const result = await requestFn(connection);
      
      // Record stats
      const responseTime = Date.now() - startTime;
      this.recordRequestStats(responseTime);
      
      return result;
    } finally {
      if (connection) {
        this.releaseConnection(connection.id);
      }
    }
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry<T>(
    requestFn: (connection: Connection) => Promise<T>,
    maxAttempts: number = this.config.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.executeRequest(requestFn);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts) {
          // Wait before retry
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError!;
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.inUse).length;
    
    const idleConnections = this.connections.size - activeConnections;
    
    const averageResponseTime = this.stats.requestTimes.length > 0
      ? this.stats.requestTimes.reduce((sum, time) => sum + time, 0) / this.stats.requestTimes.length
      : 0;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      idleConnections,
      queuedRequests: this.requestQueue.length,
      totalRequests: this.stats.totalRequests,
      averageResponseTime
    };
  }

  /**
   * Configure pool settings
   */
  configure(config: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Close all connections and clear pool
   */
  close(): void {
    this.connections.clear();
    this.requestQueue.forEach(req => 
      req.reject(new Error('Connection pool closed'))
    );
    this.requestQueue.length = 0;
  }

  /**
   * Get connection details for monitoring
   */
  getConnectionDetails(): Array<{
    id: string;
    created: Date;
    lastUsed: Date;
    inUse: boolean;
    requests: number;
    idleTime: number;
  }> {
    const now = new Date();
    return Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      created: conn.created,
      lastUsed: conn.lastUsed,
      inUse: conn.inUse,
      requests: conn.requests,
      idleTime: now.getTime() - conn.lastUsed.getTime()
    }));
  }

  /**
   * Force cleanup of idle connections
   */
  forceCleanup(): number {
    return this.cleanup();
  }

  /**
   * Find an available connection
   */
  private findAvailableConnection(): Connection | null {
    for (const connection of this.connections.values()) {
      if (!connection.inUse) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Create a new connection
   */
  private createConnection(): Connection {
    const connection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created: new Date(),
      lastUsed: new Date(),
      inUse: true,
      requests: 1
    };

    this.connections.set(connection.id, connection);
    return connection;
  }

  /**
   * Record request statistics
   */
  private recordRequestStats(responseTime: number): void {
    this.stats.totalRequests++;
    this.stats.totalResponseTime += responseTime;
    this.stats.requestTimes.push(responseTime);

    // Keep only last 1000 response times for average calculation
    if (this.stats.requestTimes.length > 1000) {
      this.stats.requestTimes = this.stats.requestTimes.slice(-1000);
    }
  }

  /**
   * Cleanup idle connections
   */
  private cleanup(): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, connection] of this.connections.entries()) {
      const idleTime = now.getTime() - connection.lastUsed.getTime();
      
      if (!connection.inUse && idleTime > this.config.maxIdleTime) {
        this.connections.delete(id);
        cleanedCount++;
      }
    }

    // Clean up expired queued requests
    const expiredRequests = this.requestQueue.filter(req => {
      const age = now.getTime() - req.timestamp.getTime();
      return age > this.config.connectionTimeout;
    });

    expiredRequests.forEach(req => {
      const index = this.requestQueue.indexOf(req);
      if (index !== -1) {
        this.requestQueue.splice(index, 1);
        req.reject(new Error('Request expired in queue'));
      }
    });

    return cleanedCount;
  }
}

// Specialized connection pools for different services
export class GeminiAPIConnectionPool extends GeminiConnectionPool {
  constructor() {
    super({
      maxConnections: 5, // Gemini API has rate limits
      maxIdleTime: 180000, // 3 minutes
      connectionTimeout: 45000, // 45 seconds for OCR processing
      retryAttempts: 3,
      retryDelay: 2000
    });
  }
}

export class VerificationAPIConnectionPool extends GeminiConnectionPool {
  constructor() {
    super({
      maxConnections: 8, // More connections for verification APIs
      maxIdleTime: 300000, // 5 minutes
      connectionTimeout: 30000, // 30 seconds
      retryAttempts: 2,
      retryDelay: 1000
    });
  }
}

// Singleton instances
export const geminiApiPool = new GeminiAPIConnectionPool();
export const verificationApiPool = new VerificationAPIConnectionPool();