# Bugfix Requirements Document

## Introduction

This document specifies the requirements for fixing a critical bug in the CAC document upload flow where customers select 3 CAC documents (all showing green checkmarks in the UI), but only 1 document is actually uploaded to the server. The bug is caused by a React state synchronization issue where the `cacDocuments` state object does not contain all selected files when the `handleVerify` function executes, despite the UI displaying visual confirmation for all 3 files.

The impact is severe: customers believe their verification is complete (green checkmarks visible), but the verification is incomplete on the server side, leading to failed verifications and poor user experience.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer selects 3 CAC documents (certificate_of_incorporation, particulars_of_directors, share_allotment) using the file input elements THEN the UI displays green checkmarks for all 3 files but the `cacDocuments` React state only contains 1 file

1.2 WHEN the customer clicks "Verify CAC" button after selecting 3 documents THEN only 1 document is uploaded to the server instead of all 3 selected documents

1.3 WHEN the upload completes with only 1 document THEN the verification succeeds but the admin UI shows "No CAC documents have been uploaded" because the document metadata query fails or returns incomplete results

1.4 WHEN documents are selected THEN no upload occurs immediately and no progress indicators are shown, creating a disconnect between user action and system state

1.5 WHEN the `handleVerify` function executes THEN it reads from the `cacDocuments` state which is out of sync with the UI's visual representation of selected files

### Expected Behavior (Correct)

2.1 WHEN a customer selects 3 CAC documents using the file input elements THEN the `cacDocuments` React state SHALL contain all 3 files and the UI SHALL display green checkmarks for all 3 files

2.2 WHEN the customer clicks "Verify CAC" button after selecting 3 documents THEN all 3 documents SHALL be uploaded to the server sequentially with visible progress indicators

2.3 WHEN all 3 documents are uploaded successfully THEN the verification SHALL proceed and the admin UI SHALL display all 3 uploaded documents with correct metadata

2.4 WHEN a document is selected THEN the upload SHALL begin immediately with a progress indicator showing upload percentage and status for each document

2.5 WHEN uploads are in progress THEN the "Verify CAC" button SHALL be disabled until all 3 uploads complete successfully

2.6 WHEN the `handleVerify` function executes THEN it SHALL only proceed with verification (not upload) since documents are already uploaded on selection

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer selects valid CAC documents (PDF or PNG, under 1MB) THEN the system SHALL CONTINUE TO validate file types and sizes before accepting them

3.2 WHEN document uploads fail due to network errors THEN the system SHALL CONTINUE TO display error messages and allow retry

3.3 WHEN the verification API is called after successful uploads THEN the system SHALL CONTINUE TO use the existing verification flow with VerifyData integration

3.4 WHEN documents are stored in Firebase Storage THEN the system SHALL CONTINUE TO use the correct storage path format: `cac-documents/{customerId}/{documentType}_{timestamp}`

3.5 WHEN document metadata is written to Firestore THEN the system SHALL CONTINUE TO use the `cac-document-metadata` collection with correct field names (customerId, documentType, storagePath, uploadedAt, fileSize, mimeType)

3.6 WHEN the admin queries for uploaded documents THEN the system SHALL CONTINUE TO query the `cac-document-metadata` collection filtered by customerId

3.7 WHEN a customer has already uploaded documents and returns to the page THEN the system SHALL CONTINUE TO display the previously uploaded documents with their status
