// Form structure mappings for Enhanced Form Viewer
// This file defines how form data should be organized and displayed in sections

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'email' | 'url' | 'array' | 'object' | 'boolean' | 'number';
  editable?: boolean;
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
          { key: 'declarationAdditionalInfo', label: 'Additional Information Agreement', type: 'boolean', editable: false },
          { key: 'declarationDocuments', label: 'Documents Agreement', type: 'boolean', editable: false },
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
          { key: 'retainerDetails', label: 'Retainer Details', type: 'text', editable: true },
          { key: 'contractInWriting', label: 'Contract in Writing', type: 'text', editable: true },
          { key: 'contractDetails', label: 'Contract Details', type: 'text', editable: true },
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
          { key: 'claimNature', label: 'Nature of Claim', type: 'text', editable: true },
          { key: 'firstAwareDate', label: 'Date First Became Aware', type: 'date', editable: true },
          { key: 'claimMadeDate', label: 'Date Claim Was Made', type: 'date', editable: true },
          { key: 'intimationMode', label: 'Intimation Mode', type: 'text', editable: true },
          { key: 'oralDetails', label: 'Oral Details', type: 'text', editable: true },
          { key: 'amountClaimed', label: 'Amount Claimed', type: 'number', editable: true },
        ]
      },
      {
        title: 'Response & Assessment',
        fields: [
          { key: 'responseComments', label: 'Response Comments', type: 'text', editable: true },
          { key: 'quantumComments', label: 'Quantum Comments', type: 'text', editable: true },
          { key: 'estimatedLiability', label: 'Estimated Liability', type: 'number', editable: true },
          { key: 'additionalInfo', label: 'Additional Information', type: 'text', editable: true },
          { key: 'additionalDetails', label: 'Additional Details', type: 'text', editable: true },
        ]
      },
      {
        title: 'Solicitor Details',
        fields: [
          { key: 'solicitorInstructed', label: 'Solicitor Instructed', type: 'text', editable: true },
          { key: 'solicitorName', label: 'Solicitor Name', type: 'text', editable: true },
          { key: 'solicitorAddress', label: 'Solicitor Address', type: 'text', editable: true },
          { key: 'solicitorCompany', label: 'Solicitor Company', type: 'text', editable: true },
          { key: 'solicitorRates', label: 'Solicitor Rates', type: 'text', editable: true },
        ]
      },
      {
        title: 'Declaration & Signature',
        fields: [
          { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
          { key: 'declarationTrue', label: 'Declaration True', type: 'boolean', editable: false },
          { key: 'declarationAdditionalInfo', label: 'Additional Information Agreement', type: 'boolean', editable: false },
          { key: 'declarationDocuments', label: 'Documents Agreement', type: 'boolean', editable: false },
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
          { key: 'declarationAdditionalInfo', label: 'Additional Information Agreement', type: 'boolean', editable: false },
          { key: 'declarationDocuments', label: 'Documents Agreement', type: 'boolean', editable: false },
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
          { key: 'previousAccidentsDetails', label: 'Previous Accidents Details', type: 'text', editable: true },
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
          { key: 'declarationAdditionalInfo', label: 'Additional Information Agreement', type: 'boolean', editable: false },
          { key: 'declarationDocuments', label: 'Documents Agreement', type: 'boolean', editable: false },
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