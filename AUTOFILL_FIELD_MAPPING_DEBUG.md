# Auto-Fill Field Mapping Debug Guide

## Issue: Only 3 Fields Being Filled

You mentioned only firstName, middleName, and lastName are being auto-filled. The system should fill up to 8 fields:

1. ✅ firstName
2. ✅ middleName  
3. ✅ lastName
4. ❌ gender
5. ❌ dateOfBirth
6. ❌ phoneNumber
7. ❌ birthstate
8. ❌ birthlga

## Possible Causes

### 1. Form Fields Don't Exist
The Individual KYC form might not have fields for gender, dateOfBirth, etc.

### 2. Field Names Don't Match
The field matching logic looks for specific field names/IDs. If your form uses different names, they won't be found.

### 3. API Not Returning Data
The Datapro API might not be returning all fields for that specific NIN.

## How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for these logs:

```
[AutoFillEngine] Normalizing NIN data
[AutoFillEngine] Mapping NIN fields to form
[AutoFillEngine] Populating form fields
```

### Step 2: Check What Data API Returned
In the browser console, after auto-fill completes, check the network tab:
1. Find the request to `/api/autofill/verify-nin`
2. Click on it
3. Look at the Response tab
4. Check what fields are in `data`:

```json
{
  "status": true,
  "data": {
    "firstname": "John",
    "middlename": "Paul",
    "surname": "Doe",
    "gender": "M",           // ← Is this present?
    "birthdate": "1990-01-01", // ← Is this present?
    "phone": "08012345678",   // ← Is this present?
    "birthstate": "Lagos",    // ← Is this present?
    "birthlga": "Ikeja"       // ← Is this present?
  }
}
```

### Step 3: Check Form Field Names
Inspect the Individual KYC form HTML and check what field names exist:

```html
<!-- These should exist in your form -->
<input name="firstName" />     <!-- ✅ Working -->
<input name="middleName" />    <!-- ✅ Working -->
<input name="lastName" />      <!-- ✅ Working -->
<input name="gender" />        <!-- ❓ Does this exist? -->
<input name="dateOfBirth" />   <!-- ❓ Does this exist? -->
<input name="phoneNumber" />   <!-- ❓ Does this exist? -->
<input name="birthstate" />    <!-- ❓ Does this exist? -->
<input name="birthlga" />      <!-- ❓ Does this exist? -->
```

### Step 4: Check Field Matching Logic
The `findFormField()` function looks for fields with these patterns:

**For "gender"**:
- name="gender"
- id="gender"
- name="sex"
- id="sex"

**For "dateOfBirth"**:
- name="dateOfBirth"
- id="dateOfBirth"
- name="dob"
- id="dob"
- name="birthDate"
- id="birthDate"

**For "phoneNumber"**:
- name="phoneNumber"
- id="phoneNumber"
- name="phone"
- id="phone"
- name="mobile"
- id="mobile"

If your form uses different field names (e.g., "Gender" with capital G, or "date_of_birth" with underscores), they won't be matched.

## Quick Fix: Add More Field Name Patterns

If your form uses different field names, we can update the field matching logic to recognize them.

**Example**: If your form has `<input name="Date_Of_Birth" />`, we need to add that pattern to the matcher.

## To See Full API Response

Add this temporary logging to see exactly what Datapro returns:

1. Open `src/services/autoFill/VerificationAPIClient.ts`
2. Find the line that says `const result: NINVerificationResponse = {`
3. Add this line BEFORE it:
```typescript
console.log('🔍 [DEBUG] Full API response:', data);
```

4. Refresh the page and try auto-fill again
5. Check browser console for the full response

## Next Steps

1. Check browser console and network tab to see what data is returned
2. Inspect the form HTML to see what field names exist
3. Share the findings so we can:
   - Add missing field name patterns to the matcher
   - Or update the form to include missing fields
   - Or confirm if Datapro isn't returning certain fields for that NIN
