/**
 * FormTypeDetector Service
 * 
 * This service analyzes form structure to determine if it's for individuals (NIN),
 * corporations (CAC), or mixed (both). It scans form fields to identify identifier
 * types and provides methods to check form capabilities.
 */

import { FormType, IdentifierType } from '../../types/autoFill';

/**
 * FormTypeDetector class
 * 
 * Provides methods to detect form type and locate identifier fields
 */
export class FormTypeDetector {
  /**
   * Detects the form type by analyzing field names
   * 
   * Scans the form for:
   * - NIN fields: nin, nationalId, national_id, nationalIdentificationNumber
   * - CAC fields: cac, rc, rcNumber, rc_number, registrationNumber, registration_number
   * 
   * Returns:
   * - 'individual' if only NIN fields found
   * - 'corporate' if only CAC fields found
   * - 'mixed' if both NIN and CAC fields found
   * - null if neither found
   * 
   * @param formElement - The form element to analyze
   * @returns The detected form type or null
   */
  detectFormType(formElement: HTMLFormElement): FormType | null {
    const hasNIN = this.supportsIdentifierType(formElement, IdentifierType.NIN);
    const hasCAC = this.supportsIdentifierType(formElement, IdentifierType.CAC);

    if (hasNIN && hasCAC) {
      return FormType.MIXED;
    } else if (hasNIN) {
      return FormType.INDIVIDUAL;
    } else if (hasCAC) {
      return FormType.CORPORATE;
    } else {
      return null;
    }
  }

  /**
   * Checks if the form supports a specific identifier type
   * 
   * For NIN: Looks for fields with names containing:
   * - nin
   * - nationalid
   * - national_id
   * - nationalidentificationnumber
   * 
   * For CAC: Looks for fields with names containing:
   * - cac
   * - rc
   * - rcnumber
   * - rc_number
   * - registrationnumber
   * - registration_number
   * 
   * @param formElement - The form element to check
   * @param type - The identifier type to check for
   * @returns True if the form supports this identifier type
   */
  supportsIdentifierType(formElement: HTMLFormElement, type: IdentifierType): boolean {
    return this.getIdentifierField(formElement, type) !== null;
  }

  /**
   * Gets the identifier field element for a specific type
   * 
   * Searches for input fields by name or id attributes.
   * Uses case-insensitive matching and handles various naming conventions.
   * 
   * @param formElement - The form element to search
   * @param type - The identifier type to find
   * @returns The input element or null if not found
   */
  getIdentifierField(formElement: HTMLFormElement, type: IdentifierType): HTMLInputElement | null {
    // Get all input elements in the form
    const inputs = formElement.querySelectorAll('input');

    // Define search patterns for each identifier type
    const patterns: Record<IdentifierType, string[]> = {
      [IdentifierType.NIN]: [
        'nin',
        'nationalid',
        'national_id',
        'national-id',
        'nationalidentificationnumber',
        'national_identification_number',
        'national-identification-number'
      ],
      [IdentifierType.CAC]: [
        'cac',
        'rc',
        'rcnumber',
        'rc_number',
        'rc-number',
        'registrationnumber',
        'registration_number',
        'registration-number',
        'cacnumber',
        'cac_number',
        'cac-number'
      ]
    };

    const searchPatterns = patterns[type];

    // Search through all inputs
    for (const input of Array.from(inputs)) {
      const name = (input.getAttribute('name') || '').toLowerCase().replace(/\s+/g, '');
      const id = (input.getAttribute('id') || '').toLowerCase().replace(/\s+/g, '');

      // Check if name or id matches any pattern
      for (const pattern of searchPatterns) {
        if (name.includes(pattern) || id.includes(pattern)) {
          return input as HTMLInputElement;
        }
      }
    }

    return null;
  }
}
