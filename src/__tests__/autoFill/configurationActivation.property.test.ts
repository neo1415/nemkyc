/**
 * Property Test: Configuration-Based Activation
 * 
 * Property 33: Configuration-Based Activation
 * For any form where auto-fill is configured as enabled, verification triggers should be active;
 * where disabled, triggers should be hidden and the form should function as standard.
 * 
 * Validates: Requirements 11.1, 11.2
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { isAutoFillEnabled, AutoFillConfiguration } from '../../components/autoFill/AutoFillConfig';
import { FormType } from '../../types/autoFill';

describe('Feature: nin-cac-autofill, Property 33: Configuration-Based Activation', () => {
  it('should activate auto-fill only when globally enabled and form type is enabled', () => {
    fc.assert(
      fc.property(
        // Generate random configuration
        fc.record({
          enabled: fc.boolean(),
          enabledForms: fc.record({
            individual: fc.boolean(),
            corporate: fc.boolean(),
            mixed: fc.boolean()
          })
        }),
        // Generate random form type
        fc.constantFrom<FormType>('individual', 'corporate', 'mixed'),
        (config, formType) => {
          const result = isAutoFillEnabled(config as AutoFillConfiguration, formType);

          // Property: auto-fill is enabled IFF both global and form-specific flags are true
          const expectedEnabled = config.enabled && config.enabledForms[formType];
          
          expect(result).toBe(expectedEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should disable auto-fill when globally disabled regardless of form settings', () => {
    fc.assert(
      fc.property(
        // Generate configuration with global disabled
        fc.record({
          enabledForms: fc.record({
            individual: fc.boolean(),
            corporate: fc.boolean(),
            mixed: fc.boolean()
          })
        }),
        fc.constantFrom<FormType>('individual', 'corporate', 'mixed'),
        (partialConfig, formType) => {
          const config: AutoFillConfiguration = {
            enabled: false, // Globally disabled
            ...partialConfig
          };

          const result = isAutoFillEnabled(config, formType);

          // Property: when globally disabled, result is always false
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect form-specific settings when globally enabled', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<FormType>('individual', 'corporate', 'mixed'),
        fc.boolean(),
        (formType, formEnabled) => {
          const config: AutoFillConfiguration = {
            enabled: true, // Globally enabled
            enabledForms: {
              individual: formType === 'individual' ? formEnabled : true,
              corporate: formType === 'corporate' ? formEnabled : true,
              mixed: formType === 'mixed' ? formEnabled : true
            }
          };

          const result = isAutoFillEnabled(config, formType);

          // Property: when globally enabled, result matches form-specific setting
          expect(result).toBe(formEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle all combinations of global and form-specific settings consistently', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // global enabled
        fc.boolean(), // individual enabled
        fc.boolean(), // corporate enabled
        fc.boolean(), // mixed enabled
        (globalEnabled, individualEnabled, corporateEnabled, mixedEnabled) => {
          const config: AutoFillConfiguration = {
            enabled: globalEnabled,
            enabledForms: {
              individual: individualEnabled,
              corporate: corporateEnabled,
              mixed: mixedEnabled
            }
          };

          const individualResult = isAutoFillEnabled(config, 'individual');
          const corporateResult = isAutoFillEnabled(config, 'corporate');
          const mixedResult = isAutoFillEnabled(config, 'mixed');

          // Property: each form type's result is independent and follows the rule
          expect(individualResult).toBe(globalEnabled && individualEnabled);
          expect(corporateResult).toBe(globalEnabled && corporateEnabled);
          expect(mixedResult).toBe(globalEnabled && mixedEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be deterministic for the same configuration and form type', () => {
    fc.assert(
      fc.property(
        fc.record({
          enabled: fc.boolean(),
          enabledForms: fc.record({
            individual: fc.boolean(),
            corporate: fc.boolean(),
            mixed: fc.boolean()
          })
        }),
        fc.constantFrom<FormType>('individual', 'corporate', 'mixed'),
        (config, formType) => {
          const result1 = isAutoFillEnabled(config as AutoFillConfiguration, formType);
          const result2 = isAutoFillEnabled(config as AutoFillConfiguration, formType);

          // Property: calling with same inputs produces same output (deterministic)
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
