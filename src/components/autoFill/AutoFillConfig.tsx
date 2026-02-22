/**
 * AutoFillConfig Component
 * 
 * Provides configuration context for auto-fill functionality.
 * Allows enabling/disabling auto-fill per form type and custom field mappings.
 * 
 * Requirements: 11.1, 11.2, 11.5
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { FormType } from '../../types/autoFill';

/**
 * Auto-fill configuration
 */
export interface AutoFillConfiguration {
  // Enable/disable auto-fill globally
  enabled: boolean;

  // Enable/disable per form type
  enabledForms: {
    individual: boolean;
    corporate: boolean;
    mixed: boolean;
  };

  // Custom field mappings (overrides default matching)
  customMappings?: {
    [formType: string]: {
      [apiField: string]: string; // apiField -> formField
    };
  };

  // API configuration
  apiConfig?: {
    timeout?: number; // milliseconds
    retryAttempts?: number;
  };

  // Visual feedback configuration
  visualConfig?: {
    showLoadingIndicator?: boolean;
    showSuccessNotification?: boolean;
    showErrorNotification?: boolean;
    autoFillMarkerColor?: string;
  };
}

/**
 * Default configuration
 */
const defaultConfig: AutoFillConfiguration = {
  enabled: true,
  enabledForms: {
    individual: true,
    corporate: true,
    mixed: true
  },
  apiConfig: {
    timeout: 5000,
    retryAttempts: 2
  },
  visualConfig: {
    showLoadingIndicator: true,
    showSuccessNotification: true,
    showErrorNotification: true,
    autoFillMarkerColor: '#d4edda'
  }
};

/**
 * Configuration context
 */
const AutoFillConfigContext = createContext<AutoFillConfiguration>(defaultConfig);

/**
 * Hook to access auto-fill configuration
 */
export function useAutoFillConfig(): AutoFillConfiguration {
  return useContext(AutoFillConfigContext);
}

/**
 * AutoFillConfig Props
 */
export interface AutoFillConfigProps {
  children: ReactNode;
  config?: Partial<AutoFillConfiguration>;
}

/**
 * AutoFillConfig Component
 * 
 * Provides auto-fill configuration to child components
 */
export function AutoFillConfig({ children, config }: AutoFillConfigProps) {
  // Merge provided config with defaults
  const mergedConfig: AutoFillConfiguration = {
    ...defaultConfig,
    ...config,
    enabledForms: {
      ...defaultConfig.enabledForms,
      ...config?.enabledForms
    },
    apiConfig: {
      ...defaultConfig.apiConfig,
      ...config?.apiConfig
    },
    visualConfig: {
      ...defaultConfig.visualConfig,
      ...config?.visualConfig
    },
    customMappings: config?.customMappings || {}
  };

  return (
    <AutoFillConfigContext.Provider value={mergedConfig}>
      {children}
    </AutoFillConfigContext.Provider>
  );
}

/**
 * Helper function to check if auto-fill is enabled for a form type
 */
export function isAutoFillEnabled(
  config: AutoFillConfiguration,
  formType: FormType
): boolean {
  if (!config.enabled) {
    return false;
  }

  return config.enabledForms[formType] ?? false;
}

/**
 * Helper function to get custom mapping for a field
 */
export function getCustomMapping(
  config: AutoFillConfiguration,
  formType: string,
  apiField: string
): string | null {
  // Check if customMappings exists and has the formType
  if (!config.customMappings || !config.customMappings[formType]) {
    return null;
  }

  // Use hasOwnProperty to avoid accessing built-in object properties
  const formMappings = config.customMappings[formType];
  if (Object.prototype.hasOwnProperty.call(formMappings, apiField)) {
    return formMappings[apiField];
  }

  return null;
}
