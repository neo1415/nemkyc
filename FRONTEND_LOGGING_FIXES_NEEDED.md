# Frontend Logging Fixes Needed

## Issues Found

### 1. Missing viewerUid Parameter
**Problem**: When viewing form details, the frontend doesn't pass `viewerUid` query parameter
**Impact**: View events show "Unknown" actor instead of actual user
**Location**: Form viewer components

**Fix Needed**:
```typescript
// When fetching form details, add viewerUid
const response = await fetch(
  `${API_URL}/api/forms/${collection}/${id}?viewerUid=${user.uid}`,
  { credentials: 'include' }
);
```

**Files to Check**:
- Any component that calls `/api/forms/:collection/:id`
- Form viewer modals
- Detail pages

### 2. UI Display Issues in EnhancedEventsLogPage

#### 2.1 IP Display
**Current**: `::1:****:****:****:****`
**Should Be**: `localhost`

**Fix**: Already fixed in backend, just needs to display properly

#### 2.2 Actor Display
**Current**: Shows "System" for some events
**Should Be**: Show actual user name and email

**Fix in EnhancedEventsLogPage.tsx**:
```typescript
// In the table cell for Actor
<TableCell>
  <div className="text-sm">
    <div className="font-medium">
      {event.actorDisplayName || event.actorEmail || 'Unknown User'}
    </div>
    {event.actorEmail && event.actorDisplayName && (
      <div className="text-gray-600">{event.actorEmail}</div>
    )}
    {event.actorRole && (
      <Badge variant="secondary" className="mt-1 text-xs">
        {event.actorRole}
      </Badge>
    )}
  </div>
</TableCell>
```

#### 2.3 Details Display
**Current**: Raw JSON dump
```json
{
  "query": {},
  "params": {},
  "statusCode": 200,
  "contentLength": "152",
  "responseTime": "2199ms"
}
```

**Should Be**: User-friendly summary
```
Login successful
Response time: 2.2 seconds
```

**Fix**: Create a helper function to format details:

```typescript
const formatEventDetails = (event: EventLog) => {
  const { action, details } = event;
  
  switch (action) {
    case 'login':
    case 'login-success':
      return `Login successful${details.loginCount ? ` (Login #${details.loginCount})` : ''}`;
    
    case 'failed-login':
      return `Login failed: ${details.error || 'Invalid credentials'}`;
    
    case 'view':
      return `Viewed ${details.formType || 'form'} details`;
    
    case 'status-update':
      return `Changed status from "${details.from?.status}" to "${details.to?.status}"${details.comment ? `: ${details.comment}` : ''}`;
    
    case 'submit':
      return `Submitted ${details.formType || 'form'}`;
    
    case 'email-sent':
      return `Email sent: ${details.subject || details.emailType}`;
    
    default:
      // For unknown actions, show a generic message
      return `${action.replace(/-/g, ' ')}`;
  }
};
```

Then use it in the table:
```typescript
<TableCell className="text-sm">
  <div>{formatEventDetails(event)}</div>
  {event.responseTime && (
    <div className="text-gray-500 text-xs mt-1">
      Response time: {event.responseTime}ms
    </div>
  )}
</TableCell>
```

#### 2.4 Hide Technical Details by Default
Add a toggle to show/hide technical JSON:

```typescript
const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

// In the expandable row
{expandedRows.has(event.id) && (
  <TableRow>
    <TableCell colSpan={8} className="bg-gray-50 p-4">
      <div className="space-y-4">
        {/* User-friendly summary */}
        <div>
          <h4 className="font-semibold mb-2">Event Summary</h4>
          <p>{formatEventDetails(event)}</p>
        </div>
        
        {/* Technical details toggle */}
        <div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </button>
          
          {showTechnicalDetails && (
            <div className="mt-2 bg-white p-3 rounded border">
              <JsonViewer data={event.details} />
            </div>
          )}
        </div>
      </div>
    </TableCell>
  </TableRow>
)}
```

## Implementation Priority

### High Priority (Do First)
1. ✅ Fix IP display (backend done, frontend just displays it)
2. ✅ Fix actor display to show actual user
3. ✅ Add formatEventDetails helper function
4. ✅ Use formatEventDetails in table

### Medium Priority
1. ⏳ Add viewerUid parameter to form detail requests
2. ⏳ Hide technical JSON by default
3. ⏳ Add toggle for technical details

### Low Priority
1. ⏳ Add icons for different event types
2. ⏳ Color-code event types
3. ⏳ Add quick filters for common events

## Files to Modify

### Frontend
1. `src/pages/admin/EnhancedEventsLogPage.tsx`
   - Add formatEventDetails function
   - Update actor display
   - Update details display
   - Add technical details toggle

2. Form viewer components (need to identify)
   - Add viewerUid query parameter
   - Ensure user context is available

## Testing Checklist

After implementing fixes:
- [ ] Login shows correct user name
- [ ] IP shows "localhost" for local development
- [ ] View form details shows user who viewed it
- [ ] Approve/reject claim shows correct details
- [ ] Details are user-friendly, not raw JSON
- [ ] Technical details can be toggled
- [ ] All events display correctly

## Expected Results

### Login Event
```
Timestamp: 12/10/2025, 9:04:11 PM
Action: Login
Actor: John Doe (john@example.com) [admin]
Target: User account
Details: Login successful (Login #92)
IP: localhost
Location: Unknown
```

### View Event
```
Timestamp: 12/10/2025, 9:05:30 PM
Action: View
Actor: Jane Smith (jane@example.com) [user]
Target: Individual KYC Form
Details: Viewed Individual KYC form details
IP: 192.168.1.*
Location: Lagos, Nigeria
```

### Status Update Event
```
Timestamp: 12/10/2025, 9:06:45 PM
Action: Status Update
Actor: Admin User (admin@nem.com) [admin]
Target: Motor Insurance Claim
Details: Changed status from "pending" to "approved": Claim verified and approved
IP: 192.168.1.*
Location: Lagos, Nigeria
```

---

**Created**: December 10, 2025
**Status**: Ready for Implementation
**Estimated Time**: 1-2 hours
