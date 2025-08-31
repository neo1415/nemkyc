/**
 * PDF Generation Blueprints for NEM Insurance Forms
 * 
 * This file contains the mapping configurations for converting form submissions
 * into structured PDF documents. Each blueprint defines how form data should
 * be organized, labeled, and displayed in the generated PDF.
 */

import { PDFBlueprint } from '../components/pdf/DynamicPDFGenerator';

export const PDF_BLUEPRINTS: Record<string, PDFBlueprint> = {
  'money-insurance-claims': {
    title: 'Money Insurance Claim Form',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', section: 'Policy Details' },
          { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', section: 'Policy Details' },
          { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', section: 'Policy Details' },
        ]
      },
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', section: 'Company Information' },
          { key: 'address', label: 'Address', type: 'textarea', section: 'Company Information' },
          { key: 'phone', label: 'Phone Number', type: 'text', section: 'Company Information' },
          { key: 'email', label: 'Email Address', type: 'email', section: 'Company Information' },
        ]
      },
      {
        title: 'Details of Loss',
        fields: [
          { key: 'lossDate', label: 'Date of Loss', type: 'date', section: 'Details of Loss' },
          { key: 'lossTime', label: 'Time of Loss', type: 'text', section: 'Details of Loss' },
          { key: 'lossLocation', label: 'Location of Loss', type: 'textarea', section: 'Details of Loss' },
          { key: 'moneyLocation', label: 'Money Location', type: 'text', section: 'Details of Loss' },
          { key: 'lossAmount', label: 'Amount of Loss', type: 'currency', section: 'Details of Loss' },
          { key: 'lossDescription', label: 'Description of Loss', type: 'textarea', section: 'Details of Loss' },
          { key: 'howItHappened', label: 'How it Happened', type: 'textarea', section: 'Details of Loss' },
        ]
      },
      {
        title: 'Loss in Transit Details',
        fields: [
          { key: 'discovererName', label: 'Person who Discovered Loss', type: 'text', section: 'Loss in Transit Details' },
          { key: 'discovererPosition', label: 'Position', type: 'text', section: 'Loss in Transit Details' },
          { key: 'discovererSalary', label: 'Salary', type: 'currency', section: 'Loss in Transit Details' },
          { key: 'policeEscort', label: 'Police Escort', type: 'text', section: 'Loss in Transit Details' },
          { key: 'amountAtStart', label: 'Amount at Journey Start', type: 'currency', section: 'Loss in Transit Details' },
          { key: 'disbursements', label: 'Disbursements Made', type: 'currency', section: 'Loss in Transit Details' },
          { key: 'doubtIntegrity', label: 'Doubt Employee Integrity', type: 'text', section: 'Loss in Transit Details' },
          { key: 'integrityExplanation', label: 'Integrity Explanation', type: 'textarea', section: 'Loss in Transit Details', conditional: { dependsOn: 'doubtIntegrity', value: 'yes' } },
        ]
      },
      {
        title: 'Loss in Safe Details',
        fields: [
          { key: 'safeType', label: 'Safe Type', type: 'text', section: 'Loss in Safe Details' },
          { key: 'keyholders', label: 'Key Holders', type: 'array', section: 'Loss in Safe Details' },
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { key: 'policeNotified', label: 'Police Notified', type: 'text', section: 'Additional Information' },
          { key: 'policeStation', label: 'Police Station', type: 'text', section: 'Additional Information', conditional: { dependsOn: 'policeNotified', value: 'yes' } },
          { key: 'previousLoss', label: 'Previous Loss', type: 'text', section: 'Additional Information' },
          { key: 'previousLossDetails', label: 'Previous Loss Details', type: 'textarea', section: 'Additional Information', conditional: { dependsOn: 'previousLoss', value: 'yes' } },
        ]
      }
    ],
    specialHandling: {
      rentAssuranceNote: false,
      directorHandling: false
    }
  },

  'rent-assurance-claims': {
    title: 'Rent Assurance Claim Form',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', section: 'Policy Details' },
          { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', section: 'Policy Details' },
          { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', section: 'Policy Details' },
        ]
      },
      {
        title: 'Insured Details (Tenant)',
        fields: [
          { key: 'nameOfInsured', label: 'Name of Insured (Tenant)', type: 'text', section: 'Insured Details' },
          { key: 'address', label: 'Address', type: 'textarea', section: 'Insured Details' },
          { key: 'age', label: 'Age', type: 'number', section: 'Insured Details' },
          { key: 'email', label: 'Email Address', type: 'email', section: 'Insured Details' },
          { key: 'phone', label: 'Phone Number', type: 'text', section: 'Insured Details' },
          { key: 'livingAtPremisesFrom', label: 'Living at Premises From', type: 'date', section: 'Insured Details' },
          { key: 'livingAtPremisesTo', label: 'Living at Premises To', type: 'date', section: 'Insured Details' },
        ]
      },
      {
        title: 'Landlord Details',
        fields: [
          { key: 'nameOfLandlord', label: 'Name of Landlord', type: 'text', section: 'Landlord Details' },
          { key: 'addressOfLandlord', label: 'Address of Landlord', type: 'textarea', section: 'Landlord Details' },
          { key: 'nameOfBeneficiary', label: 'Name of Beneficiary (Landlord)', type: 'text', section: 'Landlord Details' },
          { key: 'beneficiaryAge', label: 'Beneficiary Age', type: 'number', section: 'Landlord Details' },
          { key: 'beneficiaryOccupation', label: 'Beneficiary Occupation', type: 'text', section: 'Landlord Details' },
          { key: 'beneficiaryAddress', label: 'Beneficiary Address', type: 'textarea', section: 'Landlord Details' },
          { key: 'beneficiaryEmail', label: 'Beneficiary Email', type: 'email', section: 'Landlord Details' },
          { key: 'beneficiaryPhone', label: 'Beneficiary Phone', type: 'text', section: 'Landlord Details' },
        ]
      },
      {
        title: 'Claim Information',
        fields: [
          { key: 'periodOfDefaultFrom', label: 'Period of Default From', type: 'date', section: 'Claim Information' },
          { key: 'periodOfDefaultTo', label: 'Period of Default To', type: 'date', section: 'Claim Information' },
          { key: 'amountDefaulted', label: 'Amount Defaulted', type: 'currency', section: 'Claim Information' },
          { key: 'rentDueDate', label: 'Rent Due Date', type: 'date', section: 'Claim Information' },
          { key: 'rentPaymentFrequency', label: 'Rent Payment Frequency', type: 'text', section: 'Claim Information' },
          { key: 'rentPaymentFrequencyOther', label: 'Other Frequency Details', type: 'text', section: 'Claim Information', conditional: { dependsOn: 'rentPaymentFrequency', value: 'other' } },
          { key: 'causeOfInabilityToPay', label: 'Cause of Inability to Pay', type: 'textarea', section: 'Claim Information' },
        ]
      }
    ],
    specialHandling: {
      rentAssuranceNote: true,
      directorHandling: false
    }
  },

  'generic-form': {
    title: 'NEM Insurance Form',
    sections: [
      {
        title: 'Policy Information',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', section: 'Policy Information' },
          { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', section: 'Policy Information' },
          { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', section: 'Policy Information' },
        ]
      },
      {
        title: 'Insured Details',
        fields: [
          { key: 'nameOfInsured', label: 'Name of Insured', type: 'text', section: 'Insured Details' },
          { key: 'companyName', label: 'Company Name', type: 'text', section: 'Insured Details' },
          { key: 'fullName', label: 'Full Name', type: 'text', section: 'Insured Details' },
          { key: 'address', label: 'Address', type: 'textarea', section: 'Insured Details' },
          { key: 'email', label: 'Email Address', type: 'email', section: 'Insured Details' },
          { key: 'phone', label: 'Phone Number', type: 'text', section: 'Insured Details' },
        ]
      },
      {
        title: 'Claim/Incident Details',
        fields: [
          { key: 'dateOfOccurrence', label: 'Date of Occurrence', type: 'date', section: 'Claim Details' },
          { key: 'timeOfOccurrence', label: 'Time of Occurrence', type: 'text', section: 'Claim Details' },
          { key: 'incidentLocation', label: 'Incident Location', type: 'textarea', section: 'Claim Details' },
          { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'textarea', section: 'Claim Details' },
          { key: 'estimateOfLoss', label: 'Estimate of Loss', type: 'currency', section: 'Claim Details' },
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          // This section will be dynamically populated with any unmatched fields
        ]
      }
    ],
    specialHandling: {
      rentAssuranceNote: false,
      directorHandling: false
    }
  }
};

/**
 * Field mappings for different form types
 * This helps normalize field names across different form variants
 */
export const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  'money-insurance-claims': {
    'nameOfInsured': 'companyName',
    'dateOfLoss': 'lossDate',
    'timeOfLoss': 'lossTime',
    'locationOfLoss': 'lossLocation'
  },
  'rent-assurance-claims': {
    'tenantName': 'nameOfInsured',
    'landlordName': 'nameOfLandlord',
    'defaultAmount': 'amountDefaulted'
  }
};

/**
 * Helper function to get the appropriate blueprint for a form type
 */
export const getBlueprintForFormType = (formType: string): PDFBlueprint => {
  // Normalize form type
  const normalizedType = formType.toLowerCase().replace(/\s+/g, '-');
  
  // Try direct match first
  if (PDF_BLUEPRINTS[normalizedType]) {
    return PDF_BLUEPRINTS[normalizedType];
  }
  
  // Try pattern matching
  if (normalizedType.includes('money')) {
    return PDF_BLUEPRINTS['money-insurance-claims'];
  }
  if (normalizedType.includes('rent')) {
    return PDF_BLUEPRINTS['rent-assurance-claims'];
  }
  
  // Fallback to generic
  return PDF_BLUEPRINTS['generic-form'];
};

export default PDF_BLUEPRINTS;