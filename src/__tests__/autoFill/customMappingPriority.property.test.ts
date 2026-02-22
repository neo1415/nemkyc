/**
 * Property Test: Custom Mapping Priority
 * 
 * Property 34: Custom Mapping Priority
 * For any field where custom mapping is defined in configuration, the custom mapping
 * should take priority over default matching algorithms.
 * 
 * Validates: Requirements 11.5
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getCustomMapping, AutoFillConfiguration } from '../../components/autoFill/AutoFillConfig';

describe('Feature: nin-cac-autofill, Property 34: Custom Mapping Priority', () => {
  it('should return custom mapping when defined for a form type and API field', () => {
    fc.assert(
      fc.property(
        // Generate random form type
        fc.string({ minLength: 1, maxLength: 20 }),
        // Generate random API field name
        fc.string({ minLength: 1, maxLength: 30 }),
        // Generate random custom form field name
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField, customFormField) => {
          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField]: customFormField
              }
            }
          };

          const result = getCustomMapping(config, formType, apiField);

          // Property: when custom mapping exists, it should be returned
          expect(result).toBe(customFormField);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when no custom mapping is defined', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField) => {
          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {} // No custom mappings
          };

          const result = getCustomMapping(config, formType, apiField);

          // Property: when no custom mapping exists, return null
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when custom mapping exists for form type but not for API field', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField1, apiField2, customFormField) => {
          // Ensure apiField1 and apiField2 are different
          fc.pre(apiField1 !== apiField2);

          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField1]: customFormField // Only apiField1 has mapping
              }
            }
          };

          const result = getCustomMapping(config, formType, apiField2);

          // Property: when custom mapping exists for form but not for specific field, return null
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when custom mapping exists for different form type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType1, formType2, apiField, customFormField) => {
          // Ensure formType1 and formType2 are different
          fc.pre(formType1 !== formType2);

          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType1]: {
                [apiField]: customFormField
              }
            }
          };

          const result = getCustomMapping(config, formType2, apiField);

          // Property: custom mapping is form-type specific
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple custom mappings for the same form type independently', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField1, apiField2, customFormField1, customFormField2) => {
          // Ensure apiField1 and apiField2 are different
          fc.pre(apiField1 !== apiField2);

          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField1]: customFormField1,
                [apiField2]: customFormField2
              }
            }
          };

          const result1 = getCustomMapping(config, formType, apiField1);
          const result2 = getCustomMapping(config, formType, apiField2);

          // Property: each API field maps to its own custom form field independently
          expect(result1).toBe(customFormField1);
          expect(result2).toBe(customFormField2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be deterministic for the same configuration and inputs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField, customFormField) => {
          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField]: customFormField
              }
            }
          };

          const result1 = getCustomMapping(config, formType, apiField);
          const result2 = getCustomMapping(config, formType, apiField);

          // Property: calling with same inputs produces same output (deterministic)
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty string values in custom mappings', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField) => {
          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField]: '' // Empty string mapping
              }
            }
          };

          const result = getCustomMapping(config, formType, apiField);

          // Property: empty string is a valid custom mapping value
          expect(result).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle special characters in form types and field names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (formType, apiField, customFormField) => {
          const config: AutoFillConfiguration = {
            enabled: true,
            enabledForms: {
              individual: true,
              corporate: true,
              mixed: true
            },
            customMappings: {
              [formType]: {
                [apiField]: customFormField
              }
            }
          };

          const result = getCustomMapping(config, formType, apiField);

          // Property: special characters in names should not affect mapping lookup
          expect(result).toBe(customFormField);
        }
      ),
      { numRuns: 100 }
    );
  });
});
