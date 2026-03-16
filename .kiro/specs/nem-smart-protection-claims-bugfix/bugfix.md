# Bugfix Requirements Document

## Introduction

The NEM Smart Protection Claims implementation is severely incomplete and incorrect. The user provided detailed JSON schemas for 6 claim forms, but the current implementation has critical defects that prevent proper functionality. This bugfix addresses missing navigation links, incomplete field structures, and missing critical fields that don't match the provided JSON schemas.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN users access the Claims dropdown in the navbar THEN the system does not show the 6 new Smart Protection forms (SMP, SSP, STP, SAP, SGP, HOPP)

1.2 WHEN users fill out Smart Protection forms THEN the system presents incomplete forms missing many required fields from the JSON schemas

1.3 WHEN users encounter "other insurer details" field THEN the system shows a single field instead of 3 separate fields (name, address, policy number)

1.4 WHEN users submit Smart Protection forms THEN the system processes incomplete data that doesn't match the detailed JSON schema structure

1.5 WHEN users access Personal Accident forms THEN the system is missing critical fields like policyNumber, coverFrom, coverTo, insuredName, address, phone, email, alertPreference, accidentDate, accidentTime, accidentAmPm, accidentPlace, incidentDescription, injuryParticulars, witnesses array, doctorNameAddress, isUsualDoctor, totalIncapacityFrom, totalIncapacityTo, partialIncapacityFrom, partialIncapacityTo, declarationConfirmed, signatureDate

1.6 WHEN users access HOPP form THEN the system is missing critical fields like title, surname, firstName, otherName, dateOfBirth, gender, companyName, lossAddress, perilType, dateOfLoss, timeOfLoss, timeAmPm, medicalCertificateRequired, extentOfDamage, propertyInterest, propertyInterestOther, isSoleOwner, otherOwnerDetails, hasOtherInsurance, destroyedPropertyItems array

1.7 WHEN users interact with conditional fields THEN the system lacks proper conditional logic for field visibility based on user selections

1.8 WHEN users work with array fields THEN the system lacks proper implementation for witnesses and property items arrays

### Expected Behavior (Correct)

2.1 WHEN users access the Claims dropdown in the navbar THEN the system SHALL display all 6 Smart Protection forms: Smart Motorist Protection (SMP), Smart Students Protection (SSP), Smart Traveller Protection (STP), Smart Artisan Protection (SAP), Smart Generation Z Protection (SGP), and NEM Home Protection Policy (HOPP)

2.2 WHEN users fill out Smart Protection forms THEN the system SHALL present complete forms with all required fields matching the exact JSON schema structure

2.3 WHEN users encounter "other insurer details" field THEN the system SHALL show 3 separate fields: otherInsurerName, otherInsurerAddress, and otherInsurerPolicyNumber

2.4 WHEN users submit Smart Protection forms THEN the system SHALL process complete data that exactly matches the detailed JSON schema structure

2.5 WHEN users access Personal Accident forms (SMP, SSP, STP, SAP, SGP) THEN the system SHALL include all required fields: Policy Information (policyNumber, coverFrom, coverTo), Insured Details (insuredName/studentPupilName/companyName, address, phone, email, alertPreference), Details of Loss (accidentDate, accidentTime, accidentAmPm, accidentPlace, incidentDescription, injuryParticulars, witnesses array, doctorNameAddress, isUsualDoctor, totalIncapacityFrom, totalIncapacityTo, partialIncapacityFrom, partialIncapacityTo, otherInsurerDetails split into 3 fields), Declaration & Signature (declarationConfirmed, signature, signatureDate)

2.6 WHEN users access HOPP form THEN the system SHALL include all required fields: Policy Information (policyNumber, coverFrom, coverTo), Insured Details (title, surname, firstName, otherName, dateOfBirth, gender, companyName, address, phone, email, alertPreference), Details of Loss (lossAddress, perilType, dateOfLoss, timeOfLoss, timeAmPm, medicalCertificateRequired, extentOfDamage, propertyInterest, propertyInterestOther, isSoleOwner, otherOwnerDetails, hasOtherInsurance, otherInsurerDetails split into 3 fields, destroyedPropertyItems array), Declaration & Signature (declarationConfirmed, signature, signatureDate)

2.7 WHEN users interact with conditional fields THEN the system SHALL implement proper conditional logic: show isUsualDoctor when doctorNameAddress is not empty, show propertyInterestOther when propertyInterest equals "Other", show otherOwnerDetails when isSoleOwner equals "No", show otherInsurerDetails when hasOtherInsurance equals "Yes", show medicalCertificateRequired when perilType equals "Flood/Water/Storm/Lightning/Explosion/Accident"

2.8 WHEN users work with array fields THEN the system SHALL provide proper implementation for witnesses array (name, address) and destroyedPropertyItems array (description, cost, purchaseDate, valueAtLoss) with add/remove functionality

### Unchanged Behavior (Regression Prevention)

3.1 WHEN users access existing claim forms (Motor, Professional Indemnity, etc.) THEN the system SHALL CONTINUE TO function exactly as before with no changes to existing functionality

3.2 WHEN users navigate through the existing Claims dropdown items THEN the system SHALL CONTINUE TO work with all current navigation and routing

3.3 WHEN users submit existing claim forms THEN the system SHALL CONTINUE TO process submissions with the same data structure and validation

3.4 WHEN administrators view existing claims in the admin interface THEN the system SHALL CONTINUE TO display all existing claim types with proper formatting

3.5 WHEN the system generates ticket IDs for existing claim types THEN the system SHALL CONTINUE TO use the same prefixes and format

3.6 WHEN users access the form mappings for existing claim types THEN the system SHALL CONTINUE TO return the same configuration objects

3.7 WHEN the email service processes existing claim types THEN the system SHALL CONTINUE TO send notifications using the same templates and logic