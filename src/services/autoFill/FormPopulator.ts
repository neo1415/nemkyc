/**
 * FormPopulator Service
 * 
 * This service updates React form state with mapped field values.
 * It handles both controlled and uncontrolled components, checks for user modifications,
 * marks fields as auto-filled, and triggers validation.
 */

import { FieldMapping } from './FieldMapper';

/**
 * Result of a population operation
 */
export interface PopulationResult {
  success: boolean;
  populatedFields: string[];
  skippedFields: string[];
  errors: FieldError[];
}

/**
 * Error that occurred during field population
 */
export interface FieldError {
  fieldName: string;
  error: string;
}

/**
 * FormPopulator class
 * 
 * Provides methods to populate form fields with auto-fill data
 */
export class FormPopulator {
  private autoFilledFields: Set<string> = new Set();
  private userModifiedFields: Set<string> = new Set();
  private reactHookFormSetValue?: (name: string, value: any) => void;

  /**
   * Sets the React Hook Form setValue function for custom component support
   * 
   * @param setValue - React Hook Form's setValue function
   */
  setReactHookFormSetValue(setValue: (name: string, value: any) => void): void {
    this.reactHookFormSetValue = setValue;
  }

  /**
   * Populates form fields with mapped data
   * 
   * For React controlled components:
   * - Updates state using the provided setter function
   * - Marks fields as auto-filled in state
   * 
   * For uncontrolled components:
   * - Sets the value directly on the input element
   * - Dispatches input and change events to trigger validation
   * 
   * Skips fields that:
   * - Have been modified by the user
   * - Already have values (unless overwrite is true)
   * 
   * @param mappings - Array of field mappings to populate
   * @param formState - Current form state (for controlled components)
   * @param setFormState - State setter function (for controlled components)
   * @param options - Population options
   * @returns Population result with success status and details
   */
  populateFields(
    mappings: FieldMapping[],
    formState?: any,
    setFormState?: Function,
    options: {
      overwriteUserInput?: boolean;
      markAsAutoFilled?: boolean;
    } = {}
  ): PopulationResult {
    const {
      overwriteUserInput = false,
      markAsAutoFilled = true
    } = options;

    const result: PopulationResult = {
      success: true,
      populatedFields: [],
      skippedFields: [],
      errors: []
    };

    for (const mapping of mappings) {
      try {
        const fieldName = mapping.formFieldName;
        const fieldElement = mapping.formFieldElement;
        const value = mapping.value;

        // Skip if user has modified this field
        if (!overwriteUserInput && this.userModifiedFields.has(fieldName)) {
          result.skippedFields.push(fieldName);
          continue;
        }

        // Skip if field already has a value (user may have filled it)
        if (!overwriteUserInput && fieldElement.value && fieldElement.value.trim() !== '') {
          result.skippedFields.push(fieldName);
          this.userModifiedFields.add(fieldName);
          continue;
        }

        // Populate the field
        if (setFormState && formState !== undefined) {
          // Controlled component - update state
          this.populateControlledField(fieldName, value, formState, setFormState, markAsAutoFilled);
        } else {
          // Try React Hook Form setValue first (for custom components like Select)
          if (this.reactHookFormSetValue) {
            this.reactHookFormSetValue(fieldName, value);
          }
          
          // Also update DOM directly for standard inputs
          this.populateUncontrolledField(fieldElement, value);
        }

        // Mark as auto-filled
        if (markAsAutoFilled) {
          this.autoFilledFields.add(fieldName);
          this.markFieldAsAutoFilled(fieldElement);
        }

        result.populatedFields.push(fieldName);
      } catch (error: any) {
        result.errors.push({
          fieldName: mapping.formFieldName,
          error: error.message || 'Unknown error'
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Populates a controlled React component field
   * 
   * Updates the form state using the setter function and marks the field
   * as auto-filled in the state.
   * 
   * @param fieldName - Name of the field to populate
   * @param value - Value to set
   * @param formState - Current form state
   * @param setFormState - State setter function
   * @param markAsAutoFilled - Whether to mark field as auto-filled in state
   */
  private populateControlledField(
    fieldName: string,
    value: string,
    formState: any,
    setFormState: Function,
    markAsAutoFilled: boolean
  ): void {
    setFormState((prev: any) => ({
      ...prev,
      [fieldName]: value,
      ...(markAsAutoFilled && { [`${fieldName}_autoFilled`]: true })
    }));
  }

  /**
   * Populates an uncontrolled component field
   * 
   * Sets the value directly on the input element and dispatches
   * input and change events to trigger validation and other listeners.
   * 
   * @param fieldElement - The input element to populate
   * @param value - Value to set
   */
  private populateUncontrolledField(fieldElement: HTMLInputElement, value: string): void {
    fieldElement.value = value;
    
    // Dispatch events to trigger validation and listeners
    fieldElement.dispatchEvent(new Event('input', { bubbles: true }));
    fieldElement.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Marks a field as auto-filled with a visual indicator
   * 
   * Adds a CSS class and data attribute to the field element
   * to enable visual styling and identification.
   * 
   * @param fieldElement - The input element to mark
   */
  private markFieldAsAutoFilled(fieldElement: HTMLInputElement): void {
    fieldElement.classList.add('auto-filled');
    fieldElement.setAttribute('data-auto-filled', 'true');
  }

  /**
   * Checks if a field was auto-filled
   * 
   * @param fieldName - Name of the field to check
   * @returns True if the field was auto-filled
   */
  isFieldAutoFilled(fieldName: string): boolean {
    return this.autoFilledFields.has(fieldName);
  }

  /**
   * Marks a field as modified by the user
   * 
   * This prevents the field from being overwritten by auto-fill
   * in subsequent operations.
   * 
   * @param fieldName - Name of the field to mark
   */
  markFieldAsModified(fieldName: string): void {
    this.userModifiedFields.add(fieldName);
    this.autoFilledFields.delete(fieldName);
  }

  /**
   * Clears all auto-fill markers
   * 
   * Removes visual indicators from all auto-filled fields
   * and clears the internal tracking sets.
   */
  clearAutoFillMarkers(): void {
    // Clear tracking sets
    this.autoFilledFields.clear();
    this.userModifiedFields.clear();

    // Remove visual markers from DOM
    const autoFilledElements = document.querySelectorAll('.auto-filled');
    autoFilledElements.forEach(element => {
      element.classList.remove('auto-filled');
      element.removeAttribute('data-auto-filled');
    });
  }

  /**
   * Gets the list of auto-filled field names
   * 
   * @returns Array of field names that were auto-filled
   */
  getAutoFilledFields(): string[] {
    return Array.from(this.autoFilledFields);
  }

  /**
   * Gets the list of user-modified field names
   * 
   * @returns Array of field names that were modified by the user
   */
  getUserModifiedFields(): string[] {
    return Array.from(this.userModifiedFields);
  }
}
