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
   * @param fieldPrefix - Optional prefix for nested fields (e.g., "directors.0.")
   * @returns Array of field mappings
   */
  mapNINFields(
    normalizedData: NormalizedNINData,
    formElement: HTMLFormElement,
    fieldPrefix: string = ''
  ): FieldMapping[] {
    const mappings: FieldMapping[] = [];
    
    console.log('🔍 [FieldMapper] Starting NIN field mapping with data:', normalizedData);
    console.log('🔍 [FieldMapper] Field prefix:', fieldPrefix || '(none)');

    // Map firstName
    if (normalizedData.firstName) {
      const fieldName = `${fieldPrefix}firstName`;
      const field = findFormField(formElement, fieldName);
      console.log(`🔍 [FieldMapper] firstName: ${normalizedData.firstName} → searching for "${fieldName}" → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.firstName,
          sourceField: 'firstName'
        });
      }
    }

    // Map middleName
    if (normalizedData.middleName) {
      const fieldName = `${fieldPrefix}middleName`;
      const field = findFormField(formElement, fieldName);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.middleName,
          sourceField: 'middleName'
        });
      }
    }

    // Map lastName
    if (normalizedData.lastName) {
      const fieldName = `${fieldPrefix}lastName`;
      const field = findFormField(formElement, fieldName);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.lastName,
          sourceField: 'lastName'
        });
      }
    }

    // Map gender
    if (normalizedData.gender) {
      const fieldName = `${fieldPrefix}gender`;
      const field = findFormField(formElement, fieldName);
      console.log(`🔍 [FieldMapper] gender: ${normalizedData.gender} → searching for "${fieldName}" → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.gender,
          sourceField: 'gender'
        });
      }
    }

    // Map dateOfBirth (try both dob and dateOfBirth)
    if (normalizedData.dateOfBirth) {
      // Try dob first (common abbreviation)
      let fieldName = `${fieldPrefix}dob`;
      let field = findFormField(formElement, fieldName);
      
      // If not found, try dateOfBirth
      if (!field) {
        fieldName = `${fieldPrefix}dateOfBirth`;
        field = findFormField(formElement, fieldName);
      }
      
      console.log(`🔍 [FieldMapper] dateOfBirth: ${normalizedData.dateOfBirth} → searching for "${fieldName}" → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.dateOfBirth,
          sourceField: 'dateOfBirth'
        });
      }
    }

    // Map phoneNumber
    if (normalizedData.phoneNumber) {
      const fieldName = `${fieldPrefix}phoneNumber`;
      const field = findFormField(formElement, fieldName);
      console.log(`🔍 [FieldMapper] phoneNumber: ${normalizedData.phoneNumber} → searching for "${fieldName}" → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.phoneNumber,
          sourceField: 'phoneNumber'
        });
      }
    }
    
    console.log(`🔍 [FieldMapper] Total fields mapped: ${mappings.length}`, mappings.map(m => m.sourceField));

    // Map birthstate (try placeOfBirth as well)
    if (normalizedData.birthstate) {
      let fieldName = `${fieldPrefix}birthstate`;
      let field = findFormField(formElement, fieldName);
      
      // If not found, try placeOfBirth
      if (!field) {
        fieldName = `${fieldPrefix}placeOfBirth`;
        field = findFormField(formElement, fieldName);
      }
      
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
          formFieldElement: field,
          value: normalizedData.birthstate,
          sourceField: 'birthstate'
        });
      }
    }

    // Map birthlga
    if (normalizedData.birthlga) {
      const fieldName = `${fieldPrefix}birthlga`;
      const field = findFormField(formElement, fieldName);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || fieldName,
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
   * - companyName → insured (both forms use "insured" for company name)
   * - registrationNumber
   * - registrationDate → dateOfIncorporationRegistration
   * - companyStatus
   * - typeOfEntity → natureOfBusiness
   * - email → emailAddress (maps to "Email Address of the Company" for NFIU, "Contact Person's Email Address" for KYC)
   * 
   * Skips fields that:
   * - Don't exist in the form
   * - Have empty/null values
   * - Cannot be matched
   * 
   * Note: The email field mapping is flexible - it will map to whichever email field exists in the form.
   * NFIU Corporate has "emailAddress" (labeled "Email Address of the Company")
   * KYC Corporate has "contactPersonEmail" (labeled "Contact Person's Email Address")
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

    console.log('🔍 [FieldMapper] Starting CAC field mapping with data:', normalizedData);

    // Map companyName → insured (both forms use "insured" for company name)
    if (normalizedData.companyName) {
      const field = findFormField(formElement, 'insured');
      console.log(`🔍 [FieldMapper] companyName: ${normalizedData.companyName} → insured field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'insured',
          formFieldElement: field,
          value: normalizedData.companyName,
          sourceField: 'companyName'
        });
      }
    }

    // Map registrationNumber
    if (normalizedData.registrationNumber) {
      const field = findFormField(formElement, 'registrationNumber');
      console.log(`🔍 [FieldMapper] registrationNumber: ${normalizedData.registrationNumber} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'registrationNumber',
          formFieldElement: field,
          value: normalizedData.registrationNumber,
          sourceField: 'registrationNumber'
        });
      }
    }

    // Map registrationDate → dateOfIncorporationRegistration
    if (normalizedData.registrationDate) {
      const field = findFormField(formElement, 'dateOfIncorporationRegistration');
      console.log(`🔍 [FieldMapper] registrationDate: ${normalizedData.registrationDate} → dateOfIncorporationRegistration field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'dateOfIncorporationRegistration',
          formFieldElement: field,
          value: normalizedData.registrationDate,
          sourceField: 'registrationDate'
        });
      }
    }

    // Map companyStatus
    if (normalizedData.companyStatus) {
      const field = findFormField(formElement, 'companyStatus');
      console.log(`🔍 [FieldMapper] companyStatus: ${normalizedData.companyStatus} → field found:`, !!field);
      if (field) {
        mappings.push({
          formFieldName: field.getAttribute('name') || field.getAttribute('id') || 'companyStatus',
          formFieldElement: field,
          value: normalizedData.companyStatus,
          sourceField: 'companyStatus'
        });
      }
    }

    // Map typeOfEntity → natureOfBusiness or businessTypeOccupation
    // KYC Corporate uses: natureOfBusiness
    // NFIU Corporate uses: businessTypeOccupation
    if (normalizedData.typeOfEntity) {
      // Try natureOfBusiness first (KYC Corporate)
      let field = findFormField(formElement, 'natureOfBusiness');
      
      // If not found, try businessTypeOccupation (NFIU Corporate)
      if (!field) {
        field = findFormField(formElement, 'businessTypeOccupation');
      }
      
      console.log(`🔍 [FieldMapper] typeOfEntity: ${normalizedData.typeOfEntity} → field found:`, !!field);
      if (field) {
        const fieldName = field.getAttribute('name') || field.getAttribute('id') || 'natureOfBusiness';
        mappings.push({
          formFieldName: fieldName,
          formFieldElement: field,
          value: normalizedData.typeOfEntity,
          sourceField: 'typeOfEntity'
        });
        console.log(`🔍 [FieldMapper] Mapped typeOfEntity to field: ${fieldName}`);
      }
    }

    console.log(`🔍 [FieldMapper] Total CAC fields mapped: ${mappings.length}`, mappings.map(m => `${m.sourceField} → ${m.formFieldName}`));

    return mappings;
  }
}
