# Deployment Notifications & Monitoring Setup Guide

## Overview

The Twinship app uses a comprehensive deployment notification and monitoring system to track deployments across all environments and notify the team of important events.

## Features

### 🔔 Multi-Channel Notifications
- **Discord**: Real-time deployment updates
- **Slack**: Team collaboration notifications
- **Email**: Critical failure alerts
- **Sentry**: Error tracking and release management

### 📊 Deployment Metrics
- Deployment success/failure rates
- Average deployment duration
- Daily/weekly/monthly statistics
- Performance trend analysis

### 🎯 Automated Tracking
- Automatic deployment detection
- Release version tracking
- Source map uploads to Sentry
- Metrics collection and storage

## Setup Instructions

### 1. Discord Notifications

1. Create a Discord webhook:
   - Go to your Discord server settings
   - Navigate to "Integrations" → "Webhooks"
   - Click "New Webhook"
   - Copy the webhook URL

2. Add to GitHub Secrets:
   ```bash
   gh secret set DISCORD_WEBHOOK --body "your_discord_webhook_url"
   ```

### 2. Slack Notifications

1. Create a Slack webhook:
   - Go to https://api.slack.com/apps
   - Create a new app or select existing
   - Add "Incoming Webhooks" feature
   - Create webhook for your channel
   - Copy the webhook URL

2. Add to GitHub Secrets:
   ```bash
   gh secret set SLACK_WEBHOOK --body "your_slack_webhook_url"
   ```

### 3. Email Notifications

1. Configure email settings:
   - Use Gmail App Password (recommended)
   - Or configure SMTP settings

2. Add to GitHub Secrets:
   ```bash
   gh secret set TEAM_EMAIL --body "team@example.com"
   gh secret set EMAIL_PASSWORD --body "your_app_password"
   ```

### 4. Sentry Integration

1. Create Sentry project:
   - Sign up at https://sentry.io
   - Create new project for React Native
   - Note your org slug and project slug

2. Get Auth Token:
   - Go to Settings → Auth Tokens
   - Create token with `project:releases` scope

3. Add to GitHub Secrets:
   ```bash
   gh secret set SENTRY_ORG --body "your_org_slug"
   gh secret set SENTRY_PROJECT --body "your_project_slug"
   gh secret set SENTRY_AUTH_TOKEN --body "your_auth_token"
   gh secret set SENTRY_DSN --body "your_dsn_url"
   ```

## Testing Notifications

### Manual Test
Run the test workflow to verify all notification channels:

```bash
gh workflow run deployment-monitor.yml -f test_notifications=true
```

### What Gets Tested
- Discord webhook connectivity
- Slack webhook connectivity
- Email delivery (only on failures)
- Sentry release creation

## Notification Types

### 1. Deployment Started
Sent when a deployment begins:
- Environment name
- Branch/commit info
- Triggered by user
- Estimated duration

### 2. Deployment Success
Sent when deployment completes successfully:
- Total duration
- Version deployed
- Environment URL
- Release notes link

### 3. Deployment Failure
Sent when deployment fails:
- Error details
- Failed step
- Logs link
- Rollback instructions

### 4. Daily Summary
Sent at midnight UTC:
- Total deployments
- Success rate
- Average duration
- Top issues

## Customizing Notifications

### Modify Message Format
Edit `.github/actions/notify/action.yml`:

```yaml
message: |
  Your custom message here
  **Variable:** ${{ inputs.variable }}
```

### Add New Channels
1. Add new input in `action.yml`
2. Create notification step
3. Update workflows to pass webhook

### Change Notification Triggers
Edit `.github/workflows/deployment-monitor.yml`:

```yaml
on:
  workflow_run:
    workflows: ["Your Workflow"]
    types: [completed, failed]
```

## Metrics Dashboard

### Accessing the Dashboard
The deployment dashboard is available at:
- Local: Open `.github/deployment-dashboard.html` in browser
- GitHub Pages: Configure in repo settings

### Dashboard Features
- Real-time deployment status
- Performance metrics
- Error tracking
- Notification channel status
- Historical trends

### Updating Dashboard Data
The dashboard auto-refreshes every 30 seconds and pulls data from:
- GitHub Actions API
- Stored metrics files
- Sentry API

## Troubleshooting

### Discord Notifications Not Working
1. Verify webhook URL is correct
2. Check webhook hasn't been deleted
3. Ensure proper JSON formatting
4. Check GitHub Actions logs

### Slack Notifications Not Working
1. Verify webhook is active
2. Check channel permissions
3. Ensure app is installed in workspace
4. Review Slack audit logs

### Email Notifications Not Sending
1. Verify SMTP settings
2. Check spam folder
3. Ensure app password is valid
4. Review email provider limits

### Sentry Releases Not Created
1. Verify auth token permissions
2. Check org/project slugs
3. Ensure source maps exist
4. Review Sentry CLI output

## Best Practices

### 1. Notification Fatigue
- Only notify on important events
- Use different channels for different severity
- Batch similar notifications
- Provide summary reports

### 2. Security
- Never commit webhook URLs
- Rotate tokens regularly
- Use GitHub Secrets
- Limit webhook permissions

### 3. Monitoring
- Review metrics weekly
- Track notification delivery
- Monitor false positives
- Adjust thresholds as needed

### 4. Documentation
- Document custom configurations
- Keep webhook URLs backed up
- Document escalation procedures
- Maintain runbooks

## Environment Variables

Required GitHub Secrets:
```env
# Notification Webhooks
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
SLACK_WEBHOOK=https://hooks.slack.com/services/...
TEAM_EMAIL=team@example.com
EMAIL_PASSWORD=your_app_password

# Sentry Configuration
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_token
SENTRY_DSN=https://...@sentry.io/...

# Expo (for deployments)
EXPO_TOKEN=your_expo_token
```

## Maintenance

### Weekly Tasks
- Review deployment metrics
- Check notification delivery rates
- Update notification templates
- Clear old metric files

### Monthly Tasks
- Rotate webhook URLs
- Update team email list
- Review and adjust thresholds
- Generate monthly report

### Quarterly Tasks
- Full system audit
- Update documentation
- Review notification strategy
- Plan improvements

## Support

For issues or questions:
- Check GitHub Actions logs
- Review this documentation
- Contact DevOps team
- Open issue in repository

---

Last Updated: December 2024
Version: 1.0.0