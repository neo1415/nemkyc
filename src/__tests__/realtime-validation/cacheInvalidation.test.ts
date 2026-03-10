/**
 * Unit Tests for Cache Invalidation on Identifier Change
 * 
 * Tests the cache invalidation logic that clears cache entries when
 * the identifier field value changes and resets field validation states.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VerificationCache } from '@/services/VerificationCache';
import {
  resetAllFieldStates,
  hasIdentifierChanged,
  handleCacheInvalidationAndReset,
  createInitialFieldState,
  hasAnyMismatchedFields,
  getMismatchedFieldLabels,
  areAllFieldsValidated,
  mergeFieldStates
} from '@/utils/realtimeValidationStateHelpers';
import { FieldValidationConfig, FieldValidationStatus, FieldValidationState } from '@/types/realtimeVerificationValidation';

describe('VerificationCache - Identifier Change Invalidation', () => {
  let cache: VerificationCache;

  beforeEach(() => {
    cache = new VerificationCache();
  });

  describe('invalidateOnIdentifierChange', () => {
    it('should invalidate cache when identifier changes', () => {
      // Setup: Cache data for old identifier
      cache.set('RC123456', { name: 'Test Company' }, 'CAC');
      expect(cache.has('RC123456')).toBe(true);

      // Act: Change identifier
      const result = cache.invalidateOnIdentifierChange('RC123456', 'RC789012');

      // Assert: Old identifier cache is cleared
      expect(result.invalidated).toBe(true);
      expect(result.invalidatedIdentifier).toBe('RC123456');
      expect(cache.has('RC123456')).toBe(false);
    });

    it('should not invalidate when identifier is the same', () => {
      // Setup: Cache data
      cache.set('RC123456', { name: 'Test Company' }, 'CAC');

      // Act: Same identifier
      const result = cache.invalidateOnIdentifierChange('RC123456', 'RC123456');

      // Assert: Cache not invalidated
      expect(result.invalidated).toBe(false);
      expect(result.invalidatedIdentifier).toBe(null);
      expect(cache.has('RC123456')).toBe(true);
    });

    it('should not invalidate when old identifier is null', () => {
      // Act: No old identifier
      const result = cache.invalidateOnIdentifierChange(null, 'RC123456');

      // Assert: No invalidation
      expect(result.invalidated).toBe(false);
      expect(result.invalidatedIdentifier).toBe(null);
    });

    it('should invalidate when new identifier is null (field cleared)', () => {
      // Setup: Cache data
      cache.set('RC123456', { name: 'Test Company' }, 'CAC');

      // Act: Clear identifier
      const result = cache.invalidateOnIdentifierChange('RC123456', null);

      // Assert: Cache invalidated
      expect(result.invalidated).toBe(true);
      expect(result.invalidatedIdentifier).toBe('RC123456');
      expect(cache.has('RC123456')).toBe(false);
    });

    it('should handle invalidation when cache entry does not exist', () => {
      // Act: Try to invalidate non-existent entry
      const result = cache.invalidateOnIdentifierChange('RC999999', 'RC123456');

      // Assert: Returns false but doesn't error
      expect(result.invalidated).toBe(false);
      expect(result.invalidatedIdentifier).toBe(null);
    });

    it('should not invalidate when identifier changes from empty to value (no cache entry)', () => {
      // Act: Change from empty to value (no cache entry for empty string)
      const result = cache.invalidateOnIdentifierChange('', 'RC123456');

      // Assert: No cache entry to invalidate
      expect(result.invalidated).toBe(false);
      expect(result.invalidatedIdentifier).toBe(null);
    });
  });
});

describe('Validation State Reset Helpers', () => {
  const mockFieldsConfig: FieldValidationConfig[] = [
    {
      fieldName: 'companyName',
      fieldLabel: 'Company Name',
      verificationKey: 'name',
      normalizer: (v) => v
    },
    {
      fieldName: 'incorporationDate',
      fieldLabel: 'Incorporation Date',
      verificationKey: 'registrationDate',
      normalizer: (v) => v
    },
    {
      fieldName: 'address',
      fieldLabel: 'Address',
      verificationKey: 'address',
      normalizer: (v) => v
    }
  ];

  describe('createInitialFieldState', () => {
    it('should create initial field state with NOT_VERIFIED status', () => {
      const state = createInitialFieldState();

      expect(state.status).toBe(FieldValidationStatus.NOT_VERIFIED);
      expect(state.errorMessage).toBe(null);
      expect(state.showCheckmark).toBe(false);
      expect(state.showError).toBe(false);
    });
  });

  describe('resetAllFieldStates', () => {
    it('should reset all fields to initial state', () => {
      const resetStates = resetAllFieldStates(mockFieldsConfig);

      expect(Object.keys(resetStates)).toHaveLength(3);
      expect(resetStates.companyName.status).toBe(FieldValidationStatus.NOT_VERIFIED);
      expect(resetStates.incorporationDate.status).toBe(FieldValidationStatus.NOT_VERIFIED);
      expect(resetStates.address.status).toBe(FieldValidationStatus.NOT_VERIFIED);
    });

    it('should clear error messages on reset', () => {
      const resetStates = resetAllFieldStates(mockFieldsConfig);

      Object.values(resetStates).forEach(state => {
        expect(state.errorMessage).toBe(null);
        expect(state.showError).toBe(false);
      });
    });

    it('should clear checkmarks on reset', () => {
      const resetStates = resetAllFieldStates(mockFieldsConfig);

      Object.values(resetStates).forEach(state => {
        expect(state.showCheckmark).toBe(false);
      });
    });

    it('should handle empty fields config', () => {
      const resetStates = resetAllFieldStates([]);

      expect(Object.keys(resetStates)).toHaveLength(0);
    });
  });

  describe('hasIdentifierChanged', () => {
    it('should return true when identifier changes', () => {
      expect(hasIdentifierChanged('RC123456', 'RC789012')).toBe(true);
    });

    it('should return false when identifier is the same', () => {
      expect(hasIdentifierChanged('RC123456', 'RC123456')).toBe(false);
    });

    it('should return false when both are null', () => {
      expect(hasIdentifierChanged(null, null)).toBe(false);
    });

    it('should return true when old is null and new has value', () => {
      expect(hasIdentifierChanged(null, 'RC123456')).toBe(true);
    });

    it('should return true when old has value and new is null', () => {
      expect(hasIdentifierChanged('RC123456', null)).toBe(true);
    });

    it('should return false when both are empty strings', () => {
      expect(hasIdentifierChanged('', '')).toBe(false);
    });

    it('should return true when changing from empty to value', () => {
      expect(hasIdentifierChanged('', 'RC123456')).toBe(true);
    });
  });

  describe('handleCacheInvalidationAndReset', () => {
    it('should return reset result when identifier changes', () => {
      const result = handleCacheInvalidationAndReset(
        'RC123456',
        'RC789012',
        mockFieldsConfig
      );

      expect(result.cacheInvalidated).toBe(true);
      expect(result.invalidatedIdentifier).toBe('RC123456');
      expect(Object.keys(result.resetFieldStates)).toHaveLength(3);
      expect(result.resetFieldNames).toEqual(['companyName', 'incorporationDate', 'address']);
    });

    it('should return empty result when identifier does not change', () => {
      const result = handleCacheInvalidationAndReset(
        'RC123456',
        'RC123456',
        mockFieldsConfig
      );

      expect(result.cacheInvalidated).toBe(false);
      expect(result.invalidatedIdentifier).toBe(null);
      expect(Object.keys(result.resetFieldStates)).toHaveLength(0);
      expect(result.resetFieldNames).toHaveLength(0);
    });

    it('should reset all field states when identifier changes', () => {
      const result = handleCacheInvalidationAndReset(
        'RC123456',
        'RC789012',
        mockFieldsConfig
      );

      Object.values(result.resetFieldStates).forEach(state => {
        expect(state.status).toBe(FieldValidationStatus.NOT_VERIFIED);
        expect(state.errorMessage).toBe(null);
        expect(state.showCheckmark).toBe(false);
        expect(state.showError).toBe(false);
      });
    });
  });

  describe('mergeFieldStates', () => {
    it('should merge current and reset states', () => {
      const currentStates: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        },
        incorporationDate: {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        }
      };

      const resetStates: Record<string, FieldValidationState> = {
        incorporationDate: createInitialFieldState()
      };

      const merged = mergeFieldStates(currentStates, resetStates);

      expect(merged.companyName.status).toBe(FieldValidationStatus.MATCHED);
      expect(merged.incorporationDate.status).toBe(FieldValidationStatus.NOT_VERIFIED);
    });
  });

  describe('hasAnyMismatchedFields', () => {
    it('should return true when there are mismatched fields', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        }
      };

      expect(hasAnyMismatchedFields(states)).toBe(true);
    });

    it('should return false when all fields are matched', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        }
      };

      expect(hasAnyMismatchedFields(states)).toBe(false);
    });

    it('should return false for empty states', () => {
      expect(hasAnyMismatchedFields({})).toBe(false);
    });
  });

  describe('getMismatchedFieldLabels', () => {
    it('should return labels of mismatched fields', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        },
        incorporationDate: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        },
        address: {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        }
      };

      const labels = getMismatchedFieldLabels(states, mockFieldsConfig);

      expect(labels).toEqual(['Company Name', 'Address']);
    });

    it('should return empty array when no mismatches', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        }
      };

      const labels = getMismatchedFieldLabels(states, mockFieldsConfig);

      expect(labels).toEqual([]);
    });
  });

  describe('areAllFieldsValidated', () => {
    it('should return true when all fields are validated', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        },
        incorporationDate: {
          status: FieldValidationStatus.MISMATCHED,
          errorMessage: 'Error',
          showCheckmark: false,
          showError: true
        },
        address: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        }
      };

      expect(areAllFieldsValidated(states, mockFieldsConfig)).toBe(true);
    });

    it('should return false when some fields are not verified', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.MATCHED,
          errorMessage: null,
          showCheckmark: true,
          showError: false
        },
        incorporationDate: {
          status: FieldValidationStatus.NOT_VERIFIED,
          errorMessage: null,
          showCheckmark: false,
          showError: false
        }
      };

      expect(areAllFieldsValidated(states, mockFieldsConfig)).toBe(false);
    });

    it('should return false when some fields are pending', () => {
      const states: Record<string, FieldValidationState> = {
        companyName: {
          status: FieldValidationStatus.PENDING,
          errorMessage: null,
          showCheckmark: false,
          showError: false
        }
      };

      expect(areAllFieldsValidated(states, mockFieldsConfig)).toBe(false);
    });
  });
});

describe('Integration: Cache Invalidation with State Reset', () => {
  let cache: VerificationCache;
  const mockFieldsConfig: FieldValidationConfig[] = [
    {
      fieldName: 'companyName',
      fieldLabel: 'Company Name',
      verificationKey: 'name',
      normalizer: (v) => v
    },
    {
      fieldName: 'incorporationDate',
      fieldLabel: 'Incorporation Date',
      verificationKey: 'registrationDate',
      normalizer: (v) => v
    }
  ];

  beforeEach(() => {
    cache = new VerificationCache();
  });

  it('should invalidate cache and reset states when identifier changes', () => {
    // Setup: Cache data and create field states
    cache.set('RC123456', { name: 'Old Company' }, 'CAC');
    
    // Simulate field states with validation results
    const currentStates: Record<string, FieldValidationState> = {
      companyName: {
        status: FieldValidationStatus.MATCHED,
        errorMessage: null,
        showCheckmark: true,
        showError: false
      },
      incorporationDate: {
        status: FieldValidationStatus.MISMATCHED,
        errorMessage: 'Date mismatch',
        showCheckmark: false,
        showError: true
      }
    };

    // Act: User changes identifier
    const cacheResult = cache.invalidateOnIdentifierChange('RC123456', 'RC789012');
    const stateResult = handleCacheInvalidationAndReset('RC123456', 'RC789012', mockFieldsConfig);

    // Assert: Cache is invalidated
    expect(cacheResult.invalidated).toBe(true);
    expect(cache.has('RC123456')).toBe(false);

    // Assert: States are reset
    expect(stateResult.cacheInvalidated).toBe(true);
    expect(stateResult.resetFieldStates.companyName.status).toBe(FieldValidationStatus.NOT_VERIFIED);
    expect(stateResult.resetFieldStates.incorporationDate.status).toBe(FieldValidationStatus.NOT_VERIFIED);
    expect(stateResult.resetFieldStates.incorporationDate.errorMessage).toBe(null);
  });

  it('should maintain cache and states when identifier does not change', () => {
    // Setup: Cache data
    cache.set('RC123456', { name: 'Test Company' }, 'CAC');

    // Act: Same identifier
    const cacheResult = cache.invalidateOnIdentifierChange('RC123456', 'RC123456');
    const stateResult = handleCacheInvalidationAndReset('RC123456', 'RC123456', mockFieldsConfig);

    // Assert: Cache maintained
    expect(cacheResult.invalidated).toBe(false);
    expect(cache.has('RC123456')).toBe(true);

    // Assert: No state reset
    expect(stateResult.cacheInvalidated).toBe(false);
    expect(Object.keys(stateResult.resetFieldStates)).toHaveLength(0);
  });

  it('should handle complete workflow: verify -> change identifier -> re-verify', () => {
    // Step 1: Initial verification
    cache.set('RC123456', { name: 'Company A', registrationDate: '2020-01-01' }, 'CAC');
    expect(cache.has('RC123456')).toBe(true);

    // Step 2: User changes identifier
    const invalidationResult = cache.invalidateOnIdentifierChange('RC123456', 'RC789012');
    expect(invalidationResult.invalidated).toBe(true);
    expect(cache.has('RC123456')).toBe(false);

    // Step 3: Reset field states
    const resetResult = handleCacheInvalidationAndReset('RC123456', 'RC789012', mockFieldsConfig);
    expect(resetResult.cacheInvalidated).toBe(true);
    expect(resetResult.resetFieldNames).toEqual(['companyName', 'incorporationDate']);

    // Step 4: New verification with new identifier
    cache.set('RC789012', { name: 'Company B', registrationDate: '2021-01-01' }, 'CAC');
    expect(cache.has('RC789012')).toBe(true);
    expect(cache.has('RC123456')).toBe(false);
  });
});
