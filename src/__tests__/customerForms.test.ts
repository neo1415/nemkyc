import { describe, expect, it } from 'vitest';
import { PUBLIC_CUSTOMER_FORM_TYPES, isPublicCustomerFormType } from '../config/customerForms';

describe('customer submission form registry', () => {
  it('covers both KYC forms and every routed CDD form', () => {
    expect(PUBLIC_CUSTOMER_FORM_TYPES).toEqual([
      'Individual KYC', 'Corporate KYC', 'Individual CDD', 'Corporate CDD',
      'NAICOM Corporate CDD', 'Partners CDD', 'NAICOM Partners CDD',
      'Agents CDD', 'Brokers CDD',
    ]);

    for (const formType of PUBLIC_CUSTOMER_FORM_TYPES) {
      expect(isPublicCustomerFormType(formType), formType).toBe(true);
    }
  });

  it('does not make claims or NFIU forms public', () => {
    expect(isPublicCustomerFormType('Motor Claim')).toBe(false);
    expect(isPublicCustomerFormType('Corporate NFIU')).toBe(false);
  });
});
