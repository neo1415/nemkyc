// Configuration management service for Gemini Document Verification

export interface GeminiConfig {
  // API Configuration
  api: {
    geminiApiKey: string;
    geminiModel: string;
    geminiEndpoint: string;
    verifydataApiKey: string;
    verifydataEndpoint: string;
    dataproApiKey: string;
    dataproEndpoint: string;
    requestTimeout: number;
    maxRetries: number;
    retryDelay: number;
  };

  // Processing Configuration
  processing: {
    maxConcurrentDocuments: number;
    maxFileSize: number;
    maxPdfPages: number;
    supportedFormats: string[];
    processingTimeout: number;
    tempStorageCleanupInterval: number;
  };

  // Verification Configuration
  verification: {
    cacSimilarityThresholds: {
      companyName: number;
      address: number;
    };
    individualSimilarityThresholds: {
      fullName: number;
    };
    confidenceThresholds: {
      minimum: number;
      good: number;
      excellent: number;
    };
    fallbackProviders: string[];
  };

  // Caching Configuration
  caching: {
    enabled: boolean;
    documentResultTtl: number;
    ocrResultTtl: number;
    verificationResultTtl: number;
    apiResponseTtl: number;
    maxCacheSize: number;
    cleanupInterval: number;
  };

  // Security Configuration
  security: {
    encryptionEnabled: boolean;
    encryptionAlgorithm: string;
    keyRotationInterval: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };

  // Monitoring Configuration
  monitoring: {
    enabled: boolean;
    metricsRetentionPeriod: number;
    alertThresholds: {
      errorRate: number;
      processingTime: number;
      queueLength: number;
      apiQuotaUsage: number;
    };
    alertChannels: string[];
  };

  // Privacy Configuration
  privacy: {
    dataRetentionPeriod: number;
    piiDetectionEnabled: boolean;
    consentRequired: boolean;
    auditLogRetention: number;
    automaticDeletion: boolean;
  };

  // Feature Flags
  features: {
    realTimeUpdates: boolean;
    errorRecovery: boolean;
    offlineMode: boolean;
    advancedAnalytics: boolean;
    bulkProcessing: boolean;
    apiRateLimiting: boolean;
  };
}

export class GeminiConfigManager {
  private config: GeminiConfig;
  private configListeners: Array<(config: GeminiConfig) => void> = [];
  private environment: 'development' | 'staging' | 'production';

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadDefaultConfig();
    this.loadEnvironmentConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): GeminiConfig {
    return { ...this.config };
  }

  /**
   * Get specific configuration section
   */
  getSection<K extends keyof GeminiConfig>(section: K): GeminiConfig[K] {
    return { ...this.config[section] };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<GeminiConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.validateConfig();
    this.notifyListeners();
    this.persistConfig();
  }

  /**
   * Update specific configuration section
   */
  updateSection<K extends keyof GeminiConfig>(
    section: K,
    updates: Partial<GeminiConfig[K]>
  ): void {
    this.config[section] = { ...this.config[section], ...updates };
    this.validateConfig();
    this.notifyListeners();
    this.persistConfig();
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = this.loadDefaultConfig();
    this.loadEnvironmentConfig();
    this.notifyListeners();
    this.persistConfig();
  }

  /**
   * Subscribe to configuration changes
   */
  onConfigChange(listener: (config: GeminiConfig) => void): () => void {
    this.configListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.configListeners.indexOf(listener);
      if (index > -1) {
        this.configListeners.splice(index, 1);
      }
    };
  }

  /**
   * Validate current configuration
   */
  validateConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate API configuration
    if (!this.config.api.geminiApiKey) {
      errors.push('Gemini API key is required');
    }

    if (this.config.api.requestTimeout < 1000) {
      warnings.push('Request timeout is very low (< 1 second)');
    }

    // Validate processing configuration
    if (this.config.processing.maxConcurrentDocuments < 1) {
      errors.push('Max concurrent documents must be at least 1');
    }

    if (this.config.processing.maxFileSize < 1024 * 1024) {
      warnings.push('Max file size is very small (< 1MB)');
    }

    // Validate verification thresholds
    const { cacSimilarityThresholds, individualSimilarityThresholds } = this.config.verification;
    
    if (cacSimilarityThresholds.companyName < 0 || cacSimilarityThresholds.companyName > 100) {
      errors.push('CAC company name similarity threshold must be between 0 and 100');
    }

    if (individualSimilarityThresholds.fullName < 0 || individualSimilarityThresholds.fullName > 100) {
      errors.push('Individual full name similarity threshold must be between 0 and 100');
    }

    // Validate caching configuration
    if (this.config.caching.enabled && this.config.caching.maxCacheSize < 1) {
      errors.push('Cache size must be at least 1 when caching is enabled');
    }

    // Validate security configuration
    if (this.config.security.sessionTimeout < 300) {
      warnings.push('Session timeout is very short (< 5 minutes)');
    }

    // Validate monitoring thresholds
    const { alertThresholds } = this.config.monitoring;
    if (alertThresholds.errorRate < 0 || alertThresholds.errorRate > 100) {
      errors.push('Error rate threshold must be between 0 and 100');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): Partial<GeminiConfig> {
    const envConfigs: Record<string, Partial<GeminiConfig>> = {
      development: {
        api: {
          geminiApiKey: '',
          geminiModel: 'gemini-2.5-flash',
          geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
          verifydataApiKey: '',
          verifydataEndpoint: 'https://api.verifydata.ng/v1',
          dataproApiKey: '',
          dataproEndpoint: 'https://api.datapro.ng/v1',
          requestTimeout: 60000,
          maxRetries: 1,
          retryDelay: 1000
        },
        processing: {
          maxConcurrentDocuments: 2,
          maxFileSize: 50 * 1024 * 1024,
          maxPdfPages: 1000,
          supportedFormats: ['.pdf', '.png', '.jpg', '.jpeg'],
          processingTimeout: 120000,
          tempStorageCleanupInterval: 3600000
        },
        monitoring: {
          enabled: false,
          metricsRetentionPeriod: 2592000000,
          alertThresholds: {
            errorRate: 15,
            processingTime: 45000,
            queueLength: 25,
            apiQuotaUsage: 90
          },
          alertChannels: ['console']
        },
        features: {
          realTimeUpdates: true,
          errorRecovery: true,
          offlineMode: true,
          advancedAnalytics: false,
          bulkProcessing: false,
          apiRateLimiting: false
        }
      },
      staging: {
        api: {
          geminiApiKey: '',
          geminiModel: 'gemini-2.5-flash',
          geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
          verifydataApiKey: '',
          verifydataEndpoint: 'https://api.verifydata.ng/v1',
          dataproApiKey: '',
          dataproEndpoint: 'https://api.datapro.ng/v1',
          requestTimeout: 45000,
          maxRetries: 2,
          retryDelay: 1000
        },
        processing: {
          maxConcurrentDocuments: 5,
          maxFileSize: 50 * 1024 * 1024,
          maxPdfPages: 1000,
          supportedFormats: ['.pdf', '.png', '.jpg', '.jpeg'],
          processingTimeout: 180000,
          tempStorageCleanupInterval: 3600000
        },
        monitoring: {
          enabled: true,
          metricsRetentionPeriod: 2592000000,
          alertThresholds: {
            errorRate: 20,
            processingTime: 60000,
            queueLength: 20,
            apiQuotaUsage: 90
          },
          alertChannels: ['console', 'email']
        },
        features: {
          realTimeUpdates: true,
          errorRecovery: true,
          offlineMode: false,
          advancedAnalytics: false,
          bulkProcessing: false,
          apiRateLimiting: false
        }
      },
      production: {
        api: {
          geminiApiKey: '',
          geminiModel: 'gemini-2.5-flash',
          geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
          verifydataApiKey: '',
          verifydataEndpoint: 'https://api.verifydata.ng/v1',
          dataproApiKey: '',
          dataproEndpoint: 'https://api.datapro.ng/v1',
          requestTimeout: 30000,
          maxRetries: 3,
          retryDelay: 1000
        },
        processing: {
          maxConcurrentDocuments: 10,
          maxFileSize: 50 * 1024 * 1024,
          maxPdfPages: 1000,
          supportedFormats: ['.pdf', '.png', '.jpg', '.jpeg'],
          processingTimeout: 300000,
          tempStorageCleanupInterval: 3600000
        },
        monitoring: {
          enabled: true,
          metricsRetentionPeriod: 2592000000,
          alertThresholds: {
            errorRate: 10,
            processingTime: 30000,
            queueLength: 50,
            apiQuotaUsage: 85
          },
          alertChannels: ['console', 'email']
        },
        security: {
          encryptionEnabled: true,
          encryptionAlgorithm: 'aes-256-gcm',
          keyRotationInterval: 2592000000,
          sessionTimeout: 1800, // 30 minutes
          maxLoginAttempts: 3,
          lockoutDuration: 900 // 15 minutes
        },
        features: {
          realTimeUpdates: true,
          errorRecovery: true,
          offlineMode: false,
          advancedAnalytics: true,
          bulkProcessing: true,
          apiRateLimiting: true
        }
      }
    };

    return envConfigs[this.environment] || {};
  }

  /**
   * Export configuration for backup
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.mergeConfig(this.loadDefaultConfig(), importedConfig);
      this.validateConfig();
      this.notifyListeners();
      this.persistConfig();
    } catch (error) {
      throw new Error('Invalid configuration format');
    }
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): GeminiConfig {
    return {
      api: {
        geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        geminiModel: 'gemini-2.5-flash',
        geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        verifydataApiKey: import.meta.env.VITE_VERIFYDATA_API_KEY || '',
        verifydataEndpoint: 'https://api.verifydata.ng/v1',
        dataproApiKey: import.meta.env.VITE_DATAPRO_API_KEY || '',
        dataproEndpoint: 'https://api.datapro.ng/v1',
        requestTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      },
      processing: {
        maxConcurrentDocuments: 10,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        maxPdfPages: 1000,
        supportedFormats: ['.pdf', '.png', '.jpg', '.jpeg'],
        processingTimeout: 300000, // 5 minutes
        tempStorageCleanupInterval: 3600000 // 1 hour
      },
      verification: {
        cacSimilarityThresholds: {
          companyName: 85,
          address: 70
        },
        individualSimilarityThresholds: {
          fullName: 85
        },
        confidenceThresholds: {
          minimum: 60,
          good: 80,
          excellent: 95
        },
        fallbackProviders: ['verifydata', 'datapro']
      },
      caching: {
        enabled: true,
        documentResultTtl: 86400000, // 24 hours
        ocrResultTtl: 86400000, // 24 hours
        verificationResultTtl: 3600000, // 1 hour
        apiResponseTtl: 1800000, // 30 minutes
        maxCacheSize: 1000,
        cleanupInterval: 3600000 // 1 hour
      },
      security: {
        encryptionEnabled: true,
        encryptionAlgorithm: 'aes-256-gcm',
        keyRotationInterval: 2592000000, // 30 days
        sessionTimeout: 3600, // 1 hour
        maxLoginAttempts: 5,
        lockoutDuration: 1800 // 30 minutes
      },
      monitoring: {
        enabled: true,
        metricsRetentionPeriod: 2592000000, // 30 days
        alertThresholds: {
          errorRate: 15,
          processingTime: 45000,
          queueLength: 25,
          apiQuotaUsage: 90
        },
        alertChannels: ['console', 'email']
      },
      privacy: {
        dataRetentionPeriod: 2555, // 7 years in days
        piiDetectionEnabled: true,
        consentRequired: true,
        auditLogRetention: 2555, // 7 years in days
        automaticDeletion: true
      },
      features: {
        realTimeUpdates: true,
        errorRecovery: true,
        offlineMode: false,
        advancedAnalytics: false,
        bulkProcessing: false,
        apiRateLimiting: true
      }
    };
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    const env = import.meta.env.MODE || 'development';
    
    if (env === 'production') return 'production';
    if (env === 'staging') return 'staging';
    return 'development';
  }

  /**
   * Load environment-specific configuration
   */
  private loadEnvironmentConfig(): void {
    const envConfig = this.getEnvironmentConfig();
    this.config = this.mergeConfig(this.config, envConfig);
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: GeminiConfig, updates: Partial<GeminiConfig>): GeminiConfig {
    const result: GeminiConfig = JSON.parse(JSON.stringify(base)); // Deep clone
    
    // Merge each section explicitly
    if (updates.api) {
      result.api = { ...result.api, ...updates.api };
    }
    if (updates.processing) {
      result.processing = { ...result.processing, ...updates.processing };
    }
    if (updates.verification) {
      result.verification = { ...result.verification, ...updates.verification };
    }
    if (updates.caching) {
      result.caching = { ...result.caching, ...updates.caching };
    }
    if (updates.security) {
      result.security = { ...result.security, ...updates.security };
    }
    if (updates.monitoring) {
      result.monitoring = { ...result.monitoring, ...updates.monitoring };
    }
    if (updates.privacy) {
      result.privacy = { ...result.privacy, ...updates.privacy };
    }
    if (updates.features) {
      result.features = { ...result.features, ...updates.features };
    }
    
    return result;
  }

  /**
   * Notify configuration change listeners
   */
  private notifyListeners(): void {
    this.configListeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }

  /**
   * Persist configuration to storage
   */
  private persistConfig(): void {
    try {
      // In production, this would save to a secure configuration store
      localStorage.setItem('gemini_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to persist configuration:', error);
    }
  }
}

// Singleton instance
export const geminiConfigManager = new GeminiConfigManager();