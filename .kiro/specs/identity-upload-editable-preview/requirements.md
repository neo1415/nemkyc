# Requirements Document

## Introduction

This document specifies the requirements for Phase 2 of the identity upload validation system. Phase 1 (completed) added validation with error messages for uploaded Excel files containing identity data (NIN, BVN, DOB, etc.). Phase 2 adds an editable preview table that allows users to fix validation errors directly in the UI without re-uploading files.

The system enables insurance brokers to upload customer identity data, validate it against regulatory requirements, and correct errors inline before creating verification lists.

## Glossary

- **Preview_Table**: The table component displaying uploaded identity data rows and columns
- **Editable_Cell**: A table cell that can be clicked and edited inline by the user
- **Validation_Engine**: The system component that validates DOB, NIN, and BVN fields
- **Edit_State**: The in-memory state tracking which cells have been modified
- **Row_Actions**: UI controls (save/cancel buttons) for managing edited rows
- **Visual_Indicator**: UI element showing that a cell or row has been edited
- **Upload_Dialog**: The modal dialog containing the file upload and preview functionality
- **Identity_List**: A collection of customer identity records created from uploaded data

## Requirements

### Requirement 1: Inline Cell Editing

**User Story:** As an admin uploading identity data, I want to click on any cell in the preview table and edit its value inline, so that I can quickly fix validation errors without re-uploading the entire file.

#### Acceptance Criteria

1. WHEN a user clicks on a cell in the preview table, THEN the System SHALL make that cell editable with an input field
2. WHEN a cell is in edit mode, THEN the System SHALL display the current value in the input field
3. WHEN a user types in an editable cell, THEN the System SHALL update the cell value in real-time
4. WHEN a user clicks outside an editable cell, THEN the System SHALL save the changes and exit edit mode
5. WHEN a user presses Enter in an editable cell, THEN the System SHALL save the changes and exit edit mode
6. WHEN a user presses Escape in an editable cell, THEN the System SHALL discard changes and exit edit mode
7. THE Preview_Table SHALL support editing for all data columns (DOB, NIN, BVN, Email, Name, etc.)

### Requirement 2: Row-Level Save and Cancel Actions

**User Story:** As an admin editing identity data, I want save and cancel buttons for each edited row, so that I can control when changes are committed or discarded.

#### Acceptance Criteria

1. WHEN a user edits any cell in a row, THEN the System SHALL display save and cancel action buttons for that row
2. WHEN a user clicks the save button, THEN the System SHALL commit all edits for that row to the Edit_State
3. WHEN a user clicks the cancel button, THEN the System SHALL revert all edits for that row to original values
4. WHEN a row has no pending edits, THEN the System SHALL hide the save and cancel buttons for that row
5. WHEN a user saves a row, THEN the System SHALL trigger re-validation for that row

### Requirement 3: Re-validation After Edits

**User Story:** As an admin fixing validation errors, I want the system to automatically re-validate data after I edit it, so that I know immediately if my corrections are valid.

#### Acceptance Criteria

1. WHEN a user saves edits to a row, THEN the Validation_Engine SHALL re-validate all fields in that row
2. WHEN re-validation detects errors, THEN the System SHALL display error indicators on the affected cells
3. WHEN re-validation passes, THEN the System SHALL remove error indicators from the row
4. WHEN re-validation completes, THEN the System SHALL update the error summary count
5. THE Validation_Engine SHALL apply the same validation rules as initial upload (18+ age, 11-digit NIN/BVN, valid year range)

### Requirement 4: Edit State Management

**User Story:** As an admin editing multiple rows, I want the system to track all my changes in memory, so that I can review and finalize all edits before creating the list.

#### Acceptance Criteria

1. THE System SHALL maintain an Edit_State tracking all modified cells and their new values
2. WHEN a user edits a cell, THEN the System SHALL store the original value and new value in Edit_State
3. WHEN a user cancels edits, THEN the System SHALL remove those changes from Edit_State
4. WHEN a user clicks "Create List", THEN the System SHALL use values from Edit_State for modified cells
5. WHEN a user clicks "Create List", THEN the System SHALL use original values for unmodified cells
6. THE Edit_State SHALL persist until the user closes the Upload_Dialog or creates the list

### Requirement 5: Visual Feedback for Edited Data

**User Story:** As an admin reviewing my edits, I want clear visual indicators showing which cells and rows I've modified, so that I can easily track my changes.

#### Acceptance Criteria

1. WHEN a cell has been edited and saved, THEN the System SHALL display a visual indicator (background color or border) on that cell
2. WHEN a row contains edited cells, THEN the System SHALL display a visual indicator on the row
3. WHEN a cell has validation errors, THEN the System SHALL display an error indicator (red border or background)
4. WHEN a cell is currently being edited, THEN the System SHALL display a focus indicator
5. THE Visual_Indicator SHALL use distinct colors for edited cells vs error cells vs normal cells

### Requirement 6: Validation Error Prevention

**User Story:** As an admin, I want the system to prevent me from creating a list when validation errors exist, so that I don't submit invalid data.

#### Acceptance Criteria

1. WHEN validation errors exist after editing, THEN the System SHALL disable the "Create List" button
2. WHEN all validation errors are resolved, THEN the System SHALL enable the "Create List" button
3. WHEN the "Create List" button is disabled, THEN the System SHALL display a message explaining why
4. WHEN a user attempts to create a list with errors, THEN the System SHALL display an error message
5. THE System SHALL count errors from both unedited and edited rows

### Requirement 7: Preview Table Scrolling and Pagination

**User Story:** As an admin working with large files, I want to scroll through all rows in the preview table, so that I can edit any row regardless of file size.

#### Acceptance Criteria

1. THE Preview_Table SHALL display all uploaded rows, not just the first 10
2. WHEN the file contains more than 20 rows, THEN the System SHALL enable vertical scrolling in the preview table
3. THE Preview_Table SHALL maintain a maximum height with scrollable content
4. WHEN a user scrolls, THEN the table header SHALL remain fixed at the top
5. THE System SHALL display a row count indicator showing total rows

### Requirement 8: Edit Workflow Integration

**User Story:** As an admin, I want the editing feature to integrate seamlessly with the existing upload workflow, so that I can use it without learning a new process.

#### Acceptance Criteria

1. THE Upload_Dialog SHALL display the editable preview table after file upload and validation
2. WHEN validation errors are detected, THEN the System SHALL display the error summary above the preview table
3. WHEN a user changes the uploaded file, THEN the System SHALL clear all Edit_State
4. THE System SHALL preserve all existing upload features (template validation, email column selection, list naming)

### Requirement 9: Data Integrity

**User Story:** As an admin, I want the system to maintain data integrity during editing, so that I don't accidentally lose or corrupt data.

#### Acceptance Criteria

1. WHEN a user edits a cell, THEN the System SHALL preserve the original value until changes are saved
2. WHEN a user cancels edits, THEN the System SHALL restore the exact original value
3. WHEN a user creates a list, THEN the System SHALL send both original and edited values to the server
4. THE System SHALL not modify data in columns that were not edited
5. THE System SHALL preserve data types (strings, numbers, dates) during editing

### Requirement 10: Performance

**User Story:** As an admin uploading large files, I want the editing interface to remain responsive, so that I can work efficiently with files containing hundreds of rows.

#### Acceptance Criteria

1. WHEN a file contains up to 500 rows, THEN the Preview_Table SHALL render within 2 seconds
2. WHEN a user edits a cell, THEN the System SHALL respond to input within 100ms
3. WHEN a user saves a row, THEN re-validation SHALL complete within 500ms
4. THE System SHALL use efficient state management to avoid unnecessary re-renders
5. THE Preview_Table SHALL use virtualization for files with more than 100 rows
