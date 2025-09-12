# 🔄 Rollback and Recovery Procedures

## Table of Contents
1. [Overview](#overview)
2. [Rollback Types](#rollback-types)
3. [Automated Rollback](#automated-rollback)
4. [Manual Rollback](#manual-rollback)
5. [Database Rollback](#database-rollback)
6. [Canary Deployments](#canary-deployments)
7. [Emergency Procedures](#emergency-procedures)
8. [Monitoring and Alerts](#monitoring-and-alerts)
9. [Post-Rollback Actions](#post-rollback-actions)
10. [Troubleshooting](#troubleshooting)

## Overview

This document outlines the comprehensive rollback and recovery procedures for the Twinship application. These procedures ensure minimal downtime and data integrity during deployment issues.

### Key Components
- **Automated rollback triggers** - Automatic detection and rollback on failure
- **Manual rollback workflows** - Controlled rollback when needed
- **Database migration rollback** - Safe database schema reversal
- **Canary deployments** - Gradual rollout with automatic promotion/rollback
- **Backup and restore** - Complete system recovery procedures

## Rollback Types

### 1. Application-Only Rollback
Rolls back application code without touching the database.
```bash
# Via GitHub Actions UI
Navigate to Actions → Rollback Production Deployment → Run workflow
Select: rollback_type = "app-only"
```

### 2. Database-Only Rollback
Rolls back database changes while keeping application code.
```bash
# Via command line
./scripts/rollback/database-rollback.sh --version v1.2.3
```

### 3. Full Rollback
Complete rollback of both application and database.
```bash
# Via GitHub Actions UI
Navigate to Actions → Rollback Production Deployment → Run workflow
Select: rollback_type = "full-rollback"
```

### 4. Canary Rollback
Rolls back a canary deployment without affecting stable traffic.
```bash
# Automatic based on health checks
# Or manual via GitHub Actions UI
```

## Automated Rollback

### Trigger Conditions
Automated rollback is triggered when:
- Error rate exceeds 5% (configurable)
- Response time exceeds 3000ms
- Availability drops below 99%
- Critical errors are detected
- Database connection failures

### Monitoring Duration
- Initial health check: 30 seconds after deployment
- Continuous monitoring: 5 minutes (configurable)
- Canary monitoring: 10-120 minutes based on configuration

### Configuration
Edit `.github/workflows/auto-rollback.yml`:
```yaml
env:
  ERROR_THRESHOLD: 5  # Error rate percentage
  RESPONSE_TIME_THRESHOLD: 3000  # milliseconds
  AVAILABILITY_THRESHOLD: 99  # percentage
  MONITORING_DURATION: 300  # seconds
```

## Manual Rollback

### Via GitHub Actions UI

1. Navigate to the repository's Actions tab
2. Select "🔄 Rollback Production Deployment"
3. Click "Run workflow"
4. Fill in parameters:
   - **Target version**: Leave empty for previous version or specify
   - **Rollback type**: Choose appropriate type
   - **Reason**: Provide clear reason for rollback
   - **Emergency**: Check for immediate rollback without confirmations

### Via GitHub CLI
```bash
gh workflow run rollback.yml \
  -f target_version=v1.2.3 \
  -f rollback_type=full-rollback \
  -f reason="Performance degradation detected" \
  -f emergency=false
```

### Via API
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/rollback.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "target_version": "v1.2.3",
      "rollback_type": "app-only",
      "reason": "Customer reported critical bug",
      "emergency": "false"
    }
  }'
```

## Database Rollback

### Prerequisites
- Database backup exists
- Rollback migrations are available
- Database credentials are configured

### Rollback Procedure

1. **Create backup** (automatic)
```bash
./scripts/rollback/backup-procedures.sh backup
```

2. **Execute rollback**
```bash
./scripts/rollback/database-rollback.sh \
  --version v1.2.3 \
  --dry-run  # Remove for actual execution
```

3. **Verify rollback**
```sql
-- Check schema version
SELECT version, applied_at FROM schema_version 
ORDER BY applied_at DESC LIMIT 1;

-- Verify data integrity
SELECT COUNT(*) FROM critical_tables;
```

### Emergency Database Restore
```bash
# For critical failures, restore from backup
./scripts/rollback/database-rollback.sh \
  --version v1.2.3 \
  --emergency
```

## Canary Deployments

### Deployment Strategy
1. Deploy to canary environment (5-50% traffic)
2. Monitor for configured duration (10-120 minutes)
3. Automatically promote if healthy
4. Automatically rollback if unhealthy

### Manual Canary Deployment
```bash
gh workflow run canary-deploy.yml \
  -f version=v1.3.0 \
  -f canary_percentage=10 \
  -f monitoring_duration=30 \
  -f auto_promote=true
```

### Canary Health Metrics
- Error rate comparison with stable
- Latency comparison (< 1.5x stable)
- Success rate threshold (> 98%)
- Custom business metrics

### Progressive Rollout
```yaml
Traffic progression:
10% → Monitor 10min → 25% → Monitor 10min → 50% → Monitor 10min → 100%
```

## Emergency Procedures

### Immediate Actions
1. **Assess impact**
   - Check error rates in monitoring
   - Review customer reports
   - Identify affected services

2. **Initiate emergency rollback**
```bash
# Skip all confirmations and validations
gh workflow run rollback.yml \
  -f rollback_type=full-rollback \
  -f reason="EMERGENCY: Service down" \
  -f emergency=true
```

3. **Notify stakeholders**
   - Trigger incident response
   - Update status page
   - Notify on-call team

### Recovery Checklist
- [ ] Rollback initiated
- [ ] Health checks passing
- [ ] Database integrity verified
- [ ] Customer impact assessed
- [ ] Incident report created
- [ ] Root cause analysis scheduled

## Monitoring and Alerts

### Key Metrics to Monitor
```javascript
// Critical metrics (immediate rollback)
- HTTP 5xx errors > 5%
- Database connection failures
- Memory usage > 90%
- CPU usage > 95%

// Warning metrics (investigation required)
- Response time > 2000ms
- Error rate 2-5%
- Queue depth increasing
- Cache hit rate < 80%
```

### Alert Channels
1. **PagerDuty** - Critical production issues
2. **Slack** - Team notifications
3. **Email** - Stakeholder updates
4. **GitHub Issues** - Automatic incident creation

### Dashboard URLs
- Production: https://monitoring.twinship.app/dashboard
- Canary: https://monitoring.twinship.app/canary
- Rollback Status: https://github.com/OWNER/REPO/actions

## Post-Rollback Actions

### Immediate Steps
1. **Verify service health**
```bash
node tests/smoke/smoke-tests.js
```

2. **Check critical features**
```bash
npm run test:critical-features
```

3. **Monitor for 30 minutes**
   - Watch error rates
   - Check performance metrics
   - Review customer feedback

### Follow-up Actions
1. **Create incident report**
```markdown
## Incident Report - [Date]
### Summary
- Start time:
- End time:
- Impact:
- Root cause:

### Timeline
- Detection:
- Response:
- Resolution:

### Lessons Learned
- What went well:
- What could improve:

### Action Items
- [ ] Fix root cause
- [ ] Update monitoring
- [ ] Improve tests
```

2. **Schedule post-mortem**
3. **Update rollback procedures if needed**
4. **Implement additional tests**

## Troubleshooting

### Common Issues

#### Rollback Workflow Fails to Start
```bash
# Check GitHub Actions status
gh workflow list

# Check permissions
gh auth status

# Trigger manually via API
curl -X POST ...
```

#### Database Rollback Fails
```bash
# Check migration files exist
ls -la migrations/rollback/

# Verify database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Use emergency restore
./scripts/rollback/database-rollback.sh --emergency
```

#### Canary Stuck at Partial Traffic
```bash
# Force promote to 100%
gh workflow run canary-deploy.yml \
  -f action=force-promote

# Or force rollback
gh workflow run canary-deploy.yml \
  -f action=force-rollback
```

#### Smoke Tests Failing After Rollback
```bash
# Run with verbose output
DEBUG=* node tests/smoke/smoke-tests.js

# Check specific endpoints
curl -v https://api.twinship.app/health
```

## Retention Policies

### Backup Retention
- **Local backups**: 10 most recent (configurable)
- **S3 backups**: 30 days standard, 90 days glacier
- **Database snapshots**: 7 daily, 4 weekly, 12 monthly

### Artifact Retention
- **Build artifacts**: 7 days
- **Deployment logs**: 30 days
- **Monitoring data**: 90 days
- **Incident reports**: Permanent

### Configuration
Edit `scripts/rollback/backup-procedures.sh`:
```bash
RETENTION_DAYS=30
MAX_BACKUPS=10
```

## Best Practices

### Before Deployment
1. Always create a backup
2. Review rollback migrations
3. Test rollback procedure in staging
4. Ensure monitoring is configured

### During Issues
1. Don't panic - follow procedures
2. Communicate status updates
3. Document actions taken
4. Preserve evidence for analysis

### After Resolution
1. Complete incident report
2. Update documentation
3. Implement preventive measures
4. Share lessons learned

## Quick Reference

### Emergency Contacts
- On-call Engineer: Use PagerDuty
- DevOps Lead: @devops-lead
- CTO: @cto (for critical incidents only)

### Critical Commands
```bash
# Emergency rollback
gh workflow run rollback.yml -f emergency=true

# Check deployment status
gh run list --workflow=production-deploy.yml

# View recent deployments
git tag --sort=-version:refname | head -10

# Monitor logs
tail -f /var/log/twinship/production.log

# Database backup
./scripts/rollback/backup-procedures.sh backup

# Health check
curl https://api.twinship.app/health
```

## Appendix

### Environment Variables
```bash
DATABASE_URL=postgresql://...
BACKUP_S3_BUCKET=twinship-backups
MONITORING_API_KEY=...
SLACK_WEBHOOK_URL=...
PAGERDUTY_API_KEY=...
```

### Related Documentation
- [CI/CD Pipeline Documentation](./ci-cd-pipeline.md)
- [Deployment Guide](./deployment-guide.md)
- [Monitoring Setup](./monitoring-setup.md)
- [Incident Response](./incident-response.md)

---

**Last Updated**: 2024-01-20
**Version**: 1.0.0
**Owner**: DevOps Team