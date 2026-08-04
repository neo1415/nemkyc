# Production Rollback Plan

## Overview

This document outlines the procedures for rolling back the Identity Collection System to a previous stable state in case of critical issues during or after production deployment.

## Rollback Triggers

Initiate rollback immediately if any of the following occur:

### Critical Issues
- **Data Corruption**: Identity data is being corrupted or lost
- **Security Breach**: Unauthorized access or data exposure detected
- **System Unavailable**: Application is down for > 15 minutes
- **High Error Rate**: Error rate exceeds 25% for > 15 minutes
- **API Failure**: Datapro API consistently fails (> 50% failure rate)
- **Encryption Failure**: Encryption/decryption errors affecting data integrity

### Major Issues
- **Performance Degradation**: Response times > 10 seconds consistently
- **Data Inconsistency**: Verification results not matching expected behavior
- **Critical Functionality Broken**: Core features (upload, verify, export) not working
- **Compliance Violation**: NDPR or regulatory requirements not being met

## Rollback Decision Authority

**Authorized to initiate rollback:**
- Technical Lead
- Security Officer
- Operations Manager
- On-call Engineer (for critical issues only)

**Notification required:**
- Product Owner
- Stakeholders
- Support Team

## Rollback Procedures

### Option 1: Switch to Mock Mode (Fastest - 5 minutes)

This is the quickest rollback option that disables Datapro API integration while keeping the application running.

#### Steps:

1. **Update Verification Config**
   ```bash
   # SSH into production server
   ssh production-server
   
   # Navigate to application directory
   cd /path/to/application
   ```

2. **Edit Configuration File**
   ```bash
   # Edit the verification config
   nano src/config/verificationConfig.ts
   ```
   
   Change:
   ```typescript
   mode: 'datapro'  // Production mode
   ```
   
   To:
   ```typescript
   mode: 'mock'  // Mock mode for testing
   ```

3. **Rebuild Application**
   ```bash
   npm run build
   ```

4. **Restart Server**
   ```bash
   # Using PM2
   pm2 restart identity-app
   
   # Or using systemd
   sudo systemctl restart identity-app
   
   # Or manual restart
   npm run server
   ```

5. **Verify Rollback**
   - Check application loads: `https://your-domain.com`
   - Check logs: `pm2 logs identity-app` or `journalctl -u identity-app -f`
   - Test verification flow (should use mock responses)
   - Confirm no Datapro API calls in logs

6. **Notify Stakeholders**
   - Send notification that system is in mock mode
   - Explain that verifications will not be real until issue is resolved
   - Provide estimated time to resolution

#### Pros:
- Very fast (5 minutes)
- Application remains available
- No data loss
- Easy to reverse

#### Cons:
- Verifications will not be real
- Users may be confused by mock responses
- Not suitable for long-term operation

---

### Option 2: Restore from Backup (Moderate - 30 minutes)

This option restores the database to a previous state before the deployment.

#### Prerequisites:
- Recent database backup (< 24 hours old)
- Backup location and credentials accessible
- Previous application version available

#### Steps:

1. **Stop Application**
   ```bash
   # SSH into production server
   ssh production-server
   
   # Stop the application
   pm2 stop identity-app
   # Or
   sudo systemctl stop identity-app
   ```

2. **Backup Current State (Safety)**
   ```bash
   # Create a backup of current state before rollback
   firebase firestore:export gs://your-backup-bucket/rollback-backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Restore Database from Backup**
   ```bash
   # Restore Firestore collections from backup
   firebase firestore:import gs://your-backup-bucket/backup-YYYYMMDD-HHMMSS
   ```
   
   Or manually restore specific collections:
   ```bash
   # Restore identity-lists
   firebase firestore:import gs://your-backup-bucket/backup-YYYYMMDD-HHMMSS/identity-lists
   
   # Restore identity-entries
   firebase firestore:import gs://your-backup-bucket/backup-YYYYMMDD-HHMMSS/identity-entries
   
   # Restore identity-logs
   firebase firestore:import gs://your-backup-bucket/backup-YYYYMMDD-HHMMSS/identity-logs
   
   # Restore users (if needed)
   firebase firestore:import gs://your-backup-bucket/backup-YYYYMMDD-HHMMSS/users
   ```

4. **Revert Application Code**
   ```bash
   # Navigate to application directory
   cd /path/to/application
   
   # Checkout previous stable version
   git fetch --all
   git checkout <previous-stable-tag>
   
   # Or restore from backup
   cp -r /path/to/backup/application/* .
   ```

5. **Reinstall Dependencies**
   ```bash
   npm ci
   ```

6. **Rebuild Application**
   ```bash
   npm run build
   ```

7. **Restart Application**
   ```bash
   pm2 restart identity-app
   # Or
   sudo systemctl restart identity-app
   ```

8. **Verify Rollback**
   - Check application loads
   - Check logs for errors
   - Test core functionality (login, upload, verify)
   - Verify data integrity
   - Check that previous stable features work

9. **Notify Stakeholders**
   - Send notification that system has been rolled back
   - Explain what data may have been lost (if any)
   - Provide timeline for re-deployment

#### Pros:
- Complete restoration to known good state
- All data and code reverted
- Suitable for major issues

#### Cons:
- Takes longer (30 minutes)
- May lose data created after backup
- Requires database restore permissions

---

### Option 3: Revert Code Only (Fast - 10 minutes)

This option reverts the application code while keeping the database intact.

#### Steps:

1. **Stop Application**
   ```bash
   ssh production-server
   pm2 stop identity-app
   ```

2. **Revert Code**
   ```bash
   cd /path/to/application
   
   # Revert to previous version
   git fetch --all
   git checkout <previous-stable-tag>
   
   # Or use git revert
   git revert <commit-hash>
   ```

3. **Reinstall Dependencies**
   ```bash
   npm ci
   ```

4. **Rebuild Application**
   ```bash
   npm run build
   ```

5. **Restart Application**
   ```bash
   pm2 restart identity-app
   ```

6. **Verify Rollback**
   - Check application loads
   - Test core functionality
   - Check logs for errors

#### Pros:
- Fast (10 minutes)
- Keeps database data
- Simple procedure

#### Cons:
- May have database schema mismatches
- Not suitable if database changes were made

---

## Post-Rollback Procedures

### Immediate Actions (Within 1 hour)

1. **Verify System Stability**
   - [ ] Application is accessible
   - [ ] No errors in logs
   - [ ] Core functionality works
   - [ ] Users can login and access features

2. **Notify Users**
   - [ ] Send notification to all active users
   - [ ] Explain what happened (high-level)
   - [ ] Provide timeline for resolution
   - [ ] Offer support contact information

3. **Document Incident**
   - [ ] Record what went wrong
   - [ ] Document rollback procedure used
   - [ ] Note any data loss or issues
   - [ ] Capture relevant logs and errors

### Short-Term Actions (Within 24 hours)

1. **Root Cause Analysis**
   - [ ] Identify what caused the issue
   - [ ] Review logs and error messages
   - [ ] Analyze code changes
   - [ ] Identify contributing factors

2. **Fix Development**
   - [ ] Develop fix for the issue
   - [ ] Test fix in development environment
   - [ ] Test fix in staging environment
   - [ ] Prepare for re-deployment

3. **Communication**
   - [ ] Update stakeholders on progress
   - [ ] Provide estimated time for re-deployment
   - [ ] Document lessons learned

### Long-Term Actions (Within 1 week)

1. **Process Improvement**
   - [ ] Update deployment checklist
   - [ ] Improve testing procedures
   - [ ] Add monitoring/alerts to prevent recurrence
   - [ ] Update documentation

2. **Re-Deployment Planning**
   - [ ] Schedule new deployment window
   - [ ] Prepare enhanced testing plan
   - [ ] Communicate new deployment date
   - [ ] Ensure all stakeholders are informed

## Testing Rollback Procedure

**It is critical to test the rollback procedure before production deployment.**

### Test Rollback in Staging

1. **Setup Staging Environment**
   - Deploy current production version to staging
   - Create test data in staging database
   - Verify staging works correctly

2. **Deploy New Version to Staging**
   - Deploy new version with Datapro integration
   - Verify new version works in staging

3. **Execute Rollback Test**
   - Follow Option 1 (Mock Mode) procedure
   - Verify application switches to mock mode
   - Test that application still works
   - Switch back to Datapro mode
   - Verify application works again

4. **Execute Backup Restore Test**
   - Create backup of staging database
   - Make changes to staging database
   - Follow Option 2 (Restore from Backup) procedure
   - Verify database is restored correctly
   - Verify no data corruption

5. **Document Results**
   - Record time taken for each rollback option
   - Note any issues encountered
   - Update rollback procedures if needed

## Emergency Contacts

### Technical Team
- **Technical Lead**: [Name] - [Phone] - [Email]
- **Senior Developer**: [Name] - [Phone] - [Email]
- **DevOps Engineer**: [Name] - [Phone] - [Email]

### Management
- **Product Owner**: [Name] - [Phone] - [Email]
- **Operations Manager**: [Name] - [Phone] - [Email]

### External
- **Datapro Support**: [Phone] - [Email]
- **Firebase Support**: [Support Portal URL]
- **Hosting Provider**: [Phone] - [Email]

## Rollback Checklist

Use this checklist during rollback execution:

- [ ] Rollback trigger identified and documented
- [ ] Rollback authority notified and approved
- [ ] Rollback option selected (1, 2, or 3)
- [ ] Current state backed up (safety)
- [ ] Rollback procedure executed
- [ ] System stability verified
- [ ] Users notified
- [ ] Incident documented
- [ ] Root cause analysis initiated
- [ ] Stakeholders updated

## Appendix: Common Issues and Solutions

### Issue: Application won't start after rollback
**Solution**: Check environment variables, ensure all dependencies installed, review logs for specific errors

### Issue: Database restore fails
**Solution**: Verify backup file integrity, check Firebase permissions, try restoring individual collections

### Issue: Users still seeing errors after rollback
**Solution**: Clear browser cache, check CDN cache, verify DNS propagation

### Issue: Data inconsistency after rollback
**Solution**: Run data integrity checks, compare with backup, manually fix inconsistencies if needed

---

**Last Updated**: [Date]

**Tested On**: [Date]

**Next Test Date**: [Date]
