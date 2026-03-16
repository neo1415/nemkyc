# Design Document

## Architecture Overview

This design enhances Smart Protection Claims admin tables by replacing simple AdminUnifiedTable wrappers with full-featured DataGrid implementations that match the Corporate KYC table pattern exactly. Each of the 6 Smart Protection Claims types will have its own complete admin table component with comprehensive functionality.

## Component Architecture

### Core Components

1. **Enhanced Admin Table Components** (6 components)
   - AdminSmartMotoristProtectionClaimsTable.tsx
   - AdminSmartStudentsProtectionClaimsTable.tsx  
   - AdminSmartTravellerProtectionClaimsTable.tsx
   - AdminSmartArtisanProtectionClaimsTable.tsx
   - AdminSmartGenerationZProtectionClaimsTable.tsx
   - AdminNEMHomeProtectionClaimsTable.tsx

2. **Shared Utilities**
   - Date formatting functions
   - Data value extraction helpers
   - CSV export utilities
   - Status color mapping

### Implementation Pattern

Each admin table component will follow the exact Corporate KYC implementation pattern:

```typescript
interface FormData {
  id: string;
  status?: string;
  timestamp?: any;
  createdAt?: string;
  submittedAt?: any;
  // Collection-specific fields based on form mappings
  [key: string]: any;
}
```

## Data Layer Design

### Collection Mapping
- smart-motorist-protection-claims → AdminSmartMotoristProtectionClaimsTable
- smart-students-protection-claims → AdminSmartStudentsProtectionClaimsTable
- smart-traveller-protection-claims → AdminSmartTravellerProtectionClaimsTable
- smart-artisan-protection-claims → AdminSmartArtisanProtectionClaimsTable
- smart-generation-z-protection-claims → AdminSmartGenerationZProtectionClaimsTable
- nem-home-protection-claims → AdminNEMHomeProtectionClaimsTable

### Field Mapping Strategy

Each table will dynamically generate columns based on form mappings from `src/config/formMappings.ts`:

1. **Common Fields** (all claim types):
   - Actions (View/Delete)
   - Created At
   - Policy Information (policyNumber, periodOfCoverFrom, periodOfCoverTo)
   - Insured Details (nameOfInsured, title, dateOfBirth, gender, address, phone, email)
   - Details of Loss (accidentDate, accidentTime, accidentLocation, accidentDescription, injuryDescription)
   - System fields (status, submittedAt, submittedBy, createdAt)

2. **Type-Specific Fields**:
   - **Smart Students**: institutionName, studentId, courseOfStudy, activityAtTimeOfAccident
   - **Smart Traveller**: passportNumber, travelDestination, travelPurpose, emergencyContactNotified
   - **Smart Artisan**: occupation, employerName, workLocation, toolsInvolved, safetyMeasures
   - **Smart Generation Z**: lifestyle, sportsActivities, activityAtTimeOfAccident
   - **NEM Home**: propertyAddress, propertyType, propertyInterest, perilType, estimatedLoss

## User Interface Design

### DataGrid Configuration

Following Corporate KYC pattern exactly:

```typescript
const columns: GridColDef[] = [
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    type: 'actions',
    getActions: (params) => [
      <GridActionsCellItem icon={<Visibility />} label="View" onClick={() => handleView(params.id)} />,
      <GridActionsCellItem icon={<Delete />} label="Delete" onClick={() => handleDelete(params.id)} />
    ],
  },
  // Dynamic columns based on form mappings
];
```

### Theme Integration

Using existing burgundy and gold theme:
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#800020' }, // Burgundy
    secondary: { main: '#FFD700' }, // Gold
  },
});
```

### Search and Filter Controls

Identical to Corporate KYC implementation:
- Search text input for filtering across all fields
- Status dropdown filter (all, pending, approved, rejected)
- Combined filtering logic

## Data Processing Design

### Date Formatting

Consistent DD/MM/YYYY formatting using Corporate KYC pattern:

```typescript
const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  
  try {
    let dateObj: Date;
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(timestamp)) {
        return timestamp;
      }
      dateObj = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else {
      return 'N/A';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear());
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'N/A';
  }
};
```

### Value Extraction

Safe value extraction with N/A fallback:

```typescript
const getValue = (form: FormData, field: string): string => {
  const value = form[field];
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return String(value);
};
```

### Array Field Handling

Witnesses array formatting:

```typescript
const formatWitnesses = (witnesses: any[]): string => {
  if (!witnesses || !Array.isArray(witnesses) || witnesses.length === 0) {
    return 'N/A';
  }
  
  return witnesses.map((witness, index) => 
    `Witness ${index + 1}: ${witness.name || 'N/A'} - ${witness.address || 'N/A'}`
  ).join('; ');
};
```

## CSV Export Design

### Export Functionality

Following Corporate KYC CSV export pattern exactly:

1. **Headers Generation**: All form fields in logical order
2. **Data Processing**: Format all field values consistently
3. **File Generation**: Create CSV with proper escaping
4. **Download**: Trigger download with descriptive filename

### CSV Structure

```typescript
const exportToCSV = () => {
  const headers = [
    'ID', 'Created At', 'Policy Number', 'Cover From', 'Cover To',
    'Name of Insured', 'Title', 'Date of Birth', 'Gender', 'Address', 'Phone', 'Email',
    'Accident Date', 'Accident Time', 'Accident Location', 'Accident Description', 'Injury Description',
    // Type-specific fields dynamically added
    'Witnesses', 'Status', 'Submitted At', 'Submitted By'
  ];

  const rows = filteredForms.map(form => [
    form.id || 'N/A',
    formatDate(form.createdAt || form.timestamp || form.submittedAt),
    getValue(form, 'policyNumber'),
    formatDate(form.periodOfCoverFrom),
    formatDate(form.periodOfCoverTo),
    // ... all other fields
    formatWitnesses(form.witnesses),
    getValue(form, 'status'),
    formatDate(form.submittedAt),
    getValue(form, 'submittedBy')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${collectionName}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

## Navigation Integration

### FormViewer Integration

Each table integrates with existing FormViewer:

```typescript
const handleView = (id: GridRowId) => {
  navigate(`/admin/form/${collectionName}/${id}`);
};
```

### Route Configuration

Existing routes in App.tsx already configured:
- /admin/smart-motorist-protection-claims
- /admin/smart-students-protection-claims
- /admin/smart-traveller-protection-claims
- /admin/smart-artisan-protection-claims
- /admin/smart-generation-z-protection-claims
- /admin/nem-home-protection-claims

## Error Handling Design

### Loading States

```typescript
const [loading, setLoading] = useState(true);
const [forms, setForms] = useState<FormData[]>([]);
```

### Error Management

Using existing toast system:

```typescript
try {
  // Firestore operations
} catch (error) {
  console.error('Error:', error);
  toast({ title: 'Error message', variant: 'destructive' });
}
```

### Delete Confirmation

Modal dialog pattern from Corporate KYC:

```typescript
<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
  <DialogTitle>Confirm Delete</DialogTitle>
  <DialogContent>
    Are you sure you want to delete this form? This action cannot be undone.
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
  </DialogActions>
</Dialog>
```

## Performance Considerations

### Data Loading

Efficient Firestore queries with ordering:

```typescript
const fetchForms = async () => {
  try {
    setLoading(true);
    const formsRef = collection(db, collectionName);
    const q = query(formsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    const formsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp || data.submittedAt || data.createdAt || new Date(),
        createdAt: data.createdAt || data.submittedAt || data.timestamp
      };
    });

    setForms(formsData);
  } catch (error) {
    console.error('Error fetching forms:', error);
    toast({ title: 'Error fetching data', variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};
```

### Pagination Configuration

```typescript
initialState={{
  pagination: {
    paginationModel: { page: 0, pageSize: 25 },
  },
}}
pageSizeOptions={[10, 25, 50, 100]}
```

## Security Considerations

### Authentication Integration

Using existing auth context:

```typescript
const { user, isAdmin } = useAuth();

useEffect(() => {
  if (!user || !isAdmin()) {
    navigate('/unauthorized');
    return;
  }
  fetchForms();
}, [user, isAdmin, navigate]);
```

### Data Access Control

Firestore security rules already configured for admin access to Smart Protection Claims collections.

## Correctness Properties

Based on the prework analysis, the following correctness properties ensure the implementation meets requirements:

### Property 1: Complete Field Display (Invariant)
For any Smart Protection Claims admin table, the number of displayed columns must equal the number of fields defined in the corresponding form mapping plus system columns (actions, timestamps).

### Property 2: Data Consistency (Round Trip)
For any form record, displaying it in the admin table then viewing it in FormViewer must show identical data values.

### Property 3: Filter Idempotence
Applying the same search and status filters multiple times must produce identical filtered results.

### Property 4: CSV Export Completeness (Metamorphic)
The number of rows in exported CSV must equal the number of filtered records displayed in the table.

### Property 5: Status Color Mapping (Model-Based)
Status display colors must follow the defined mapping: approved=success (green), rejected=error (red), pending=warning (yellow).

### Property 6: Date Format Consistency (Invariant)
All date fields across all Smart Protection Claims tables must display in DD/MM/YYYY format consistently.

### Property 7: Navigation Correctness (Round Trip)
Clicking View action then navigating back to the admin table must return to the same filtered state and record position.

## Testing Strategy

### Unit Tests
- Date formatting functions
- Value extraction helpers
- CSV generation logic
- Filter application logic

### Integration Tests
- Firestore data loading
- FormViewer navigation
- Delete operations with confirmation
- CSV export functionality

### Property-Based Tests
- Field display completeness across all claim types
- Data consistency between table and FormViewer
- Filter behavior with various input combinations
- CSV export data integrity

### End-to-End Tests
- Complete admin workflow (view, filter, export, delete)
- Cross-browser compatibility
- Performance with large datasets
- Error handling scenarios