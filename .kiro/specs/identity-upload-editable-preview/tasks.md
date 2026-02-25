# Implementation Plan: Identity Upload Editable Preview

## Overview

This implementation plan breaks down the editable preview feature into incremental tasks. Each task builds on previous work, starting with core state management, then adding UI components, and finally integrating with the existing upload workflow. The approach ensures that each step can be tested independently before moving forward.

## Tasks

- [x] 1. Set up edit state management infrastructure
  - Create TypeScript types for EditState, ValidationState, and EditingCell
  - Implement state management hooks in UploadDialog component
  - Add helper functions for state manipulation (getMergedRowData, updateEditState, clearEditState)
  - _Requirements: 4.1, 4.2, 4.6_

- [x]* 1.1 Write property test for edit state structure
  - **Property 9: Edit State Structure and Tracking**
  - **Validates: Requirements 4.1, 4.2, 4.6**

- [x]* 1.2 Write property test for merged data correctness
  - **Property 10: Merged Data Correctness**
  - **Validates: Requirements 4.4, 4.5, 9.3, 9.4, 9.5**

- [x] 2. Implement EditableCell component
  - Create EditableCell component with view and edit modes
  - Add click handler to enter edit mode
  - Implement TextField for editing with auto-focus
  - Add keyboard handlers for Enter (save) and Escape (cancel)
  - Add blur handler to save on click outside
  - Implement visual indicators (background colors, borders, icons)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.3, 5.4, 5.5_

- [x] 2.1 Write unit tests for EditableCell component
  - Test view mode rendering
  - Test edit mode entry on click
  - Test Enter key saves changes
  - Test Escape key cancels changes
  - Test blur saves changes
  - Test visual indicators for different states
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 5.1, 5.3, 5.4, 5.5_

- [x] 2.2 Write property test for cell edit mode behavior
  - **Property 1: Cell Edit Mode Behavior**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2.3 Write property test for edit save and cancel behavior
  - **Property 2: Edit Save and Cancel Behavior**
  - **Validates: Requirements 1.4, 1.5, 1.6**

- [x] 3. Implement RowActions component
  - Create RowActions component with save and cancel buttons
  - Add icon buttons with proper styling
  - Implement click handlers for save and cancel
  - Add tooltips for accessibility
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.1 Write unit tests for RowActions component
  - Test save button click calls onSave
  - Test cancel button click calls onCancel
  - Test button rendering and styling
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement EditablePreviewTable component
  - Create EditablePreviewTable component structure
  - Render table with sticky header
  - Map over rows and columns to create EditableCell instances
  - Pass cell-specific props (isEdited, hasError, isEmailColumn, isNameColumn)
  - Conditionally render RowActions for rows with pending edits
  - Add row count indicator
  - Implement scrollable container with max height
  - _Requirements: 1.7, 2.4, 5.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.1 Write unit tests for EditablePreviewTable component
  - Test table rendering with correct structure
  - Test sticky header behavior
  - Test row count indicator
  - Test RowActions visibility based on edit state
  - _Requirements: 2.4, 7.1, 7.5_

- [x] 4.2 Write property test for universal column editability
  - **Property 3: Universal Column Editability**
  - **Validates: Requirements 1.7**

- [x] 4.3 Write property test for row action button visibility
  - **Property 4: Row Action Button Visibility**
  - **Validates: Requirements 2.1, 2.4**

- [x] 5. Integrate edit state management with EditablePreviewTable
  - Add state hooks to UploadDialog (editState, validationState, editingCell)
  - Implement onCellEdit handler to update editState
  - Implement onRowSave handler to commit edits and trigger validation
  - Implement onRowCancel handler to revert edits
  - Implement onCellEditStart and onCellEditEnd handlers
  - Pass state and handlers to EditablePreviewTable
  - _Requirements: 4.1, 4.2, 4.3, 4.6_

- [x] 5.1 Write property test for save triggers state update and validation
  - **Property 5: Save Triggers State Update and Validation**
  - **Validates: Requirements 2.2, 2.5, 3.1**

- [x] 5.2 Write property test for cancel restores original values
  - **Property 6: Cancel Restores Original Values**
  - **Validates: Requirements 2.3, 4.3**

- [x] 6. Implement re-validation logic
  - Create validateRow function that validates a single row
  - Integrate with existing validateIdentityData function
  - Update validationState after row save
  - Calculate error summary from validationState
  - Display error indicators on cells based on validationState
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6.1 Write property test for validation consistency
  - **Property 7: Validation Consistency**
  - **Validates: Requirements 3.5**

- [x] 6.2 Write property test for validation error display workflow
  - **Property 8: Validation Error Display Workflow**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement visual indicators for edited and error cells
  - Add logic to determine cell background color based on state
  - Apply green background for edited cells
  - Apply red border for error cells
  - Apply blue background for name columns
  - Apply green background for email column
  - Add icons for edited (checkmark) and error (warning) states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Write property test for visual indicator accuracy
  - **Property 12: Visual Indicator Accuracy**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 9. Update "Create List" button logic
  - Disable button when validation errors exist (from validationState)
  - Display explanatory message when button is disabled
  - Update error count to include errors from both original and edited rows
  - Merge editState with original data when creating list
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 9.1 Write property test for list creation button state
  - **Property 11: List Creation Button State**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 10. Update error report generator to include edits
  - Modify generateErrorReport function to accept editState parameter
  - Merge editState with original data before generating report
  - Add column showing original vs edited values for modified cells
  - _Requirements: 8.3_

- [x] 10.1 Write property test for error report includes edits
  - **Property 14: Error Report Includes Edits**
  - **Validates: Requirements 8.3**

- [x] 11. Implement file change handling
  - Add logic to clear editState when file changes
  - Clear validationState when file changes
  - Clear editingCell when file changes
  - Reset error summary when file changes
  - _Requirements: 8.4_

- [x] 11.1 Write property test for file change clears edit state
  - **Property 15: File Change Clears Edit State**
  - **Validates: Requirements 8.4**

- [x] 12. Replace read-only preview table with EditablePreviewTable
  - Remove existing read-only table from UploadDialog
  - Add EditablePreviewTable component to UploadDialog
  - Update preview section to show all rows (not just first 10)
  - Maintain existing features (email column highlighting, name column highlighting)
  - _Requirements: 7.1, 8.1, 8.5_

- [x] 12.1 Write property test for all rows displayed
  - **Property 13: All Rows Displayed**
  - **Validates: Requirements 7.1, 7.5**

- [x] 12.2 Write property test for original value preservation during editing
  - **Property 16: Original Value Preservation During Editing**
  - **Validates: Requirements 9.1, 9.2**

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Add virtualization for large files (optional performance optimization)
  - Install react-window library
  - Create VirtualizedEditableTable component
  - Use FixedSizeList for rendering rows
  - Conditionally use virtualization for files with 100+ rows
  - Test with large files (500+ rows)
  - _Requirements: 10.5_

- [x] 14.1 Write performance tests for large files
  - Test rendering time for 500 row file
  - Test edit responsiveness
  - Test re-validation performance
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 15. Integration testing and polish
  - Test full workflow: upload → edit → save → validate → create list
  - Test multiple row edits
  - Test error correction workflow
  - Test file change clears state
  - Test error report download with edits
  - Add accessibility attributes (ARIA labels, keyboard navigation)
  - Test browser compatibility (Chrome, Firefox, Safari, Edge)
  - _Requirements: 8.1, 8.2, 8.5_

- [x] 15.1 Write integration tests for full edit workflow
  - Test upload file with errors → edit cells → save → validate → create list
  - Test multiple row edits with save and cancel
  - Test error correction workflow
  - Test file change clears all state
  - Test error report includes edited values
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end workflows
- Virtualization (task 14) is optional but recommended for production use with large files
