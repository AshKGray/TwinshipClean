import { logger } from '../utils/logger';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailVerificationData {
  displayName: string;
  verificationUrl: string;
  expirationTime: string;
}

export interface PasswordResetData {
  displayName: string;
  resetUrl: string;
  expirationTime: string;
  requestedFrom: string;
}

export class EmailService {
  private readonly fromEmail: string;
  private readonly serviceType: string;
  private readonly sendgridApiKey?: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@twinship.app';
    this.serviceType = process.env.EMAIL_SERVICE || 'sendgrid';
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;

    if (this.serviceType === 'sendgrid' && !this.sendgridApiKey) {
      logger.warn('SendGrid API key not configured, emails will be logged instead of sent');
    }
  }

  async sendEmailVerification(to: string, data: EmailVerificationData): Promise<void> {
    const template = this.getEmailVerificationTemplate(data);
    await this.sendEmail(to, template);
  }

  async sendPasswordReset(to: string, data: PasswordResetData): Promise<void> {
    const template = this.getPasswordResetTemplate(data);
    await this.sendEmail(to, template);
  }

  private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      if (this.serviceType === 'sendgrid' && this.sendgridApiKey) {
        await this.sendViaSendGrid(to, template);
      } else {
        // Development mode - log email instead of sending
        this.logEmail(to, template);
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  private async sendViaSendGrid(to: string, template: EmailTemplate): Promise<void> {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(this.sendgridApiKey!);

    const msg = {
      to,
      from: {
        email: this.fromEmail,
        name: 'Twinship'
      },
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    await sgMail.default.send(msg);
    logger.info(`Email sent to ${to}: ${template.subject}`);
  }

  private logEmail(to: string, template: EmailTemplate): void {
    logger.info('=== EMAIL (Development Mode) ===');
    logger.info(`To: ${to}`);
    logger.info(`From: ${this.fromEmail}`);
    logger.info(`Subject: ${template.subject}`);
    logger.info(`Text Content: ${template.text}`);
    logger.info(`HTML Content: ${template.html}`);
    logger.info('=== END EMAIL ===');
  }

  private getEmailVerificationTemplate(data: EmailVerificationData): EmailTemplate {
    const subject = 'Welcome to Twinship - Verify Your Email';
    
    const text = `
Hello ${data.displayName || 'there'},

Welcome to Twinship! To complete your registration and start connecting with your twin, please verify your email address by clicking the link below:

${data.verificationUrl}

This verification link will expire in ${data.expirationTime}.

If you didn't create this account, you can safely ignore this email.

Best regards,
The Twinship Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Twinship</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9ff; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to Twinship! 👯‍♀️</h1>
    <p>Your twin connection journey starts here</p>
  </div>
  
  <div class="content">
    <h2>Hello ${data.displayName || 'there'},</h2>
    
    <p>Welcome to Twinship! We're excited to help you strengthen and explore your unique twin connection.</p>
    
    <p>To complete your registration and start connecting with your twin, please verify your email address:</p>
    
    <div style="text-align: center;">
      <a href="${data.verificationUrl}" class="button">Verify My Email</a>
    </div>
    
    <div class="warning">
      ⏰ <strong>Important:</strong> This verification link will expire in ${data.expirationTime}.
    </div>
    
    <p>Once verified, you'll be able to:</p>
    <ul>
      <li>🎮 Play psychic games with your twin</li>
      <li>💬 Use our specialized twin chat features</li>
      <li>📊 Take relationship assessments</li>
      <li>📖 Create and share your twin stories</li>
    </ul>
    
    <p>If you didn't create this account, you can safely ignore this email.</p>
    
    <div class="footer">
      <p>Best regards,<br>The Twinship Team</p>
      <p><small>If the button above doesn't work, copy and paste this link into your browser: ${data.verificationUrl}</small></p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }

  private getPasswordResetTemplate(data: PasswordResetData): EmailTemplate {
    const subject = 'Reset Your Twinship Password';
    
    const text = `
Hello ${data.displayName || 'there'},

We received a request to reset your password for your Twinship account. If you made this request, click the link below to reset your password:

${data.resetUrl}

This password reset link will expire in ${data.expirationTime}.

Request details:
- Requested from: ${data.requestedFrom}
- Time: ${new Date().toLocaleString()}

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

For security reasons, if you continue to receive these emails without requesting them, please contact our support team.

Best regards,
The Twinship Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Twinship</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9ff; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .security-info { background: #e8f4fd; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Password Reset</h1>
    <p>Secure your Twinship account</p>
  </div>
  
  <div class="content">
    <h2>Hello ${data.displayName || 'there'},</h2>
    
    <p>We received a request to reset your password for your Twinship account. If you made this request, click the button below to create a new password:</p>
    
    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="button">Reset My Password</a>
    </div>
    
    <div class="warning">
      ⏰ <strong>Important:</strong> This password reset link will expire in ${data.expirationTime}.
    </div>
    
    <div class="security-info">
      <h3>🔍 Request Details:</h3>
      <ul style="margin: 10px 0;">
        <li><strong>Requested from:</strong> ${data.requestedFrom}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    </div>
    
    <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>For security reasons, if you continue to receive these emails without requesting them, please contact our support team immediately.</p>
    
    <div class="footer">
      <p>Best regards,<br>The Twinship Team</p>
      <p><small>If the button above doesn't work, copy and paste this link into your browser: ${data.resetUrl}</small></p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
  }
}

let emailServiceInstance: EmailService;

const getEmailService = () => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};

export const emailService = {
  sendEmailVerification: (to: string, data: EmailVerificationData) => 
    getEmailService().sendEmailVerification(to, data),
  sendPasswordReset: (to: string, data: PasswordResetData) => 
    getEmailService().sendPasswordReset(to, data),
};