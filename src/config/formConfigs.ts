import { FormConfig } from '@/types/formConfig';

// Common field options
const nationalityOptions = [
  { value: 'Nigerian', label: 'Nigerian' },
  { value: 'Foreign', label: 'Foreign' },
  { value: 'Both', label: 'Both' },
];

const idTypeOptions = [
  { value: 'International Passport', label: 'International Passport' },
  { value: 'NIMC', label: 'NIMC' },
  { value: 'Drivers Licence', label: 'Drivers Licence' },
  { value: 'Voters Card', label: 'Voters Card' },
  { value: 'NIN', label: 'NIN' },
];

const sourceOfIncomeOptions = [
  { value: 'Salary or Business Income', label: 'Salary or Business Income' },
  { value: 'Investments or Dividends', label: 'Investments or Dividends' },
  { value: 'Other', label: 'Other (please specify)' },
];

// NFIU Individual Configuration
export const nfiuIndividualConfig: FormConfig = {
  formType: 'nfiu-individual',
  title: 'NFIU Individual Form',
  description: 'NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit. Complete these forms for compliance purposes.',
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      fields: [
        {
          name: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
        },
        {
          name: 'middleName',
          label: 'Middle Name',
          type: 'text',
          required: false,
        },
        {
          name: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
        },
        {
          name: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: true,
          maxDate: new Date(), // Cannot be in the future
        },
        {
          name: 'placeOfBirth',
          label: 'Place of Birth',
          type: 'text',
          required: true,
        },
        {
          name: 'nationality',
          label: 'Nationality',
          type: 'select',
          required: true,
          options: nationalityOptions,
        },
        {
          name: 'occupation',
          label: 'Occupation',
          type: 'text',
          required: true,
        },
        {
          name: 'NIN',
          label: 'NIN (National Identification Number)',
          type: 'text',
          required: true,
          maxLength: 11,
          tooltip: 'Your 11-digit National Identification Number',
        },
        {
          name: 'BVN',
          label: 'BVN (Bank Verification Number)',
          type: 'text',
          required: true,
          maxLength: 11,
          tooltip: 'Bank Verification Number - Required for NFIU compliance',
        },
        {
          name: 'taxIDNo',
          label: 'Tax Identification Number',
          type: 'text',
          required: true,
          tooltip: 'Tax Identification Number - Required for NFIU reporting',
        },
        {
          name: 'identificationType',
          label: 'ID Type',
          type: 'select',
          required: true,
          options: idTypeOptions,
        },
        {
          name: 'idNumber',
          label: 'ID Number',
          type: 'text',
          required: true,
        },
        {
          name: 'issuingBody',
          label: 'Issuing Body',
          type: 'text',
          required: true,
        },
        {
          name: 'issuedDate',
          label: 'Issue Date',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'expiryDate',
          label: 'Expiry Date',
          type: 'date',
          required: false,
          minDate: new Date(),
        },
        {
          name: 'emailAddress',
          label: 'Email Address',
          type: 'email',
          required: false,
        },
        {
          name: 'GSMno',
          label: 'Phone Number',
          type: 'tel',
          required: false,
        },
        {
          name: 'sourceOfIncome',
          label: 'Source of Income',
          type: 'select',
          required: true,
          options: sourceOfIncomeOptions,
        },
        {
          name: 'sourceOfIncomeOther',
          label: 'Please specify other income source',
          type: 'text',
          required: false,
          conditional: {
            field: 'sourceOfIncome',
            value: 'Other',
          },
        },
      ],
    },
    {
      id: 'documents',
      title: 'Document Upload',
      fields: [
        {
          name: 'identification',
          label: 'Upload Means of Identification',
          type: 'file',
          required: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 3,
          tooltip: 'Upload a clear copy of your identification document (PDF, JPG, or PNG, max 3MB)',
        },
      ],
    },
  ],
};

// NFIU Corporate Configuration
export const nfiuCorporateConfig: FormConfig = {
  formType: 'nfiu-corporate',
  title: 'NFIU Corporate Form',
  description: 'NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit. Complete these forms for compliance purposes.',
  sections: [
    {
      id: 'company',
      title: 'Company Information',
      fields: [
        {
          name: 'insured',
          label: 'Company Name',
          type: 'text',
          required: true,
        },
        {
          name: 'officeAddress',
          label: 'Office Address',
          type: 'textarea',
          required: true,
        },
        {
          name: 'ownershipOfCompany',
          label: 'Ownership of Company',
          type: 'select',
          required: false,
          options: nationalityOptions,
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          required: false,
        },
        {
          name: 'incorporationNumber',
          label: 'Incorporation Number',
          type: 'text',
          required: true,
        },
        {
          name: 'incorporationState',
          label: 'State of Incorporation',
          type: 'text',
          required: true,
        },
        {
          name: 'dateOfIncorporationRegistration',
          label: 'Date of Incorporation',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'contactPersonNo',
          label: 'Company Contact Number',
          type: 'tel',
          required: true,
        },
        {
          name: 'businessTypeOccupation',
          label: 'Business Type/Occupation',
          type: 'text',
          required: true,
        },
        {
          name: 'taxIDNo',
          label: 'Tax Identification Number',
          type: 'text',
          required: true,
          tooltip: 'Company Tax ID - Required for NFIU reporting',
        },
        {
          name: 'emailAddress',
          label: 'Email Address of the Company',
          type: 'email',
          required: true,
        },
        {
          name: 'premiumPaymentSource',
          label: 'Premium Payment Source',
          type: 'select',
          required: true,
          options: sourceOfIncomeOptions,
        },
        {
          name: 'premiumPaymentSourceOther',
          label: 'Please specify other payment source',
          type: 'text',
          required: false,
          conditional: {
            field: 'premiumPaymentSource',
            value: 'Other',
          },
        },
      ],
    },
    {
      id: 'accounts',
      title: 'Account Details',
      description: 'Naira account details are mandatory for NFIU compliance',
      fields: [
        {
          name: 'localBankName',
          label: 'Bank Name (Naira Account)',
          type: 'text',
          required: true,
        },
        {
          name: 'localAccountNumber',
          label: 'Account Number (Naira Account)',
          type: 'text',
          required: true,
        },
        {
          name: 'localBankBranch',
          label: 'Bank Branch (Naira Account)',
          type: 'text',
          required: true,
        },
        {
          name: 'localAccountOpeningDate',
          label: 'Account Opening Date (Naira Account)',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'foreignBankName',
          label: 'Bank Name (Domiciliary Account)',
          type: 'text',
          required: false,
        },
        {
          name: 'foreignAccountNumber',
          label: 'Account Number (Domiciliary Account)',
          type: 'text',
          required: false,
        },
        {
          name: 'foreignBankBranch',
          label: 'Bank Branch (Domiciliary Account)',
          type: 'text',
          required: false,
        },
        {
          name: 'foreignAccountOpeningDate',
          label: 'Account Opening Date (Domiciliary Account)',
          type: 'date',
          required: false,
          maxDate: new Date(),
        },
      ],
    },
    {
      id: 'documents',
      title: 'Document Upload',
      fields: [
        {
          name: 'verificationDocUrl',
          label: 'CAC Verification Document',
          type: 'file',
          required: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 3,
          tooltip: 'Upload CAC registration document',
        },
      ],
    },
  ],
};

// KYC Individual Configuration
export const kycIndividualConfig: FormConfig = {
  formType: 'kyc-individual',
  title: 'KYC Individual Form',
  description: 'KYC forms are for customer onboarding and verification. Complete these forms to establish a business relationship.',
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      fields: [
        {
          name: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
        },
        {
          name: 'middleName',
          label: 'Middle Name',
          type: 'text',
          required: false,
        },
        {
          name: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
        },
        {
          name: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'placeOfBirth',
          label: 'Place of Birth',
          type: 'text',
          required: true,
        },
        {
          name: 'nationality',
          label: 'Nationality',
          type: 'select',
          required: true,
          options: nationalityOptions,
        },
        {
          name: 'occupation',
          label: 'Occupation',
          type: 'text',
          required: true,
        },
        {
          name: 'NIN',
          label: 'NIN (National Identification Number)',
          type: 'text',
          required: true,
          maxLength: 11,
          tooltip: 'Your 11-digit National Identification Number',
        },
        // NOTE: BVN field NOT included in KYC
        {
          name: 'taxIDNo',
          label: 'Tax Identification Number',
          type: 'text',
          required: false,
          tooltip: 'Tax Identification Number - Optional for KYC',
        },
        {
          name: 'identificationType',
          label: 'ID Type',
          type: 'select',
          required: true,
          options: idTypeOptions,
        },
        {
          name: 'idNumber',
          label: 'ID Number',
          type: 'text',
          required: true,
        },
        {
          name: 'issuingBody',
          label: 'Issuing Body',
          type: 'text',
          required: true,
        },
        {
          name: 'issuedDate',
          label: 'Issue Date',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'expiryDate',
          label: 'Expiry Date',
          type: 'date',
          required: false,
          minDate: new Date(),
        },
        {
          name: 'emailAddress',
          label: 'Email Address',
          type: 'email',
          required: false,
        },
        {
          name: 'GSMno',
          label: 'Phone Number',
          type: 'tel',
          required: false,
        },
        {
          name: 'sourceOfIncome',
          label: 'Source of Income',
          type: 'select',
          required: true,
          options: sourceOfIncomeOptions,
        },
        {
          name: 'sourceOfIncomeOther',
          label: 'Please specify other income source',
          type: 'text',
          required: false,
          conditional: {
            field: 'sourceOfIncome',
            value: 'Other',
          },
        },
      ],
    },
    {
      id: 'documents',
      title: 'Document Upload',
      fields: [
        {
          name: 'identification',
          label: 'Upload Means of Identification',
          type: 'file',
          required: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 3,
          tooltip: 'Upload a clear copy of your identification document (PDF, JPG, or PNG, max 3MB)',
        },
      ],
    },
    // NOTE: Account Details section NOT included in KYC
  ],
};

// KYC Corporate Configuration
export const kycCorporateConfig: FormConfig = {
  formType: 'kyc-corporate',
  title: 'KYC Corporate Form',
  description: 'KYC forms are for customer onboarding and verification. Complete these forms to establish a business relationship.',
  sections: [
    {
      id: 'company',
      title: 'Company Information',
      fields: [
        {
          name: 'insured',
          label: 'Company Name',
          type: 'text',
          required: true,
        },
        {
          name: 'officeAddress',
          label: 'Office Address',
          type: 'textarea',
          required: true,
        },
        {
          name: 'ownershipOfCompany',
          label: 'Ownership of Company',
          type: 'text',
          required: true,
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          required: true,
        },
        {
          name: 'incorporationNumber',
          label: 'Incorporation Number',
          type: 'text',
          required: true,
        },
        {
          name: 'incorporationState',
          label: 'State of Incorporation',
          type: 'text',
          required: true,
        },
        {
          name: 'dateOfIncorporationRegistration',
          label: 'Date of Incorporation',
          type: 'date',
          required: true,
          maxDate: new Date(),
        },
        {
          name: 'contactPersonNo',
          label: 'Company Contact Number',
          type: 'tel',
          required: true,
        },
        {
          name: 'natureOfBusiness',
          label: 'Business Type',
          type: 'text',
          required: true,
        },
        {
          name: 'businessOccupation',
          label: 'Business Occupation',
          type: 'text',
          required: true,
        },
        {
          name: 'taxIDNo',
          label: 'Tax Identification Number',
          type: 'text',
          required: false,
          tooltip: 'Company Tax ID - Optional for KYC',
        },
        {
          name: 'contactPersonName',
          label: 'Name of Contact Person',
          type: 'text',
          required: true,
          tooltip: 'Primary contact person for this business relationship',
        },
        {
          name: 'contactPersonEmail',
          label: "Contact Person's Email Address",
          type: 'email',
          required: true,
        },
        {
          name: 'estimatedTurnover',
          label: 'Estimated Annual Turnover',
          type: 'text',
          required: true,
          tooltip: 'Estimated annual business turnover',
        },
      ],
    },
    {
      id: 'documents',
      title: 'Document Upload',
      fields: [
        {
          name: 'verificationDocUrl',
          label: 'CAC Verification Document',
          type: 'file',
          required: true,
          accept: '.pdf,.jpg,.jpeg,.png',
          maxSize: 3,
          tooltip: 'Upload CAC registration document',
        },
      ],
    },
    // NOTE: Account Details section NOT included in KYC
    // NOTE: Premium Payment Source field NOT included in KYC
    // NOTE: Office Location field NOT included in KYC
    // NOTE: Name of Branch Office field NOT included in KYC
    // NOTE: BVN field NOT included in directors for KYC
    // NOTE: Residential Address field NOT included in directors for KYC
    // NOTE: Tax ID Number field NOT included in directors for KYC
  ],
};
