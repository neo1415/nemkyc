# Bugfix Requirements Document

## Introduction

The Corporate NFIU form viewer has critical display and PDF generation issues that result in inconsistent field ordering, technical metadata leaking into the display, and poor PDF quality. This affects the professional presentation of Corporate NFIU forms to administrators and undermines the user experience. The bug occurs because FormViewer.tsx uses a generic array rendering approach with Object.entries() which doesn't guarantee field order, unlike the dedicated CorporateKYCViewer component which maintains consistent field ordering and professional PDF generation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a Corporate NFIU form is viewed in FormViewer THEN the directors section displays fields in random order on each page refresh

1.2 WHEN a Corporate NFIU form is viewed in FormViewer THEN technical metadata fields like "_rowHeight" and "32" appear in the display

1.3 WHEN a Corporate NFIU form is viewed in FormViewer THEN directors are not displayed in separate cards with clear "Director 1", "Director 2" headers

1.4 WHEN a Corporate NFIU form is viewed in FormViewer THEN fields are not displayed in a clean 2-column grid layout

1.5 WHEN a PDF is generated for a Corporate NFIU form using FormViewer THEN the PDF has poor formatting with messy table layout

1.6 WHEN a PDF is generated for a Corporate NFIU form using FormViewer THEN the PDF does not include NEM Insurance header with burgundy branding

1.7 WHEN a Corporate NFIU form is viewed in FormViewer THEN the PDF generation does not use html2canvas + jsPDF approach

### Expected Behavior (Correct)

2.1 WHEN a Corporate NFIU form is viewed THEN the directors section SHALL display fields in a consistent, logical order on every page load

2.2 WHEN a Corporate NFIU form is viewed THEN technical metadata fields like "_rowHeight" and numeric values SHALL NOT appear in the display

2.3 WHEN a Corporate NFIU form is viewed THEN each director SHALL be displayed in a separate card with clear "Director 1", "Director 2" headers

2.4 WHEN a Corporate NFIU form is viewed THEN fields SHALL be displayed in a clean 2-column grid layout matching CorporateKYCViewer

2.5 WHEN a PDF is generated for a Corporate NFIU form THEN the PDF SHALL have professional formatting using html2canvas to capture the visual layout

2.6 WHEN a PDF is generated for a Corporate NFIU form THEN the PDF SHALL include NEM Insurance header with burgundy branding

2.7 WHEN a Corporate NFIU form is viewed THEN the system SHALL use a dedicated CorporateNFIUViewer component instead of the generic FormViewer

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a non-Corporate-NFIU form is viewed THEN the system SHALL CONTINUE TO use the appropriate viewer component (CorporateKYCViewer, IndividualKYCViewer, etc.)

3.2 WHEN a Corporate NFIU form with flat director structure (firstName, firstName2) is viewed THEN the system SHALL CONTINUE TO synthesize the directors array correctly

3.3 WHEN a Corporate NFIU form with array director structure is viewed THEN the system SHALL CONTINUE TO display directors correctly

3.4 WHEN FormViewer routes to specialized viewers THEN the system SHALL CONTINUE TO pass formData and navigation handlers correctly

3.5 WHEN any form PDF is generated THEN the system SHALL CONTINUE TO handle multi-page content correctly

3.6 WHEN any form is viewed THEN the system SHALL CONTINUE TO display file upload fields with download buttons

3.7 WHEN any form is viewed THEN the system SHALL CONTINUE TO format dates, times, and currency values correctly

3.8 WHEN any form is viewed THEN the system SHALL CONTINUE TO display the ticket ID prominently if present
