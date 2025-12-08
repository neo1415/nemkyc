# Collection Mapping Analysis

## Current State (BEFORE FIX)

### Corporate KYC
- **Form submits with formType**: `'Corporate KYC'`
- **Server maps to collection**: `'corporate-kyc-form'` (from getFirestoreCollection function)
- **Admin table fetches from**: `'corporate-kyc-form'` (CorporateKYCTable.tsx)
- **Status**: ✅ CORRECT - Matches!

### Corporate CDD
- **Form submits with formType**: `'Corporate CDD'`
- **Server maps to collection**: `'corporateCDD'` (from getFirestoreCollection function)
- **Admin table fetches from**: `'corporate-kyc'` (CorporateCDDTable.tsx)
- **Status**: ❌ WRONG - Mismatch! Should be `'corporateCDD'`

### NAICOM Corporate CDD
- **Form submits with formType**: `'NAICOM Corporate CDD'`
- **Server maps to collection**: `'corporateCDD'` (from getFirestoreCollection function - matches "corporate" and "cdd")
- **Admin table fetches from**: `'corporate-kyc'` (CorporateCDDTable.tsx - same table as Corporate CDD)
- **Status**: ❌ WRONG - Mismatch! Should be `'corporateCDD'`

## Issue Identified
The `CorporateCDDTable.tsx` is fetching from `'corporate-kyc'` but both Corporate CDD and NAICOM Corporate CDD forms are submitting to `'corporateCDD'` collection.

## Required Fix
Change `CorporateCDDTable.tsx` to fetch from `'corporateCDD'` instead of `'corporate-kyc'`.

## Note
The misleading collection name `'corporate-kyc'` in the admin table was incorrect. The correct collection for Corporate CDD forms is `'corporateCDD'` as defined in server.js getFirestoreCollection function.
