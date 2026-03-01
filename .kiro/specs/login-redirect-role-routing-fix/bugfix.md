# Bugfix Requirements Document

## Introduction

After successful authentication, all users regardless of their role are being redirected to `/dashboard` instead of being routed to their role-appropriate destination. This affects brokers who should go to `/admin/identity` with an upload dialog, admin/super admin/compliance/claims users who should go to `/admin`, and only regular users should go to `/dashboard`. The bug appears to be caused by duplicate useEffect hooks in `src/pages/auth/SignIn.tsx` (lines 88-129 and 133-171) that both contain identical flawed redirect logic where role matching conditions fail, causing all users to fall through to the default `else` clause that redirects to `/dashboard`.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user with role 'broker' successfully authenticates THEN the system redirects them to `/dashboard` instead of `/admin/identity` with upload dialog

1.2 WHEN a user with role 'admin', 'super admin', 'compliance', or 'claims' successfully authenticates THEN the system redirects them to `/dashboard` instead of `/admin`

1.3 WHEN the role matching logic in the useEffect hooks evaluates user roles THEN the conditions `rolesMatch(user.role, 'admin')`, `rolesMatch(user.role, 'super admin')`, `rolesMatch(user.role, 'compliance')`, and `rolesMatch(user.role, 'claims')` all fail to match even when the user has those roles

1.4 WHEN all role matching conditions fail in the redirect logic THEN all users fall through to the final `else` clause and are redirected to `/dashboard`

1.5 WHEN there are two duplicate useEffect hooks (lines 88-129 and 133-171) with identical redirect logic THEN both hooks execute the same flawed logic, compounding the issue

### Expected Behavior (Correct)

2.1 WHEN a user with role 'broker' successfully authenticates THEN the system SHALL redirect them to `/admin/identity` with state `{ openUploadDialog: true }`

2.2 WHEN a user with role 'admin', 'super admin', 'compliance', or 'claims' successfully authenticates THEN the system SHALL redirect them to `/admin`

2.3 WHEN a user with role 'default' or any non-admin role successfully authenticates THEN the system SHALL redirect them to `/dashboard`

2.4 WHEN the role matching logic evaluates user roles THEN it SHALL correctly identify broker, admin, super admin, compliance, and claims roles using the `rolesMatch()` and `isAdminRole()` utility functions

2.5 WHEN there are duplicate useEffect hooks handling the same redirect logic THEN the system SHALL consolidate them into a single useEffect hook to prevent redundant execution and logic conflicts

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user has a pending submission in sessionStorage THEN the system SHALL CONTINUE TO redirect them to the appropriate form page as the highest priority redirect

3.2 WHEN a redirect parameter is present in the URL (e.g., `?redirect=dashboard`) THEN the system SHALL CONTINUE TO honor that redirect parameter

3.3 WHEN a user is not authenticated or MFA/email verification is required THEN the system SHALL CONTINUE TO prevent redirect and show the appropriate authentication flow

3.4 WHEN the `normalizeRole()` function processes role strings THEN it SHALL CONTINUE TO normalize role variations (case, spacing, alternative names) to standard format

3.5 WHEN the `isAdminRole()` function checks if a role is an admin role THEN it SHALL CONTINUE TO correctly identify 'super admin', 'admin', 'compliance', and 'claims' as admin roles

3.6 WHEN the `rolesMatch()` function compares two roles THEN it SHALL CONTINUE TO perform case-insensitive comparison with normalization
