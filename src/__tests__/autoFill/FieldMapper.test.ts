/**
 * Unit Tests: FieldMapper Service
 * 
 * Tests the FieldMapper service with specific form structures and edge cases.
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FieldMapper } from '../../services/autoFill/FieldMapper';
import { NormalizedNINData, NormalizedCACData } from '../../services/autoFill/DataNormalizer';

describe('FieldMapper Service', () => {
  let fieldMapper: FieldMapper;

  beforeEach(() => {
    fieldMapper = new FieldMapper();
  });

  describe('mapNINFields', () => {
    it('should map all fields in individual-kyc form structure', () => {
      const form = document.createElement('form');
      ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber', 'birthstate', 'birthlga'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        middleName: 'Paul',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15',
        phoneNumber: '08012345678',
        birthstate: 'Lagos',
        birthlga: 'Ikeja'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(8);
      expect(mappings.map(m => m.sourceField)).toEqual(
        expect.arrayContaining(['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber', 'birthstate', 'birthlga'])
      );
    });

    it('should map fields in Individual-kyc-form structure (capital I)', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName', 'gender', 'dateOfBirth'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: '1985-05-20'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(4);
      expect(mappings.find(m => m.sourceField === 'firstName')?.value).toBe('Jane');
      expect(mappings.find(m => m.sourceField === 'lastName')?.value).toBe('Smith');
    });

    it('should map fields in brokers-kyc form structure', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName', 'gender', 'dateOfBirth', 'phoneNumber'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'Broker',
        lastName: 'Name',
        gender: 'male',
        dateOfBirth: '1980-03-10',
        phoneNumber: '08098765432'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(5);
    });

    it('should handle forms missing some fields', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15',
        phoneNumber: '08012345678'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(2);
      expect(mappings.map(m => m.sourceField)).toEqual(['firstName', 'lastName']);
    });

    it('should handle nested form structures', () => {
      const form = document.createElement('form');
      const fieldset = document.createElement('fieldset');
      
      ['firstName', 'lastName', 'gender'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        fieldset.appendChild(input);
      });
      
      form.appendChild(fieldset);

      const ninData: NormalizedNINData = {
        firstName: 'Nested',
        lastName: 'User',
        gender: 'female',
        dateOfBirth: '1995-07-25'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(3);
      expect(mappings.map(m => m.sourceField)).toEqual(expect.arrayContaining(['firstName', 'lastName', 'gender']));
    });

    it('should skip fields with empty values', () => {
      const form = document.createElement('form');
      ['firstName', 'middleName', 'lastName'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        middleName: '', // Empty value
        lastName: 'Doe',
        gender: '',
        dateOfBirth: ''
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(2);
      expect(mappings.map(m => m.sourceField)).toEqual(['firstName', 'lastName']);
    });

    it('should handle optional fields correctly', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName', 'middleName', 'phoneNumber'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15'
        // middleName and phoneNumber are undefined
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(2);
      expect(mappings.map(m => m.sourceField)).toEqual(['firstName', 'lastName']);
    });
  });

  describe('mapCACFields', () => {
    it('should map all fields in corporate-kyc form structure', () => {
      const form = document.createElement('form');
      ['companyName', 'registrationNumber', 'registrationDate', 'companyStatus', 'typeOfEntity'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const cacData: NormalizedCACData = {
        companyName: 'Tech Solutions Limited',
        registrationNumber: '123456',
        registrationDate: '2020-05-15',
        companyStatus: 'Active',
        typeOfEntity: 'Private Limited Company'
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(5);
      expect(mappings.map(m => m.sourceField)).toEqual(
        expect.arrayContaining(['companyName', 'registrationNumber', 'registrationDate', 'companyStatus', 'typeOfEntity'])
      );
    });

    it('should map fields in corporate-kyc-form structure', () => {
      const form = document.createElement('form');
      ['companyName', 'registrationNumber', 'companyStatus'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const cacData: NormalizedCACData = {
        companyName: 'Business Corp',
        registrationNumber: '789012',
        registrationDate: '2019-03-20',
        companyStatus: 'Active'
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(3);
      expect(mappings.find(m => m.sourceField === 'companyName')?.value).toBe('Business Corp');
    });

    it('should handle forms missing some fields', () => {
      const form = document.createElement('form');
      ['companyName', 'registrationNumber'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const cacData: NormalizedCACData = {
        companyName: 'Test Company',
        registrationNumber: '456789',
        registrationDate: '2021-08-10',
        companyStatus: 'Active',
        typeOfEntity: 'LLC'
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(2);
      expect(mappings.map(m => m.sourceField)).toEqual(['companyName', 'registrationNumber']);
    });

    it('should handle nested form structures', () => {
      const form = document.createElement('form');
      const div = document.createElement('div');
      
      ['companyName', 'registrationNumber', 'companyStatus'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        div.appendChild(input);
      });
      
      form.appendChild(div);

      const cacData: NormalizedCACData = {
        companyName: 'Nested Corp',
        registrationNumber: '111222',
        registrationDate: '2018-12-01',
        companyStatus: 'Active'
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(3);
    });

    it('should skip fields with empty values', () => {
      const form = document.createElement('form');
      ['companyName', 'registrationNumber', 'typeOfEntity'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const cacData: NormalizedCACData = {
        companyName: 'Company Name',
        registrationNumber: '',
        registrationDate: '',
        companyStatus: ''
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].sourceField).toBe('companyName');
    });

    it('should handle optional typeOfEntity field', () => {
      const form = document.createElement('form');
      ['companyName', 'registrationNumber', 'companyStatus', 'typeOfEntity'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const cacData: NormalizedCACData = {
        companyName: 'Simple Corp',
        registrationNumber: '999888',
        registrationDate: '2022-01-01',
        companyStatus: 'Active'
        // typeOfEntity is undefined
      };

      const mappings = fieldMapper.mapCACFields(cacData, form);

      expect(mappings).toHaveLength(3);
      expect(mappings.map(m => m.sourceField)).toEqual(['companyName', 'registrationNumber', 'companyStatus']);
    });
  });

  describe('Field Mapping Edge Cases', () => {
    it('should return empty array when form has no matching fields', () => {
      const form = document.createElement('form');
      ['field1', 'field2', 'field3'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(0);
    });

    it('should handle forms with select and textarea elements', () => {
      const form = document.createElement('form');
      
      const firstNameInput = document.createElement('input');
      firstNameInput.setAttribute('name', 'firstName');
      form.appendChild(firstNameInput);

      const genderSelect = document.createElement('select');
      genderSelect.setAttribute('name', 'gender');
      form.appendChild(genderSelect);

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      expect(mappings).toHaveLength(2);
      expect(mappings.find(m => m.sourceField === 'gender')?.formFieldElement.tagName).toBe('SELECT');
    });

    it('should preserve source field names in mappings', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      mappings.forEach(mapping => {
        expect(mapping.sourceField).toBeTruthy();
        expect(['firstName', 'lastName']).toContain(mapping.sourceField);
      });
    });

    it('should include form field elements in mappings', () => {
      const form = document.createElement('form');
      ['firstName', 'lastName'].forEach(name => {
        const input = document.createElement('input');
        input.setAttribute('name', name);
        form.appendChild(input);
      });

      const ninData: NormalizedNINData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        dateOfBirth: '1990-01-15'
      };

      const mappings = fieldMapper.mapNINFields(ninData, form);

      mappings.forEach(mapping => {
        expect(mapping.formFieldElement).toBeInstanceOf(HTMLInputElement);
        expect(form.contains(mapping.formFieldElement)).toBe(true);
      });
    });
  });
});
