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

  'goods-in-transit-claims': {
    title: 'Goods In Transit Claim',
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
          { key: 'businessType', label: 'Business Type', type: 'text', editable: true },
        ]
      },
      {
        title: 'Loss Details',
        fields: [
          { key: 'dateOfLoss', label: 'Date of Loss', type: 'date', editable: true },
          { key: 'timeOfLoss', label: 'Time of Loss', type: 'text', editable: true },
          { key: 'placeOfOccurrence', label: 'Place of Occurrence', type: 'text', editable: true },
          { key: 'descriptionOfGoods', label: 'Description of Goods', type: 'textarea', editable: true },
          { key: 'numberOfPackages', label: 'Number of Packages', type: 'number', editable: true },
          { key: 'totalWeight', label: 'Total Weight', type: 'number', editable: true },
          { key: 'weightUnits', label: 'Weight Units', type: 'text', editable: true },
          { key: 'totalValue', label: 'Total Value', type: 'currency', editable: true },
          { key: 'howGoodsPacked', label: 'How Goods Packed', type: 'text', editable: true },
        ]
      },
      {
        title: 'Paerticulars of Goods',
        fields: [
          { key: 'goodsItems', label: 'Goods Items', type: 'array', editable: true },
          { key: 'totalValue', label: 'Total Value', type: 'text', editable: false },
        ]
      },
      {
        title: 'Circumstances',
        fields: [
          { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'textarea', editable: true },
          { key: 'otherVehicleInvolved', label: 'Other Vehicle Involved', type: 'boolean', editable: true },
          { key: 'otherVehicleOwnerName', label: 'Other Vehicle Owners Name', type: 'text', editable: true, conditional: { dependsOn: 'otherVehicleInvolved', value: 'true' } },
          { key: 'otherVehicleOwnerAddress', label: 'Other Vehicle Owners Address', type: 'text', editable: true, conditional: { dependsOn: 'otherVehicleInvolved', value: 'true' } },
        ]
      },
   {
        title: 'Dispatch Details',
        fields: [
          { key: 'dispatchAddress', label: 'Dispatch Address', type: 'text', editable: true },
          { key: 'dispatchDate', label: 'Dispatch Date', type: 'date', editable: true },
          { key: 'consigneeName', label: 'Consignee Name', type: 'text', editable: true },
          { key: 'consigneeAddress', label: 'Consignee Address', type: 'text', editable: true },
          { key: 'vehicleRegistration', label: 'Vehicle Registration', type: 'text', editable: true },
        ]
      },
      {
        title: 'Additional Details',
        fields: [
          { key: 'inspectionAddress', label: 'Inspection Address', type: 'text', editable: true },
          { key: 'isOwnerOfGoods', label: 'Is Owner of Goods', type: 'boolean', editable: true },
          { key: 'goodsInSoundCondition', label: 'Goods in Sound Condition', type: 'boolean', editable: true },
          { key: 'checkedByDriver', label: 'Checked by Driver', type: 'boolean', editable: true },
          { key: 'staffLoadedUnloaded', label: 'Staff Loaded/Unloaded', type: 'boolean', editable: true },
          { key: 'receiptGiven', label: 'Receipt Given', type: 'boolean', editable: true },
          { key: 'claimMadeAgainstYou', label: 'Claim Made Against You', type: 'boolean', editable: true },
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
  },

 'rent-assurance-claims': {
  title: 'Rent Assurance Claim',
  sections: [
    {
      title: 'Policy Details',
      fields: [
        { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
        { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', editable: true },
        { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', editable: true }
      ]
    },
    {
      title: 'Insured Details',
      fields: [
        { key: 'nameOfInsured', label: 'Name of Insured (Tenant)', type: 'text', editable: true },
        { key: 'address', label: 'Address', type: 'textarea', editable: true },
        { key: 'age', label: 'Age', type: 'number', editable: true },
        { key: 'email', label: 'Email', type: 'email', editable: true },
        { key: 'phone', label: 'Phone', type: 'text', editable: true },
        { key: 'nameOfLandlord', label: 'Name of Landlord', type: 'text', editable: true },
        { key: 'addressOfLandlord', label: 'Address of Landlord', type: 'textarea', editable: true },
        { key: 'livingAtPremisesFrom', label: 'Living at Premises From', type: 'date', editable: true },
        { key: 'livingAtPremisesTo', label: 'Living at Premises To', type: 'date', editable: true }
      ]
    },
    {
      title: 'Claim Information',
      fields: [
        { key: 'periodOfDefaultFrom', label: 'Period of Default From', type: 'date', editable: true },
        { key: 'periodOfDefaultTo', label: 'Period of Default To', type: 'date', editable: true },
        { key: 'amountDefaulted', label: 'Amount Defaulted (₦)', type: 'currency', editable: true },
        { key: 'rentDueDate', label: 'Rent Due Date', type: 'date', editable: true },
        {
          key: 'rentPaymentFrequency',
          label: 'Frequency of Rent Payment',
          type: 'text',
          editable: true
        },
        {
          key: 'rentPaymentFrequencyOther',
          label: 'Specify Other Frequency',
          type: 'text',
          editable: true,
          conditional: { dependsOn: 'rentPaymentFrequency', value: 'other' }
        },
        { key: 'causeOfInabilityToPay', label: 'Cause of Inability to Pay', type: 'textarea', editable: true }
      ]
    },
    {
      title: 'Beneficiary Details',
      fields: [
        { key: 'nameOfBeneficiary', label: 'Name of Beneficiary (Landlord)', type: 'text', editable: true },
        { key: 'beneficiaryAge', label: 'Age', type: 'number', editable: true },
        { key: 'beneficiaryOccupation', label: 'Occupation', type: 'text', editable: true },
        { key: 'beneficiaryAddress', label: 'Address', type: 'textarea', editable: true },
        { key: 'beneficiaryEmail', label: 'Email', type: 'email', editable: true },
        { key: 'beneficiaryPhone', label: 'Phone', type: 'text', editable: true }
      ]
    },
    {
      title: 'File Uploads',
      fields: [
        { key: 'rentAgreement', label: 'Rent Agreement', type: 'file', editable: true },
        { key: 'demandNote', label: 'Demand Note', type: 'file', editable: true },
        { key: 'quitNotice', label: 'Quit Notice', type: 'file', editable: true }
      ]
    },
    {
      title: 'Data Privacy',
      fields: [
        { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'checkbox', editable: false }
      ]
    },
    {
      title: 'Declaration & Signature',
      fields: [
        { key: 'writtenDeclaration', label: 'Written Declaration', type: 'textarea', editable: false },
        { key: 'signature', label: 'Digital Signature', type: 'text', editable: false }
      ]
    },
    {
      title: 'System Information',
      fields: [
        { key: 'status', label: 'Status', type: 'text', editable: true },
        { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
        { key: 'submittedBy', label: 'Submitted By', type: 'date', editable: false },
        { key: 'createdAt', label: 'Created At', type: 'date', editable: false },
        { key: 'formType', label: 'Form Type', type: 'text', editable: false }
      ]
    }
  ]
},

 'motor-claims': {
  title: 'Motor Claim',
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
          { key: 'nameCompany', label: 'Name / Company Name', type: 'text', editable: true },
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Vehicle Details',
        fields: [
          { key: 'registrationNumber', label: 'Registration Number', type: 'text', editable: true },
          { key: 'make', label: 'Make', type: 'text', editable: true },
          { key: 'model', label: 'Model', type: 'text', editable: true },
          { key: 'year', label: 'Year', type: 'text', editable: true },
          { key: 'engineNumber', label: 'Engine Number', type: 'text', editable: true },
          { key: 'chassisNumber', label: 'Chassis Number', type: 'text', editable: true },
          { key: 'registeredInYourName', label: 'Registered in Your Name', type: 'text', editable: true },
          { key: 'registeredInYourNameDetails', label: 'Registration Details', type: 'text', editable: true },
          { key: 'ownedSolely', label: 'Owned Solely by You', type: 'text', editable: true },
          { key: 'ownedSolelyDetails', label: 'Ownership Details', type: 'text', editable: true },
          { key: 'hirePurchase', label: 'Subject to Hire Purchase', type: 'text', editable: true },
          { key: 'hirePurchaseDetails', label: 'Hire Purchase Details', type: 'text', editable: true },
          { key: 'vehicleUsage', label: 'Vehicle Usage', type: 'text', editable: true },
          { key: 'trailerAttached', label: 'Trailer Attached', type: 'text', editable: true },
        ]
      },
      {
        title: 'Damage Details',
        fields: [
          { key: 'damageDescription', label: 'Damage Description', type: 'text', editable: true },
          { key: 'inspectionLocation', label: 'Inspection Location', type: 'text', editable: true },
        ]
      },
      {
        title: 'Incident Details',
        fields: [
          { key: 'incidentLocation', label: 'Incident Location', type: 'text', editable: true },
          { key: 'incidentDate', label: 'Incident Date', type: 'date', editable: true },
          { key: 'incidentTime', label: 'Incident Time', type: 'text', editable: true },
          { key: 'policeReported', label: 'Police Reported', type: 'text', editable: true },
          { key: 'policeStationDetails', label: 'Police Station Details', type: 'text', editable: true },
          { key: 'incidentDescription', label: 'Incident Description', type: 'text', editable: true },
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { key: 'witnesses', label: 'Witnesses', type: 'array', editable: true },
        ]
      },
      {
        title: 'Other Vehicle Details',
        fields: [
          { key: 'otherVehicleInvolved', label: 'Other Vehicle Involved', type: 'text', editable: true },
          { key: 'otherVehicleRegNumber', label: 'Other Vehicle Registration', type: 'text', editable: true },
          { key: 'otherVehicleMakeModel', label: 'Other Vehicle Make/Model', type: 'text', editable: true },
          { key: 'otherDriverName', label: 'Other Driver Name', type: 'text', editable: true },
          { key: 'otherDriverPhone', label: 'Other Driver Phone', type: 'text', editable: true },
          { key: 'otherDriverAddress', label: 'Other Driver Address', type: 'text', editable: true },
          { key: 'otherVehicleInjuryDamage', label: 'Other Vehicle Injury/Damage', type: 'text', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'submittedby', label: 'Submitted By', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false },
        ]
      }
    ]
  },

  'professional-indemnity-claims': {
    title: 'Professional Indemnity Claim',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
          { key: 'coverageFromDate', label: 'Coverage From Date', type: 'date', editable: true },
          { key: 'coverageToDate', label: 'Coverage To Date', type: 'date', editable: true },
        ]
      },
      {
        title: 'Insured Details',
        fields: [
          { key: 'insuredName', label: 'Name of Insured', type: 'text', editable: true },
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Claimant Details',
        fields: [
          { key: 'claimantName', label: 'Claimant Name', type: 'text', editable: true },
          { key: 'claimantAddress', label: 'Claimant Address', type: 'text', editable: true },
        ]
      },
      {
        title: 'Retainer/Contract Details',
        fields: [
          { key: 'retainerDetails', label: 'What were you retained/contracted to do?', type: 'textarea', editable: true },
          { key: 'contractInWriting', label: 'Was your contract evidenced in writing?', type: 'text', editable: true },
          { key: 'contractDocument', label: 'Contract Document', type: 'file', editable: false, conditional: { dependsOn: 'contractInWriting', value: 'yes' } },
          { key: 'contractDetails', label: 'Contract Details', type: 'textarea', editable: true, conditional: { dependsOn: 'contractInWriting', value: 'no' } },
          { key: 'workPerformedFrom', label: 'Work Performed From', type: 'date', editable: true },
          { key: 'workPerformedTo', label: 'Work Performed To', type: 'date', editable: true },
        ]
      },
      {
        title: 'Work Performer Details',
        fields: [
          { key: 'workPerformerName', label: 'Work Performer Name', type: 'text', editable: true },
          { key: 'workPerformerTitle', label: 'Work Performer Title', type: 'text', editable: true },
          { key: 'workPerformerDuties', label: 'Work Performer Duties', type: 'text', editable: true },
          { key: 'workPerformerContact', label: 'Work Performer Contact', type: 'text', editable: true },
        ]
      },
      {
        title: 'Claim Details',
        fields: [
          { key: 'claimNature', label: 'Nature of Claim', type: 'textarea', editable: true },
          { key: 'firstAwareDate', label: 'Date First Became Aware', type: 'date', editable: true },
          { key: 'claimMadeDate', label: 'Date Claim Was Made', type: 'date', editable: true },
          { key: 'intimationMode', label: 'Was intimation oral or written?', type: 'text', editable: true },
          { key: 'oralDetails', label: 'Oral Details', type: 'textarea', editable: true, conditional: { dependsOn: 'intimationMode', value: 'oral' } },
          { key: 'writtenIntimation', label: 'Written Intimation Document', type: 'file', editable: false, conditional: { dependsOn: 'intimationMode', value: 'written' } },
          { key: 'amountClaimed', label: 'Amount Claimed', type: 'currency', editable: true },
        ]
      },
      {
        title: 'Response & Assessment',
        fields: [
          { key: 'responseComments', label: 'Comments in response to the claim', type: 'textarea', editable: true },
          { key: 'quantumComments', label: 'Comments on the quantum of the claim', type: 'textarea', editable: true },
          { key: 'estimatedLiability', label: 'Estimated monetary liability', type: 'currency', editable: true },
          { key: 'additionalInfo', label: 'Any other details or info that will help insurer?', type: 'text', editable: true },
          { key: 'additionalDetails', label: 'Additional Details', type: 'textarea', editable: true, conditional: { dependsOn: 'additionalInfo', value: 'yes' } },
          { key: 'additionalDocument', label: 'Additional Document', type: 'file', editable: false, conditional: { dependsOn: 'additionalInfo', value: 'yes' } },
        ]
      },
      {
        title: 'Solicitor Details',
        fields: [
          { key: 'solicitorInstructed', label: 'Have you instructed a solicitor?', type: 'text', editable: true },
          { key: 'solicitorName', label: 'Solicitor Name', type: 'text', editable: true, conditional: { dependsOn: 'solicitorInstructed', value: 'yes' } },
          { key: 'solicitorAddress', label: 'Solicitor Address', type: 'textarea', editable: true, conditional: { dependsOn: 'solicitorInstructed', value: 'yes' } },
          { key: 'solicitorCompany', label: 'Solicitor Company', type: 'text', editable: true, conditional: { dependsOn: 'solicitorInstructed', value: 'yes' } },
          { key: 'solicitorRates', label: 'Solicitor Rates', type: 'text', editable: true, conditional: { dependsOn: 'solicitorInstructed', value: 'yes' } },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'submittedAt', label: 'Submitted By', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false },
        ]
      }
    ]
  },

  'public-liability-claims': {
    title: 'Public Liability Claim',
    sections: [
      {
        title: 'Policy Details',
        fields: [
          { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
          { key: 'coverageFromDate', label: 'Coverage From Date', type: 'date', editable: true },
          { key: 'coverageToDate', label: 'Coverage To Date', type: 'date', editable: true },
        ]
      },
      {
        title: 'Insured Details',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Accident Details',
        fields: [
          { key: 'accidentDate', label: 'Date of Accident', type: 'date', editable: true },
          { key: 'accidentTime', label: 'Time of Accident', type: 'text', editable: true },
          { key: 'accidentPlace', label: 'Place of Accident', type: 'text', editable: true },
          { key: 'accidentDetails', label: 'Accident Details', type: 'text', editable: true },
          { key: 'employeeActivity', label: 'Employee Activity', type: 'text', editable: true },
        ]
      },
      {
        title: 'Responsible Party',
        fields: [
          { key: 'responsiblePersonName', label: 'Responsible Person Name', type: 'text', editable: true },
          { key: 'responsiblePersonAddress', label: 'Responsible Person Address', type: 'text', editable: true },
          { key: 'responsibleEmployer', label: 'Responsible Employer', type: 'text', editable: true },
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { key: 'witnesses', label: 'Witnesses', type: 'array', editable: true },
        ]
      },
      {
        title: 'Police & Insurance',
        fields: [
          { key: 'policeInvolved', label: 'Police Involved', type: 'text', editable: true },
          { key: 'policeStation', label: 'Police Station', type: 'text', editable: true },
          { key: 'officerNumber', label: 'Officer Number', type: 'text', editable: true },
          { key: 'otherInsurance', label: 'Other Insurance', type: 'text', editable: true },
          { key: 'otherInsuranceDetails', label: 'Other Insurance Details', type: 'text', editable: true },
        ]
      },
      {
        title: 'Claimant Information',
        fields: [
          { key: 'claimantName', label: 'Claimant Name', type: 'text', editable: true },
          { key: 'claimantAddress', label: 'Claimant Address', type: 'text', editable: true },
          { key: 'injuryNature', label: 'Nature of Injury', type: 'text', editable: true },
        ]
      },
      {
        title: 'Claim Notice',
        fields: [
          { key: 'claimNoticeReceived', label: 'Claim Notice Received', type: 'text', editable: true },
          { key: 'noticeFrom', label: 'Notice From', type: 'text', editable: true },
          { key: 'noticeWhen', label: 'Notice When', type: 'date', editable: true },
          { key: 'noticeForm', label: 'Notice Form', type: 'text', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
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

  'employers-liability-claims': {
    title: 'Employers Liability Claim',
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
          { key: 'name', label: 'Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
        ]
      },
      {
        title: 'Injured Party Details',
        fields: [
          { key: 'injuredPartyName', label: 'Injured Party Name', type: 'text', editable: true },
          { key: 'injuredPartyAge', label: 'Injured Party Age', type: 'number', editable: true },
          { key: 'injuredPartyAddress', label: 'Injured Party Address', type: 'text', editable: true },
          { key: 'averageMonthlyEarnings', label: 'Average Monthly Earnings', type: 'number', editable: true },
          { key: 'occupation', label: 'Occupation', type: 'text', editable: true },
          { key: 'dateOfEmployment', label: 'Date of Employment', type: 'date', editable: true },
          { key: 'maritalStatus', label: 'Marital Status', type: 'text', editable: true },
          { key: 'numberOfChildren', label: 'Number of Children', type: 'number', editable: true },
          { key: 'agesOfChildren', label: 'Ages of Children', type: 'text', editable: true },
          { key: 'previousAccidents', label: 'Previous Accidents', type: 'text', editable: true },
          { key: 'previousAccidentsDetails', label: 'Previous Accidents Details', type: 'text', editable: true, conditional: { dependsOn: 'previousAccidents', value: 'yes' } },
        ]
      },
      {
        title: 'Injury Details',
        fields: [
          { key: 'natureOfInjuries', label: 'Nature of Injuries', type: 'text', editable: true },
          { key: 'machineryInvolved', label: 'Machinery Involved', type: 'text', editable: true },
          { key: 'supervisorName', label: 'Supervisor Name', type: 'text', editable: true },
          { key: 'supervisorPosition', label: 'Supervisor Position', type: 'text', editable: true },
        ]
      },
      {
        title: 'Accident Details',
        fields: [
          { key: 'accidentDate', label: 'Accident Date', type: 'date', editable: true },
          { key: 'accidentTime', label: 'Accident Time', type: 'text', editable: true },
          { key: 'accidentPlace', label: 'Accident Place', type: 'text', editable: true },
          { key: 'dateReported', label: 'Date Reported', type: 'date', editable: true },
          { key: 'reportedBy', label: 'Reported By', type: 'text', editable: true },
          { key: 'dateStoppedWork', label: 'Date Stopped Work', type: 'date', editable: true },
          { key: 'workDescription', label: 'Work Description', type: 'text', editable: true },
          { key: 'howAccidentOccurred', label: 'How Accident Occurred', type: 'text', editable: true },
          { key: 'soberOrIntoxicated', label: 'Sober or Intoxicated', type: 'text', editable: true },
        ]
      },
      {
        title: 'Medical Details',
        fields: [
          { key: 'receivingTreatment', label: 'Receiving Treatment', type: 'text', editable: true },
          { key: 'hospitalName', label: 'Hospital Name', type: 'text', editable: true },
          { key: 'hospitalAddress', label: 'Hospital Address', type: 'text', editable: true },
          { key: 'doctorName', label: 'Doctor Name', type: 'text', editable: true },
          { key: 'doctorAddress', label: 'Doctor Address', type: 'text', editable: true },
        ]
      },
      {
        title: 'Disablement Details',
        fields: [
          { key: 'totallyDisabled', label: 'Totally Disabled', type: 'text', editable: true },
          { key: 'dateStoppedWorking', label: 'Date Stopped Working', type: 'date', editable: true },
          { key: 'estimatedDuration', label: 'Estimated Duration', type: 'text', editable: true },
          { key: 'ableToDoAnyDuties', label: 'Able to Do Any Duties', type: 'text', editable: true },
          { key: 'dutiesDetails', label: 'Duties Details', type: 'text', editable: true },
          { key: 'claimMadeOnYou', label: 'Claim Made on You', type: 'text', editable: true },
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { key: 'witnesses', label: 'Witnesses', type: 'array', editable: true },
        ]
      },
      {
        title: 'Other Insurers',
        fields: [
          { key: 'otherInsurerName', label: 'Other Insurer Name', type: 'text', editable: true },
          { key: 'otherInsurerAddress', label: 'Other Insurer Address', type: 'text', editable: true },
          { key: 'otherInsurerPolicyNumber', label: 'Other Insurer Policy Number', type: 'text', editable: true },
        ]
      },
      {
        title: 'Statement of Earnings',
        fields: [
          { key: 'earnings', label: 'Earnings Statement', type: 'array', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
           { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
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

  'combined-gpa-employers-liability-claims': {
    title: 'Combined GPA & Employers Liability Claim',
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
          { key: 'name', label: 'Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Injured Party Details',
        fields: [
          { key: 'injuredPartyName', label: 'Injured Party Name', type: 'text', editable: true },
          { key: 'injuredPartyAge', label: 'Injured Party Age', type: 'number', editable: true },
          { key: 'injuredPartyAddress', label: 'Injured Party Address', type: 'textarea', editable: true },
          { key: 'averageMonthlyEarnings', label: 'Average Monthly Earnings', type: 'currency', editable: true },
          { key: 'occupation', label: 'Occupation', type: 'text', editable: true },
          { key: 'dateOfEmployment', label: 'Date of Employment', type: 'date', editable: true },
          { key: 'durationEmployed', label: 'Employment Duration', type: 'text', editable: true },
          { key: 'notDirectlyEmployed', label: 'Not Directly Employed', type: 'boolean', editable: true },
          { key: 'employerName', label: 'Employer Name', type: 'text', editable: true, conditional: { dependsOn: 'notDirectlyEmployed', value: 'true' }},
          { key: 'employerAddress', label: 'Employer Address', type: 'textarea', editable: true, conditional: { dependsOn: 'notDirectlyEmployed', value: 'true' } },
          { key: 'maritalStatus', label: 'Marital Status', type: 'text', editable: true },
          { key: 'previousAccidents', label: 'Previous Accidents', type: 'text', editable: true },
          { key: 'previousAccidentsDetails', label: 'Previous Accidents Details', type: 'textarea', editable: true, conditional: { dependsOn: 'previousAccidents', value: 'yes' } },
        ]
      },
      {
        title: 'Injury Details',
        fields: [
          { key: 'natureOfInjuries', label: 'Nature of Injuries', type: 'textarea', editable: true },
          { key: 'machineryInvolved', label: 'Machinery Involved', type: 'text', editable: true },
        ]
      },
      {
        title: 'Accident Details',
        fields: [
          { key: 'accidentDate', label: 'Accident Date', type: 'date', editable: true },
          { key: 'accidentTime', label: 'Accident Time', type: 'text', editable: true },
          { key: 'accidentPlace', label: 'Accident Place', type: 'textarea', editable: true },
          { key: 'dateReported', label: 'Date Reported', type: 'date', editable: true },
          { key: 'dateTimeStoppedWork', label: 'Date/Time Stopped Work', type: 'text', editable: true },
          { key: 'workAtTime', label: 'Work at Time', type: 'textarea', editable: true },
          { key: 'howItOccurred', label: 'How It Occurred', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Medical Details',
        fields: [
          { key: 'receivingTreatment', label: 'Receiving Treatment', type: 'text', editable: true },
          { key: 'hospitalName', label: 'Hospital Name', type: 'text', editable: true, conditional: { dependsOn: 'receivingTreatment', value: 'yes' } },
          { key: 'hospitalAddress', label: 'Hospital Address', type: 'textarea', editable: true, conditional: { dependsOn: 'receivingTreatment', value: 'yes' } },
          { key: 'stillInHospital', label: 'Still in Hospital', type: 'text', editable: true },
          { key: 'dischargeDate', label: 'Discharge Date', type: 'date', editable: true, conditional: { dependsOn: 'stillInHospital', value: 'no' } },
          { key: 'ableToDoduties', label: 'Able to Do Duties', type: 'text', editable: true },
          { key: 'dutiesDetails', label: 'Duties Details', type: 'textarea', editable: true, conditional: { dependsOn: 'ableToDoDuties', value: 'yes' } },
          { key: 'dateNatureResumedWork', label: 'Date and Nature of Resumed Work', type: 'text', editable: true },
          { key: 'doctorName', label: 'Doctor Name', type: 'text', editable: true },
        ]
      },
      {
        title: 'Disablement',
        fields: [
          { key: 'totallyDisabled', label: 'Totally Disabled', type: 'text', editable: true },
          { key: 'estimatedDuration', label: 'Estimated Duration', type: 'text', editable: true },
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { key: 'witnesses', label: 'Witnesses', type: 'array', editable: true },
        ]
      },
      {
        title: 'Other Insurance',
        fields: [
          { key: 'otherInsurerName', label: 'Other Insurer Name', type: 'text', editable: true },
          { key: 'otherInsurerAddress', label: 'Other Insurer Address', type: 'textarea', editable: true },
          { key: 'otherInsurerPolicyNumber', label: 'Other Insurer Policy Number', type: 'text', editable: true },
        ]
      },
      {
        title: 'Statement of Earnings',
        fields: [
          { key: 'earnings', label: 'Monthly Earnings', type: 'array', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
           { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
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

  'burglary-claims': {
    title: 'Burglary Insurance Claim',
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Details of Loss',
        fields: [
          { key: 'premisesAddress', label: 'Premises Address', type: 'textarea', editable: true },
          { key: 'premisesTelephone', label: 'Premises Telephone', type: 'text', editable: true },
          { key: 'dateOfTheft', label: 'Date of Theft', type: 'date', editable: true },
          { key: 'timeOfTheft', label: 'Time of Theft', type: 'text', editable: true },
          { key: 'howEntryEffected', label: 'Give full details of how entry was affected', type: 'textarea', editable: true },
          { key: 'roomsEntered', label: 'Rooms Entered', type: 'textarea', editable: true },
          { key: 'premisesOccupied', label: 'Premises Occupied', type: 'boolean', editable: true },
          { key: 'lastOccupiedDate', label: 'Last Occupied Date', type: 'text', editable: true },
          { key: 'suspicions', label: 'Have Suspicions', type: 'boolean', editable: true },
          { key: 'suspicionName', label: 'Suspicion Name', type: 'text', editable: true },
          { key: 'policeInformed', label: 'Police Informed', type: 'boolean', editable: true },
          { key: 'policeDate', label: 'Police Date', type: 'date', editable: true },
          { key: 'policeStation', label: 'Police Station', type: 'text', editable: true },
          { key: 'soleOwner', label: 'Sole Owner', type: 'boolean', editable: true },
          { key: 'ownerDetails', label: 'Owner Details', type: 'textarea', editable: true },
          { key: 'otherInsurance', label: 'Other Insurance', type: 'boolean', editable: true },
          { key: 'otherInsurerDetails', label: 'Other Insurer Details', type: 'textarea', editable: true },
          { key: 'totalContentsValue', label: 'Total Contents Value', type: 'currency', editable: true },
          { key: 'sumInsuredFirePolicy', label: 'Sum Insured Fire Policy', type: 'currency', editable: true },
          { key: 'fireInsurerName', label: 'Fire Insurer Name', type: 'text', editable: true },
          { key: 'fireInsurerAddress', label: 'Fire Insurer Address', type: 'textarea', editable: true },
          { key: 'previousLoss', label: 'Previous Loss', type: 'boolean', editable: true },
          { key: 'previousLossDetails', label: 'Previous Loss Details', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Property Items',
        fields: [
          { key: 'propertyItems', label: 'Property Items', type: 'array', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
          { key: 'signatureDate', label: 'Signature Date', type: 'date', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'submittedBy, label: 'Submitted By', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false },
        ]
      }
    ]
  },

  'fireSpecialPerilsClaims': {
    title: 'Fire and Special Perils Claim',
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
          { key: 'name', label: 'Name', type: 'text', editable: true },
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Loss Details',
        fields: [
          { key: 'premisesAddress', label: 'Premises Address', type: 'textarea', editable: true },
          { key: 'premisesPhone', label: 'Premises Phone', type: 'text', editable: true },
          { key: 'dateOfOccurrence', label: 'Date of Occurrence', type: 'date', editable: true },
          { key: 'timeOfOccurrence', label: 'Time of Occurrence', type: 'text', editable: true },
          { key: 'incidentDescription', label: 'Incident Description', type: 'textarea', editable: true },
          { key: 'causeOfFire', label: 'Cause of Fire', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Premises Use',
        fields: [
          { key: 'premisesUsedAsPerPolicy', label: 'Premises Used As Per Policy', type: 'boolean', editable: true },
          { key: 'premisesUsageDetails', label: 'Premises Usage Details', type: 'textarea', editable: true },
          { key: 'purposeOfPremises', label: 'Purpose of Premises', type: 'textarea', editable: true },
          { key: 'unallowedRiskIntroduced', label: 'Unallowed Risk Introduced', type: 'boolean', editable: true },
          { key: 'unallowedRiskDetails', label: 'Unallowed Risk Details', type: 'textarea', editable: true },
          { key: 'measuresWhenFireDiscovered', label: 'Measures When Fire Discovered', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Property Ownership',
        fields: [
          { key: 'soleOwner', label: 'Sole Owner', type: 'boolean', editable: true },
          { key: 'otherOwnersName', label: 'Other Owners Name', type: 'text', editable: true },
          { key: 'otherOwnersAddress', label: 'Other Owners Address', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Other Insurance',
        fields: [
          { key: 'hasOtherInsurance', label: 'Has Other Insurance', type: 'boolean', editable: true },
          { key: 'otherInsuranceName', label: 'Other Insurance Name', type: 'text', editable: true },
          { key: 'otherInsuranceAddress', label: 'Other Insurance Address', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Valuation',
        fields: [
          { key: 'premisesContentsValue', label: 'Premises Contents Value', type: 'currency', editable: true },
          { key: 'hasPreviousClaim', label: 'Has Previous Claim', type: 'boolean', editable: true },
          { key: 'previousClaimDate', label: 'Previous Claim Date', type: 'date', editable: true },
          { key: 'previousClaimAmount', label: 'Previous Claim Amount', type: 'currency', editable: true },
        ]
      },
      {
        title: 'Items Lost/Damaged',
        fields: [
          { key: 'itemsLost', label: 'Items Lost/Damaged', type: 'array', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
          { key: 'signatureDate', label: 'Signature Date', type: 'date', editable: true },
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
  },

  'money-insurance-claims': {
    title: 'Money Insurance Claim',
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'textarea', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Loss Details',
        fields: [
          { key: 'lossDate', label: 'Date of Loss', type: 'date', editable: true },
          { key: 'lossTime', label: 'Time of Loss', type: 'text', editable: true },
          { key: 'lossLocation', label: 'Loss Location', type: 'textarea', editable: true },
          { key: 'howItHappened', label: 'How It Happened', type: 'textarea', editable: true },
          { key: 'policeNotified', label: 'Police Notified', type: 'text', editable: true },
          { key: 'policeStation', label: 'Police Station', type: 'text', editable: true },
          { key: 'lossAmount', label: 'Loss Amount', type: 'currency', editable: true },
          { key: 'lossDescription', label: 'Loss Description', type: 'textarea', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'declarationAccepted', label: 'Declaration Accepted', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
          { key: 'signatureDate', label: 'Signature Date', type: 'date', editable: true },
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
  },

  // Contractors Plant & Machinery Claims
  'contractors-claims': {
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Loss Details',
        fields: [
          { key: 'howItHappened', label: 'How Loss Occurred', type: 'text', editable: true },
          { key: 'policeNotified', label: 'Police Notified', type: 'text', editable: true },
          { key: 'policeStation', label: 'Police Station', type: 'text', editable: true },
          { key: 'lossAmount', label: 'Loss Amount', type: 'currency', editable: true },
          { key: 'lossDescription', label: 'Loss Description', type: 'text', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'declarationAccepted', label: 'Declaration Accepted', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
          { key: 'signatureDate', label: 'Signature Date', type: 'date', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
        ]
      }
    ]
  },

  // Fidelity Guarantee Claims
  'fidelityGuaranteeClaims': {
    title: 'Fidelity Guarantee Claim',
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Defaulter Details',
        fields: [
          { key: 'defaulterName', label: 'Defaulter Name', type: 'text', editable: true },
          { key: 'defaulterAge', label: 'Age', type: 'number', editable: true },
          { key: 'defaulterAddress', label: 'Present Address', type: 'text', editable: true },
          { key: 'defaulterOccupation', label: 'Occupation', type: 'text', editable: true },
          { key: 'dateOfDiscovery', label: 'Date of Discovery', type: 'date', editable: true },
        ]
      },
      {
        title: 'Default Details',
        fields: [
          { key: 'defaultDetails', label: 'Default Details', type: 'text', editable: true },
          { key: 'defaultAmount', label: 'Default Amount', type: 'currency', editable: true },
          { key: 'hasPreviousIrregularity', label: 'Previous Irregularity', type: 'boolean', editable: true },
          { key: 'previousIrregularityDetails', label: 'Previous Irregularity Details', type: 'text', editable: true },
          { key: 'lastCorrectCheckDate', label: 'Last Correct Check Date', type: 'date', editable: true },
          { key: 'hasDefaulterProperty', label: 'Defaulter Property Known', type: 'boolean', editable: true },
          { key: 'defaulterPropertyDetails', label: 'Property Details', type: 'text', editable: true },
          { key: 'hasRemunerationDue', label: 'Remuneration Due', type: 'boolean', editable: true },
          { key: 'remunerationDetails', label: 'Remuneration Details', type: 'text', editable: true },
          { key: 'hasOtherSecurity', label: 'Other Security', type: 'boolean', editable: true },
          { key: 'otherSecurityDetails', label: 'Other Security Details', type: 'text', editable: true },
        ]
      },
      {
        title: 'Employment Status',
        fields: [
          { key: 'hasBeenDischarged', label: 'Been Discharged', type: 'boolean', editable: true },
          { key: 'dischargeDate', label: 'Discharge Date', type: 'date', editable: true },
          { key: 'hasSettlementProposal', label: 'Settlement Proposal', type: 'boolean', editable: true },
          { key: 'settlementProposalDetails', label: 'Settlement Proposal Details', type: 'text', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Data Privacy Agreement', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
          { key: 'signatureDate', label: 'Signature Date', type: 'date', editable: true },
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
        ]
      }
    ]
  },

  // Group Personal Accident Claims
  'group-personal-accident-claims': {
    title: 'Group Personal Accident Claim',
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
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
        ]
      },
      {
        title: 'Accident Details',
        fields: [
          { key: 'accidentDate', label: 'Accident Date', type: 'date', editable: true },
          { key: 'accidentTime', label: 'Accident Time', type: 'text', editable: true },
          { key: 'accidentPlace', label: 'Accident Place', type: 'text', editable: true },
          { key: 'incidentDescription', label: 'Incident Description', type: 'text', editable: true },
          { key: 'particularsOfInjuries', label: 'Particulars of Injuries', type: 'text', editable: true },
        ]
      },
      {
        title: 'Doctor Details',
        fields: [
          { key: 'doctorName', label: 'Doctor Name', type: 'text', editable: true },
          { key: 'doctorAddress', label: 'Doctor Address', type: 'text', editable: true },
          { key: 'isUsualDoctor', label: 'Usual Doctor', type: 'boolean', editable: true },
          { key: 'totalIncapacityFrom', label: 'Total Incapacity From', type: 'date', editable: true },
          { key: 'totalIncapacityTo', label: 'Total Incapacity To', type: 'date', editable: true },
          { key: 'partialIncapacityFrom', label: 'Partial Incapacity From', type: 'date', editable: true },
          { key: 'partialIncapacityTo', label: 'Partial Incapacity To', type: 'date', editable: true },
        ]
      },
      {
        title: 'Other Insurance',
        fields: [
          { key: 'otherInsurerName', label: 'Other Insurer Name', type: 'text', editable: true },
          { key: 'otherInsurerAddress', label: 'Other Insurer Address', type: 'text', editable: true },
          { key: 'otherPolicyNumber', label: 'Other Policy Number', type: 'text', editable: true },
        ]
      },
      {
        title: 'Witnesses',
        fields: [
          { key: 'witnesses', label: 'Witnesses', type: 'array', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Data Privacy Agreement', type: 'boolean', editable: false },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
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
  },

  // CDD FORMS
  'individual-kyc': {
    title: 'Individual CDD Form',
    sections: [
      {
        title: 'Personal Information',
        fields: [
          { key: 'title', label: 'Title', type: 'text', editable: true },
          { key: 'firstName', label: 'First Name', type: 'text', editable: true },
          { key: 'lastName', label: 'Last Name', type: 'text', editable: true },
          { key: 'contactAddress', label: 'Contact Address', type: 'textarea', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'residenceCountry', label: 'Residence Country', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
          { key: 'mobileNumber', label: 'Mobile Number', type: 'text', editable: true },
          { key: 'residentialAddress', label: 'Residential Address', type: 'textarea', editable: true },
          { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
          { key: 'occupation', label: 'Occupation', type: 'text', editable: true },
          { key: 'position', label: 'Position', type: 'text', editable: true }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { key: 'businessType', label: 'Business Type', type: 'text', editable: true },
          { key: 'businessTypeOther', label: 'Business Type (Other)', type: 'text', editable: true, conditional: { dependsOn: 'businessType', value: 'other' } },
          { key: 'employerEmail', label: "Employer's Email", type: 'email', editable: true },
          { key: 'employerName', label: "Employer's Name", type: 'text', editable: true },
          { key: 'employerTelephone', label: "Employer's Telephone", type: 'text', editable: true },
          { key: 'employerAddress', label: "Employer's Address", type: 'textarea', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true },
          { key: 'idType', label: 'ID Type', type: 'text', editable: true },
          { key: 'identificationNumber', label: 'Identification Number', type: 'text', editable: true },
          { key: 'issuingCountry', label: 'Issuing Country', type: 'text', editable: true },
          { key: 'issuedDate', label: 'Issued Date', type: 'date', editable: true },
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Account Details',
        fields: [
          { key: 'annualIncomeRange', label: 'Annual Income Range', type: 'text', editable: true },
          { key: 'premiumPaymentSource', label: 'Premium Payment Source', type: 'text', editable: true },
          { key: 'premiumPaymentSourceOther', label: 'Premium Payment Source (Other)', type: 'text', editable: true, conditional: { dependsOn: 'premiumPaymentSource', value: 'other' } }
        ]
      },
      {
        title: 'File Uploads',
        fields: [
          { key: 'passportPhotographUrl', label: 'Passport Photograph', type: 'file', editable: false },
          { key: 'identificationDocumentUrl', label: 'Identification Document', type: 'file', editable: false },
          { key: 'proofOfAddressUrl', label: 'Proof of Address', type: 'file', editable: false },
          { key: 'employmentLetterUrl', label: 'Employment Letter', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: true },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  // === PARTNERS CDD ===
  'partners-cdd': {
    title: 'Partners CDD',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Address', type: 'textarea', editable: true },
          { key: 'city', label: 'City', type: 'text', editable: true },
          { key: 'state', label: 'State', type: 'text', editable: true },
          { key: 'country', label: 'Country', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'url', editable: true },
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text', editable: true },
          { key: 'contactPersonNumber', label: 'Contact Person Number', type: 'text', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'vatRegistrationNumber', label: 'VAT Registration Number', type: 'text', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation/RC Number', type: 'text', editable: true },
          { key: 'incorporationDate', label: 'Date of Incorporation', type: 'date', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'businessNature', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: true }, // May be flat object in older versions
          // Individual director fields for flat object compatibility
          { key: 'director1Name', label: 'Director 1 Name', type: 'text', editable: true },
          { key: 'director1Phone', label: 'Director 1 Phone', type: 'text', editable: true },
          { key: 'director1Email', label: 'Director 1 Email', type: 'email', editable: true },
          { key: 'director1Address', label: 'Director 1 Address', type: 'textarea', editable: true },
          { key: 'director1DateOfBirth', label: 'Director 1 Date of Birth', type: 'date', editable: true },
          { key: 'director1Nationality', label: 'Director 1 Nationality', type: 'text', editable: true },
          { key: 'director1IdType', label: 'Director 1 ID Type', type: 'text', editable: true },
          { key: 'director1IdNumber', label: 'Director 1 ID Number', type: 'text', editable: true },
          { key: 'director2Name', label: 'Director 2 Name', type: 'text', editable: true },
          { key: 'director2Phone', label: 'Director 2 Phone', type: 'text', editable: true },
          { key: 'director2Email', label: 'Director 2 Email', type: 'email', editable: true },
          { key: 'director2Address', label: 'Director 2 Address', type: 'textarea', editable: true },
          { key: 'director2DateOfBirth', label: 'Director 2 Date of Birth', type: 'date', editable: true },
          { key: 'director2Nationality', label: 'Director 2 Nationality', type: 'text', editable: true },
          { key: 'director2IdType', label: 'Director 2 ID Type', type: 'text', editable: true },
          { key: 'director2IdNumber', label: 'Director 2 ID Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Bank Account Details',
        fields: [
          { key: 'localAccountNumber', label: 'Local Account Number', type: 'text', editable: true },
          { key: 'localBankName', label: 'Local Bank Name', type: 'text', editable: true },
          { key: 'localBankBranch', label: 'Local Bank Branch', type: 'text', editable: true },
          { key: 'localAccountOpeningDate', label: 'Local Account Opening Date', type: 'date', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Document Uploads',
        fields: [
          { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', type: 'file', editable: false },
          { key: 'identificationMeansDirector1', label: 'Identification Means for Director 1', type: 'file', editable: false },
          { key: 'identificationMeansDirector2', label: 'Identification Means for Director 2', type: 'file', editable: false },
          { key: 'cacStatusReport', label: 'CAC Status Report', type: 'file', editable: false },
          { key: 'vatRegistrationLicense', label: 'VAT Registration License', type: 'file', editable: false },
          { key: 'taxClearanceCertificate', label: 'Tax Clearance Certificate', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  // === NAICOM PARTNERS CDD ===
  'naicom-partners-cdd': {
    title: 'NAICOM Partners CDD',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Address', type: 'textarea', editable: true },
          { key: 'city', label: 'City', type: 'text', editable: true },
          { key: 'state', label: 'State', type: 'text', editable: true },
          { key: 'country', label: 'Country', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'url', editable: true },
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text', editable: true },
          { key: 'contactPersonNumber', label: 'Contact Person Number', type: 'text', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'vatRegistrationNumber', label: 'VAT Registration Number', type: 'text', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation/RC Number', type: 'text', editable: true },
          { key: 'incorporationDate', label: 'Date of Incorporation', type: 'date', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'businessNature', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true },
          { key: 'naicomLicenseIssuingDate', label: 'NAICOM License Issuing Date', type: 'date', editable: true },
          { key: 'naicomLicenseExpiryDate', label: 'NAICOM License Expiry Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: true }, // May be flat object in older versions
          // Individual director fields for flat object compatibility
          { key: 'director1Name', label: 'Director 1 Name', type: 'text', editable: true },
          { key: 'director1Phone', label: 'Director 1 Phone', type: 'text', editable: true },
          { key: 'director1Email', label: 'Director 1 Email', type: 'email', editable: true },
          { key: 'director1Address', label: 'Director 1 Address', type: 'textarea', editable: true },
          { key: 'director1DateOfBirth', label: 'Director 1 Date of Birth', type: 'date', editable: true },
          { key: 'director1Nationality', label: 'Director 1 Nationality', type: 'text', editable: true },
          { key: 'director1IdType', label: 'Director 1 ID Type', type: 'text', editable: true },
          { key: 'director1IdNumber', label: 'Director 1 ID Number', type: 'text', editable: true },
          { key: 'director2Name', label: 'Director 2 Name', type: 'text', editable: true },
          { key: 'director2Phone', label: 'Director 2 Phone', type: 'text', editable: true },
          { key: 'director2Email', label: 'Director 2 Email', type: 'email', editable: true },
          { key: 'director2Address', label: 'Director 2 Address', type: 'textarea', editable: true },
          { key: 'director2DateOfBirth', label: 'Director 2 Date of Birth', type: 'date', editable: true },
          { key: 'director2Nationality', label: 'Director 2 Nationality', type: 'text', editable: true },
          { key: 'director2IdType', label: 'Director 2 ID Type', type: 'text', editable: true },
          { key: 'director2IdNumber', label: 'Director 2 ID Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Bank Account Details',
        fields: [
          { key: 'localAccountNumber', label: 'Local Account Number', type: 'text', editable: true },
          { key: 'localBankName', label: 'Local Bank Name', type: 'text', editable: true },
          { key: 'localBankBranch', label: 'Local Bank Branch', type: 'text', editable: true },
          { key: 'localAccountOpeningDate', label: 'Local Account Opening Date', type: 'date', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Document Uploads',
        fields: [
          { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', type: 'file', editable: false },
          { key: 'identificationMeansDirector1', label: 'Identification Means for Director 1', type: 'file', editable: false },
          { key: 'identificationMeansDirector2', label: 'Identification Means for Director 2', type: 'file', editable: false },
          { key: 'cacStatusReport', label: 'CAC Status Report', type: 'file', editable: false },
          { key: 'vatRegistrationLicense', label: 'VAT Registration License', type: 'file', editable: false },
          { key: 'taxClearanceCertificate', label: 'Tax Clearance Certificate', type: 'file', editable: false },
          { key: 'naicomLicenseCertificate', label: 'NAICOM License Certificate', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  // === CORPORATE CDD ===
  'corporate-cdd': {
    title: 'Corporate CDD',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredCompanyAddress', label: 'Registered Company Address', type: 'textarea', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation Number', type: 'text', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'dateOfIncorporationRegistration', label: 'Date of Incorporation/Registration', type: 'date', editable: true },
          { key: 'natureOfBusiness', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'companyLegalForm', label: 'Company Type', type: 'text', editable: true },
          { key: 'ccompanyLegalFormOther', label: 'Other Company Type', type: 'text', editable: true, conditional: { dependsOn: 'companyLegalForm', value: 'Other' } },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'url', editable: true },
          { key: 'taxIdentificationNumber', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'telephoneNumber', label: 'Telephone Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: true }, // May be flat object in older versions
          // Individual director fields for flat object compatibility
          { key: 'director1Name', label: 'Director 1 Name', type: 'text', editable: true },
          { key: 'director1Phone', label: 'Director 1 Phone', type: 'text', editable: true },
          { key: 'director1Email', label: 'Director 1 Email', type: 'email', editable: true },
          { key: 'director1Address', label: 'Director 1 Address', type: 'textarea', editable: true },
          { key: 'director1DateOfBirth', label: 'Director 1 Date of Birth', type: 'date', editable: true },
          { key: 'director1Nationality', label: 'Director 1 Nationality', type: 'text', editable: true },
          { key: 'director1IdType', label: 'Director 1 ID Type', type: 'text', editable: true },
          { key: 'director1IdNumber', label: 'Director 1 ID Number', type: 'text', editable: true },
          { key: 'director2Name', label: 'Director 2 Name', type: 'text', editable: true },
          { key: 'director2Phone', label: 'Director 2 Phone', type: 'text', editable: true },
          { key: 'director2Email', label: 'Director 2 Email', type: 'email', editable: true },
          { key: 'director2Address', label: 'Director 2 Address', type: 'textarea', editable: true },
          { key: 'director2DateOfBirth', label: 'Director 2 Date of Birth', type: 'date', editable: true },
          { key: 'director2Nationality', label: 'Director 2 Nationality', type: 'text', editable: true },
          { key: 'director2IdType', label: 'Director 2 ID Type', type: 'text', editable: true },
          { key: 'director2IdNumber', label: 'Director 2 ID Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Bank Account Details',
        fields: [
          { key: 'bankName', label: 'Bank Name', type: 'text', editable: true },
          { key: 'accountNumber', label: 'Account Number', type: 'text', editable: true },
          { key: 'bankBranch', label: 'Bank Branch', type: 'text', editable: true },
          { key: 'accountOpeningDate', label: 'Account Opening Date', type: 'date', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Document Uploads',
        fields: [
          { key: 'cacCertificate', label: 'CAC Certificate', type: 'file', editable: false },
          { key: 'identification', label: 'Identification Document', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  // === NAICOM CORPORATE CDD ===
  'naicom-corporate-cdd': {
    title: 'NAICOM Corporate CDD',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Company Address', type: 'textarea', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation Number', type: 'text', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'dateOfIncorporation', label: 'Date of Incorporation/Registration', type: 'date', editable: true },
          { key: 'natureOfBusiness', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'companyType', label: 'Company Type', type: 'text', editable: true },
          { key: 'companyTypeOther', label: 'Other Company Type', type: 'text', editable: true, conditional: { dependsOn: 'companyType', value: 'Other' } },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'url', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'telephone', label: 'Telephone Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: true }, // May be flat object in older versions
          // Individual director fields for flat object compatibility
          { key: 'director1Name', label: 'Director 1 Name', type: 'text', editable: true },
          { key: 'director1Phone', label: 'Director 1 Phone', type: 'text', editable: true },
          { key: 'director1Email', label: 'Director 1 Email', type: 'email', editable: true },
          { key: 'director1Address', label: 'Director 1 Address', type: 'textarea', editable: true },
          { key: 'director1DateOfBirth', label: 'Director 1 Date of Birth', type: 'date', editable: true },
          { key: 'director1Nationality', label: 'Director 1 Nationality', type: 'text', editable: true },
          { key: 'director1IdType', label: 'Director 1 ID Type', type: 'text', editable: true },
          { key: 'director1IdNumber', label: 'Director 1 ID Number', type: 'text', editable: true },
          { key: 'director2Name', label: 'Director 2 Name', type: 'text', editable: true },
          { key: 'director2Phone', label: 'Director 2 Phone', type: 'text', editable: true },
          { key: 'director2Email', label: 'Director 2 Email', type: 'email', editable: true },
          { key: 'director2Address', label: 'Director 2 Address', type: 'textarea', editable: true },
          { key: 'director2DateOfBirth', label: 'Director 2 Date of Birth', type: 'date', editable: true },
          { key: 'director2Nationality', label: 'Director 2 Nationality', type: 'text', editable: true },
          { key: 'director2IdType', label: 'Director 2 ID Type', type: 'text', editable: true },
          { key: 'director2IdNumber', label: 'Director 2 ID Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Bank Account Details',
        fields: [
          { key: 'bankName', label: 'Bank Name', type: 'text', editable: true },
          { key: 'accountNumber', label: 'Account Number', type: 'text', editable: true },
          { key: 'bankBranch', label: 'Bank Branch', type: 'text', editable: true },
          { key: 'accountOpeningDate', label: 'Account Opening Date', type: 'date', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Document Uploads',
        fields: [
          { key: 'cacCertificate', label: 'CAC Certificate', type: 'file', editable: false },
          { key: 'identification', label: 'Identification Document', type: 'file', editable: false },
          { key: 'naicomLicenseCertificate', label: 'NAICOM License Certificate', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  'corporate-kyc': {
    title: 'Corporate CDD Form',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Company Address', type: 'textarea', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation Number', type: 'text', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'dateOfIncorporation', label: 'Date of Incorporation/Registration', type: 'date', editable: true },
          { key: 'natureOfBusiness', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'companyType', label: 'Company Type', type: 'text', editable: true },
          { key: 'companyTypeOther', label: 'Company Type (Other)', type: 'text', editable: true, conditional: { dependsOn: 'companyType', value: 'Other' } },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'text', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'telephone', label: 'Telephone Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: false },
          // Individual director fields for flat structure compatibility
          { key: 'firstName', label: 'Director 1 First Name', type: 'text', editable: true },
          { key: 'middleName', label: 'Director 1 Middle Name', type: 'text', editable: true },
          { key: 'lastName', label: 'Director 1 Last Name', type: 'text', editable: true },
          { key: 'email', label: 'Director 1 Email', type: 'email', editable: true },
          { key: 'phoneNumber', label: 'Director 1 Phone Number', type: 'text', editable: true },
          { key: 'dob', label: 'Director 1 Date of Birth', type: 'date', editable: true },
          { key: 'nationality', label: 'Director 1 Nationality', type: 'text', editable: true },
          { key: 'occupation', label: 'Director 1 Occupation', type: 'text', editable: true },
          { key: 'residentialAddress', label: 'Director 1 Residential Address', type: 'textarea', editable: true },
          { key: 'idType', label: 'Director 1 ID Type', type: 'text', editable: true },
          { key: 'idNumber', label: 'Director 1 ID Number', type: 'text', editable: true },
          { key: 'issuedDate', label: 'Director 1 ID Issued Date', type: 'date', editable: true },
          { key: 'expiryDate', label: 'Director 1 ID Expiry Date', type: 'date', editable: true },
          { key: 'issuingBody', label: 'Director 1 ID Issuing Body', type: 'text', editable: true },
          { key: 'placeOfBirth', label: 'Director 1 Place of Birth', type: 'text', editable: true },
          { key: 'employersName', label: 'Director 1 Employers Name', type: 'text', editable: true },
          { key: 'employersPhoneNumber', label: 'Director 1 Employers Phone Number', type: 'text', editable: true },
          { key: 'sourceOfIncome', label: 'Director 1 Source of Income', type: 'text', editable: true },
          { key: 'taxIDNumber', label: 'Director 1 Tax ID Number', type: 'text', editable: true },
          { key: 'BVNNumber', label: 'Director 1 BVN Number', type: 'text', editable: true },
          // Director 2 fields
          { key: 'firstName2', label: 'Director 2 First Name', type: 'text', editable: true },
          { key: 'middleName2', label: 'Director 2 Middle Name', type: 'text', editable: true },
          { key: 'lastName2', label: 'Director 2 Last Name', type: 'text', editable: true },
          { key: 'email2', label: 'Director 2 Email', type: 'email', editable: true },
          { key: 'phoneNumber2', label: 'Director 2 Phone Number', type: 'text', editable: true },
          { key: 'dob2', label: 'Director 2 Date of Birth', type: 'date', editable: true },
          { key: 'nationality2', label: 'Director 2 Nationality', type: 'text', editable: true },
          { key: 'occupation2', label: 'Director 2 Occupation', type: 'text', editable: true },
          { key: 'residentialAddress2', label: 'Director 2 Residential Address', type: 'textarea', editable: true },
          { key: 'idType2', label: 'Director 2 ID Type', type: 'text', editable: true },
          { key: 'idNumber2', label: 'Director 2 ID Number', type: 'text', editable: true },
          { key: 'issuedDate2', label: 'Director 2 ID Issued Date', type: 'date', editable: true },
          { key: 'expiryDate2', label: 'Director 2 ID Expiry Date', type: 'date', editable: true },
          { key: 'issuingBody2', label: 'Director 2 ID Issuing Body', type: 'text', editable: true },
          { key: 'placeOfBirth2', label: 'Director 2 Place of Birth', type: 'text', editable: true },
          { key: 'employersName2', label: 'Director 2 Employers Name', type: 'text', editable: true },
          { key: 'employersPhoneNumber2', label: 'Director 2 Employers Phone Number', type: 'text', editable: true },
          { key: 'sourceOfIncome2', label: 'Director 2 Source of Income', type: 'text', editable: true },
          { key: 'taxIDNumber2', label: 'Director 2 Tax ID Number', type: 'text', editable: true },
          { key: 'BVNNumber2', label: 'Director 2 BVN Number', type: 'text', editable: true }
        ]
      },
      {
        title: 'Account Details',
        fields: [
          { key: 'bankName', label: 'Bank Name', type: 'text', editable: true },
          { key: 'accountNumber', label: 'Account Number', type: 'text', editable: true },
          { key: 'bankBranch', label: 'Bank Branch', type: 'text', editable: true },
          { key: 'accountOpeningDate', label: 'Account Opening Date', type: 'date', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'File Uploads',
        fields: [
          { key: 'cac', label: 'Certificate of Incorporation', type: 'file', editable: false },
          { key: 'identification', label: 'Identification Document', type: 'file', editable: false },
          { key: 'certificateOfIncorporationUrl', label: 'Certificate of Incorporation', type: 'file', editable: false },
          { key: 'memorandumOfAssociationUrl', label: 'Memorandum of Association', type: 'file', editable: false },
          { key: 'articlesOfAssociationUrl', label: 'Articles of Association', type: 'file', editable: false },
          { key: 'directorsResolutionUrl', label: 'Directors Resolution', type: 'file', editable: false }
        ]
      },
      {
        title: 'Declaration',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: true },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  'partners-kyc': {
    title: 'Partners CDD Form',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Company Address', type: 'textarea', editable: true },
          { key: 'city', label: 'City', type: 'text', editable: true },
          { key: 'state', label: 'State', type: 'text', editable: true },
          { key: 'country', label: 'Country', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'text', editable: true },
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text', editable: true },
          { key: 'contactPersonNumber', label: 'Contact Person Number', type: 'text', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'vatRegistrationNumber', label: 'VAT Registration Number', type: 'text', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation/RC Number', type: 'text', editable: true },
          { key: 'incorporationDate', label: 'Date of Incorporation', type: 'date', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'businessNature', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: false }
        ]
      },
      {
        title: 'Account Details',
        fields: [
          { key: 'localAccountNumber', label: 'Local Account Number', type: 'text', editable: true },
          { key: 'localBankName', label: 'Local Bank Name', type: 'text', editable: true },
          { key: 'localBankBranch', label: 'Local Bank Branch', type: 'text', editable: true },
          { key: 'localAccountOpeningDate', label: 'Local Account Opening Date', type: 'date', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Declaration',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: true },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  'agents-kyc': {
    title: 'Agents CDD Form',
    sections: [
      {
        title: 'Personal Information',
        fields: [
          { key: 'firstName', label: 'First Name', type: 'text', editable: true },
          { key: 'middleName', label: 'Middle Name', type: 'text', editable: true },
          { key: 'lastName', label: 'Last Name', type: 'text', editable: true },
          { key: 'residentialAddress', label: 'Residential Address', type: 'textarea', editable: true },
          { key: 'gender', label: 'Gender', type: 'text', editable: true },
          { key: 'position', label: 'Position/Role', type: 'text', editable: true },
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', editable: true },
          { key: 'placeOfBirth', label: 'Place of Birth', type: 'text', editable: true },
          { key: 'otherSourceOfIncome', label: 'Other Source of Income', type: 'text', editable: true },
          { key: 'otherSourceOfIncomeOther', label: 'Other Source of Income (Specify)', type: 'text', editable: true, conditional: { dependsOn: 'otherSourceOfIncome', value: 'other' } },
          { key: 'nationality', label: 'Nationality', type: 'text', editable: true },
          { key: 'phoneNumber', label: 'Phone Number', type: 'text', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true },
          { key: 'taxIdNumber', label: 'Tax ID Number', type: 'text', editable: true },
          { key: 'occupation', label: 'Occupation', type: 'text', editable: true },
          { key: 'email', label: 'Email', type: 'email', editable: true },
          { key: 'validMeansOfId', label: 'Valid Means of ID', type: 'text', editable: true },
          { key: 'identificationNumber', label: 'Identification Number', type: 'text', editable: true },
          { key: 'issuedDate', label: 'Issued Date', type: 'date', editable: true },
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', editable: true },
          { key: 'issuingBody', label: 'Issuing Body', type: 'text', editable: true }
        ]
      },
      {
        title: 'Additional Information',
        fields: [
          { key: 'agentName', label: 'Agent Name', type: 'text', editable: true },
          { key: 'agentsOfficeAddress', label: 'Agents Office Address', type: 'textarea', editable: true },
          { key: 'naicomLicenseNumber', label: 'NAICOM License Number (RIA)', type: 'text', editable: true },
          { key: 'licenseIssuedDate', label: 'License Issued Date', type: 'date', editable: true },
          { key: 'licenseExpiryDate', label: 'License Expiry Date', type: 'date', editable: true },
          { key: 'emailAddress', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'text', editable: true },
          { key: 'mobileNumber', label: 'Mobile Number', type: 'text', editable: true },
          { key: 'taxIdentificationNumber', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'arianMembershipNumber', label: 'ARIAN Membership Number', type: 'text', editable: true },
          { key: 'listOfAgentsApprovedPrincipals', label: 'List of Agents Approved Principals (Insurers)', type: 'textarea', editable: true }
        ]
      },
      {
        title: 'Financial Information',
        fields: [
          { key: 'localAccountNumber', label: 'Local Account Number', type: 'text', editable: true },
          { key: 'localBankName', label: 'Local Bank Name', type: 'text', editable: true },
          { key: 'localBankBranch', label: 'Local Bank Branch', type: 'text', editable: true },
          { key: 'localAccountOpeningDate', label: 'Local Account Opening Date', type: 'date', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Declaration',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: true },
          { key: 'signature', label: 'Digital Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
        ]
      }
    ]
  },

  'brokers-kyc': {
    title: 'Brokers CDD Form',
    sections: [
      {
        title: 'Company Information',
        fields: [
          { key: 'companyName', label: 'Company Name', type: 'text', editable: true },
          { key: 'registeredAddress', label: 'Registered Company Address', type: 'textarea', editable: true },
          { key: 'city', label: 'City', type: 'text', editable: true },
          { key: 'state', label: 'State', type: 'text', editable: true },
          { key: 'country', label: 'Country', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'website', label: 'Website', type: 'text', editable: true },
          { key: 'contactPersonName', label: 'Contact Person Name', type: 'text', editable: true },
          { key: 'contactPersonNumber', label: 'Contact Person Number', type: 'text', editable: true },
          { key: 'taxId', label: 'Tax Identification Number', type: 'text', editable: true },
          { key: 'vatRegistrationNumber', label: 'VAT Registration Number', type: 'text', editable: true },
          { key: 'incorporationNumber', label: 'Incorporation/RC Number', type: 'text', editable: true },
          { key: 'incorporationDate', label: 'Date of Incorporation', type: 'date', editable: true },
          { key: 'incorporationState', label: 'Incorporation State', type: 'text', editable: true },
          { key: 'businessNature', label: 'Nature of Business', type: 'textarea', editable: true },
          { key: 'bvn', label: 'BVN', type: 'text', editable: true }
        ]
      },
      {
        title: 'Directors Information',
        fields: [
          { key: 'directors', label: 'Directors', type: 'array', editable: false }
        ]
      },
      {
        title: 'Account Details',
        fields: [
          { key: 'localAccountNumber', label: 'Local Account Number', type: 'text', editable: true },
          { key: 'localBankName', label: 'Local Bank Name', type: 'text', editable: true },
          { key: 'localBankBranch', label: 'Local Bank Branch', type: 'text', editable: true },
          { key: 'localAccountOpeningDate', label: 'Local Account Opening Date', type: 'date', editable: true },
          { key: 'foreignAccountNumber', label: 'Foreign Account Number', type: 'text', editable: true },
          { key: 'foreignBankName', label: 'Foreign Bank Name', type: 'text', editable: true },
          { key: 'foreignBankBranch', label: 'Foreign Bank Branch', type: 'text', editable: true },
          { key: 'foreignAccountOpeningDate', label: 'Foreign Account Opening Date', type: 'date', editable: true }
        ]
      },
      {
        title: 'Declaration',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: true },
          { key: 'signature', label: 'Signature', type: 'text', editable: true }
        ]
      },
      {
        title: 'System Information',
        fields: [
          { key: 'status', label: 'Status', type: 'text', editable: true },
          { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
          { key: 'createdAt', label: 'Created At', type: 'text', editable: false },
          { key: 'formType', label: 'Form Type', type: 'text', editable: false }
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
