# Design Document: Identity Upload Editable Preview

## Overview

This design extends the existing identity upload validation system (Phase 1) with inline editing capabilities. Users can click on cells in the preview table, edit values directly, and have the system re-validate the data automatically. This eliminates the need to re-upload entire files when fixing small validation errors.

The design integrates seamlessly with the existing UploadDialog component, validation engine, and error reporting system. It uses React state management to track edits, Material-UI components for the editable table interface, and the existing validation functions for re-validation.

## Architecture

### Component Structure

```
UploadDialog (existing, modified)
├── EditablePreviewTable (new)
│   ├── EditableCell (new)
│   └── RowActions (new)
├── ValidationErrorDisplay (existing, unchanged)
└── Error Report Generator (existing, unchanged)
```

### State Management

The UploadDialog component will manage three new state objects:

1. **editState**: Tracks all cell modifications
   - Structure: `Map<rowIndex, Map<columnName, newValue>>`
   - Stores only modified cells to minimize memory usage
   - Cleared when file changes or dialog closes

2. **validationState**: Tracks validation results per row
   - Structure: `Map<rowIndex, ValidationError[]>`
   - Updated after each row save
   - Used to display error indicators on cells

3. **editingCell**: Tracks currently active edit
   - Structure: `{ rowIndex: number, column: string } | null`
   - Only one cell can be edited at a time
   - Cleared when edit is saved/cancelled

### Data Flow

```
User clicks cell → Enter edit mode → User types → User saves
                                                      ↓
                                            Update editState
                                                      ↓
                                            Re-validate row
                                                      ↓
                                            Update validationState
                                                      ↓
                                            Update UI indicators
```

## Components and Interfaces

### EditablePreviewTable Component

**Purpose**: Replaces the read-only preview table with an editable version

**Props**:
```typescript
interface EditablePreviewTableProps {
  columns: string[];
  rows: Record<string, any>[];
  emailColumn: string;
  nameColumns?: NameColumns;
  editState: Map<number, Map<string, any>>;
  validationState: Map<number, ValidationError[]>;
  editingCell: { rowIndex: number; column: string } | null;
  onCellEdit: (rowIndex: number, column: string, value: any) => void;
  onRowSave: (rowIndex: number) => void;
  onRowCancel: (rowIndex: number) => void;
  onCellEditStart: (rowIndex: number, column: string) => void;
  onCellEditEnd: () => void;
}
```

**Rendering Logic**:
- Renders table with sticky header
- Maps over rows and columns to create cells
- Passes cell-specific props to EditableCell component
- Displays RowActions for rows with pending edits
- Applies visual indicators based on edit and validation state

**Styling**:
- Uses Material-UI Table components
- Applies background colors: green for edited cells, red for error cells, blue for name columns
- Maintains existing email column highlighting
- Adds hover effects for editable cells

### EditableCell Component

**Purpose**: Individual table cell that can be clicked and edited

**Props**:
```typescript
interface EditableCellProps {
  rowIndex: number;
  column: string;
  value: any;
  isEditing: boolean;
  isEdited: boolean;
  hasError: boolean;
  isEmailColumn: boolean;
  isNameColumn: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onValueChange: (value: any) => void;
}
```

**Behavior**:
- **View Mode**: Displays value as text, shows cursor pointer on hover
- **Edit Mode**: Displays TextField with current value, auto-focuses
- **Keyboard Handling**:
  - Enter: Save and exit edit mode
  - Escape: Cancel and exit edit mode
  - Tab: Save current cell and move to next cell (future enhancement)
- **Click Outside**: Save and exit edit mode

**Implementation**:
```typescript
function EditableCell({
  rowIndex,
  column,
  value,
  isEditing,
  isEdited,
  hasError,
  isEmailColumn,
  isNameColumn,
  onEditStart,
  onEditEnd,
  onValueChange,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onValueChange(localValue);
      onEditEnd();
    } else if (e.key === 'Escape') {
      setLocalValue(value); // Reset to original
      onEditEnd();
    }
  };

  const handleBlur = () => {
    onValueChange(localValue);
    onEditEnd();
  };

  // Determine background color
  const bgcolor = hasError
    ? 'error.lighter'
    : isEdited
    ? 'success.lighter'
    : isEmailColumn
    ? 'success.light'
    : isNameColumn
    ? '#f5f9ff'
    : 'inherit';

  return (
    <TableCell
      sx={{
        bgcolor,
        cursor: isEditing ? 'text' : 'pointer',
        border: hasError ? '2px solid red' : isEdited ? '2px solid green' : 'none',
        position: 'relative',
      }}
      onClick={() => !isEditing && onEditStart()}
    >
      {isEditing ? (
        <TextField
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          size="small"
          fullWidth
          variant="standard"
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {String(value || '')}
          {isEdited && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />}
          {hasError && <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />}
        </Box>
      )}
    </TableCell>
  );
}
```

### RowActions Component

**Purpose**: Save and cancel buttons for edited rows

**Props**:
```typescript
interface RowActionsProps {
  rowIndex: number;
  onSave: () => void;
  onCancel: () => void;
}
```

**Rendering**:
- Displays as an additional column at the end of the row
- Shows two icon buttons: Save (check icon) and Cancel (X icon)
- Only visible for rows with pending edits
- Buttons are small and compact to minimize space usage

**Implementation**:
```typescript
function RowActions({ rowIndex, onSave, onCancel }: RowActionsProps) {
  return (
    <TableCell sx={{ width: 100, textAlign: 'center' }}>
      <IconButton
        size="small"
        color="success"
        onClick={onSave}
        title="Save changes"
      >
        <CheckIcon />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={onCancel}
        title="Cancel changes"
      >
        <CloseIcon />
      </IconButton>
    </TableCell>
  );
}
```

## Data Models

### EditState Structure

```typescript
// Map of row index to map of column name to new value
type EditState = Map<number, Map<string, any>>;

// Example:
// Row 0, column "DOB" changed to "01/01/1990"
// Row 0, column "NIN" changed to "12345678901"
// Row 2, column "Email" changed to "new@example.com"
const editState = new Map([
  [0, new Map([
    ['DOB', '01/01/1990'],
    ['NIN', '12345678901'],
  ])],
  [2, new Map([
    ['Email', 'new@example.com'],
  ])],
]);
```

### ValidationState Structure

```typescript
// Map of row index to array of validation errors for that row
type ValidationState = Map<number, ValidationError[]>;

// Example:
// Row 0 has one error in NIN column
// Row 5 has two errors in DOB and BVN columns
const validationState = new Map([
  [0, [
    {
      rowIndex: 0,
      rowNumber: 2,
      column: 'NIN',
      value: '123',
      errorType: 'NIN_INVALID',
      message: 'NIN must be exactly 11 digits',
    },
  ]],
  [5, [
    {
      rowIndex: 5,
      rowNumber: 7,
      column: 'DOB',
      value: '2010-01-01',
      errorType: 'DOB_UNDER_AGE',
      message: 'DOB indicates age under 18',
    },
    {
      rowIndex: 5,
      rowNumber: 7,
      column: 'BVN',
      value: '999',
      errorType: 'BVN_INVALID',
      message: 'BVN must be exactly 11 digits',
    },
  ]],
]);
```

### Merged Row Data

When creating the list, merge original data with edit state:

```typescript
function getMergedRowData(
  originalRow: Record<string, any>,
  rowIndex: number,
  editState: EditState
): Record<string, any> {
  const rowEdits = editState.get(rowIndex);
  if (!rowEdits) return originalRow;

  return {
    ...originalRow,
    ...Object.fromEntries(rowEdits),
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Cell Edit Mode Behavior

*For any* cell in the preview table, clicking the cell should enter edit mode with an input field displaying the current value, and typing should update the value in real-time.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Edit Save and Cancel Behavior

*For any* editable cell, pressing Enter or clicking outside should save changes and exit edit mode, while pressing Escape should discard changes and restore the original value.

**Validates: Requirements 1.4, 1.5, 1.6**

### Property 3: Universal Column Editability

*For any* column in the preview table (DOB, NIN, BVN, Email, Name, etc.), all cells in that column should be editable.

**Validates: Requirements 1.7**

### Property 4: Row Action Button Visibility

*For any* row in the preview table, save and cancel buttons should be visible if and only if that row has pending edits.

**Validates: Requirements 2.1, 2.4**

### Property 5: Save Triggers State Update and Validation

*For any* row with pending edits, clicking the save button should commit all edits to Edit_State and trigger re-validation for that row.

**Validates: Requirements 2.2, 2.5, 3.1**

### Property 6: Cancel Restores Original Values

*For any* row with pending edits, clicking the cancel button should revert all cells in that row to their original values and remove changes from Edit_State.

**Validates: Requirements 2.3, 4.3**

### Property 7: Validation Consistency

*For any* row that is saved after editing, re-validation should apply the same validation rules (18+ age, 11-digit NIN/BVN, valid year range) as the initial upload validation.

**Validates: Requirements 3.5**

### Property 8: Validation Error Display Workflow

*For any* row that is re-validated, if errors are detected, error indicators should appear on affected cells and the error summary count should increase; if no errors are detected, error indicators should be removed and the error summary count should decrease.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 9: Edit State Structure and Tracking

*For any* cell that is edited and saved, the Edit_State should store both the original value and the new value, maintaining this data until the dialog is closed or the list is created.

**Validates: Requirements 4.1, 4.2, 4.6**

### Property 10: Merged Data Correctness

*For any* row when creating the list, the merged row data should contain edited values for modified columns and original values for unmodified columns, preserving data types.

**Validates: Requirements 4.4, 4.5, 9.3, 9.4, 9.5**

### Property 11: List Creation Button State

*For any* upload dialog state, the "Create List" button should be disabled if and only if validation errors exist in either edited or unedited rows, and should display an explanatory message when disabled.

**Validates: Requirements 6.1, 6.2, 6.3, 6.5**

### Property 12: Visual Indicator Accuracy

*For any* cell in the preview table, the visual indicator (background color, border, icon) should accurately reflect whether the cell is currently being edited, has been edited and saved, has validation errors, or is in a normal state, with distinct colors for each state.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 13: All Rows Displayed

*For any* uploaded file, the preview table should display all rows (not just the first 10), with a row count indicator showing the total number of rows.

**Validates: Requirements 7.1, 7.5**

### Property 14: File Change Clears Edit State

*For any* file change operation, the system should clear all Edit_State, validation state, and editing cell state.

**Validates: Requirements 8.3**

### Property 15: Original Value Preservation During Editing

*For any* cell being edited, the original value should remain unchanged in the data store until the user explicitly saves the changes.

**Validates: Requirements 9.1, 9.2**

## Error Handling

### Edit Mode Errors

**Scenario**: User enters invalid data in edit mode
**Handling**: 
- Allow user to enter any value (no client-side blocking)
- Validate on save
- Display error indicator if validation fails
- Keep cell editable so user can fix immediately

### Validation Errors

**Scenario**: Re-validation detects errors after save
**Handling**:
- Update validationState with new errors
- Display red border and error icon on affected cells
- Update error summary count
- Keep "Create List" button disabled

### State Corruption

**Scenario**: Edit state becomes inconsistent with displayed data
**Handling**:
- Implement state validation checks
- Log errors to console for debugging
- Provide "Reset" button to clear all edits if needed

### Performance Degradation

**Scenario**: Large files (500+ rows) cause slow rendering
**Handling**:
- Implement virtualization using react-window or react-virtualized
- Only render visible rows
- Lazy-load validation state
- Debounce re-validation calls

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **EditableCell Component**
   - Renders in view mode with correct value
   - Enters edit mode on click
   - Saves on Enter key
   - Cancels on Escape key
   - Saves on blur

2. **RowActions Component**
   - Renders save and cancel buttons
   - Calls onSave when save button clicked
   - Calls onCancel when cancel button clicked

3. **State Management Functions**
   - getMergedRowData merges original and edited values correctly
   - Edit state updates correctly when cell is edited
   - Validation state updates correctly after re-validation

4. **Edge Cases**
   - Empty string values
   - Null/undefined values
   - Very long strings
   - Special characters
   - Excel serial numbers in date fields

### Property-Based Tests

Property tests verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property 1: Edit State Isolation**
   - Generate random row indices and column names
   - Edit cells in different rows
   - Verify that editing one row doesn't affect others
   - **Tag**: Feature: identity-upload-editable-preview, Property 1: Edit State Isolation

2. **Property 2: Original Value Preservation**
   - Generate random original values
   - Edit cells and then cancel
   - Verify original values are restored exactly
   - **Tag**: Feature: identity-upload-editable-preview, Property 2: Original Value Preservation

3. **Property 3: Validation Consistency**
   - Generate random DOB, NIN, BVN values (both valid and invalid)
   - Validate during upload and after editing
   - Verify same validation rules applied
   - **Tag**: Feature: identity-upload-editable-preview, Property 3: Validation Consistency

4. **Property 4: Error State Synchronization**
   - Generate random validation errors
   - Update validation state
   - Verify UI error indicators match validation errors
   - **Tag**: Feature: identity-upload-editable-preview, Property 4: Error State Synchronization

5. **Property 5: Edit State Persistence**
   - Generate random sequence of edits
   - Simulate UI interactions (scrolling, clicking)
   - Verify edit state persists
   - **Tag**: Feature: identity-upload-editable-preview, Property 5: Edit State Persistence

6. **Property 6: Merged Data Correctness**
   - Generate random original rows and edits
   - Merge data
   - Verify edited columns have new values, unedited have original
   - **Tag**: Feature: identity-upload-editable-preview, Property 6: Merged Data Correctness

7. **Property 7: List Creation Prevention**
   - Generate random validation states (with and without errors)
   - Check "Create List" button enabled state
   - Verify button disabled when errors exist
   - **Tag**: Feature: identity-upload-editable-preview, Property 7: List Creation Prevention

8. **Property 8: Visual Indicator Accuracy**
   - Generate random cell states (edited, error, normal)
   - Render cells
   - Verify visual indicators match state
   - **Tag**: Feature: identity-upload-editable-preview, Property 8: Visual Indicator Accuracy

9. **Property 9: Single Edit Mode**
   - Generate random sequence of cell edit starts
   - Verify only one cell in edit mode at a time
   - **Tag**: Feature: identity-upload-editable-preview, Property 9: Single Edit Mode

10. **Property 10: Keyboard Navigation Consistency**
    - Generate random cell values
    - Simulate Enter and Escape key presses
    - Verify correct save/cancel behavior
    - **Tag**: Feature: identity-upload-editable-preview, Property 10: Keyboard Navigation Consistency

### Integration Tests

1. **Full Edit Workflow**
   - Upload file with validation errors
   - Edit cells to fix errors
   - Save changes
   - Verify validation passes
   - Create list successfully

2. **Multiple Row Edits**
   - Upload file
   - Edit multiple rows
   - Save some, cancel others
   - Verify correct state

3. **Error Report with Edits**
   - Upload file with errors
   - Edit some cells
   - Download error report
   - Verify report includes both original and edited values

### Performance Tests

1. **Large File Rendering**
   - Upload file with 500 rows
   - Measure initial render time (should be < 2 seconds)
   - Verify virtualization works correctly

2. **Edit Responsiveness**
   - Edit cell
   - Measure input lag (should be < 100ms)
   - Verify smooth typing experience

3. **Re-validation Performance**
   - Save edited row
   - Measure re-validation time (should be < 500ms)
   - Verify UI remains responsive

## Implementation Notes

### Virtualization for Large Files

For files with more than 100 rows, use react-window for virtualization:

```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedTable({ rows, columns, ... }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TableRow>
        {columns.map(col => (
          <EditableCell
            key={col}
            rowIndex={index}
            column={col}
            value={rows[index][col]}
            {...otherProps}
          />
        ))}
      </TableRow>
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={rows.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Debounced Re-validation

To avoid excessive validation calls during rapid edits:

```typescript
import { debounce } from 'lodash';

const debouncedValidate = useMemo(
  () => debounce((rowIndex: number) => {
    // Perform validation
    const errors = validateRow(rowIndex);
    setValidationState(prev => new Map(prev).set(rowIndex, errors));
  }, 300),
  []
);
```

### State Reset on File Change

When user changes the uploaded file:

```typescript
const handleFileChange = (newFile: File) => {
  // Clear all edit state
  setEditState(new Map());
  setValidationState(new Map());
  setEditingCell(null);
  
  // Parse new file
  parseFile(newFile);
};
```

### Accessibility Considerations

- Editable cells should have proper ARIA labels
- Keyboard navigation should work without mouse
- Error messages should be announced to screen readers
- Focus management should be logical and predictable

### Browser Compatibility

- Tested on Chrome, Firefox, Safari, Edge
- Uses standard React and Material-UI components
- No browser-specific APIs required
- Graceful degradation for older browsers
