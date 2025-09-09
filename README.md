# Project  Implementation Instructions

# Overview

This application is a highly professional, production-grade insurance form suite. You will be designing **multi-step** forms based on the specifications provided. Please read and respect every detail here to ensure the forms are functional, responsive, secure, and precise.



##  GENERAL RULES

✅ Each form has its own **name**. Use that name in the component and directory structure.  
✅ Each form is divided into **sections**. Each section should be treated as a single *step* in a stepper, in the order they appear in the provided data.  
✅ Every section name should be clearly shown as a step in the stepper UI, so the user can see what section they are on.  
✅ The *last* section should always include **data privacy & declaration**, with signature and date (prefilled with today’s date), plus a checkbox for agreement. The declaration block text is standard and included below.  
✅ Once the user ticks the declaration, a `summary-dialog` modal appears showing all form data in review mode, letting them confirm or edit before final submit.  
✅ After final submit, save the form data to the Firebase Firestore database, and upload any files to Firebase Storage under organized folders.  
✅ Send a **success email** to the user after successful submission.  
✅ After successful submission, display a **success modal** with a smooth professional animation. Underneath, include a **note** section with contact details for claim status and inquiries (using the language in the current printed forms).  



# FIELD RULES

✅ All required fields should have a clear `*` indicator.  
✅ Every field must have a **tooltip** describing its purpose.  
✅ Validate all fields thoroughly (e.g., phone numbers, email addresses, numeric ranges, dates, etc.).  
✅ If a field combines multiple pieces of information in one line, split them with clear labels.  

## CONDITIONAL

✅ For yes/no or boolean fields with follow-ups like “If yes, explain,” only show the next field if yes .  
✅ For options with “Other,” show a conditional text field for specification. Label it unambiguously.

### AUTOCOMPLETE FIELDS

✅ For **country** or **nationality** fields: use an autocomplete with country flags.  
✅ For **state** and **city** fields: filter dynamically by chosen country/state.  
✅ For country-issued or passport-issuing fields, use the same autocomplete style.  
✅ **Prioritize these autocomplete instructions** over any JSX snippets.

### MULTIPLE-ENTRY FIELDS

✅ Where repeatable data (like directors or witnesses) is collected, include an **Add** button to dynamically add multiple entries.  
✅ Allow delete/remove per added entry.

### TABLE-STYLE FIELDS

✅ For list of items with amounts/descriptions/totals, use an interactive table with “Add Row.”  
✅ For fixed series rows (like months 1–12), build them statically.



## 📌 FILE UPLOADS

✅ Accept only `.jpg`, `.png`, or `.pdf` under 3MB.  
✅ Place file upload inputs exactly where requested.  
✅ Store uploads in folders named by form type.



## 📌 PERSISTENCE 

✅ Save to `localStorage` on every change, with one-week expiry.  
✅ Encrypt localStorage (e.g., AES) to protect sensitive data.

---

## 📌 RESPONSIVENESS & INTERACTIVITY

✅ Responsive on all devices.  
✅ Add smooth but fast step transitions (no more than 250ms).  
✅ Use skeleton loaders to prevent lag.  
✅ Clean, readable, professional styling.



##📌 SUMMARY MODAL

✅ After the user signs/date-stamps and checks declaration:  
- Show a **summary-dialog** with all entries  
- Allow final edits  
✅ Then submit to Firestore + Storage + send confirmation email  
✅ Show a success modal with an animation and note for follow-up

-

## 📌 FIREBASE RULES

✅ Use clear, consistent collections for each form  
✅ Store uploaded files in folders matching form names  
✅ Send confirmation emails  
✅ Keep field names consistent

---

## 📌 REMINDER

**For each form below:**

- Follow this structure exactly  
- Parse sections in order  
- Keep validations strong  
- Support dynamic repeatable entries  
- Apply autocomplete for countries, states, cities, and nationalities  
- Use correct constraints for file uploads  
- Add the summary-dialog + success modal  
- Always use a professional success note for follow-up


## 📌 DATA PRIVACY & DECLARATION BLOCK (for all forms, final step)

``
## Data Privacy

i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.  
ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.  
iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.  

## Declaration

1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.  
2. I/We agree to provide additional information to NEM Insurance, if required.  
3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.  








1️ Professional Indemnity Insurance Claim Form
Form Name: Professional Indemnity Insurance Claim Form
 Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover


From (date)


To (date)


Section 2: Insured Details
Name of Insured (required)


Company Name (if applicable)


Title (Mr/Mrs/Chief/Dr/Other, dropdown)


Date of Birth (date)


Gender (dropdown: Male / Female / Other)


Address (required)


Phone (phone input, validated)


Email (email input)


Section 3: Claimant Details
Full Name of Claimant (required)


Address of Claimant (required)


Section 4: Retainer/Contract Details
What were you retained/contracted to do? (text area)


Was your contract evidenced in writing? (yes/no, if yes then file upload for contract PDF max 3MB)


If NO, details of contract and its terms (conditional, show only if no above)


When did you perform the work giving rise to the claim? (date range)


Who actually performed the work (Name, Title, Duties, Contact)? (multi-field)


Section 5: Claim Details
Nature of the claim or the circumstances (text area)


Date first became aware of the claim (date)


Date claim or intimation of claim made to you (date)


Was intimation oral or written? (radio: oral / written, if written then file upload, if oral then text area with first-person details)


Amount claimed (currency input)


Section 6: Insured’s Response
Comments in response to the claim (text area)


Comments on the quantum of the claim (text area)


Estimated monetary liability (currency input)


Any other details or info that will help insurer? (yes/no, if yes then text area + file upload if needed)


Have you instructed a solicitor? (yes/no, if yes then name, address, company, rates)


Section 7: Data Privacy
Show text exactly as:


 Your data will solemnly be used for the purposes of this business contract... etc.



Section 8: Declaration & Signature
Declaration (multi-checkbox)


agree that statements are true


agree to provide more info


agree on documents requested


Signature of policyholder (digital signature input)


Date (prefilled today’s date)


Contact note: For claims status enquiries, call 01 448 9570


Notes for Lovable:
 ✅ Make all required fields marked with *
 ✅ Conditional fields for contract evidence and for oral/written as explained
 ✅ Use tooltips for each field
 ✅ Stepper section names visible
 ✅ Show animated summary modal with final review
 ✅ Final submit saves to Firestore and storage with confirmation email

2️⃣ Public Liability Insurance Claim Form
Form Name: Public Liability Insurance Claim Form
 Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (from / to date range)


Section 2: Insured Details
Company Name (if applicable)


Address (required)


Phone (phone input)


Email (email input)


Section 3: Details of Loss
Date of Accident (date)


Time of Accident (time picker with am/pm)


Place where accident occurred (required)


Full details of how accident occurred (text area)


Names & addresses of all witnesses (multi-entry)


For each witness: Name, Address, Is employee or independent (radio), use add witness button


What were you or your employees doing? (text area)


Name/address of person who caused accident (split fields, not combined)


Name/address of that person’s employer if other than insured (optional)


Section 4: Police and Other Insurances
Were particulars taken by police? (yes/no, if yes then station and officer number)


Do you hold other policies covering this accident? (yes/no, if yes then details)


Section 5: Claimant
Name (required)


Address (required)


Nature of injury or damage (text area)


Have you received claim notice? (yes/no, if yes from whom, when, in what form, and if written then file upload)


Section 6: Data Privacy
Show text exactly as given in the form


Section 7: Declaration & Signature
Declaration (multi-checkbox)


Signature of policyholder (digital signature input)


Date (prefilled today’s date)


Contact note: For claims status enquiries, call 01 448 9570


Notes for Lovable:
 ✅ Handle witness add/remove logic with unique labels
 ✅ Conditional fields for police details and notice of claims
 ✅ Summary modal after declaration
 ✅ Final submit to Firestore with confirmation email
 ✅ Animated success modal with contact info

3️⃣ Rent Assurance Policy Claim Form
Form Name: Rent Assurance Policy Claim Form
 Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (from / to date range)


Section 2: Insured Details
Name of Insured (tenant, required)


Address (required)


Age (number)


Email (email input)


Phone (phone input)


Name of Landlord (required)


Address of Landlord (required)


How long living at premises (date range)


Section 3: Claim Information
Period of Default (date range)


Amount defaulted (currency input)


Rent due date (date)


Frequency of rent payment (dropdown: yearly / half-yearly / biannually / other with text input if other)


Cause of inability to pay (text area)


Section 4: Beneficiary Details
Name of Beneficiary (landlord, required)


Age (number)


Address (required)


Email (email input)


Phone (phone input)


Occupation (text)


Section 5: Declaration & Signature
Declaration multi-checkbox


Signature of policyholder (digital signature input)


Date (prefilled today’s date)


Additional written declaration box as per printed form:


“I, [name], of [address], do hereby warrant … amounting in all to …” (text area, required)


File upload section for rent agreement, demand note, quit notice (allow multiple files, pdf/jpg/png, 3MB max each)


Contact note: For claims status enquiries, call 01 448 9570


Section 6: Data Privacy
Show the data privacy text exactly as printed


Notes for Lovable:
 ✅ Separate the fields for “name of landlord” vs. “address of landlord” (no combined fields)
 ✅ Provide add/remove logic if future witness or tenant data repeats
 ✅ Summary modal before submit
 ✅ Confirmation email
 ✅ Animated success modal with contact details


4️⃣ Money Insurance Claim Form
Form Name: Money Insurance Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Company Name (required)


Address (required)


Phone (phone input, validated)


Email (email input)


Section 3: Details of Loss
When did it happen?


Date (date input)


Time (time picker with am/pm)


Where did it happen? (required)


Was the money in transit or locked in a safe? (radio options)


Section 4: If loss was in transit
Name of person who discovered loss (multi-entry)


For each: Name, Position, Salary (salary = number input with currency)


Was there a police escort? (yes/no)


How much was in employee’s possession at journey start? (currency)


What disbursements were made by him during journey? (currency)


Any reason to doubt integrity of employee? (yes/no with explanation if yes)


Section 5: If loss was in safe
Name of person who discovered loss (text)


Was the safe bricked into wall or standing free? (dropdown)


Names, positions, salaries of employees in charge of keys (multi-entry)


Section 6: General
How did it happen? (text area)


Have police been notified? (yes/no, if yes then police station)


Previous loss under the policy? (yes/no, if yes then details)


What is the amount of loss and what did it consist of? (currency and description)


Section 7: Data Privacy
Show exactly as stated in form


Section 8: Declaration & Signature
Declaration (checkbox list, same as form)


Signature of policyholder (digital signature input)


Date (prefilled today)


Notes for Lovable:
 ✅ Conditional “if yes” fields for police / escort
 ✅ Witness and keyholder fields as dynamic “add” entries
 ✅ Summary modal at end
 ✅ Final submit stores to Firestore and sends confirmation email
 ✅ Collection names clear
 ✅ Responsive
 ✅ Success modal after final submit

5️⃣ Motor Insurance Claim Form
Form Name: Motor Insurance Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name / Company Name (required)


Title (Mr/Mrs/Chief/Dr/Other, dropdown)


Date of Birth (date)


Gender (dropdown)


Address (required)


Phone (phone input)


Email (email input)


Section 3: Vehicle Details
Vehicle Registration Number (required)


Make and Model (required)


Year (number)


Engine Number (text)


Chassis Number (text)


Registered in your name? (yes/no, if no then details)


Owned solely by you? (yes/no, if no then details)


Subject of a hire purchase agreement? (yes/no, if yes then details)


What was the vehicle being used for? (text area)


Was a trailer attached? (yes/no)


Brief description of damage (text area)


Name, address, phone where vehicle can be inspected (text area)


Section 4: Circumstances of the Incident
Where did the incident happen? (text)


Date (date)


Time (time picker am/pm)


Reported to police? (yes/no, if yes station details)


Full description of what happened (text area)


Section 5: Witnesses
Witness 1 (multi-fields: name, address, phone)


Witness 2 (multi-fields)


Indicate if either was a passenger (checkboxes)


Section 6: Other Drivers Involved and Property Damage
Another vehicle involved? (yes/no, if yes details)


Car reg number, make/model, name, phone, address


Description of injury/damage


Section 7: Data Privacy
Show as exactly stated


Section 8: Declaration & Signature
Declaration (checkbox list)


Signature of policyholder (digital signature)


Date (prefilled today)


Notes for Lovable:
 ✅ Conditional fields for hire purchase / trailer / police reporting
 ✅ Dynamic witnesses (add/remove)
 ✅ Final review summary modal before submit
 ✅ Confirmation email
 ✅ Success modal
 ✅ All validated including phone / emails / country pickers
 ✅ Clear collections and storage groups

6️⃣ Goods-in-Transit Insurance Claim Form
Form Name: Goods-in-Transit Insurance Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Company Name (required)


Address (required)


Phone (phone input)


Email (email input)


Business Type (text)


Section 3: Details of Loss
Date of Loss (date)


Time (time picker am/pm)


Place of Occurrence (text)


Description of Goods concerned (text area)


Number of packages (number)


Total weight (number + units)


Total value (currency input)


How goods were packed (text area)


Section 4: Circumstances
Circumstances of loss or damage (text area, allow expansion)


If another vehicle was involved


Name & address of owner


Name & address of witness


Police station advised (text)


Date reported to police (date)


Dispatch address


Dispatch date (date)


Consignee name & address


Section 5: Particulars of Goods Lost or Damaged
Dynamic table: Quantity, Description, Value


Allow add rows


Realtime total value calculation


Section 6: Where Inspected
Address where damaged goods can be inspected


Section 7: If you are owner of goods
How/by whom were goods transported? (text area)


Name & address of their insurers


Section 8: If you are claiming as carrier
Name & address of goods owner


Name & address of their insurers


Section 9: Vehicle / Transport
Goods in sound condition on receipt? (yes/no)


Checked by your driver? (yes/no)


Vehicle registration number (text)


Did you or your staff load/unload? (yes/no)


Was a receipt given? (yes/no)


Condition of carriage (file upload specimen if needed)


Claim made against you? (yes/no, if yes date received)


Section 10: Data Privacy
Show text exactly as given


Section 11: Declaration & Signature
Declaration checkbox


Signature of policyholder (digital signature)


Date (prefilled today)


Notes for Lovable:
 ✅ Dynamic “add row” functionality for item list (with running totals)
 ✅ Conditional sections for carrier vs. owner
 ✅ Police details conditional
 ✅ Summary modal at end with final confirmation
 ✅ Confirmation email after submit
 ✅ Storage files 3MB max
 ✅ Responsive / interactive / professional
 ✅ Local storage 7-day expiry





7️⃣ Group Personal Accident Insurance Claim Form
Form Name: Group Personal Accident Insurance Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Company Name (required)


Address (required, multi-line textarea)


Phone (validated phone number)


Email (validated email)


Section 3: Details of Loss
Accident Date (date)


Time (time picker with am/pm)


Place (required, text)


Incident Description (textarea)


Particulars of Injuries (textarea)


Section 4: Witness Information
Multiple entries for each witness


Name (required)


Address (textarea)


Section 5: Doctor Information
Name of doctor (required)


Address of doctor (textarea)


Is this your usual doctor? (yes/no)


Section 6: Incapacity Details
Total incapacity period:


From (date)


To (date)


Partial incapacity period:


From (date)


To (date)


Section 7: Other Insurers
Name (required)


Address (textarea)


Policy Number (text)


Section 8: Data Privacy
Show exactly as given in the form


Section 9: Declaration & Signature
Declaration checkbox (multiple items as described)


Signature of policyholder (digital signature)


Date (prefilled with today’s date)


Notes for Lovable:
 ✅ All addresses separated from names
 ✅ Descriptions are textareas
 ✅ Multiple witnesses as dynamic repeaters
 ✅ Conditional yes/no fields for usual doctor
 ✅ Final summary modal before submit
 ✅ Success confirmation
 ✅ All data saved locally with 7-day expiry
 ✅ Professional stepper layout showing section names
 ✅ Local storage expiry logic
 ✅ All collections properly named
 ✅ Success email after final submit

8️⃣ Fire and Special Perils Claim Form
Form Name: Fire and Special Perils Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name (required)


Company Name (optional)


Title (Mr/Mrs/Chief/Dr/Other dropdown)


Date of Birth (date)


Gender (dropdown)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Loss Details
Full address of premises involved (textarea)


Premises telephone (validated phone)


Date of occurrence (date)


Time (time picker am/pm)


Incident description (textarea)


Cause of fire (textarea + allow suspicious reasons if undiscovered)*


Section 4: Premises Use
Was the premises used as per policy? (yes/no)


If no, details (textarea, conditional)


Purpose premises was being used for (textarea)


Any unallowed element of risk introduced? (yes/no, if yes explain)


Measures taken when fire was discovered (textarea)


Section 5: Property Ownership
Are you the sole owner? (yes/no)


If no, name and address of owners (split fields)


Section 6: Other Insurance
Any other policy on the property? (yes/no, if yes name and address of other insurers)


Section 7: Valuation
Value of premises contents (currency)


Previous claim under similar policy? (yes/no, if yes date & amount of loss)


Section 8: Items Lost or Damaged
Dynamic table:


S/N


Description (textarea)


Cost price


Date of purchase (date)


Estimated value at occurrence


Value of salvage


Net amount claimed (auto calculate difference)


Section 9: Data Privacy
Show exactly as provided


Section 10: Declaration & Signature
Declaration checkbox


Signature (digital signature)


Date (prefilled)


Notes for Lovable:
 ✅ Description fields use textareas
 ✅ Dynamic add-rows for itemized loss with live calculations
 ✅ Conditional logic for “yes/no” fields
 ✅ All multi-entity fields split (name, address, phone)
 ✅ Final summary modal
 ✅ Confirmation email after submit
 ✅ Responsive stepper
 ✅ Professional look
 ✅ Local storage 7-day expiry

9️⃣ Fidelity Guarantee Insurance Claim Form
Form Name: Fidelity Guarantee Insurance Claim Form
Steps / Sections:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Company Name (required)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Details of Defaulter
Name (required)


Age (number)


Present Address (textarea)


Occupation (text)


Date of discovery of default (date)


Section 4: Details of Default
How long, and in what manner, has the default been carried out and concealed? (textarea)


Amount of the default (currency)


Previous irregularity in accounts? (yes/no, if yes explain)


On what date was the account last checked and found correct? (date)


Any property/furniture of the defaulter known? (yes/no, if yes details)


Any salary, commission or other remuneration due to defaulter? (yes/no, if yes details)


Other security in addition to the guarantee? (yes/no, if yes details)


Section 5: Employment Status
Has the defaulter been discharged? (yes/no, if yes date)


Has a proposal for settlement been put forward? (yes/no, if yes details textarea)


Section 6: Data Privacy
Show exactly as written


Section 7: Declaration & Signature
Declaration checkbox


Signature of policyholder (digital signature)


Date (prefilled with today)


Notes for Lovable:
 ✅ Separate name/address/phone fields always
 ✅ Descriptions or narrative fields always use textareas
 ✅ All yes/no fields with conditionally revealed details
 ✅ Final summary modal before final submit
 ✅ Success confirmation
 ✅ Professional, interactive, responsive
 ✅ Local storage 7-day expiry
 ✅ Email confirmation after final submit
 ✅ Collection and storage bucket folders named



1️⃣ Contractors, Plant and Machinery Claim Form
Form Name: Contractors, Plant and Machinery Claim Form
Sections / Steps:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name of Insured (required)


Company Name (optional)


Title (dropdown: Mr/Mrs/Chief/Dr/Other)


Date of Birth (date)


Gender (dropdown)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Plant/Machinery Details
 (dynamic repeater block with “Add Item” button)
Item number (required)


Year of Manufacture (number)


Make (text)


Registration number (text)


Date of Purchase (date)


Cost Price (currency)


Deduction for age/use/wear (currency)


Sum claimed (currency) with radio choice: “Present Value” or “Repairs”


Section 4: Loss/Damage Details
Date and hour of loss/damage (date + time picker)


If unknown, when and where last seen intact (textarea)


Where did loss/damage occur? (textarea)


Parts damaged and extent of damage (textarea)


Where can plant/machinery be inspected (textarea)


Full account of circumstances (textarea)


Suspicion or information on responsible parties (textarea)


Section 5: Witnesses
 (dynamic repeater block with “Add Witness” button)
Witness Name (required)


Witness Address (textarea)


Witness Phone (validated phone)


Section 6: Theft / Third Party Details
Police informed? (yes/no, conditional station details if yes)


Other recovery actions taken (textarea)


Are you sole owner? (yes/no, if no: details textarea)


Any other insurance on the item? (yes/no, if yes details)


If third party involved, third party name, address, insurer (split fields)


Section 7: Data Privacy
Static info


Section 8: Declaration & Signature
Declaration checkbox


Signature (digital)


Date (prefilled today)


Implementation Notes for Lovable:
 ✅ Separate fields (name, address, phone)
 ✅ Narrative fields are textareas
 ✅ Conditional yes/no
 ✅ Dynamic repeaters for both machinery and witnesses
 ✅ Stepper navigation
 ✅ Local storage with 7-day expiry
 ✅ File upload controls where needed (PDF/JPG/PNG under 3MB)
 ✅ Professional interactive design
 ✅ Summary modal for review before final submit
 ✅ Success email on submit

2️⃣ Employers Liability Claim Form
Form Name: Employers Liability Claim Form
Sections / Steps:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name (required)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Injured Party Details
Name (required)


Age (number)


Address (textarea)


Average monthly earnings (currency)


Occupation (text)


Date of employment (date)


Marital Status (dropdown)


Number of children (number)


Ages of children (textarea for multiple ages)


Previous accidents (yes/no, if yes: textarea details)


Section 4: Injury Details
Nature of injuries (textarea)


Machinery involved (textarea if relevant)


Name and position of supervisor (split fields)


Section 5: Accident Details
Accident date (date)


Time (time picker am/pm)


Place (textarea)


Date reported (date)


Reported by (text)


Date injured party stopped work (date)


Description of work engaged in (textarea)


How the accident occurred (textarea)


Sober or intoxicated (yes/no)


Section 6: Medical
Receiving treatment (yes/no, if yes: hospital name/address)


Name and address of doctor (split fields)


Section 7: Disablement
Totally disabled? (yes/no)


Date stopped working (date)


Estimated duration of disablement (text)


Able to do any duties? (yes/no, if yes: textarea)


Has any claim been made on you? (yes/no)


Section 8: Witnesses
 (dynamic repeater block with “Add Witness” button)
Witness Name (required)


Witness Address (textarea)


Witness Phone (phone field)


Section 9: Other Insurers
Name, address, policy number (split fields, optional)


Section 10: Statement of Earnings
 (12-month table)
Month Ending


Wages & Bonus


Plus monthly allowances (food/fuel/housing) (currency)


Section 11: Data Privacy
Static text


Section 12: Declaration & Signature
Declaration checkbox


Signature (digital)


Date (prefilled today)


Implementation Notes for Lovable:
 ✅ Witnesses dynamic repeater included
 ✅ Narrative fields are textareas
 ✅ Conditional yes/no
 ✅ Local storage with 7-day expiry
 ✅ Summary modal for review
 ✅ Success email after submit
 ✅ Stepper navigation with current section name
 ✅ File uploads validated
 ✅ Interactive, professional look

3️⃣ Combined GPA & Employers Liability Claim Form
Form Name: Combined GPA & Employers Liability Claim Form
Sections / Steps:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name (required)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Injured Party Details
Name (required)


Age (number)


Address (textarea)


Average monthly earnings (currency)


Occupation (text)


Date of employment (date)


If not directly employed, employer’s name and address (split fields)


Duration employed (text)


Marital Status (dropdown)


Previous accidents (yes/no, if yes textarea details)


Section 4: Injury Details
Nature of injuries (textarea)


Machinery involved (textarea)


Section 5: Accident Details
Accident date (date)


Time (time picker am/pm)


Place (textarea)


Date reported (date)


Date/time injured party stopped work (date/time)


Work at time (textarea)


How it occurred (textarea)


Section 6: Medical
Receiving treatment (yes/no, if yes: hospital name/address)


Still in hospital? (yes/no, if no discharge date)


Able to do duties? (yes/no, if yes details)


Date and nature of resumed work (textarea)


Section 7: Doctor Details
Name of doctor (text)


Section 8: Disablement
Totally disabled? (yes/no)


Estimated duration (text)


Section 9: Witnesses
 (dynamic repeater block with “Add Witness” button)
Witness Name (required)


Witness Address (textarea)


Witness Phone (phone field)


Section 10: Other Insurers
Name, address, policy number (split fields, optional)


Section 11: Statement of Earnings
 (12-month table)
Month Ending


Wages & Bonus


Plus monthly allowances (currency)


Section 12: Data Privacy
Static info


Section 13: Declaration & Signature
Declaration checkbox


Signature (digital)


Date (prefilled)


Implementation Notes for Lovable:
 ✅ Dynamic witness repeater
 ✅ Narrative descriptions as textarea
 ✅ Proper conditional logic
 ✅ Stepper with section names
 ✅ Local storage with expiry 7 days
 ✅ File upload rules (PDF/JPG/PNG under 3MB)
 ✅ Success email
 ✅ Summary modal for review
 ✅ Professional design, clean, with interactive features but not overly playful



1️⃣ Burglary, Housebreaking and Larceny Claim Form
Form Name: Burglary, Housebreaking and Larceny Claim Form
Sections / Steps:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name of Insured (required)


Company Name (optional)


Title (dropdown: Mr/Mrs/Chief/Dr/Other)


Date of Birth (date)


Gender (dropdown)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Details of Loss
Full address of premises involved (textarea)


Telephone (validated phone)


Date of theft (date)


Time (time picker am/pm)


How entry was effected (textarea)


Rooms entered (textarea)


Premises occupied at time of loss? (yes/no, if no then last occupied date/time)


Suspicions on anyone? (yes/no, if yes then name field)


Police informed? (yes/no, if yes then date + station address)


Are you sole owner? (yes/no, if no then owner name/address)


Any other insurance? (yes/no, if yes then insurer details)


Value of total contents (currency)


Sum insured under fire policy (currency)


Fire policy insurer details (split fields)


Previous burglary/theft loss? (yes/no, if yes then textarea explanation)


Section 4: Property Details
 (table style with dynamic “Add Item” button)
Description


Cost Price (currency)


Date of purchase (date)


Estimated value at time of loss (currency)


Net amount claimed (currency)


Section 5: Data Privacy
Static information


Section 6: Declaration & Signature
Declaration checkbox


Signature (digital)


Date (prefilled today)


Implementation Notes for Lovable:
 ✅ Narrative questions as textarea
 ✅ Conditional yes/no fields
 ✅ Property list table with dynamic “Add” button
 ✅ Summary modal after data privacy step
 ✅ Professional design with section stepper
 ✅ Local storage 7-day expiry
 ✅ Success email on submit
 ✅ Responsive
 ✅ File uploads: PDF, JPG, PNG max 3MB
 ✅ Collections labeled in Firestore, directory groupings for uploads
 ✅ “Add more” function consistent for any lists

2️⃣ All Risk Claim Form
Form Name: All Risk Claim Form
Sections / Steps:
Section 1: Policy Details
Policy Number (required)


Period of Cover (date range)


Section 2: Insured Details
Name of Insured (required)


Address (textarea)


Phone (validated phone)


Email (validated email)


Section 3: Details of Loss
Type of claim (text)


Location of claim (textarea)


Date of occurrence (date)


Time (time picker am/pm)


Describe property involved (model, make, year etc) (textarea)


Circumstances of loss/damage (textarea)


Estimate of loss/repairs (currency)


Section 4: Property Details
 (table style with dynamic “Add Item” button)
Description


Date of purchase/manufacture (date)


Cost price (currency)


Deduction for age/use/wear (currency)


Amount claimed (currency)


Remarks (textarea)


Section 5: Ownership & Recovery Questions
Sole owner? (yes/no, if no then explain)


Any hire purchase agreement? (yes/no, if yes then hire company name/address)


Steps taken to recover lost property (textarea)


Any other insurance on this property? (yes/no, if yes details)


Ever sustained same loss before? (yes/no, if yes details)


Total value of insured property at time of loss (currency)


Other insurance in place at time of incident? (yes/no, if yes insurer/policy details)


Prior claims under any burglary/all risk policy? (yes/no, if yes details)


Informed police? (yes/no, if yes police station details)


Section 6: Data Privacy
Static info


Section 7: Declaration & Signature
Declaration checkbox


Signature (digital)


Date (prefilled today)


Implementation Notes for Lovable:
 ✅ Description/details as textarea
 ✅ Conditional logic for yes/no
 ✅ Dynamic “Add Item” for property listing
 ✅ Summary modal after final section
 ✅ Section-based stepper
 ✅ Local storage with 7-day expiry
 ✅ Success email after submit
 ✅ File uploads max 3MB for relevant evidence
 ✅ Professional, responsive, with clear error validation

✅ This final batch sticks 100% to:
dynamic add buttons for any lists


conditional yes/no logic


split complex fields


all text-area for descriptions/details


summary dialog modal


local storage 7-day


success email after submit


responsive, interactive, but professional


stepper showing the section names


data grouped with labeled Firestore collections and storage buckets




CDD FORMS

 Corporate CDD
Form Name: Corporate CDD
Sections / Steps:

Section 1: Company Info
Company Name (required, min 3, max 50)


Registered Company Address (required, textarea, min 3, max 60)


Incorporation Number (required, min 7, max 15)


Incorporation State (required, min 3, max 50)


Date of Incorporation/Registration (required, date)


Nature of Business (required, textarea, min 3, max 60)


Company Type (required, select)


Options:


Choose Company Type


Sole Proprietor


Unlimited Liability Company


Limited Liability Company


Public Limited Company


Joint Venture


Other (if “Other”, reveal text input with clear label)


Email Address (required, valid email pattern, min 5, max 50)


Website (required)


Tax Identification Number (optional, min 6, max 15)


Telephone Number (required, phone validation, min 5, max 11)



Section 2: Directors Info
(repeatable with “Add Director” button)
For each director:
First Name (required, min 3, max 30)


Middle Name (optional, min 3, max 30)


Last Name (required, min 3, max 30)


Date of Birth (required, date)


Place of Birth (required, min 3, max 30)


Nationality (required, with auto-complete country flags)


Country (required, with auto-complete country flags)


Occupation (required, min 3, max 30)


Email (required, valid email pattern, min 6, max 30)


Phone Number (required, phone, min 5, max 11)


BVN (required, exactly 11 digits)


Employer’s Name (optional, min 2, max 50)


Employer’s Phone (optional, phone, min 5, max 11)


Residential Address (required, textarea)


Tax ID Number (optional)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Driver’s Licence


Voters Card


Identification Number (required, min 1, max 20)


Issuing Body (required, min 1, max 50)


Issued Date (required, date)


Expiry Date (optional, date)


Source of Income (required, select)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (if “Other”, reveal text input with clear label)


✅ Repeatable block with “Add Director” and delete option for multiple entries.

Section 3: Account Details
Subsection: Local Account Details
Bank Name (required, min 3, max 50)


Account Number (required, min 7, max 10)


Bank Branch (required, min 3, max 30)


Account Opening Date (required, date)


Subsection: Foreign Account Details (optional)
Bank Name (optional)


Account Number (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 4: Uploads
Upload Your CAC Certificate (required, accepts jpg/png/pdf, max 3MB)


Upload Means of Identification (required, accepts jpg/png/pdf, max 3MB)



Section 5: Data Privacy & Declaration
Static text


Accept checkboxes


Digital signature


Date (prefilled today)


Submit triggers summary dialog and then final submit to Firestore + success email


Show section stepper


All fields to store in local storage for 7 days


Responsive


Validate all fields


Professional but friendly look


File uploads grouped in directories in Firebase Storage



2️⃣ NAICOM Company CDD
Form Name: NAICOM Company CDD
Sections / Steps:

Section 1: Company Details
Company Name (required, min 3, max 50)


Registered Company Address (required, textarea, min 3, max 60)


Incorporation Number (required, min 7, max 15)


Incorporation State (required, min 3, max 50)


Date of Incorporation/Registration (required, date)


Nature of Business (required, textarea, min 3, max 60)


Company Type (required, select)


Choose Company Type


Sole Proprietor


Unlimited Liability Company


Limited Liability Company


Public Limited Company


Joint Venture


Other (if “Other”, reveal text input with clear label)


Email Address (required, valid email pattern, min 5, max 50)


Website (required)


Tax Identification Number (required, min 6, max 15)


Telephone Number (required, phone validation, min 5, max 11)



Section 2: Director Info
(repeatable with “Add Director” button)
For each director:
First Name (required, min 3, max 30)


Middle Name (optional, min 3, max 30)


Last Name (required, min 3, max 30)


Date of Birth (required, date)


Place of Birth (required, min 3, max 30)


Nationality (required, with auto-complete country flags)


Country (required, with auto-complete country flags)


Occupation (required, min 3, max 30)


Email (required, valid email, min 6, max 30)


Phone Number (required, phone, min 5, max 11)


BVN (required, exactly 11 digits)


Employer’s Name (optional, min 2, max 50)


Employer’s Phone (optional, phone, min 5, max 11)


Residential Address (required, textarea)


Tax ID Number (optional)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Driver’s Licence


Voters Card


Identification Number (required, min 1, max 20)


Issuing Body (required, min 1, max 50)


Issued Date (required, date)


Expiry Date (optional, date)


Source of Income (required, select)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (if “Other”, reveal text input with clear label)*


✅ Repeatable block with “Add Director” and delete option for multiple entries.

Section 3: Account Details
Subsection: Local Account Details
Bank Name (required, min 3, max 50)


Account Number (required, min 7, max 10)


Bank Branch (required, min 3, max 30)


Account Opening Date (required, date)


Subsection: Foreign Account Details (optional)
Bank Name (optional)


Account Number (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 4: Uploads
Upload Your CAC Certificate (required, accepts jpg/png/pdf, max 3MB)


Upload Means of Identification (required, accepts jpg/png/pdf, max 3MB)


Upload NAICOM License Certificate (required, accepts jpg/png/pdf, max 3MB)



Section 5: Data Privacy & Declaration
Static text


Accept checkboxes


Digital signature


Date (prefilled today)


Submit triggers summary dialog and then final submit to Firestore + success email


Show section stepper


All fields stored in local storage with 7-day expiry


Responsive


Professional design


Clear error validation


File uploads grouped neatly under named directories



1️⃣ Partners CDD
Form Name: Partners CDD
Sections / Steps:

Section 1: Company Info
Company Name (required)


Registered Company Address (required, textarea)


City (required)


State (required)


Country (required, auto-complete flags)


Email Address (required, email)


Website (required)


Contact Person Name (required)


Contact Person Number (required, phone)


Tax Identification Number (optional)


VAT Registration Number (required)


Incorporation/RC Number (required)


Date of Incorporation/Registration (required, date)


Incorporation State (required)


Nature of Business (required, textarea)


BVN (required, number, 11 digits)



Section 2: Directors Info
(repeatable with Add Director button)
For each director:
Title (required)


Gender (required, select)


Select Gender


Male


Female


First Name (required)


Middle Name (optional)


Last Name (required)


Residential Address (required, textarea)


Position (required)


Date of Birth (required, date)


Place of Birth (required)


Occupation (required)


BVN (required, 11 digits)


Tax ID Number (optional)


International Passport Number (required)


Passport Issued Country (required)


Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


Nationality (required)


Phone Number (required)


Email (required, email)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Drivers Licence


Voters Card


Identification Number (required)


Issued Date (required, date)


Expiry Date (required, date)


Issuing Body (required)


✅ Repeats with “Add Director” and delete support

Section 3: Account Details
Subsection: Local Account Details
Account Number (required)


Bank Name (required)


Bank Branch (required)


Account Opening Date (required, date)


Subsection: Foreign Account Details (optional)
Account Number (optional)


Bank Name (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 4: Uploads
Certificate of Incorporation (required, jpg/png/pdf max 3MB)


Means of Identification for Director 1 (required)


Means of Identification for Director 2 (the field label says optional, but rules say required — keep as required)


CAC Status Report (the field label says optional, but rules say required — keep as required)


VAT Registration License (the field label says optional, but rules say required — keep as required)


Tax Clearance Certificate within last 3 years (the field label says optional, but rules say required — keep as required)



Section 5: Data Privacy & Declaration
static text


checkbox agree


digital signature


date


submit triggers summary modal


store data 7 days in local storage


send success email



2️⃣ NAICOM Partners CDD
Form Name: NAICOM Partners CDD
Sections / Steps:

Section 1: Company Info
Company Name (required)


Registered Company Address (required, textarea)


City (required)


State (required)


Country (required, with auto-complete flags)


Email Address (required, email)


Website (required)


Contact Person Name (required)


Contact Person Number (required)


Tax Identification Number (required)


VAT Registration Number (required)


Incorporation/RC Number (required)


Date of Incorporation/Registration (required, date)


Incorporation State (required)


Nature of Business (required, textarea)


BVN (required, 11 digits)


NAICOM License Issuing Date (required, date)


NAICOM License Expiry Date (required, date)



Section 2: Directors Info
(repeatable with Add Director button)
Title (required)


Gender (required, select)


Select Gender


Male


Female


First Name (required)


Middle Name (optional)


Last Name (required)


Residential Address (required, textarea)


Position (required)


Date of Birth (required, date)


Place of Birth (required)


Occupation (required)


BVN (required, 11 digits)


Tax ID Number (optional)


International Passport Number (required)


Passport Issued Country (required)


Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


Nationality (required)


Phone Number (required)


Email (required, email)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Drivers Licence


Voters Card


Identification Number (required)


Issued Date (required, date)


Expiry Date (required, date)


Issuing Body (required)


✅ Repeatable block with “Add Director”

Section 3: Account Details
Local Account Details
Account Number (required)


Bank Name (required)


Bank Branch (required)


Account Opening Date (required, date)


Foreign Account Details (optional)
Account Number (optional)


Bank Name (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 4: Uploads
Certificate of Incorporation (required)


Identification Means for Director 1 (required)


Identification Means for Director 2 (rules say required — note conflict in label)


CAC Status Report (rules say required — note conflict in label)


VAT Registration License (rules say required — note conflict in label)


Tax Clearance Certificate (rules say required — note conflict in label)


NAICOM License Certificate (optional)



Section 5: Data Privacy & Declaration
static text


accept terms


digital signature


submit triggers summary modal


store 7 days in local storage


send success email



3️⃣ Brokers
Form Name: Brokers
Sections / Steps:

Section 1: Company Info
Company Name (required)


Company Address (required, textarea)


City (required)


State (required)


Country (required)


Incorporation/RC Number (required)


Registration Number (required)


Incorporation State (required)


Company Type (required, select, switch to text if Other)


Choose Company Type


Sole Proprietor


Unlimited Liability Company


Limited Liability Company


Public Limited Company


Joint Venture


Other (please specify)


Date of Incorporation/Registration (required, date)


Email Address (required, email)


Website (required)


Business Type/Occupation (required, textarea)


Tax Number (required)


Telephone Number (required, phone)



Section 2: Directors Info
(repeatable with Add Director button)
Title (required)


Gender (required, select)


Select Gender


Male


Female


First Name (required)


Middle Name (optional)


Last Name (required)


Date of Birth (required, date)


Place of Birth (required)


Nationality (required)


Residence Country (required)


Occupation (required)


BVN (required, 11 digits)


Employer’s Name (required)


Phone Number (required, phone)


Address (required, textarea)


Email (required, email)


Tax ID Number (optional)


International Passport Number (optional)


Passport Issued Country (optional)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Drivers Licence


Voters Card


Identification Number (required)


Issued By (Issuing Country) (required)


Issued Date (required, date)


Expiry Date (optional, date)


Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


✅ Repeatable block with “Add Director”

Section 3: Account Details
Local Account Details
Local Bank Name (required)


Bank Branch (required)


Current Account Number (required)


Account Opening Date (required, date)


Domiciliary Account Details (optional)
Domiciliary Account Number (optional)


Foreign Bank Name (optional)


Bank Branch Name (optional)


Currency (optional)


Account Opening Date (optional, date)



Section 4: Uploads
Certificate of Incorporation (required)


Identification Means for Director 1 (required)


Identification Means for Director 2 (required)


NAICOM License Certificate (optional)



Section 5: Data Privacy & Declaration
static text


accept checkbox


digital signature


store in local storage for 7 days


success email after submit


responsive


section steppers


summary modal



1️⃣ Individual CDD
Form Name: Individual CDD
Sections / Steps:

Section 1: Personal Info
Title (required)


First Name (required)


Last Name (required)


Contact Address (required, textarea)


Gender (required, select)


Select Gender


Male


Female


Residence Country (required, with auto-complete flags)


Date Of Birth (required, date)


Place of Birth (required)


Email (required, email)


Mobile Number (required, phone)


Residential Address (required, textarea)


Nationality (required)


Occupation (required)


Position (optional)



Section 2: Additional Info
Business Type (required, select, switch to text if Other)


Choose Company Type


Sole Proprietor


Limited Liability Company


Public Limited Company


Joint Venture


Other (please specify)


Employer’s Email (required, email)


Employer’s Name (optional)


Employer’s Telephone Number (optional, phone)


Employer’s Address (optional, textarea)


Tax Identification Number (optional)


BVN (required, number, 11 digits)


ID Type (required, select)


Choose ID Type


International Passport


NIMC


Drivers Licence


Voters Card


NIN


Identification Number (required)


Issuing Country (required)


Issued Date (required, date)


Expiry Date (optional, date)



Section 3: Account Details & Uploads
Annual Income Range (required, select)


Annual Income Range


Less Than 1 Million


1 Million - 4 Million


4.1 Million - 10 Million


More Than 10 Million


Premium Payment Source (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


Upload Means of Identification (required, file, jpg/png/pdf 3MB)


Digital Signature (required, textarea or e-sign pad)



Section 4: Data Privacy & Declaration
static text


accept checkbox


date


summary modal


store in local storage 7 days


responsive



2️⃣ Agents CDD
Form Name: Agents CDD
Sections / Steps:

Section 1: Personal Info
First Name (required)


Middle Name (optional)


Last Name (required)


Residential Address (required, textarea)


Gender (required, select)


Select Gender


Male


Female


Position/Role (required)


Date of Birth (required, date)


Place of Birth (required)


Other Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


Nationality (required)


Phone Number (required, phone)


BVN (required, 11 digits)


Tax ID Number (optional)


Occupation (required)


Email (required, email)


Valid Means of ID (required, select)


Choose Identification Type


International Passport


NIMC


Drivers Licence


Voters Card


Identification Number (required)


Issued Date (required, date)


Expiry Date (optional, date)


Issuing Body (required)



Section 2: Additional Info
Agent Name (required)


Agents Office Address (required, textarea)


NAICOM License Number (RIA) (required)


License Issued Date (required, date)


License Expiry Date (required, date)


Email Address (required, email)


Website (required)


Mobile Number (required, phone)


Tax Identification Number (optional)


ARIAN Membership Number (required)


List of Agents Approved Principals (Insurers) (required, textarea)



Section 3: Financial Info
Subsection: Local Account Details
Account Number (required)


Bank Name (required)


Bank Branch (required)


Account Opening Date (required, date)


Subsection: Foreign Account Details (optional)
Account Number (optional)


Bank Name (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 4: Data Privacy & Declaration
static text


accept checkbox


e-signature


submit triggers summary modal


store in local storage for 7 days


send confirmation email


responsive


multi-step steppers







KYC FORMS
 Corporate KYC
Form Name: Corporate KYC
Sections / Steps

Section 1: Company Info
NEM Branch Office (required)


Insured (required)


Office Address (required, textarea)


Ownership of Company (required, select)


Select Ownership Of Company


Nigerian


Foreign


Both


Contact Person (required)


Website (required)


Incorporation Number (required)


Incorporation State (required)


Date of Incorporation/Registration (required, date)


BVN (required, 11 digits)


Contact Person Mobile Number (required, phone)


Tax Identification Number (optional)


Email Address (required, email)


Business Type/Occupation (required)


Estimated Turnover (required, select)


Annual Income Range


Less Than 10 Million


11 Million - 50 Million


51 Million - 200 Million


More Than 200 Million


Premium Payment Source (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)



Section 2: Director Info
(dynamically add multiple directors with “Add Director” button)
First Name (required)


Middle Name (optional)


Last Name (required)


Date of Birth (required, date)


Place of Birth (required)


Nationality (required)


Country (required)


Occupation (required)


Email (required, email)


Phone Number (required, phone)


BVN (required, 11 digits)


Employers Name (optional)


Employers Phone Number (optional)


Residential Address (required)


Tax ID Number (optional)


ID Type (required, select)


Choose Identification Type


International Passport


NIMC


Drivers Licence


Voters Card


Identification Number (required)


Issuing Body (required)


Issued Date (required, date)


Expiry Date (optional, date)


Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)



Section 3: Account Details & Verification Upload
Company Name Verification Document (required, select)


Verification Document


Certificate of Incorporation or Business Registration


CAC Status Report


Board Resolution


Power of Attorney


Upload Your Verification Document (required, file, jpg/pdf/png)



Section 4: Data Privacy & Declaration
static text block


accept checkbox


summary modal


local storage 7 days


e-sign pad


confirmation email


responsive steppers



2️⃣ Individual KYC
Form Name: Individual KYC
Sections / Steps

Section 1: Personal Info
Office Location (required)


Title (required)


First Name (required)


Middle Name (required)


Last Name (required)


Contact Address (required, textarea)


Occupation (required)


Gender (required, select)


Select Gender


Male


Female


Date of Birth (required, date)


Mother’s Maiden Name (required)


Employer’s Name (optional)


Employer’s Telephone Number (optional)


Employer’s Address (optional)


City (required)


State (required)


Country (required)


Nationality (required, select)


Select Nationality


Nigerian


Foreign


Both


Residential Address (required)


Mobile Number (required, phone)


Email (required, email)


Tax Identification Number (optional)


BVN (required, 11 digits)


ID Type (required, select)


Choose ID Type


International Passport


NIMC


Drivers Licence


Voters Card


NIN


Identification Number (required)


Issuing Country (required)


Issued Date (required, date)


Expiry Date (optional, date)


Source of Income (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)


Annual Income Range (required, select)


Annual Income Range


Less Than 1 Million


1 Million - 4 Million


4.1 Million - 10 Million


More Than 10 Million


Premium Payment Source (required, select, switch to text if Other)


Choose Income Source


Salary or Business Income


Investments or Dividends


Other (please specify)



Section 2: Account Details
Subsection: Local Account Details
Bank Name (required)


Account Number (required)


Bank Branch (required)


Account Opening Date (required, date)


Subsection: Foreign Account Details (optional)
Bank Name (optional)


Account Number (optional)


Bank Branch (optional)


Account Opening Date (optional, date)



Section 3: Upload
Upload Means of Identification (required, file, jpg/png/pdf 3MB, custom Controller)



Section 4: Data Privacy & Declaration
static text


checkbox


summary modal


local storage 7 days


submit confirmation email


responsive




