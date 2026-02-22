/**
 * FieldMapper Service
 * 
 * This service maps normalized API response data to form fields.
 * It uses flexible field name matching to handle different naming conventions
 * and gracefully skips fields that don't exist in the form.
 */

import { findFormField } from '../../utils/autoFill/fieldMatching';
import { NormalizedNINData, NormalizedCACData } from './DataNormalizer';

/**
 * Represents a mapping between an API field and a form field
 */
export interface FieldMapping {
  formFieldName: string;
  formFieldElement: HTMLInputElement;
  value: string;
  sourceField: string; // Original API field name
}

/**
 * FieldMapper class
 * 
 * Provides methods to map NIN and CAC data to form fields
 */
export class FieldMapper {
  /**
   * Maps NIN data to form fields
   * 
   * Attempts to find matching form fields for each NIN data field:
   * - firstName
   * - middleName
   * - lastName
   * - gender
   * - dateOfBirth
   * - phoneNumber
   * - birthstate
   * - birthlga
   * 
   * Skips fields that:
   * - Don't exist in the form
   * - Have empty/null values
   * - Cannot be matched
   * 
   * @param normalizedData - Normalized NIN data
   * @param formElement - The form element to populate
   * @returns Array of field mappings
   */
  mapNINFields(
    normalizedData: NormalizedNINData,
    formElement: HTMLFormElement
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    console.log('🔍 [FieldMapper] Starting NIN field mapping with data:', normalizedData);

    // Map firstName
    if (normalizedData.firstName) {
      const field = findFormField(formElement, 'firstName');
      console.log(`🔍 [FieldMapper] firstName: ${normalizedData.firstName} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'firstName',
          formFieldElement: field,
          value: normalizedData.firstName,
          sourceField: 'firstName'
        });
      }
    }

    // Map middleName
    if (normalizedData.middleName) {
      const field = findFormField(formElement, 'middleName');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'middleName',
          formFieldElement: field,
          value: normalizedData.middleName,
          sourceField: 'middleName'
        });
      }
    }

    // Map lastName
    if (normalizedData.lastName) {
      const field = findFormField(formElement, 'lastName');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'lastName',
          formFieldElement: field,
          value: normalizedData.lastName,
          sourceField: 'lastName'
        });
      }
    }

    // Map gender
    if (normalizedData.gender) {
      const field = findFormField(formElement, 'gender');
      console.log(`🔍 [FieldMapper] gender: ${normalizedData.gender} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'gender',
          formFieldElement: field,
          value: normalizedData.gender,
          sourceField: 'gender'
        });
      }
    }

    // Map dateOfBirth
    if (normalizedData.dateOfBirth) {
      const field = findFormField(formElement, 'dateOfBirth');
      console.log(`🔍 [FieldMapper] dateOfBirth: ${normalizedData.dateOfBirth} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'dateOfBirth',
          formFieldElement: field,
          value: normalizedData.dateOfBirth,
          sourceField: 'dateOfBirth'
        });
      }
    }

    // Map phoneNumber
    if (normalizedData.phoneNumber) {
      const field = findFormField(formElement, 'phoneNumber');
      console.log(`🔍 [FieldMapper] phoneNumber: ${normalizedData.phoneNumber} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'phoneNumber',
          formFieldElement: field,
          value: normalizedData.phoneNumber,
          sourceField: 'phoneNumber'
        });
      }
    }
    
    console.log(`🔍 [FieldMapper] Total fields mapped: ${mappings.length}`, mappings.map(m => m.sourceField));

    // Map birthstate
    if (normalizedData.birthstate) {
      const field = findFormField(formElement, 'birthstate');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'birthstate',
          formFieldElement: field,
          value: normalizedData.birthstate,
          sourceField: 'birthstate'
        });
      }
    }

    // Map birthlga
    if (normalizedData.birthlga) {
      const field = findFormField(formElement, 'birthlga');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'birthlga',
          formFieldElement: field,
          value: normalizedData.birthlga,
          sourceField: 'birthlga'
        });
      }
    }

    return mappings;
  }

  /**
   * Maps CAC data to form fields
   * 
   * Attempts to find matching form fields for each CAC data field:
   * - companyName
   * - registrationNumber
   * - registrationDate
   * - companyStatus
   * - typeOfEntity
   * 
   * Skips fields that:
   * - Don't exist in the form
   * - Have empty/null values
   * - Cannot be matched
   * 
   * @param normalizedData - Normalized CAC data
   * @param formElement - The form element to populate
   * @returns Array of field mappings
   */
  mapCACFields(
    normalizedData: NormalizedCACData,
    formElement: HTMLFormElement
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    // Map companyName
    if (normalizedData.companyName) {
      const field = findFormField(formElement, 'companyName');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'companyName',
          formFieldElement: field,
          value: normalizedData.companyName,
          sourceField: 'companyName'
        });
      }
    }

    // Map registrationNumber
    if (normalizedData.registrationNumber) {
      const field = findFormField(formElement, 'registrationNumber');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'registrationNumber',
          formFieldElement: field,
          value: normalizedData.registrationNumber,
          sourceField: 'registrationNumber'
        });
      }
    }

    // Map registrationDate
    if (normalizedData.registrationDate) {
      const field = findFormField(formElement, 'registrationDate');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'registrationDate',
          formFieldElement: field,
          value: normalizedData.registrationDate,
          sourceField: 'registrationDate'
        });
      }
    }

    // Map companyStatus
    if (normalizedData.companyStatus) {
      const field = findFormField(formElement, 'companyStatus');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'companyStatus',
          formFieldElement: field,
          value: normalizedData.companyStatus,
          sourceField: 'companyStatus'
        });
      }
    }

    // Map typeOfEntity
    if (normalizedData.typeOfEntity) {
      const field = findFormField(formElement, 'typeOfEntity');
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'typeOfEntity',
          formFieldElement: field,
          value: normalizedData.typeOfEntity,
          sourceField: 'typeOfEntity'
        });
      }
    }

    return mappings;
  }
}
