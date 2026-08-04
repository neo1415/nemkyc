# Identity Remediation System - Broker Training Guide

## Welcome, Brokers! 👋

This guide will help you quickly learn how to use the NEM Insurance Identity Remediation System to collect and verify your clients' National Identification Numbers (NIN) and Corporate Affairs Commission (CAC) registration numbers.

---

## Table of Contents

1. [Why We Need This](#why-we-need-this)
2. [Getting Started](#getting-started)
3. [Preparing Your Excel Files](#preparing-your-excel-files)
4. [Uploading Customer Data](#uploading-customer-data)
5. [Sending Verification Requests](#sending-verification-requests)
6. [Tracking Progress](#tracking-progress)
7. [Handling Customer Questions](#handling-customer-questions)
8. [Common Error Scenarios](#common-error-scenarios)
9. [Best Practices](#best-practices)
10. [Quick Reference](#quick-reference)

---

## Why We Need This

### Regulatory Requirement

The National Insurance Commission (NAICOM) and Nigeria Insurance Industry Reform Act (NAIIRA) require all insurance companies to collect and verify the identity information of their clients. This is part of the Know Your Customer (KYC) requirements.

**What This Means for You:**
- You must provide NIN for individual clients
- You must provide CAC registration numbers for corporate clients
- This information must be verified against official databases
- Failure to comply may affect policy administration

### Benefits

✅ **Compliance**: Meet NAICOM/NAIIRA requirements  
✅ **Efficiency**: Automated verification process  
✅ **Security**: Encrypted data storage (NDPR compliant)  
✅ **Tracking**: Monitor progress in real-time  
✅ **Support**: Clear error messages and guidance  

---

## Getting Started

### First Login

When you log in for the first time, you'll see a **guided tour** that walks you through the system. We recommend completing the tour to familiarize yourself with the features.

**Tour Steps:**
1. Welcome and overview
2. Download Excel templates
3. Upload customer data
4. Review uploaded data
5. Select customers
6. Send verification requests
7. Track progress

**Tip**: You can restart the tour anytime from the Help menu.

### Your Dashboard

After login, you'll land on the **Identity Collection** page. Here you'll see:

- **Upload New List** button (top right)
- **Your Lists** table showing all your uploads
- **Progress Summary** for each list

**What You Can Do:**
- Upload new customer lists
- View existing lists
- Send verification requests
- Track verification progress
- Export verified data
- Resend verification links

**What You Cannot Do:**
- View other brokers' lists (privacy protection)
- Change system settings
- Manage user roles

---

## Preparing Your Excel Files

### Step 1: Download the Template

1. Click **"Upload New List"** button
2. Click **"Download Template"** dropdown
3. Choose:
   - **Individual Template** (for personal insurance clients)
   - **Corporate Template** (for business insurance clients)

### Step 2: Understand the Template

#### Individual Client Template

**Required Columns** (must be filled):
- **Title**: Mr, Mrs, Ms, Dr, etc.
- **First Name**: Customer's first name
- **Last Name**: Customer's last name
- **Phone Number**: 11-digit Nigerian phone number (e.g., 07089273645)
- **Email**: Valid email address
- **Address**: Residential address
- **Gender**: Male or Female (or M/F)
- **Policy Number**: Insurance policy number
- **BVN**: Bank Verification Number (11 digits)

**Optional Columns** (recommended):
- **Date of Birth**: Format: DD/MM/YYYY (e.g., 04/01/1980)
- **Occupation**: Customer's occupation
- **Nationality**: Usually "Nigerian"
- **NIN**: If you already have it (11 digits)

#### Corporate Client Template

**Required Columns** (must be filled):
- **Company Name**: Registered business name
- **Company Address**: Business address
- **Email Address**: Company email
- **Company Type**: Limited, PLC, NGO, etc.
- **Phone Number**: Company phone number
- **Policy Number**: Insurance policy number
- **Registration Number**: CAC registration number (RC number)
- **Registration Date**: Date company was registered
- **Business Address**: Physical business location

**Optional Columns**:
- **CAC**: If you already have the full CAC number

### Step 3: Fill in the Data

**Important Guidelines:**

✅ **Do:**
- Use the exact column names from the template
- Fill all required columns
- Use consistent date format (DD/MM/YYYY)
- Double-check names for spelling errors
- Verify email addresses are correct
- Use 11-digit phone numbers starting with 0

❌ **Don't:**
- Change column names
- Leave required columns empty
- Mix date formats (e.g., MM/DD/YYYY and DD/MM/YYYY)
- Use special characters in names
- Include spaces in phone numbers (system will handle this)

**Example - Individual Client:**
```
Title: Mr
First Name: John
Last Name: Doe
Phone Number: 07089273645
Email: john.doe@example.com
Address: 123 Main Street, Lagos
Gender: Male
Date of Birth: 04/01/1980
Policy Number: POL123456
BVN: 12345678901
```

**Example - Corporate Client:**
```
Company Name: ABC Limited
Company Address: 456 Business Avenue, Lagos
Email Address: info@abclimited.com
Company Type: Limited
Phone Number: 08012345678
Policy Number: POL789012
Registration Number: RC123456
Registration Date: 15/03/2010
Business Address: 456 Business Avenue, Lagos
```

### Step 4: Save Your File

- Save as Excel (.xlsx) or CSV (.csv)
- Name it clearly (e.g., "Q1_2024_Individual_Clients.xlsx")
- Keep a backup copy

---

## Uploading Customer Data

### Step 1: Start Upload

1. Click **"Upload New List"** button
2. Upload dialog opens

### Step 2: Read Compliance Message

You'll see a message about NAICOM/NAIIRA regulations. This reminds you that:
- You must provide accurate customer information
- Data will be verified against official databases
- This is a legal requirement for insurance companies

### Step 3: Upload Your File

**Option 1: Drag and Drop**
- Drag your Excel file into the upload area
- File will be processed automatically

**Option 2: Click to Browse**
- Click the upload area
- Select your file from your computer
- Click "Open"

### Step 4: Review Preview

After upload, you'll see:
- **First 10 rows** of your data in a table
- **Detected columns** highlighted
- **Email column** highlighted in green
- **Name columns** highlighted in blue
- **List type** detected (Individual or Corporate)

**Check for:**
- ✅ All columns are present
- ✅ Email column is correctly detected
- ✅ Name columns are correctly detected
- ✅ Data looks correct (no weird characters)
- ✅ List type is correct (Individual or Corporate)

**If Something is Wrong:**
- Click "Cancel"
- Fix your Excel file
- Upload again

### Step 5: Name Your List

- Enter a descriptive name (e.g., "Q1 2024 Individual Clients")
- This helps you identify the list later

### Step 6: Confirm Upload

- Click **"Create List"** button
- System processes your file (may take a few seconds)
- You'll see a success message
- List appears in your dashboard

**What Happens Behind the Scenes:**
- System validates all required columns
- System encrypts sensitive data (NIN, BVN, CAC)
- System stores data securely in database
- System creates entries for each customer

---

## Sending Verification Requests

### Step 1: Open Your List

1. Click on the list you just uploaded
2. You'll see a table with all your customers

### Step 2: Select Customers

**Option 1: Select All**
- Click the checkbox in the table header
- All customers will be selected
- **Note**: Already verified customers are automatically excluded

**Option 2: Select Specific Customers**
- Click checkboxes next to specific customers
- You can select as many as you want

**Tip**: Use filters to narrow down:
- Filter by status: "Pending" (not yet sent)
- Search by name or email

### Step 3: Choose Verification Type

Click one of these buttons:
- **"Request NIN"** - For individual clients
- **"Request CAC"** - For corporate clients

**How to Choose:**
- Use "Request NIN" for personal insurance (life, health, motor)
- Use "Request CAC" for business insurance (commercial, liability)

### Step 4: Review Email List

A confirmation dialog shows:
- Number of customers selected
- List of email addresses that will receive links
- Verification type (NIN or CAC)

**Check:**
- ✅ Email addresses are correct
- ✅ Number of customers is correct
- ✅ Verification type is correct

### Step 5: Send Emails

- Click **"Send"** button
- System sends personalized emails to each customer
- Progress bar shows sending status
- Success message appears when done

**What Customers Receive:**
- Professional email with NEM Insurance branding
- Explanation of why they need to verify
- Secure verification link (unique for each customer)
- Link expiration date (7 days)
- Your contact information for questions

**Email Preview:**
```
Subject: Action Required: Verify Your Identity Information - NEM Insurance

Dear Client,

We write to inform you that, in line with the directives of the National 
Insurance Commission (NAICOM) and ongoing regulatory requirements on Know 
Your Customer (KYC) and data integrity, all insurance companies are mandated 
to obtain and update the identification details of their clients.

Accordingly, we kindly request your cooperation in providing the following:

For Individual Clients: National Identification Number (NIN)

To ensure confidentiality and data protection, we have provided a secured 
link through which the required information can be safely submitted. Kindly 
access the link below and complete the request at your earliest convenience:

[Secure Verification Link]

This link will expire on [Date].

Please note that failure to update these details may affect the continued 
administration of your policy, in line with regulatory guidelines.

For assistance, please contact:
Email: nemsupport@nem-insurance.com
Telephone: 0201-4489570-2

Thank you for your cooperation.

Yours faithfully,
NEM Insurance
```

---

## Tracking Progress

### Dashboard View

Your dashboard shows:
- **Total Entries**: Total customers in the list
- **Verified**: Successfully verified customers (green)
- **Pending**: Awaiting verification (yellow)
- **Failed**: Verification failed (red)
- **Progress Bar**: Visual representation

### List Detail View

Click on a list to see detailed status for each customer:

| Status | Icon | Meaning |
|--------|------|---------|
| **Pending** | ⏳ | Link not sent yet |
| **Link Sent** | 📧 | Email sent, awaiting customer response |
| **Verified** | ✅ | Successfully verified |
| **Failed** | ❌ | Verification failed |
| **Email Failed** | ⚠️ | Email couldn't be delivered |

### Viewing Verification Details

Click on any customer row to see:

**For Verified Customers:**
- ✅ Verification successful
- NIN/CAC number
- Verification timestamp
- Field matching results

**For Failed Customers:**
- ❌ Verification failed
- Reason for failure
- Failed fields
- Retry options

### Exporting Data

1. Click **"Export"** button
2. Choose format: CSV or Excel
3. File downloads with all data including verification results

**Export Includes:**
- All original columns from your upload
- Verification status
- NIN/CAC (if verified)
- Verification timestamps

---

## Handling Customer Questions

### Common Customer Questions

#### Q1: "Why do you need my NIN?"

**Answer:**
"This is a regulatory requirement from NAICOM (National Insurance Commission). All insurance companies in Nigeria must collect and verify customer identity information as part of KYC (Know Your Customer) requirements. This helps protect you and ensures your policy is properly administered."

#### Q2: "Is this secure?"

**Answer:**
"Yes, absolutely. The verification link is unique to you and expires after 7 days. Your NIN is encrypted and stored securely in compliance with Nigeria Data Protection Regulation (NDPR). We only use your NIN for verification purposes and never share it with third parties."

#### Q3: "The link doesn't work"

**Possible Causes:**
- Link expired (7 days)
- Link already used
- Technical issue

**Solution:**
1. Check if customer already verified (check your dashboard)
2. If not verified, resend the link:
   - Go to list detail page
   - Find the customer
   - Click "Resend Link" button
   - New email sent immediately

#### Q4: "I don't have my NIN"

**Answer:**
"You can obtain your NIN from:
- Your NIN slip (if you enrolled)
- NIMC office (bring valid ID)
- NIMC mobile app
- USSD code: Dial *346# from your registered phone number

If you need help, contact NIMC at 0700-6464-6464 or visit www.nimc.gov.ng"

#### Q5: "I entered my NIN but it says it's wrong"

**Possible Causes:**
- Typo in NIN
- Name mismatch (married name vs NIN name)
- Date of birth mismatch
- Wrong NIN provided

**Solution:**
1. Ask customer to verify their NIN from their NIN slip
2. Check if name in your records matches their NIN name
3. Verify date of birth is correct
4. If data is wrong in your system, correct it and resend link

#### Q6: "What happens if I don't verify?"

**Answer:**
"According to NAICOM regulations, failure to provide verified identity information may affect the continued administration of your policy. We strongly encourage you to complete the verification to ensure uninterrupted service."

### When to Escalate

Contact NEM Insurance support when:
- Customer reports technical errors
- Verification fails repeatedly with correct information
- Customer has concerns about data privacy
- You're unsure how to handle a situation

**Support Contact:**
- Email: nemsupport@nem-insurance.com
- Phone: 0201-4489570-2

---

## Common Error Scenarios

### Scenario 1: Email Failed to Send

**Symptom**: Customer status shows "Email Failed"

**Causes:**
- Invalid email address
- Email server rejected message
- Temporary network issue

**Solution:**
1. Verify email address is correct
2. Update email if wrong
3. Click "Resend Link" button
4. If still failing, contact customer by phone

### Scenario 2: Customer Says They Didn't Receive Email

**Causes:**
- Email in spam/junk folder
- Wrong email address
- Email server delay

**Solution:**
1. Ask customer to check spam/junk folder
2. Verify email address with customer
3. Update email if wrong
4. Resend link
5. If still not received, send link via WhatsApp (copy link from system)

### Scenario 3: Verification Failed - Name Mismatch

**Symptom**: Verification failed, error says "Last Name doesn't match"

**Causes:**
- Customer changed name (marriage, deed poll)
- Typo in your records
- Customer provided wrong NIN

**Solution:**
1. Contact customer to verify their current legal name
2. Check their NIN slip for the name registered with NIMC
3. If your records are wrong, correct them:
   - Export the list
   - Correct the data in Excel
   - Upload as new list
   - Delete old list
4. If customer changed name, they need to update it with NIMC first

### Scenario 4: Verification Failed - Date of Birth Mismatch

**Symptom**: Verification failed, error says "Date of Birth doesn't match"

**Causes:**
- Wrong date format (MM/DD/YYYY vs DD/MM/YYYY)
- Typo in your records
- Customer provided wrong NIN

**Solution:**
1. Verify date of birth from policy documents
2. Check date format in your Excel file (should be DD/MM/YYYY)
3. Common mistake: 01/04/1980 could be:
   - 1st April 1980 (DD/MM/YYYY) ✅
   - 4th January 1980 (MM/DD/YYYY) ❌
4. Correct the data and retry

### Scenario 5: NIN Not Found

**Symptom**: Verification failed, error says "NIN not found in NIMC database"

**Causes:**
- Typo in NIN
- NIN not yet registered with NIMC
- Customer provided wrong NIN

**Solution:**
1. Ask customer to verify NIN from their NIN slip
2. Check for typos (NIN is 11 digits)
3. If customer doesn't have NIN, they need to enroll with NIMC
4. If NIN is correct but not found, customer should contact NIMC

### Scenario 6: High Failure Rate

**Symptom**: Many customers failing verification

**Causes:**
- Data quality issues in your Excel file
- Wrong date format used
- Names have typos

**Solution:**
1. Review your Excel file carefully
2. Check date format (DD/MM/YYYY)
3. Verify names are spelled correctly
4. Check if you're using the correct template
5. Test with a small batch (5-10 customers) first

---

## Best Practices

### Before Upload

✅ **Do:**
- Download and use the official templates
- Fill all required columns
- Double-check names for spelling errors
- Use consistent date format (DD/MM/YYYY)
- Verify email addresses are valid
- Test with a small batch first (5-10 customers)
- Keep a backup of your Excel file

❌ **Don't:**
- Create your own column names
- Leave required columns empty
- Mix date formats
- Use special characters in names
- Upload without reviewing data

### During Upload

✅ **Do:**
- Review the preview carefully
- Check that email column is detected correctly
- Verify list type is correct (Individual/Corporate)
- Use descriptive list names
- Read any warning messages

❌ **Don't:**
- Skip the preview
- Ignore warning messages
- Upload without naming the list
- Upload duplicate lists

### After Upload

✅ **Do:**
- Send verification requests promptly
- Monitor progress daily
- Respond to customer questions quickly
- Retry failed verifications after fixing issues
- Export verified data regularly
- Keep customers informed

❌ **Don't:**
- Ignore failed verifications
- Retry without fixing the issue
- Leave customers waiting
- Delete lists without exporting data

### Communication

✅ **Do:**
- Inform customers in advance about the verification request
- Provide your contact information
- Respond to questions within 24 hours
- Be patient and helpful
- Explain the regulatory requirement

❌ **Don't:**
- Send verification requests without warning
- Ignore customer questions
- Use technical jargon
- Blame customers for errors
- Be impatient

---

## Quick Reference

### Upload Checklist

- [ ] Downloaded correct template (Individual or Corporate)
- [ ] Filled all required columns
- [ ] Used DD/MM/YYYY date format
- [ ] Verified email addresses
- [ ] Checked for spelling errors
- [ ] Saved file as .xlsx or .csv
- [ ] Named file clearly
- [ ] Kept backup copy

### Sending Checklist

- [ ] Opened correct list
- [ ] Selected customers to verify
- [ ] Chose correct verification type (NIN or CAC)
- [ ] Reviewed email list
- [ ] Confirmed sending
- [ ] Monitored progress

### Troubleshooting Checklist

- [ ] Checked verification status
- [ ] Reviewed error message
- [ ] Verified data is correct
- [ ] Contacted customer if needed
- [ ] Corrected data if wrong
- [ ] Retried verification
- [ ] Escalated to support if unresolved

### Required Data Summary

**Individual Clients:**
- Title, First Name, Last Name
- Phone Number, Email, Address
- Gender, Date of Birth
- Policy Number, BVN
- NIN (optional, if you have it)

**Corporate Clients:**
- Company Name, Company Address
- Email Address, Company Type
- Phone Number, Policy Number
- Registration Number, Registration Date
- Business Address
- CAC (optional, if you have it)

### Contact Information

**Your Support:**
- Email: nemsupport@nem-insurance.com
- Phone: 0201-4489570-2
- Hours: Monday-Friday, 8:00 AM - 5:00 PM

**Customer NIMC Support:**
- Phone: 0700-6464-6464
- Website: www.nimc.gov.ng

---

## Training Exercises

### Exercise 1: Prepare an Excel File

1. Download the Individual Client template
2. Add 5 sample customers with realistic data
3. Save the file
4. Upload to the system
5. Review the preview

**Goal**: Practice preparing and uploading data

### Exercise 2: Send Verification Requests

1. Use the list from Exercise 1
2. Select all customers
3. Click "Request NIN"
4. Review the confirmation dialog
5. Send the requests

**Goal**: Practice sending verification requests

### Exercise 3: Handle a Failed Verification

1. Create a test customer with intentionally wrong data
2. Send verification request
3. Simulate verification failure
4. Review error details
5. Correct the data
6. Retry verification

**Goal**: Practice troubleshooting failed verifications

### Exercise 4: Export Data

1. Use any list with verified customers
2. Click "Export" button
3. Choose Excel format
4. Open the exported file
5. Review the data

**Goal**: Practice exporting verified data

---

## Frequently Asked Questions (FAQ)

### System Access

**Q: How do I get access to the system?**  
A: Contact your NEM Insurance administrator to create an account with "Broker" role.

**Q: I forgot my password. What do I do?**  
A: Click "Forgot Password" on the login page and follow the instructions.

**Q: Can I access the system from my phone?**  
A: Yes, the system is mobile-friendly, but we recommend using a computer for uploading files.

### Data Management

**Q: Can I edit data after uploading?**  
A: No, you cannot edit individual entries. If you need to correct data, export the list, make corrections in Excel, upload as a new list, and delete the old one.

**Q: Can I delete a list?**  
A: Yes, but only your own lists. Click the delete button and confirm. This action cannot be undone.

**Q: How long is data stored?**  
A: Data is stored indefinitely for compliance purposes. You can export and delete lists you no longer need.

### Verification Process

**Q: How long does verification take?**  
A: Once a customer submits their NIN, verification is instant (5-10 seconds).

**Q: What if a customer doesn't respond?**  
A: You can resend the verification link. Links expire after 7 days, so resend if needed.

**Q: Can I verify customers without sending them emails?**  
A: Yes, if you already have their NIN in your Excel file, use the "Verify All Unverified" button to verify automatically.

### Costs

**Q: Is there a cost per verification?**  
A: Contact NEM Insurance for pricing information. Costs are typically covered by the insurance company.

**Q: Are there limits on how many customers I can verify?**  
A: No hard limits, but the system has rate limiting (50 verifications per minute) to ensure stability.

---

## Certification

After completing this training, you should be able to:

✅ Understand why identity verification is required  
✅ Download and fill Excel templates correctly  
✅ Upload customer data to the system  
✅ Send verification requests to customers  
✅ Track verification progress  
✅ Handle customer questions confidently  
✅ Troubleshoot common error scenarios  
✅ Export verified data  

**Next Steps:**
1. Complete the guided tour in the system
2. Practice with a small batch of customers (5-10)
3. Review this guide as needed
4. Contact support if you have questions

---

## Additional Resources

### Video Tutorials (Coming Soon)

- How to prepare Excel files
- How to upload and send verification requests
- How to handle failed verifications
- How to export data

### Templates

- Individual Client Template (Excel)
- Corporate Client Template (Excel)
- Sample Data File (for practice)

### Support Documents

- API Documentation (for technical users)
- Admin User Guide (for administrators)
- Security & Compliance Guide

---

**Congratulations!** You're now ready to use the Identity Remediation System. Remember, we're here to help. Don't hesitate to contact support if you need assistance.

**Good luck with your verifications!** 🎉

---

**Last Updated**: January 2024  
**Version**: 3.0  
**For**: Insurance Brokers

**Need Help?** Contact nemsupport@nem-insurance.com or call 0201-4489570-2
