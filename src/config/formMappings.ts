// Form structure mappings for Enhanced Form Viewer
// This file defines how form data should be organized and displayed in sections

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'email' | 'url' | 'array' | 'object' | 'boolean' | 'number' | 'currency' | 'textarea' | 'file';
  editable?: boolean;
  conditional?: {
    dependsOn: string;
    value: string;
  };
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormMapping {
  [formType: string]: {
    sections: FormSection[];
    title: string;
  };
}

export const FORM_MAPPINGS: FormMapping = {
  'all-risk-claims': {
    title: 'All Risk Claim',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
          { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', editable: true },
          { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', editable: true },
        ]
      },
      {
        title: 'Insured Details',
        fields: [
          { key: 'nameOfInsured', label: 'Name of Insured', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Details of Loss',
        fields: [
          { key: 'typeOfClaim', label: 'Type of Claim', type: 'text', editable: true },
          { key: 'locationOfClaim', label: 'Location of Claim', type: 'text', editable: true },
          { key: 'dateOfOccurrence', label: 'Date of Occurrence', type: 'date', editable: true },
          { key: 'timeOfOccurrence', label: 'Time of Occurrence', type: 'text', editable: true },
          { key: 'propertyDescription', label: 'Property Description', type: 'textarea', editable: true },
          { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'textarea', editable: true },
          { key: 'estimateOfLoss', label: 'Estimate of Loss', type: 'currency', editable: true },
        ]
      },
      {
        title: 'Property Details',
        fields: [
          { key: 'propertyItems', label: 'Property Items', type: 'array', editable: true },
        ]
      },
      {
        title: 'Ownership & Recovery',
        fields: [
          { key: 'soleOwner', label: 'Sole Owner', type: 'boolean', editable: true },
          { key: 'ownershipExplanation', label: 'Ownership Explanation', type: 'textarea', editable: true, conditional: { dependsOn: 'soleOwner', value: 'false' } },
          { key: 'hasHirePurchase', label: 'Has Hire Purchase', type: 'boolean', editable: true },
          { key: 'hirePurchaseCompany', label: 'Hire Purchase Company', type: 'text', editable: true, conditional: { dependsOn: 'hasHirePurchase', value: 'true' } },
          { key: 'hirePurchaseAddress', label: 'Hire Purchase Address', type: 'text', editable: true, conditional: { dependsOn: 'hasHirePurchase', value: 'true' } },
          { key: 'recoveryStepsTaken', label: 'Recovery Steps Taken', type: 'textarea', editable: true },
          { key: 'hasOtherInsurance', label: 'Has Other Insurance', type: 'boolean', editable: true },
          { key: 'otherInsuranceDetails', label: 'Other Insurance Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasOtherInsurance', value: 'true' } },
          { key: 'hasPreviousLoss', label: 'Has Previous Loss', type: 'boolean', editable: true },
          { key: 'previousLossDetails', label: 'Previous Loss Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasPreviousLoss', value: 'true' } },
          { key: 'totalPropertyValue', label: 'Total Property Value', type: 'currency', editable: true },
          { key: 'hasOtherInsuranceAtTime', label: 'Has Other Insurance At Time', type: 'boolean', editable: true },
          { key: 'otherInsuranceAtTimeDetails', label: 'Other Insurance At Time Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasOtherInsuranceAtTime', value: 'true' } },
          { key: 'hasPriorClaims', label: 'Has Prior Claims', type: 'boolean', editable: true },
          { key: 'priorClaimsDetails', label: 'Prior Claims Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasPriorClaims', value: 'true' } },
          { key: 'policeInformed', label: 'Police Informed', type: 'boolean', editable: true },
          { key: 'policeStationDetails', label: 'Police Station Details', type: 'text', editable: true, conditional: { dependsOn: 'policeInformed', value: 'true' } },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'submittedBy', label: 'Submitted By', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false },
        ]
      }
    ]
  },

  'contractors-plant-machinery-claims': {
    title: 'Contractors Plant & Machinery Claim',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
          { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', editable: true },
          { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', editable: true },
        ]
      },
      {
        title: 'Insured Details',
        fields: [
          { key: 'nameOfInsured', label: 'Name of Insured', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Details of Loss',
        fields: [
          { key: 'dateOfOccurrence', label: 'Date of Occurrence', type: 'date', editable: true },
          { key: 'timeOfOccurrence', label: 'Time of Occurrence', type: 'text', editable: true },
          { key: 'placeOfOccurrence', label: 'Place of Occurrence', type: 'text', editable: true },
          { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'textarea', editable: true },
          { key: 'estimateOfLoss', label: 'Estimate of Loss', type: 'currency', editable: true },
        ]
      },
      {
        title: 'Plant & Machinery Details',
        fields: [
          { key: 'plantItems', label: 'Plant & Machinery Items', type: 'array', editable: true },
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { key: 'hasOtherInsurance', label: 'Has Other Insurance', type: 'boolean', editable: true },
          { key: 'otherInsuranceDetails', label: 'Other Insurance Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasOtherInsurance', value: 'true' } },
          { key: 'hasPreviousLoss', label: 'Has Previous Loss', type: 'boolean', editable: true },
          { key: 'previousLossDetails', label: 'Previous Loss Details', type: 'textarea', editable: true, conditional: { dependsOn: 'hasPreviousLoss', value: 'true' } },
          { key: 'policeInformed', label: 'Police Informed', type: 'boolean', editable: true },
          { key: 'policeStationDetails', label: 'Police Station Details', type: 'text', editable: true, conditional: { dependsOn: 'policeInformed', value: 'true' } },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false },
        ]
      }
    ]
  }
};

// Helper function to get form mapping
export const getFormMapping = (formType: string) => {
  return FORM_MAPPINGS[formType] || null;
};

// Helper function to get all available form types
export const getAvailableFormTypes = () => {
  return Object.keys(FORM_MAPPINGS);
};