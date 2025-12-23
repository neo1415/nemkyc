# NEM Insurance Forms Application - Comprehensive Documentation

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Database Design](#database-design)
6. [Application Features](#application-features)
7. [Security Implementation](#security-implementation)
8. [API Endpoints](#api-endpoints)
9. [Frontend Architecture](#frontend-architecture)
10. [Deployment Guide](#deployment-guide)

---

## Executive Summary

**NEM Insurance Forms Application** is a comprehensive, production-grade web application designed for NEM Insurance to digitize and streamline their insurance form submission, processing, and management workflows. The application handles three main categories of forms:

- **KYC (Know Your Customer)** - Individual and Corporate identity verification
- **CDD (Customer Due Diligence)** - Agents, Brokers, Partners, Individual, and Corporate due diligence
- **Claims** - 14 different types of insurance claims processing

### Key Highlights
- **Multi-role system** with 5 distinct user roles
- **SIEM-grade event logging** for compliance and security monitoring
- **Real-time form processing** with status tracking
- **Secure authentication** with session-based cookies
- **Comprehensive audit trail** for all user actions
- **Email notifications** for form submissions and status updates
- **PDF generation** for form submissions
- **File upload** with Firebase Storage integration

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│  Express.js Server (Node.js) - Port 3001                    │
│  - CORS Protection                                           │
│  - CSRF Protection                                           │
│  - Rate Limiting                                             │
│  - Input Validation                                          │
│  - Authentication Middleware                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   Firebase   │ │ Firebase │ │  Firebase  │
│     Auth     │ │ Firestore│ │  Storage   │
│              │ │          │ │            │
│ User Auth    │ │ NoSQL DB │ │ File Store │
└──────────────┘ └──────────┘ └────────────┘
```


### Component Architecture

```
Frontend (React)
├── Pages
│   ├── Auth (SignIn, SignUp, ResetPassword)
│   ├── Dashboard (User, Admin)
│   ├── Forms
│   │   ├── KYC (Individual, Corporate)
│   │   ├── CDD (Agents, Brokers, Partners, Individual, Corporate)
│   │   └── Claims (14 types)
│   └── Admin
│       ├── Tables (Users, Forms, Claims)
│       ├── Viewers (Form details)
│       └── Events Log
├── Components
│   ├── Auth (ProtectedRoute, RoleProtectedRoute, MFA)
│   ├── Common (Forms, Modals, Loaders)
│   ├── Layout (Header, Footer, Sidebar)
│   └── UI (shadcn/ui components)
├── Services
│   ├── authService (Authentication)
│   ├── formsService (Form CRUD)
│   ├── emailService (Notifications)
│   └── pdfService (PDF generation)
└── Contexts
    └── AuthContext (Global auth state)

Backend (Express.js)
├── Authentication & Authorization
│   ├── Session-based auth (httpOnly cookies)
│   ├── Role-based access control (RBAC)
│   └── Token exchange with Firebase
├── API Routes
│   ├── /api/exchange-token (Login)
│   ├── /api/register (User registration)
│   ├── /api/forms/* (Form operations)
│   ├── /api/users/* (User management)
│   ├── /api/events-logs (Audit logs)
│   └── /api/update-claim-status (Claims processing)
├── Middleware
│   ├── requireAuth (Authentication check)
│   ├── requireRole (Authorization check)
│   ├── CSRF protection
│   ├── Input validation
│   └── Request logging
└── Services
    ├── Email (Nodemailer)
    ├── File Storage (Firebase Storage)
    └── Event Logging (SIEM-grade)
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.1 | Build tool & dev server |
| TailwindCSS | 3.4.11 | Styling |
| shadcn/ui | Latest | UI component library |
| React Router | 6.26.2 | Client-side routing |
| React Hook Form | 7.59.0 | Form management |
| Zod | 3.23.8 | Schema validation |
| Recharts | 2.15.4 | Data visualization |
| jsPDF | 3.0.1 | PDF generation |
| Axios | 1.10.0 | HTTP client |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | Latest LTS | Runtime environment |
| Express.js | Latest | Web framework |
| Firebase Admin SDK | 11.10.0 | Backend Firebase integration |
| Nodemailer | Latest | Email service |
| Helmet | Latest | Security headers |
| CORS | Latest | Cross-origin resource sharing |
| CSRF | Latest | CSRF protection |
| Express Validator | Latest | Input validation |
| Multer | Latest | File upload handling |
| Bcrypt | Latest | Password hashing |

### Database & Storage
| Service | Purpose |
|---------|---------|
| Firebase Authentication | User authentication |
| Cloud Firestore | NoSQL database |
| Firebase Storage | File storage |

### Security & Monitoring
| Tool | Purpose |
|------|---------|
| Helmet | HTTP security headers |
| CORS | Origin whitelisting |
| CSRF Tokens | Cross-site request forgery protection |
| Rate Limiting | DDoS protection |
| XSS Clean | XSS attack prevention |
| HPP | HTTP parameter pollution prevention |
| Morgan | HTTP request logging |

---

## User Roles & Permissions

The application implements a sophisticated role-based access control (RBAC) system with 5 distinct roles:

### 1. **Default (Regular User)**
**Role Code:** `default`, `user`, `regular`

**Permissions:**
- Submit KYC forms (Individual, Corporate)
- Submit CDD forms (Individual, Corporate, Agents, Brokers, Partners)
- Submit Claims (all 14 types)
- View own submissions
- Update own profile
- Change password

**Dashboard Access:** User Dashboard
- View profile information
- Change password
- View submission history (own forms only)

**Restrictions:**
- Cannot view other users' submissions
- Cannot approve/reject forms
- Cannot access admin panel
- Cannot manage users

---

### 2. **Claims Officer**
**Role Code:** `claims`

**Permissions:**
- All Default user permissions, plus:
- View all claims submissions
- Approve/reject claims
- Add comments to claims
- Update claim status
- Download claim attachments
- View claims analytics

**Dashboard Access:** Admin Dashboard (Claims-focused)
- Claims statistics
- Pending claims count
- Approved claims count
- Claims distribution charts
- Recent claims submissions

**Admin Panel Access:**
- All Claims tables (14 types)
- Claim detail viewers
- Claim status management
- Events log (claims-related)

**Restrictions:**
- Cannot view KYC/CDD forms
- Cannot manage users
- Cannot change user roles
- Limited to claims-related operations

---

### 3. **Compliance Officer**
**Role Code:** `compliance`

**Permissions:**
- All Default user permissions, plus:
- View all KYC submissions
- View all CDD submissions
- Approve/reject KYC/CDD forms
- Add comments to forms
- Update form status
- Download form attachments
- View compliance analytics

**Dashboard Access:** Admin Dashboard (Compliance-focused)
- KYC/CDD statistics
- Form distribution charts
- Recent KYC/CDD submissions
- Compliance metrics

**Admin Panel Access:**
- All KYC tables (Individual, Corporate)
- All CDD tables (Agents, Brokers, Partners, Individual, Corporate)
- Form detail viewers
- Form status management
- Events log (KYC/CDD-related)

**Restrictions:**
- Cannot view claims
- Cannot manage users
- Cannot change user roles
- Limited to KYC/CDD operations

---

### 4. **Admin**
**Role Code:** `admin`

**Permissions:**
- All Claims Officer permissions
- All Compliance Officer permissions
- View all forms (KYC, CDD, Claims)
- Approve/reject any form
- View all analytics
- Access full events log
- View system statistics

**Dashboard Access:** Admin Dashboard (Full Access)
- Total submissions
- KYC forms count
- CDD forms count
- Claims forms count
- Pending/approved claims
- Form distribution charts
- Monthly submission trends
- Recent submissions (all types)

**Admin Panel Access:**
- All form tables (KYC, CDD, Claims)
- All form viewers
- Status management for all forms
- Full events log access
- Analytics and reports

**Restrictions:**
- Cannot manage users (create/delete/change roles)
- Cannot access user management panel
- Cannot delete users

---

### 5. **Super Admin**
**Role Code:** `super admin`, `superadmin`, `super-admin`, `super_admin`

**Permissions:**
- All Admin permissions, plus:
- Create new users
- Delete users
- Change user roles
- View all users
- Access user management panel
- Full system access
- Override any restriction

**Dashboard Access:** Admin Dashboard (Full Access + User Management)
- All admin dashboard features
- Total users count
- User management statistics
- System-wide analytics

**Admin Panel Access:**
- All admin panel features
- User management table
- Role assignment interface
- User creation/deletion
- Full events log with all details

**Special Features:**
- Auto-assigned to `neowalker502@gmail.com`
- Cannot be deleted by other admins
- Can perform any action in the system
- Full audit trail access

---

### Role Normalization

The system implements intelligent role normalization to handle various role name formats:

```javascript
// All these map to "super admin"
superadmin → super admin
super-admin → super admin
super_admin → super admin
super admin → super admin

// All these map to "default"
user → default
regular → default
default → default
```

### Role Hierarchy

```
Super Admin (Highest Authority)
    ↓
  Admin (Full operational access)
    ↓
Compliance Officer ← → Claims Officer (Specialized access)
    ↓
Default User (Basic access)
```


---

## Database Design

### Firestore Collections Structure

#### 1. **userroles** Collection
Stores user profile and role information.

```javascript
{
  // Document ID: Firebase Auth UID
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "default", // default, claims, compliance, admin, super admin
  "phone": "+2348012345678",
  "notificationPreference": "email", // email or sms
  "dateCreated": Timestamp,
  "dateModified": Timestamp,
  "loginCount": 5
}
```

**Indexes:**
- `role` (for role-based queries)
- `email` (for user lookup)

**Security Rules