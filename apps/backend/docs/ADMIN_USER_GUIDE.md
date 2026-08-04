# Identity Remediation System - Admin User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Managing Identity Lists](#managing-identity-lists)
4. [Interpreting Verification Results](#interpreting-verification-results)
5. [Handling Failed Verifications](#handling-failed-verifications)
6. [Retrying Verifications](#retrying-verifications)
7. [User Role Management](#user-role-management)
8. [Monitoring & Reports](#monitoring--reports)
9. [Troubleshooting](#troubleshooting)
10. [Contacting Support](#contacting-support)

---

## Introduction

Welcome to the Identity Remediation System Admin User Guide. This guide will help you manage customer identity verification, interpret results, handle failures, and maintain the system effectively.

### What is the Identity Remediation System?

The Identity Remediation System helps NEM Insurance collect and verify missing National Identification Numbers (NIN) and Corporate Affairs Commission (CAC) registration numbers from legacy insurance customers. The system:

- Accepts Excel/CSV uploads with customer data
- Sends secure verification links to customers
- Validates identity information against NIMC database
- Tracks verification progress
- Provides detailed reports and audit trails

### Who Should Use This Guide?

This guide is for:
- **Administrators**: Managing all identity lists and users
- **Compliance Officers**: Monitoring verification compliance
- **Super Admins**: Full system access and configuration

---

## Getting Started

### Accessing the System

1. Navigate to the NEM Insurance portal
2. Sign in with your admin credentials
3. Click on **"Identity Collection"** in the sidebar

### Dashboard Overview

The Identity Lists Dashboard shows:

- **Total Lists**: Number of uploaded customer lists
- **Total Entries**: Total customers across all lists
- **Verified**: Number of successfully verified customers
- **Pending**: Customers awaiting verification
- **Failed**: Customers with failed verifications

### Your Role

As an admin, you can:
- ✅ View all identity lists (from all brokers and admins)
- ✅ Upload new lists
- ✅ Send verification requests
- ✅ View verification details
- ✅ Retry failed verifications
- ✅ Export data
- ✅ Manage user roles
- ✅ Access audit logs

---

## Managing Identity Lists

### Viewing All Lists

1. Go to **Identity Collection** page
2. You'll see all lists in a table/card view
3. Each list shows:
   - **Name**: List name (e.g., "Q1 2024 Individual Clients")
   - **Upload Date**: When the list was created
   - **Total Entries**: Number of customers in the list
   - **Verified**: Number of verified customers
   - **Progress**: Percentage complete
   - **Created By**: Broker or admin who uploaded the list

### Viewing List Details

1. Click on any list to view details
2. You'll see a table with all customer entries
3. Columns include:
   - All original columns from Excel file
   - **Status**: Current verification status
   - **NIN/CAC**: Verified identity number (if verified)
   - **Link Sent At**: When verification email was sent
   - **Verified At**: When verification was completed

### Filtering and Searching

**Filter by Status:**
- Click the **Status** dropdown
- Select: All, Pending, Link Sent, Verified, Failed

**Search:**
- Use the search box to find customers by name, email, or policy number
- Search works across all columns

**Sort:**
- Click any column header to sort
- Click again to reverse sort order

### Deleting Lists

⚠️ **Warning**: Deleting a list is permanent and cannot be undone.

1. Click the **Delete** button on a list
2. Confirm the deletion
3. All entries and verification data will be removed

---

## Interpreting Verification Results

### Verification Statuses

| Status | Meaning | What to Do |
|--------|---------|------------|
| **Pending** | Customer hasn't been sent a verification link yet | Select and send verification request |
| **Link Sent** | Verification email sent, awaiting customer response | Wait for customer to submit NIN/CAC |
| **Verified** | Customer successfully verified | No action needed ✅ |
| **Failed** | Verification failed (field mismatch or error) | Review details and retry or contact customer |
| **Email Failed** | Email couldn't be delivered | Check email address and resend |

### Understanding Verification Details

Click on any entry to view detailed verification information:

#### For Verified Entries

```
✅ Verification Successful

NIN: 12345678901
Verified At: 2024-01-15 10:30:45

Field Matching Results:
✅ First Name: JOHN (API) ↔ John (Excel) - MATCHED
✅ Last Name: BULL (API) ↔ Bull (Excel) - MATCHED
✅ Gender: Male (API) ↔ M (Excel) - MATCHED
✅ Date of Birth: 12-May-1969 (API) ↔ 12/05/1969 (Excel) - MATCHED
⚠️ Phone Number: 08123456789 (API) ↔ 08098765432 (Excel) - DIFFERENT (Optional)

Tracking ID: 100083737345
Source: NIMC
```

**What This Means:**
- All required fields matched successfully
- Phone number is different but this is optional (people change numbers)
- NIN is valid and belongs to this customer
- Data can be trusted for policy administration

#### For Failed Entries

```
❌ Verification Failed

Reason: Field Mismatch
Failed At: 2024-01-15 10:35:22
Attempts: 1 of 3

Field Matching Results:
✅ First Name: JOHN (API) ↔ John (Excel) - MATCHED
❌ Last Name: SMITH (API) ↔ Bull (Excel) - MISMATCH
✅ Gender: Male (API) ↔ M (Excel) - MATCHED
❌ Date of Birth: 15-Jan-1970 (API) ↔ 12/05/1969 (Excel) - MISMATCH

Failed Fields: Last Name, Date of Birth

Customer Notified: Yes
Staff Notified: Yes
```

**What This Means:**
- The NIN provided belongs to someone else
- Last name and date of birth don't match our records
- Customer has been notified to contact their broker
- You've been notified via email with full details

### Common Verification Scenarios

#### Scenario 1: All Fields Match ✅
**Status**: Verified  
**Action**: None needed. Data is accurate.

#### Scenario 2: Phone Number Different ⚠️
**Status**: Verified  
**Action**: None needed. Phone numbers change frequently.  
**Note**: Consider updating customer contact information.

#### Scenario 3: Name Mismatch ❌
**Status**: Failed  
**Possible Causes**:
- Customer provided wrong NIN
- Data entry error in Excel file
- Customer changed name (marriage, deed poll)

**Action**: Contact customer to verify correct NIN and name.

#### Scenario 4: Date of Birth Mismatch ❌
**Status**: Failed  
**Possible Causes**:
- Customer provided wrong NIN
- Data entry error in Excel file
- Date format confusion (DD/MM/YYYY vs MM/DD/YYYY)

**Action**: Verify date of birth in policy documents and retry.

#### Scenario 5: NIN Not Found ❌
**Status**: Failed  
**Error**: "NIN not found in NIMC database"

**Possible Causes**:
- NIN not yet registered with NIMC
- Typo in NIN
- NIN belongs to someone else

**Action**: Ask customer to verify their NIN from their NIN slip.

---

## Handling Failed Verifications

### Step-by-Step Process

#### Step 1: Review Failure Details

1. Click on the failed entry
2. Read the **Verification Details** dialog
3. Note which fields failed
4. Check the error message

#### Step 2: Identify the Issue

**Field Mismatch:**
- Compare API data with Excel data
- Look for obvious errors (typos, wrong dates)
- Check if customer might have changed name

**NIN Not Found:**
- Verify NIN is 11 digits
- Check for typos
- Confirm NIN with customer

**Network Error:**
- Temporary issue
- Retry immediately

**Service Unavailable:**
- Datapro API is down
- Wait and retry later

#### Step 3: Correct the Data

**If Excel Data is Wrong:**
1. Download the list as CSV
2. Correct the data in Excel
3. Upload as a new list
4. Delete the old list

**If Customer Provided Wrong NIN:**
1. Contact customer via email or phone
2. Request correct NIN
3. Update the entry manually (if possible)
4. Or ask customer to resubmit via verification link

#### Step 4: Retry Verification

See [Retrying Verifications](#retrying-verifications) section below.

### Notification Emails

When verification fails, two emails are sent:

**Customer Email:**
- User-friendly explanation
- Next steps (contact broker)
- Broker contact information

**Staff Email (to you):**
- Technical details
- Failed fields
- API response
- Link to entry in admin portal

**Check Your Email:**
- Look for subject: "Identity Verification Failed - Action Required"
- Review technical details
- Click link to go directly to the entry

---

## Retrying Verifications

### When to Retry

Retry verification when:
- ✅ You've corrected data errors
- ✅ Customer provided correct NIN
- ✅ Network error occurred (temporary)
- ✅ Service was unavailable (now restored)

Don't retry when:
- ❌ Same error will occur (data still wrong)
- ❌ Customer hasn't responded yet
- ❌ Maximum attempts reached (3)

### How to Retry

#### Method 1: Single Entry Retry

1. Go to the list detail page
2. Find the failed entry
3. Click **"Retry Verification"** button
4. Confirm the retry
5. Wait for result (usually 5-10 seconds)

#### Method 2: Bulk Retry

1. Go to the list detail page
2. Filter by status: **Failed**
3. Select entries to retry (checkbox)
4. Click **"Retry Selected"** button
5. Confirm the retry
6. Monitor progress bar

#### Method 3: Resend Verification Link

If customer needs to resubmit:

1. Find the entry
2. Click **"Resend Link"** button
3. New email sent to customer
4. Old link is invalidated
5. Customer can submit again

### Retry Limits

- **Maximum Attempts**: 3 per entry
- **Resend Limit**: Unlimited (but warning after 3)
- **Cooldown**: None (can retry immediately)

### Monitoring Retries

After retrying:
- Check the **Attempts** column (e.g., "2 of 3")
- Review new verification details
- If still failing, investigate further

---

## User Role Management

### Available Roles

| Role | Access Level |
|------|--------------|
| **Default** | No identity collection access |
| **Broker** | Upload lists, view only own data |
| **Compliance** | View all lists, full access |
| **Claims** | No identity collection access |
| **Admin** | Full access, user management |
| **Super Admin** | Full system access |

### Changing User Roles

1. Go to **Admin** → **Users**
2. Find the user in the table
3. Click the **Role** dropdown
4. Select new role
5. Confirm the change
6. User's access updates immediately

### Role Change Scenarios

**Promoting a Broker to Admin:**
- Broker can now see all lists (not just their own)
- Broker can manage other users
- Broker can access all system features

**Demoting an Admin to Broker:**
- Admin can now only see their own lists
- Admin loses user management access
- Admin loses access to other brokers' data

**Assigning Compliance Role:**
- User can view all lists
- User can send verification requests
- User cannot manage other users

### Best Practices

- ✅ Assign roles based on job function
- ✅ Review roles quarterly
- ✅ Remove access when employees leave
- ✅ Use "Compliance" role for auditors
- ✅ Limit "Super Admin" to IT staff

---

## Monitoring & Reports

### Dashboard Metrics

**Overall Progress:**
- Total entries across all lists
- Verification completion rate
- Average time from link sent to verification
- Success rate (verified / total sent)

**Error Rates:**
- Percentage of failed verifications
- Most common error types
- Lists with highest failure rates

**API Health:**
- Datapro API status (healthy/down)
- Average response time
- Daily API call count
- Monthly cost projection

### Exporting Data

#### Export Single List

1. Go to list detail page
2. Click **"Export"** button
3. Choose format: CSV or Excel
4. File downloads with all data:
   - All original columns
   - Verification status
   - NIN/CAC (if verified)
   - Timestamps

#### Export All Lists

1. Go to Identity Lists Dashboard
2. Click **"Export All"** button
3. Choose format
4. File includes summary of all lists

### Audit Logs

View all system activity:

1. Go to **Admin** → **Identity Audit Logs**
2. Filter by:
   - Action type (upload, send, verify, etc.)
   - Date range
   - User
   - List
3. Export logs for compliance reporting

**Logged Actions:**
- List created/deleted
- Links sent
- Verifications (success/failure)
- Retries
- Exports
- Role changes

---

## Troubleshooting

### Common Issues

#### Issue 1: Verification Link Expired

**Symptom**: Customer says link doesn't work

**Solution**:
1. Check if link expired (default: 7 days)
2. Click **"Resend Link"** button
3. New link sent to customer
4. Old link is invalidated

#### Issue 2: Email Not Delivered

**Symptom**: Entry status shows "Email Failed"

**Solution**:
1. Verify email address is correct
2. Check if email is in spam folder
3. Update email address if wrong
4. Click **"Resend Link"** button

#### Issue 3: High Failure Rate

**Symptom**: Many verifications failing

**Possible Causes**:
- Data quality issues in Excel file
- Wrong NINs provided
- Date format confusion

**Solution**:
1. Review failed entries for patterns
2. Check if specific fields always fail
3. Verify data in original Excel file
4. Contact broker to verify data source

#### Issue 4: Datapro API Down

**Symptom**: All verifications failing with "Service unavailable"

**Solution**:
1. Check API health status in dashboard
2. Wait for service to restore
3. Retry failed verifications
4. Contact Datapro support if prolonged

#### Issue 5: Slow Verification

**Symptom**: Verifications taking longer than usual

**Possible Causes**:
- High API load
- Network issues
- Rate limiting

**Solution**:
1. Check API response time in dashboard
2. Reduce concurrent verifications
3. Spread bulk verifications over time
4. Contact support if persistent

### Error Messages Explained

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "Invalid NIN format" | NIN is not 11 digits | Verify NIN is correct |
| "NIN not found" | NIN not in NIMC database | Confirm NIN with customer |
| "Field mismatch" | Data doesn't match | Review failed fields, correct data |
| "Network error" | Connectivity issue | Retry verification |
| "Service unavailable" | Datapro API down | Wait and retry later |
| "Rate limit exceeded" | Too many requests | Wait 1 minute and retry |

---

## Contacting Support

### When to Contact Support

Contact support when:
- ❌ Datapro API is down for > 1 hour
- ❌ Encryption errors occur
- ❌ System errors prevent uploads
- ❌ Data corruption suspected
- ❌ Security concerns
- ❌ Feature requests

### Support Channels

**NEM Insurance Technical Support:**
- **Email**: nemsupport@nem-insurance.com
- **Phone**: 0201-4489570-2
- **Hours**: Monday-Friday, 8:00 AM - 5:00 PM WAT

**Datapro API Support:**
- **Email**: devops@datapronigeria.net
- **Use for**: API errors, service outages, credential issues

**Security Issues:**
- **Email**: security@nem-insurance.com
- **Use for**: Data breaches, unauthorized access, vulnerabilities

### Information to Provide

When contacting support, include:

1. **Your Details**:
   - Name
   - Email
   - Role (Admin/Compliance/Super Admin)

2. **Issue Details**:
   - What you were trying to do
   - What happened instead
   - Error messages (exact text)
   - Screenshots (if applicable)

3. **Context**:
   - List ID (if applicable)
   - Entry ID (if applicable)
   - Timestamp of issue
   - Browser and version

4. **Steps to Reproduce**:
   - Step 1: ...
   - Step 2: ...
   - Step 3: ...

### Response Times

- **Critical Issues** (system down): 1 hour
- **High Priority** (verification failures): 4 hours
- **Medium Priority** (feature issues): 1 business day
- **Low Priority** (questions, requests): 2 business days

---

## Best Practices

### Data Quality

✅ **Do:**
- Verify data before uploading
- Use Excel templates
- Check for typos in names and dates
- Validate email addresses
- Test with small batch first

❌ **Don't:**
- Upload unverified data
- Mix individual and corporate data
- Use inconsistent date formats
- Include invalid email addresses

### Verification Management

✅ **Do:**
- Monitor verification progress daily
- Review failed verifications promptly
- Retry after correcting data
- Export data regularly for backup
- Track completion rates

❌ **Don't:**
- Ignore failed verifications
- Retry without fixing issues
- Delete lists without exporting
- Send duplicate requests

### Security

✅ **Do:**
- Log out when finished
- Use strong passwords
- Review audit logs regularly
- Report suspicious activity
- Limit role assignments

❌ **Don't:**
- Share login credentials
- Leave computer unattended while logged in
- Grant unnecessary permissions
- Ignore security alerts

### Communication

✅ **Do:**
- Respond to customer inquiries promptly
- Provide clear instructions
- Follow up on failed verifications
- Keep brokers informed
- Document issues

❌ **Don't:**
- Ignore customer emails
- Provide technical jargon to customers
- Blame customers for errors
- Delay responses

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + F` | Search in table |
| `Ctrl + E` | Export current view |
| `Ctrl + R` | Refresh data |
| `Esc` | Close dialog |

### Status Icons

| Icon | Status |
|------|--------|
| ⏳ | Pending |
| 📧 | Link Sent |
| ✅ | Verified |
| ❌ | Failed |
| ⚠️ | Email Failed |

### Quick Actions

- **Send Verification**: Select entries → Click "Request NIN/CAC"
- **Retry Failed**: Filter by "Failed" → Select → Click "Retry"
- **Resend Link**: Click entry → Click "Resend Link"
- **Export Data**: Click "Export" → Choose format
- **View Details**: Click any entry row

---

## Appendix

### Glossary

- **NIN**: National Identification Number (11 digits)
- **CAC**: Corporate Affairs Commission registration number
- **BVN**: Bank Verification Number
- **NIMC**: National Identity Management Commission
- **NDPR**: Nigeria Data Protection Regulation
- **Datapro**: Third-party NIN verification API provider
- **Field Mismatch**: When API data doesn't match Excel data

### Regulatory Compliance

The Identity Remediation System complies with:
- **NAICOM Directives**: KYC requirements for insurance companies
- **NDPR**: Data protection and encryption at rest
- **NAIIRA**: Insurance industry regulations

### System Requirements

- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Internet**: Stable connection (minimum 1 Mbps)
- **Screen**: Minimum 1280x720 resolution
- **JavaScript**: Must be enabled

---

**Last Updated**: January 2024  
**Version**: 3.0  
**For**: Administrators, Compliance Officers, Super Admins

**Need Help?** Contact nemsupport@nem-insurance.com or call 0201-4489570-2
