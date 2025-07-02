\# specs.md

\# Insurance KYC/CDD/Claims App — Project Specification

This project is a web application to manage insurance onboarding, KYC, CDD, and claim submission processes, with multiple user roles and dashboards.

\---

\#\# Tech Stack  
\- \*\*Frontend:\*\* React \+ TypeScript \+ TailwindCSS  
\- \*\*Backend:\*\* Node.js \+ Express  
\- \*\*Database:\*\* Firestore (Firebase)  
\- \*\*Auth:\*\* Firebase Auth (custom claims, role-based)  
\- \*\*PDF Generation:\*\* jspdf / pdfmake  
\- \*\*Notifications:\*\* Email (nodemailer / Sendgrid) \+ SMS (Twilio or equivalent)

\---

\#\# User Roles  
\- \*\*Default user\*\*  
  \- Must register just before final form submission (username/password or Google)  
  \- Chooses notification method (email or SMS) during sign-up  
  \- Can see own profile & personal details  
  \- Can view submitted forms in a dashboard (read-only)  
  \- Can download submitted forms \+ attached files in PDF  
  \- Receives notifications:  
    \- on form submission (“thanks for submitting”)  
    \- on claim approval (“approved”)  
  \- Cannot edit submissions after submitting

\- \*\*Admin / Compliance / Moderator\*\*  
  \- Created manually by super-admin  
  \- Initially blocked (role stays \`default\`)  
  \- Gets onboarding email with random password and reset link  
  \- Cannot log in until:  
    \- they change their password  
    \- super-admin upgrades their role  
  \- See all form submissions on an admin dashboard:  
    \- Widgets showing totals for current month  
    \- % growth vs last month  
    \- Submission type graph (day, month, year)  
    \- Latest submissions list  
  \- Can view, edit, delete any form  
  \- Claim forms:  
    \- row color yellow \= pending  
    \- row color green \= approved  
    \- email user after approval  
  \- Sidebar with collapsible dropdowns for:  
    \- Claims (14+)  
    \- CDD  
    \- KYC  
  \- Secure:  
    \- not public  
    \- not indexed  
    \- only accessible to upgraded roles  
  \- Unauthorized users see a custom block page

\---

\#\# Forms

\#\#\# Claims Forms  
14 claim forms, to be referenced from the uploaded project spec. They are named individually, for example:  
\- motor  
\- money  
\- burglary  
\- public-liability  
\- contractors  
\- goods-in-transit  
\- machinery  
\- personal-accident  
\- marine  
\- fire  
\- bond  
\- aviation  
\- livestock  
\*(use exact forms as coded in your prompt document)\*

\---

\#\#\# KYC Forms  
\- individual-kyc  
\- corporate-kyc

\---

\#\#\# CDD Forms  
\- agents  
\- brokers  
\- individual  
\- corporate  
\- partners  
\- naicom-corporate  
\- naicom-partners

✅ \*\*Special CDD front-end logic\*\*    
\- On frontend, only show:    
  \- agents    
  \- brokers    
  \- corporate    
  \- partners    
  \- individual    
\- When a user clicks corporate or partners, trigger a modal asking:    
  \- \*“Are you NAICOM approved?”\*    
    \- if \*\*no\*\*, load corporate/partners form    
    \- if \*\*yes\*\*, load naicom-corporate / naicom-partners    
\- In the admin dashboard, all (including naicom forms) appear together in a single table for review, editing, approval, and download.

\---

\#\# UX/UI  
\- White primary theme, with burgundy & gold accents  
\- Dark mode option  
\- Responsive  
\- Sidebar with icons and dropdown menus  
\- Tooltips on all form fields and buttons  
\- Multi-page landing  
  \- visible form links  
  \- user login button  
  \- profile/dashboard icon if logged in  
\- Professional typography  
\- Use images where relevant  
\- Print-style layout for single form views, with sectioned fields  
\- Company logo/header on all exported PDFs

\---

\#\# Functional Features  
\- \*\*Form standardization\*\*  
  \- Phone numbers validated via reusable controller  
  \- Date pickers for date-only or year  
  \- Date-time pickers for full date/time  
  \- All variable names & labels clear and readable  
  \- Field-level sanitization \+ validation

\- \*\*Submissions\*\*  
  \- Users cannot edit after submit  
  \- Admins can edit / delete  
  \- File uploads  
  \- All files downloadable

\- \*\*Notifications\*\*  
  \- email or SMS  
  \- preference set at sign-up

\- \*\*PDF Exports\*\*  
  \- with company logo  
  \- mimic paper forms

\- \*\*Security\*\*  
  \- role-based claims in Firebase  
  \- CSRF protection  
  \- JWT / secure cookies  
  \- input sanitization  
  \- authorization for admins as in server.js logic

\---

\#\# Server Structure  
\- /controllers  
  \- authController  
  \- claimsController  
  \- cddController  
  \- kycController  
  \- fileUploadController  
\- /routes  
  \- authRoutes  
  \- claimsRoutes  
  \- cddRoutes  
  \- kycRoutes  
  \- uploadRoutes  
\- /services  
  \- emailService  
  \- pdfService  
  \- notificationService  
\- /models  
  \- user  
  \- submission  
  \- claim  
\- tests for core logic  
\- reusable utilities (e.g., phone validation, role checking)

\---

\#\# CI/CD & Exports  
\- Export entire project to GitHub  
\- Maintain clear, logical folder structure  
\- Add CI-friendly environment configuration

\---

\#\# Priorities  
✅ Clean, scalable    
✅ Modular    
✅ Well-commented    
✅ Ready for rapid testing    
✅ Minimal bugs    
✅ Professional UX

\---

\# End of specs.md

