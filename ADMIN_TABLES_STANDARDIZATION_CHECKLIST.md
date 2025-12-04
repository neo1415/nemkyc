# Admin Tables Standardization Checklist

## Overview
This document outlines the required changes to standardize all KYC and CDD admin tables to match the IndividualCDD table design.

## Reference Design: AdminIndividualCDDTable.tsx
The IndividualCDD table has the ideal implementation with:
- ✅ Burgundy (#800020) and Gold (#FFD700) theme
- ✅ Sorting by timestamp descending (latest first)
- ✅ Search/filter bar
- ✅ Export CSV functionality
- ✅ Consistent styling and layout
- ✅ Proper date formatting (dd/MM/yyyy HH:mm for timestamps, dd/MM/yyyy for dates)

---

## Tables to Update

### KYC Tables
1. **AdminIndividualKYCTable.tsx** ❌ Needs Update
2. **AdminCorporateKYCTable.tsx** ❌ Needs Update

### CDD Tables  
3. **AdminIndividualCDDTable.tsx** ✅ Reference (Already Perfect)
4. **AdminCorporateCDDTable.tsx** ❌ Needs Update
5. **AdminPartnersCDDTable.tsx** ❌ Needs Update (Uses AdminUnifiedTable)
6. **AdminBrokersCDDTable.tsx** ❌ Needs Update
7. **AdminAgentsCDDTable.tsx** ❌ Needs Update

---

## Required Changes for Each Table

### 1. Theme Configuration
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#800020', // Burgundy
    },
    secondary: {
      main: '#FFD700', // Gold
    },
    background: {
      default: '#ffffff',
    },
  },
});
```

### 2. Data Fetching with Proper Sorting
```typescript
const fetchForms = async () => {
  try {
    setLoading(true);
    const formsRef = collection(db, 'COLLECTION_NAME');
    const q = query(formsRef, orderBy('timestamp', 'desc')); // ⚠️ LATEST FIRST
    const querySnapshot = await getDocs(q);
    
    const formsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FormData[];

    setForms(formsData);
    generateColumns(formsData);
  } catch (error) {
    console.error('Error fetching forms:', error);
    toast({
      title: "Error",
      description: "Failed to fetch forms",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

### 3. Search/Filter Bar
```typescript
const [filterValue, setFilterValue] = useState('');

// In render:
<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
  <TextField
    label="Search forms..."
    variant="outlined"
    size="small"
    value={filterValue}
    onChange={(e) => setFilterValue(e.target.value)}
    sx={{ minWidth: 300 }}
  />
</Box>

// Filter logic:
const filteredForms = forms.filter(form => {
  if (!filterValue) return true;
  
  const searchFields = ['firstName', 'lastName', 'emailAddress', 'companyName']; // Adjust per table
  return searchFields.some(field => 
    form[field]?.toString().toLowerCase().includes(filterValue.toLowerCase())
  );
});
```

### 4. Header with Export Button
```typescript
<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
  <Typography variant="h4" component="h1" sx={{ color: '#800020', fontWeight: 'bold' }}>
    TABLE_TITLE
  </Typography>
  
  <Button
    variant="contained"
    startIcon={<GetApp />}
    onClick={handleExportCSV}
    sx={{
      backgroundColor: '#800020',
      color: 'white',
      '&:hover': {
        backgroundColor: '#600018'
      },
      borderRadius: '8px',
      textTransform: 'none',
      fontWeight: 'bold'
    }}
  >
    Export CSV
  </Button>
</Box>
```

### 5. DataGrid Styling
```typescript
<DataGrid
  rows={filteredForms}
  columns={columns}
  loading={loading}
  pageSizeOptions={[10, 25, 50, 100]}
  initialState={{
    pagination: {
      paginationModel: { page: 0, pageSize: 25 },
    },
  }}
  checkboxSelection
  disableRowSelectionOnClick
  sx={{
    '& .MuiDataGrid-root': {
      border: 'none',
    },
    '& .MuiDataGrid-cell': {
      borderBottom: 'none',
    },
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#f5f5f5',
      color: '#800020',
      fontWeight: 'bold',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: '#f8f8f8',
    },
  }}
/>
```

### 6. Timestamp Column (First Column)
```typescript
{
  field: 'timestamp',
  headerName: 'Created At',
  width: 180,
  renderCell: (params) => {
    if (!params.value) return 'N/A';
    try {
      let date;
      if (typeof params.value === 'string') {
        date = new Date(params.value);
      } else if (params.value?.toDate) {
        date = params.value.toDate();
      } else if (params.value instanceof Date) {
        date = params.value;
      } else {
        return 'N/A';
      }
      
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'N/A';
    }
  }
}
```

---

## Table-Specific Details

### AdminIndividualKYCTable.tsx
- **Collection**: `individual-kyc`
- **Search Fields**: firstName, lastName, emailAddress, nationality
- **Key Columns**: timestamp, firstName, lastName, email, BVN, NIN, nationality

### AdminCorporateKYCTable.tsx
- **Collection**: `corporate-kyc`
- **Search Fields**: companyName, emailAddress, incorporationNumber
- **Key Columns**: timestamp, companyName, incorporationNumber, email, BVN, NIN

### AdminCorporateCDDTable.tsx
- **Collection**: `corporate-cdd`
- **Search Fields**: companyName, emailAddress, incorporationNumber
- **Key Columns**: timestamp, companyName, incorporationNumber, email, directors info

### AdminPartnersCDDTable.tsx
- **Collection**: `partners-kyc`
- **Currently Uses**: AdminUnifiedTable (needs custom implementation)
- **Search Fields**: companyName, emailAddress, incorporationNumber
- **Key Columns**: timestamp, companyName, incorporationNumber, email, directors info

### AdminBrokersCDDTable.tsx
- **Collection**: `brokers-cdd`
- **Search Fields**: companyName, emailAddress, registrationNumber
- **Key Columns**: timestamp, companyName, registrationNumber, email, directors info

### AdminAgentsCDDTable.tsx
- **Collection**: `agents-cdd`
- **Search Fields**: firstName, lastName, emailAddress, position
- **Key Columns**: timestamp, firstName, lastName, email, position, BVN, NIN

---

## Implementation Priority

### Phase 1: KYC Tables (Simpler)
1. AdminIndividualKYCTable.tsx
2. AdminCorporateKYCTable.tsx

### Phase 2: CDD Tables
3. AdminCorporateCDDTable.tsx
4. AdminBrokersCDDTable.tsx
5. AdminAgentsCDDTable.tsx
6. AdminPartnersCDDTable.tsx (requires replacing AdminUnifiedTable)

---

## Testing Checklist

For each updated table, verify:
- [ ] Latest entries appear first (sorted by timestamp desc)
- [ ] Search bar filters results correctly
- [ ] Export CSV works and includes all data
- [ ] Burgundy/gold theme applied consistently
- [ ] Date formatting is correct (dd/MM/yyyy HH:mm for timestamps)
- [ ] All columns display data correctly
- [ ] View and Delete actions work
- [ ] Responsive layout works on different screen sizes
- [ ] Loading states display properly
- [ ] Error handling works correctly

---

## Notes
- All tables should use the same MUI DataGrid configuration
- Maintain consistent column widths where possible
- Use 'N/A' for missing/null values
- Handle date conversions consistently (Firestore timestamps, ISO strings, Date objects)
- Keep the same pagination options: [10, 25, 50, 100]
- Default page size: 25 rows
