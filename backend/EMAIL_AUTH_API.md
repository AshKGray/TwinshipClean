# Email Verification & Password Reset API

This document describes the email verification and password reset functionality implemented for the Twinship backend API.

## Overview

The implementation includes:
- Email verification with secure tokens (6-hour expiry for resend, 24-hour for initial)
- Password reset functionality with secure tokens (1-hour expiry)
- Email service integration (SendGrid/development mode)
- Rate limiting for security
- Comprehensive error handling

## API Endpoints

### 1. Email Verification

#### `POST /api/auth/verify-email`
Verifies a user's email address using a verification token.

**Request Body:**
```json
{
  "token": "verification-token-uuid"
}
```

**Responses:**
- **200 OK**: Email verified successfully
  ```json
  {
    "success": true,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "displayName": "User Name",
      "emailVerified": true
    },
    "message": "Email verified successfully"
  }
  ```

- **400 Bad Request**: Invalid/expired token or already verified
- **422 Unprocessable Entity**: Validation errors

### 2. Resend Email Verification

#### `POST /api/auth/resend-verification`
Resends email verification to a user (rate limited: 3 requests per hour).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**
- **200 OK**: Verification email sent (or user doesn't exist - security)
  ```json
  {
    "success": true,
    "message": "Verification email sent successfully"
  }
  ```

- **400 Bad Request**: Email already verified
- **429 Too Many Requests**: Rate limit exceeded

### 3. Forgot Password

#### `POST /api/auth/forgot-password`
Initiates password reset process (rate limited: 3 requests per hour).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**
- **200 OK**: Password reset email sent (always returns success for security)
  ```json
  {
    "success": true,
    "message": "If an account exists with this email, a password reset link has been sent."
  }
  ```

- **429 Too Many Requests**: Rate limit exceeded

### 4. Reset Password

#### `POST /api/auth/reset-password`
Resets user password using a reset token (rate limited: 5 requests per 15 minutes).

**Request Body:**
```json
{
  "token": "reset-token",
  "password": "NewSecurePassword123"
}
```

**Responses:**
- **200 OK**: Password reset successful
  ```json
  {
    "success": true,
    "message": "Password reset successful",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "displayName": "User Name"
    }
  }
  ```

- **400 Bad Request**: Invalid/expired/used token
- **401 Unauthorized**: Account locked
- **422 Unprocessable Entity**: Validation errors

## Security Features

### Token Security
- **Verification tokens**: UUID v4, 6-24 hour expiry
- **Password reset tokens**: Cryptographically secure (crypto.randomBytes), 1-hour expiry
- **One-time use**: Password reset tokens are marked as used after consumption
- **Token cleanup**: All refresh tokens revoked after password reset

### Rate Limiting
- **Email endpoints**: 3 requests per hour per IP
- **Password reset**: 5 requests per 15 minutes per IP
- **Login attempts**: Existing strict rate limiting maintained

### Privacy Protection
- **Email enumeration prevention**: Consistent responses regardless of account existence
- **Secure error messages**: No revelation of sensitive information
- **IP/User-Agent tracking**: Logged for security auditing

## Email Templates

### Verification Email
- **Subject**: "Welcome to Twinship - Verify Your Email"
- **Content**: Welcome message, verification link, expiration notice
- **Design**: Branded HTML template with fallback text

### Password Reset Email
- **Subject**: "Reset Your Twinship Password"
- **Content**: Reset link, security details, expiration notice
- **Security**: Includes request source IP and timestamp

## Environment Configuration

Required environment variables:

```env
# Email Service
EMAIL_FROM="noreply@twinship.app"
EMAIL_SERVICE="sendgrid"
SENDGRID_API_KEY="your-sendgrid-api-key"

# Frontend URL for email links
FRONTEND_URL="http://localhost:8081"

# Email verification settings
EMAIL_VERIFICATION_REQUIRED="false"
```

## Development Mode

When `SENDGRID_API_KEY` is not configured, the system operates in development mode:
- Emails are logged to console instead of sent
- Full email content (HTML and text) is displayed in server logs
- Verification tokens are logged for testing

## Error Handling

### Auth Error Codes
- `AUTH_VERIFICATION_TOKEN_INVALID`: Invalid verification token
- `AUTH_VERIFICATION_TOKEN_EXPIRED`: Expired verification token
- `AUTH_EMAIL_ALREADY_VERIFIED`: Email already verified
- `AUTH_PASSWORD_RESET_TOKEN_INVALID`: Invalid reset token
- `AUTH_PASSWORD_RESET_TOKEN_EXPIRED`: Expired reset token
- `AUTH_PASSWORD_RESET_TOKEN_USED`: Reset token already used

### Validation Rules
- **Email**: Valid email format, normalized
- **Password**: Minimum 8 characters, uppercase, lowercase, number
- **Tokens**: Non-empty strings

## Database Schema

The implementation uses existing Prisma schema fields:

**User model:**
- `emailVerified: Boolean`
- `emailVerificationToken: String?`
- `emailVerificationExpires: DateTime?`

**PasswordReset model:**
- `token: String` (indexed)
- `expiresAt: DateTime`
- `usedAt: DateTime?`
- `ipAddress: String?`
- `userAgent: String?`

## Testing

Use the provided test script:
```bash
cd backend
node test-auth-endpoints.js
```

The test script verifies:
- Registration with email verification
- Resend verification functionality
- Forgot password flow
- Invalid token handling
- Validation error responses

## Production Deployment

1. **Configure SendGrid**: Add valid `SENDGRID_API_KEY`
2. **Set Frontend URL**: Update `FRONTEND_URL` for production
3. **Enable Email Verification**: Set `EMAIL_VERIFICATION_REQUIRED="true"` if required
4. **Monitor Rate Limits**: Adjust rate limiting based on usage patterns
5. **Security Audit**: Review logs and implement additional monitoring

## Support & Maintenance

- Monitor email delivery rates through SendGrid dashboard
- Review rate limiting effectiveness in server logs
- Track failed verification/reset attempts for security analysis
- Regularly clean up expired tokens (consider implementing cleanup job)