# PDF Generation QA Checklist

## Pre-Generation Checks

### Data Validation
- [ ] Submission data object is complete and valid
- [ ] All required fields are present in the submission
- [ ] Form type detection works correctly
- [ ] Blueprint mapping is appropriate for form type

### Test Data Preparation
- [ ] Test with complete form submissions
- [ ] Test with partially filled forms
- [ ] Test with edge cases (very long text, special characters)
- [ ] Test with different form types (Money Insurance, Rent Assurance, etc.)

## Visual Layout Checks

### Header Section
- [ ] NEM Insurance logo appears correctly (top-left)
- [ ] Company letterhead information is properly aligned
- [ ] Contact details are complete and accurate
- [ ] Header doesn't overlap with content

### Title and Policy Meta
- [ ] Form title is centered and in uppercase
- [ ] Policy meta box is positioned correctly (top-right)
- [ ] Policy number displays correctly (or shows blank line if empty)
- [ ] Coverage dates are formatted as DD/MM/YYYY
- [ ] Policy meta box has proper border and spacing

### Content Organization
- [ ] Sections are clearly separated with headers
- [ ] Section headers use burgundy color (#8B4513)
- [ ] Fields are organized in logical groups
- [ ] Field labels are bold and properly aligned
- [ ] Field values have appropriate formatting

### Page Layout
- [ ] Margins are consistent (20mm all around)
- [ ] Text doesn't extend beyond margins
- [ ] Page breaks occur at appropriate points
- [ ] No orphaned labels (label on one page, value on next)
- [ ] Headers repeat appropriately on new pages

## Content Accuracy Checks

### Data Mapping
- [ ] All submitted data appears in the PDF
- [ ] Field labels match expected labels
- [ ] No internal/system fields appear (id, status, etc.)
- [ ] File upload fields are listed in attachments only

### Data Formatting
- [ ] Dates are formatted as DD/MM/YYYY
- [ ] Currency values show ₦ symbol and proper formatting
- [ ] Boolean fields show checked/unchecked boxes (☑/☐)
- [ ] Long text wraps properly without cutting words
- [ ] Email addresses and phone numbers display correctly

### Conditional Logic
- [ ] Conditional fields only appear when conditions are met
- [ ] Hidden fields show label with empty line when appropriate
- [ ] Follow-up questions appear only when triggered
- [ ] No duplicate or conflicting information

## Special Handling Checks

### Array Fields
- [ ] Directors array displays as numbered sections
- [ ] Property items show in table format
- [ ] Array headers are clear and descriptive
- [ ] Empty arrays show "N/A" appropriately

### Form-Specific Features
- [ ] Money Insurance: Transit vs. Safe sections display correctly
- [ ] Rent Assurance: Special declaration paragraph included
- [ ] Corporate forms: Director information properly structured
- [ ] Claims forms: Loss details properly organized

### Attachments Section
- [ ] File upload fields listed with descriptive names
- [ ] No actual file content embedded
- [ ] Attachment list is complete
- [ ] Proper bullet formatting for attachment names

## Footer Content Checks

### Required Blocks (All Must Be Present)
- [ ] Important Notice section with all 3 bullet points
- [ ] Claims Procedure section with all 5 bullet points  
- [ ] Data Privacy Statement with all 3 bullet points
- [ ] Declaration section with numbered points (1-3)
- [ ] Signature line with date field

### Rent Assurance Special Content
- [ ] Special declaration paragraph appears for rent forms only
- [ ] Insured name and address populated in declaration
- [ ] Claim amount formatted correctly in declaration
- [ ] Additional note about rent agreement attachments

### Declaration and Signature
- [ ] Declaration stays together on same page (no page break)
- [ ] Signature line is properly formatted
- [ ] Date field is aligned to the right
- [ ] All declaration text is accurate and complete

## Page Management Checks

### Page Breaks
- [ ] Sections don't break inappropriately
- [ ] Declaration block stays on same page
- [ ] Tables break properly with headers repeated
- [ ] No excessive white space before page breaks

### Page Numbering
- [ ] Page numbers appear at bottom center
- [ ] Company name appears in footer
- [ ] Page numbering is sequential and accurate
- [ ] Footer doesn't interfere with content

## Typography and Styling

### Font Consistency
- [ ] Consistent font family throughout document
- [ ] Proper font sizes (Title: 16pt, Headers: 12pt, Body: 10pt)
- [ ] Bold formatting applied consistently
- [ ] No font rendering issues

### Color Usage
- [ ] Headers use burgundy color (#8B4513)
- [ ] Body text is black
- [ ] Color choices are print-friendly
- [ ] Sufficient contrast for readability

### Spacing and Alignment
- [ ] Consistent line spacing throughout
- [ ] Proper spacing between sections
- [ ] Field labels and values aligned correctly
- [ ] No excessive gaps or cramped text

## Functional Testing

### PDF Generation
- [ ] PDF generates without errors
- [ ] Generation completes in reasonable time
- [ ] Memory usage is acceptable
- [ ] No console errors during generation

### File Operations
- [ ] PDF downloads with correct filename
- [ ] File size is reasonable
- [ ] PDF opens correctly in viewers
- [ ] Print layout is appropriate

### Browser Compatibility
- [ ] Works in Chrome/Chromium browsers
- [ ] Works in Firefox
- [ ] Works in Safari (if applicable)
- [ ] Works in Edge

## Print Quality Checks

### Physical Printing
- [ ] Print one sample page to verify margins
- [ ] Logo prints clearly at appropriate size
- [ ] Text is readable when printed
- [ ] Colors print appropriately (or test in grayscale)

### Print Layout
- [ ] No content cut off at margins
- [ ] Page breaks work well for printing
- [ ] Scale is appropriate for A4 paper
- [ ] Professional appearance when printed

## Edge Case Testing

### Data Edge Cases
- [ ] Very long company names
- [ ] Special characters in text fields
- [ ] Empty/null values display as "N/A"
- [ ] Large numbers format correctly

### Content Edge Cases
- [ ] Forms with many sections (4+ pages)
- [ ] Forms with large arrays (10+ directors)
- [ ] Forms with extensive text descriptions
- [ ] Minimal forms with few filled fields

### System Edge Cases
- [ ] Missing form mappings handled gracefully
- [ ] Unknown field types display appropriately
- [ ] Corrupted or invalid data handled safely
- [ ] Network issues during generation

## Performance Validation

### Generation Speed
- [ ] Small forms (1 page) generate quickly (< 2 seconds)
- [ ] Large forms (4+ pages) generate reasonably (< 10 seconds)
- [ ] No significant delays or hanging
- [ ] Progress indication if needed

### Memory Usage
- [ ] No memory leaks during generation
- [ ] Multiple PDFs can be generated consecutively
- [ ] Browser doesn't slow down after multiple generations
- [ ] Cleanup happens properly after download

## Security and Privacy

### Data Handling
- [ ] No sensitive data exposed in console logs
- [ ] PDF contains only intended information
- [ ] No system metadata leaked into PDF
- [ ] File downloads use secure methods

### Content Validation
- [ ] No script injection possible through form data
- [ ] PDF content matches exactly what was submitted
- [ ] No additional data added without consent
- [ ] Data privacy statements included

## Final Quality Assurance

### Professional Appearance
- [ ] Overall layout looks professional
- [ ] Consistent with NEM Insurance branding
- [ ] Suitable for official documentation
- [ ] Print-ready quality

### Completeness Check
- [ ] All required information present
- [ ] No missing sections or fields
- [ ] Complete audit trail in attachments
- [ ] Ready for regulatory compliance

### Sign-off Criteria
- [ ] All visual checks pass
- [ ] All functional tests pass
- [ ] Performance is acceptable
- [ ] Ready for production deployment

## Post-Deployment Monitoring

### Production Validation
- [ ] Test with real production data
- [ ] Monitor error rates and performance
- [ ] Collect user feedback
- [ ] Verify download statistics

### Ongoing Maintenance
- [ ] Schedule regular testing with new form types
- [ ] Monitor for browser compatibility issues
- [ ] Update blueprints as forms evolve
- [ ] Maintain documentation currency

---

**QA Sign-off:**
- [ ] Visual Review Complete
- [ ] Functional Testing Complete
- [ ] Performance Testing Complete  
- [ ] Ready for Production

**Reviewer:** _________________ **Date:** _________________