/**
 * Unit Tests: FormTypeDetector
 * 
 * Tests for the FormTypeDetector service that analyzes form structure
 * to determine if it's for individuals, corporations, or mixed.
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormTypeDetector } from '../../services/autoFill/FormTypeDetector';
import { FormType, IdentifierType } from '../../types/autoFill';

describe('FormTypeDetector', () => {
  let detector: FormTypeDetector;

  beforeEach(() => {
    detector = new FormTypeDetector();
  });

  describe('detectFormType', () => {
    it('should detect individual form with NIN field', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'nin');
      form.appendChild(ninInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.INDIVIDUAL);
    });

    it('should detect corporate form with CAC field', () => {
      const form = document.createElement('form');
      const cacInput = document.createElement('input');
      cacInput.setAttribute('name', 'cac');
      form.appendChild(cacInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.CORPORATE);
    });

    it('should detect corporate form with RC number field', () => {
      const form = document.createElement('form');
      const rcInput = document.createElement('input');
      rcInput.setAttribute('name', 'rcNumber');
      form.appendChild(rcInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.CORPORATE);
    });

    it('should detect mixed form with both NIN and CAC fields', () => {
      const form = document.createElement('form');
      
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'nin');
      form.appendChild(ninInput);
      
      const cacInput = document.createElement('input');
      cacInput.setAttribute('name', 'cac');
      form.appendChild(cacInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.MIXED);
    });

    it('should return null for form with no identifier fields', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.setAttribute('name', 'firstName');
      form.appendChild(nameInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBeNull();
    });

    it('should detect NIN field with snake_case naming', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'national_id');
      form.appendChild(ninInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.INDIVIDUAL);
    });

    it('should detect CAC field with snake_case naming', () => {
      const form = document.createElement('form');
      const rcInput = document.createElement('input');
      rcInput.setAttribute('name', 'rc_number');
      form.appendChild(rcInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.CORPORATE);
    });

    it('should detect NIN field by id attribute', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('id', 'nin');
      form.appendChild(ninInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.INDIVIDUAL);
    });

    it('should detect CAC field by id attribute', () => {
      const form = document.createElement('form');
      const cacInput = document.createElement('input');
      cacInput.setAttribute('id', 'registrationNumber');
      form.appendChild(cacInput);

      const formType = detector.detectFormType(form);
      expect(formType).toBe(FormType.CORPORATE);
    });
  });

  describe('supportsIdentifierType', () => {
    it('should return true for form with NIN field', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'nin');
      form.appendChild(ninInput);

      const supports = detector.supportsIdentifierType(form, IdentifierType.NIN);
      expect(supports).toBe(true);
    });

    it('should return false for form without NIN field', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.setAttribute('name', 'firstName');
      form.appendChild(nameInput);

      const supports = detector.supportsIdentifierType(form, IdentifierType.NIN);
      expect(supports).toBe(false);
    });

    it('should return true for form with CAC field', () => {
      const form = document.createElement('form');
      const cacInput = document.createElement('input');
      cacInput.setAttribute('name', 'cac');
      form.appendChild(cacInput);

      const supports = detector.supportsIdentifierType(form, IdentifierType.CAC);
      expect(supports).toBe(true);
    });

    it('should return false for form without CAC field', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.setAttribute('name', 'firstName');
      form.appendChild(nameInput);

      const supports = detector.supportsIdentifierType(form, IdentifierType.CAC);
      expect(supports).toBe(false);
    });
  });

  describe('getIdentifierField', () => {
    it('should find NIN field by name', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'nin');
      form.appendChild(ninInput);

      const field = detector.getIdentifierField(form, IdentifierType.NIN);
      expect(field).toBe(ninInput);
    });

    it('should find CAC field by name', () => {
      const form = document.createElement('form');
      const cacInput = document.createElement('input');
      cacInput.setAttribute('name', 'rcNumber');
      form.appendChild(cacInput);

      const field = detector.getIdentifierField(form, IdentifierType.CAC);
      expect(field).toBe(cacInput);
    });

    it('should return null when NIN field not found', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.setAttribute('name', 'firstName');
      form.appendChild(nameInput);

      const field = detector.getIdentifierField(form, IdentifierType.NIN);
      expect(field).toBeNull();
    });

    it('should return null when CAC field not found', () => {
      const form = document.createElement('form');
      const nameInput = document.createElement('input');
      nameInput.setAttribute('name', 'firstName');
      form.appendChild(nameInput);

      const field = detector.getIdentifierField(form, IdentifierType.CAC);
      expect(field).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'NIN');
      form.appendChild(ninInput);

      const field = detector.getIdentifierField(form, IdentifierType.NIN);
      expect(field).toBe(ninInput);
    });

    it('should find field with spaces in name', () => {
      const form = document.createElement('form');
      const ninInput = document.createElement('input');
      ninInput.setAttribute('name', 'national id');
      form.appendChild(ninInput);

      const field = detector.getIdentifierField(form, IdentifierType.NIN);
      expect(field).toBe(ninInput);
    });

    it('should find first matching field when multiple exist', () => {
      const form = document.createElement('form');
      
      const ninInput1 = document.createElement('input');
      ninInput1.setAttribute('name', 'nin');
      form.appendChild(ninInput1);
      
      const ninInput2 = document.createElement('input');
      ninInput2.setAttribute('name', 'nationalId');
      form.appendChild(ninInput2);

      const field = detector.getIdentifierField(form, IdentifierType.NIN);
      expect(field).toBe(ninInput1);
    });
  });
});
