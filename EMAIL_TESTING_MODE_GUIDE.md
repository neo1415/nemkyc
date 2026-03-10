# Email Testing Mode Guide

## Overview

This guide explains how to temporarily limit email notifications to super admins only during testing, preventing emails from being sent to compliance and admin users.

## Quick Start

### Enable Testing Mode (Super Admin Only)

1. Open your `.env.local` file (or `.env.production` for production)
2. Add or update this line:
   ```
   EMAIL_RECIPIENTS_MODE=super-admin
   ```
3. Restart your server
4. All form submission emails will now only go to super admin users

### Revert to Normal Mode (All Recipients)

1. Open your `.env.local` file (or `.env.production` for production)
2. Change the line to:
   ```
   EMAIL_RECIPIENTS_MODE=all
   ```
   Or simply remove the line (defaults to 'all')
3. Restart your server
4. Emails will be sent to all recipients (admin, compliance, super admin)

## How It Works

The system checks the `EMAIL_RECIPIENTS_MODE` environment variable:

- **`super-admin`** (Testing Mode): Only super admin users receive emails
- **`all`** (Normal Mode): All users (admin, compliance, super admin) receive emails
- **Not set**: Defaults to `all` (normal mode)

## Affected Functions

This setting controls email recipients for:

1. **Form Submissions** - When users submit forms (Motor Claims, KYC, NFIU, etc.)
2. **Admin Notifications** - When admins need to be notified about new submissions
3. **Role-based Emails** - Any email sent via `getAllAdminEmails()` or `getEmailsByRoles()`

## Console Logging

When the server starts or sends emails, you'll see console logs indicating the current mode:

```
📧 EMAIL MODE: super-admin only (testing mode)
📧 Found 1 recipient(s): ['superadmin@example.com']
```

or

```
📧 EMAIL MODE: all recipients (normal mode)
📧 Found 5 recipient(s): ['admin1@example.com', 'admin2@example.com', ...]
```

## Important Notes

1. **Server Restart Required**: You must restart the server after changing the environment variable
2. **User Emails Unaffected**: Confirmation emails to form submitters are NOT affected by this setting
3. **Easy Reverting**: Simply change the environment variable back to `all` or remove it to restore normal behavior
4. **No Code Changes**: This is purely configuration-based, no code modifications needed

## Example Workflow

### Testing a New Feature

```bash
# 1. Enable testing mode
echo "EMAIL_RECIPIENTS_MODE=super-admin" >> .env.local

# 2. Restart server
npm run server  # or your server start command

# 3. Test your feature (only super admins get emails)

# 4. When done testing, revert to normal
# Edit .env.local and change to:
# EMAIL_RECIPIENTS_MODE=all

# 5. Restart server again
npm run server
```

## Troubleshooting

### Emails Still Going to Everyone

- Check that you've set `EMAIL_RECIPIENTS_MODE=super-admin` in the correct `.env` file
- Ensure you've restarted the server after making the change
- Check the console logs to confirm the mode is active

### No Emails Being Sent

- Verify that you have at least one user with the super admin role in your database
- Check the console logs for any email sending errors
- Ensure your email configuration (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) is correct

### Super Admin Role Variants

The system recognizes these super admin role values:
- `super admin` (with space)
- `super-admin` (with hyphen)
- `superadmin` (no space)

Make sure your super admin users have one of these role values in the `userroles` collection.

## Security Note

This feature is designed for testing purposes only. In production, you should typically use `EMAIL_RECIPIENTS_MODE=all` to ensure all relevant staff receive notifications.
