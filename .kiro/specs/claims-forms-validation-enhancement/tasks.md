# Implementation Plan: Claims Forms Validation Enhancement

## Overview

This plan implements centralized validation utilities and applies them across all 26 claim forms, starting with adding DOB and gender fields to the Fire & Special Perils form.

## Tasks

- [x] 1. Create centralized validation utilities
  - [x] 1.1 Add validation functions to src/utils/validation.ts
  - [x] 1.6 Add Yup integration helpers

- [x] 2. Update Fire & Special Perils form with DOB and gender
  - [x] 2.1 Add dateOfBirth and gender fields to FireSpecialPerilsClaimData interface
  - [x] 2.2 Update Fire form schema with new field validations
  - [x] 2.3 Add DOB and gender inputs to Fire form UI

- [x] 3. Update admin display for Fire claims
  - [x] 3.1 Add DOB and gender to admin table and form viewer

- [ ] 4. Apply validation to claim forms - Batch 1
  - [x] 4.1 Update BurglaryClaimForm
  - [ ] 4.2 Update MotorClaim
  - [ ] 4.3 Update ProfessionalIndemnityClaimForm
  - [ ] 4.4 Update PublicLiabilityClaimForm

- [ ] 5. Apply validation to claim forms - Batch 2
  - [ ] 5.1 Update EmployersLiabilityClaim
  - [x] 5.2 Update CombinedGPAEmployersLiabilityClaim
  - [x] 5.3 Update GroupPersonalAccidentClaim
  - [x] 5.4 Update AllRiskClaim

- [ ] 6. Apply validation to claim forms - Batch 3
  - [x] 6.1 Update MoneyInsuranceClaim
  - [x] 6.2 Update FidelityGuaranteeClaim
  - [ ] 6.3 Update GoodsInTransitClaim
  - [x] 6.4 Update RentAssuranceClaim

- [ ] 7. Apply validation to claim forms - Batch 4
  - [x] 7.1 Update ContractorsPlantMachineryClaim
  - [x] 7.2 Update NEMHomeProtectionClaim
  - [ ] 7.3 Update SmartMotoristProtectionClaim
  - [ ] 7.4 Update SmartTravellerProtectionClaim

- [ ] 8. Apply validation to claim forms - Batch 5
  - [ ] 8.1 Update SmartStudentsProtectionClaim
  - [ ] 8.2 Update SmartGenerationZProtectionClaim
  - [ ] 8.3 Update SmartArtisanProtectionClaim
  - [ ] 8.4 Update MultiPerilsCropClaim

- [x] 9. Apply validation to claim forms - Batch 6
  - [x] 9.1 Update YieldIndexInsuranceClaim
  - [x] 9.2 Update LivestockClaim
  - [x] 9.3 Update PoultryClaim
  - [x] 9.4 Update FisheryFishFarmClaim

- [x] 10. Apply validation to remaining claim form - Batch 7
  - [x] 10.1 Update FarmPropertyProduceClaim

- [x] 11. Final verification
  - Run diagnostics on all modified files
