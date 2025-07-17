// Form structure mappings for Enhanced Form Viewer
// This file defines how form data should be organized and displayed in sections

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'email' | 'url' | 'array' | 'object' | 'boolean' | 'number' | 'currency' | 'textarea' | 'file';
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
          { key: 'notDirectlyEmployed', label: 'Not Directly Employed', type: 'boolean', editable: true },
          { key: 'employerName', label: 'Employer Name', type: 'text', editable: true },
          { key: 'employerAddress', label: 'Employer Address', type: 'textarea', editable: true },
          { key: 'maritalStatus', label: 'Marital Status', type: 'text', editable: true },
          { key: 'previousAccidents', label: 'Previous Accidents', type: 'text', editable: true },
          { key: 'previousAccidentsDetails', label: 'Previous Accidents Details', type: 'textarea', editable: true },
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
          { key: 'hospitalName', label: 'Hospital Name', type: 'text', editable: true },
          { key: 'hospitalAddress', label: 'Hospital Address', type: 'textarea', editable: true },
          { key: 'stillInHospital', label: 'Still in Hospital', type: 'text', editable: true },
          { key: 'dischargeDate', label: 'Discharge Date', type: 'date', editable: true },
          { key: 'ableToDoduties', label: 'Able to Do Duties', type: 'text', editable: true },
          { key: 'dutiesDetails', label: 'Duties Details', type: 'textarea', editable: true },
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
          { key: 'declarationAdditionalInfo', label: 'Declaration Additional Info', type: 'boolean', editable: false },
          { key: 'declarationDocuments', label: 'Declaration Documents', type: 'boolean', editable: false },
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
          { key: 'howEntryEffected', label: 'How Entry Was Effected', type: 'textarea', editable: true },
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

  // Goods In Transit Claims
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
          { key: 'address', label: 'Address', type: 'text', editable: true },
          { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
          { key: 'email', label: 'Email Address', type: 'email', editable: true },
          { key: 'businessType', label: 'Business Type', type: 'text', editable: true },
        ]
      },
      {
        title: 'Loss Details',
        fields: [
          { key: 'dateOfLoss', label: 'Date of Loss', type: 'date', editable: true },
          { key: 'timeOfLoss', label: 'Time of Loss', type: 'text', editable: true },
          { key: 'placeOfOccurrence', label: 'Place of Occurrence', type: 'text', editable: true },
          { key: 'descriptionOfGoods', label: 'Description of Goods', type: 'text', editable: true },
          { key: 'numberOfPackages', label: 'Number of Packages', type: 'number', editable: true },
          { key: 'totalWeight', label: 'Total Weight', type: 'number', editable: true },
          { key: 'weightUnits', label: 'Weight Units', type: 'text', editable: true },
          { key: 'totalValue', label: 'Total Value', type: 'currency', editable: true },
          { key: 'howGoodsPacked', label: 'How Goods Packed', type: 'text', editable: true },
          { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'text', editable: true },
        ]
      },
      {
        title: 'Transport Details',
        fields: [
          { key: 'otherVehicleInvolved', label: 'Other Vehicle Involved', type: 'boolean', editable: true },
          { key: 'dispatchAddress', label: 'Dispatch Address', type: 'text', editable: true },
          { key: 'dispatchDate', label: 'Dispatch Date', type: 'text', editable: true },
          { key: 'consigneeName', label: 'Consignee Name', type: 'text', editable: true },
          { key: 'consigneeAddress', label: 'Consignee Address', type: 'text', editable: true },
          { key: 'vehicleRegistration', label: 'Vehicle Registration', type: 'text', editable: true },
        ]
      },
      {
        title: 'Goods Items',
        fields: [
          { key: 'goodsItems', label: 'Items List', type: 'array', editable: true },
        ]
      },
      {
        title: 'Additional Details',
        fields: [
          { key: 'inspectionAddress', label: 'Inspection Address', type: 'text', editable: true },
          { key: 'isOwnerOfGoods', label: 'Owner of Goods', type: 'boolean', editable: true },
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