export const PUBLIC_CUSTOMER_FORM_TYPES = [
  'Individual KYC',
  'Corporate KYC',
  'Individual CDD',
  'Corporate CDD',
  'NAICOM Corporate CDD',
  'Partners CDD',
  'NAICOM Partners CDD',
  'Agents CDD',
  'Brokers CDD',
] as const;

const PUBLIC_CUSTOMER_FORM_TYPE_SET = new Set<string>(PUBLIC_CUSTOMER_FORM_TYPES);

export const isPublicCustomerFormType = (formType: string): boolean =>
  PUBLIC_CUSTOMER_FORM_TYPE_SET.has(formType);
