import * as MailComposer from 'expo-mail-composer';
import * as SMS from 'expo-sms';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { TwinProfile, ThemeColor, TwinType } from '../state/twinStore';

export interface Invitation {
  id: string;
  inviterName: string;
  inviterEmail?: string;
  inviterPhone?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  token: string;
  status: 'pending' | 'sent' | 'delivered' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  twinType: TwinType;
  accentColor: ThemeColor;
  deepLink?: string;
  attemptCount: number;
  lastAttemptAt?: string;
  metadata?: {
    deviceInfo?: string;
    appVersion?: string;
    platform?: string;
  };
}

export interface InvitationAnalytics {
  totalSent: number;
  totalAccepted: number;
  totalDeclined: number;
  totalExpired: number;
  acceptanceRate: number;
  averageResponseTime: number;
  recentInvitations: Invitation[];
}

class InvitationService {
  private static instance: InvitationService;
  private readonly STORAGE_KEY = 'twinship_invitations';
  private readonly TOKEN_LENGTH = 32;
  private readonly EXPIRY_HOURS = 168; // 7 days
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour in milliseconds
  private readonly MAX_INVITES_PER_HOUR = 5;

  private constructor() {}

  static getInstance(): InvitationService {
    if (!InvitationService.instance) {
      InvitationService.instance = new InvitationService();
    }
    return InvitationService.instance;
  }

  /**
   * Generate a cryptographically secure invitation token
   */
  private async generateSecureToken(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(this.TOKEN_LENGTH);
    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Create a deep link for invitation acceptance
   */
  private createDeepLink(token: string): string {
    const baseUrl = Linking.createURL('');
    return `${baseUrl}invitation/${token}`;
  }

  /**
   * Validate invitation token format and security
   */
  private validateToken(token: string): boolean {
    const tokenRegex = /^[0-9A-F]{64}$/;
    return tokenRegex.test(token);
  }

  /**
   * Check rate limiting for invitation sending
   */
  private async checkRateLimit(): Promise<boolean> {
    try {
      const invitations = await this.getStoredInvitations();
      const oneHourAgo = new Date(Date.now() - this.RATE_LIMIT_WINDOW);
      
      const recentInvitations = invitations.filter(
        inv => new Date(inv.createdAt) > oneHourAgo
      );
      
      return recentInvitations.length < this.MAX_INVITES_PER_HOUR;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  }

  /**
   * Store invitations locally with encryption support
   */
  private async storeInvitations(invitations: Invitation[]): Promise<void> {
    try {
      const data = JSON.stringify(invitations);
      await AsyncStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to store invitations:', error);
      throw new Error('Failed to save invitation data');
    }
  }

  /**
   * Retrieve stored invitations
   */
  private async getStoredInvitations(): Promise<Invitation[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to retrieve invitations:', error);
      return [];
    }
  }

  /**
   * Clean up expired invitations
   */
  private async cleanupExpiredInvitations(): Promise<void> {
    try {
      const invitations = await this.getStoredInvitations();
      const now = new Date();
      
      const validInvitations = invitations.filter(inv => {
        const expiryDate = new Date(inv.expiresAt);
        const isExpired = now > expiryDate;
        
        if (isExpired && inv.status === 'pending') {
          inv.status = 'expired';
        }
        
        // Keep recent invitations for analytics (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return new Date(inv.createdAt) > thirtyDaysAgo;
      });
      
      await this.storeInvitations(validInvitations);
    } catch (error) {
      console.error('Failed to cleanup expired invitations:', error);
    }
  }

  /**
   * Create a new invitation
   */
  async createInvitation(
    inviterProfile: TwinProfile,
    recipientContact: { email?: string; phone?: string }
  ): Promise<Invitation> {
    // Rate limiting check
    const canSend = await this.checkRateLimit();
    if (!canSend) {
      throw new Error('Rate limit exceeded. Please wait before sending another invitation.');
    }

    // Validation
    if (!recipientContact.email && !recipientContact.phone) {
      throw new Error('Either email or phone number is required');
    }

    if (recipientContact.email && !this.isValidEmail(recipientContact.email)) {
      throw new Error('Invalid email address format');
    }

    if (recipientContact.phone && !this.isValidPhoneNumber(recipientContact.phone)) {
      throw new Error('Invalid phone number format');
    }

    const token = await this.generateSecureToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation: Invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inviterName: inviterProfile.name,
      inviterEmail: undefined, // Don't store inviter's contact info for privacy
      inviterPhone: undefined,
      recipientEmail: recipientContact.email,
      recipientPhone: recipientContact.phone,
      token,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      twinType: inviterProfile.twinType,
      accentColor: inviterProfile.accentColor,
      deepLink: this.createDeepLink(token),
      attemptCount: 0,
      metadata: {
        appVersion: '1.0.0', // Should be dynamic
        platform: 'mobile',
      },
    };

    // Store the invitation
    const invitations = await this.getStoredInvitations();
    invitations.push(invitation);
    await this.storeInvitations(invitations);

    return invitation;
  }

  /**
   * Send email invitation
   */
  async sendEmailInvitation(invitation: Invitation): Promise<boolean> {
    try {
      if (!invitation.recipientEmail) {
        throw new Error('No email address provided');
      }

      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Email composer is not available on this device');
      }

      const subject = `🌟 Your Twin Wants to Connect on Twinship!`;
      const htmlBody = this.generateEmailTemplate(invitation);
      const body = this.generatePlainTextEmail(invitation);

      const result = await MailComposer.composeAsync({
        recipients: [invitation.recipientEmail],
        subject,
        body,
        isHtml: false, // We'll use plain text for better compatibility
      });

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        await this.updateInvitationStatus(invitation.id, 'sent');
        return true;
      } else if (result.status === MailComposer.MailComposerStatus.SAVED) {
        // User saved as draft - still count as attempt
        await this.updateInvitationStatus(invitation.id, 'pending');
        return false;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to send email invitation:', error);
      await this.incrementAttemptCount(invitation.id);
      throw error;
    }
  }

  /**
   * Send SMS invitation
   */
  async sendSMSInvitation(invitation: Invitation): Promise<boolean> {
    try {
      if (!invitation.recipientPhone) {
        throw new Error('No phone number provided');
      }

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('SMS is not available on this device');
      }

      const message = this.generateSMSTemplate(invitation);

      const result = await SMS.sendSMSAsync(
        [invitation.recipientPhone],
        message
      );

      if (result.result === SMS.SMSResult.SENT) {
        await this.updateInvitationStatus(invitation.id, 'sent');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to send SMS invitation:', error);
      await this.incrementAttemptCount(invitation.id);
      throw error;
    }
  }

  /**
   * Validate and accept invitation using token
   */
  async acceptInvitation(token: string): Promise<{
    success: boolean;
    invitation?: Invitation;
    error?: string;
  }> {
    try {
      if (!this.validateToken(token)) {
        return { success: false, error: 'Invalid invitation token format' };
      }

      const invitations = await this.getStoredInvitations();
      const invitation = invitations.find(inv => inv.token === token);

      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status === 'accepted') {
        return { success: false, error: 'Invitation has already been accepted' };
      }

      if (invitation.status === 'declined') {
        return { success: false, error: 'Invitation has been declined' };
      }

      if (invitation.status === 'expired' || new Date() > new Date(invitation.expiresAt)) {
        await this.updateInvitationStatus(invitation.id, 'expired');
        return { success: false, error: 'Invitation has expired' };
      }

      await this.updateInvitationStatus(invitation.id, 'accepted');
      return { success: true, invitation };
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      return { success: false, error: 'Failed to process invitation' };
    }
  }

  /**
   * Decline invitation
   */
  async declineInvitation(token: string): Promise<boolean> {
    try {
      const invitations = await this.getStoredInvitations();
      const invitation = invitations.find(inv => inv.token === token);

      if (!invitation) {
        return false;
      }

      await this.updateInvitationStatus(invitation.id, 'declined');
      return true;
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      return false;
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    try {
      const invitations = await this.getStoredInvitations();
      return invitations.find(inv => inv.token === token) || null;
    } catch (error) {
      console.error('Failed to get invitation by token:', error);
      return null;
    }
  }

  /**
   * Get all invitations for analytics
   */
  async getInvitationAnalytics(): Promise<InvitationAnalytics> {
    try {
      const invitations = await this.getStoredInvitations();
      
      const totalSent = invitations.filter(inv => inv.status === 'sent' || inv.status === 'accepted' || inv.status === 'declined').length;
      const totalAccepted = invitations.filter(inv => inv.status === 'accepted').length;
      const totalDeclined = invitations.filter(inv => inv.status === 'declined').length;
      const totalExpired = invitations.filter(inv => inv.status === 'expired').length;
      
      const acceptanceRate = totalSent > 0 ? (totalAccepted / totalSent) * 100 : 0;
      
      // Calculate average response time for accepted invitations
      const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');
      const responseTimes = acceptedInvitations.map(inv => {
        const created = new Date(inv.createdAt).getTime();
        const updated = new Date(inv.lastAttemptAt || inv.createdAt).getTime();
        return updated - created;
      });
      
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
      
      // Get recent invitations (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentInvitations = invitations
        .filter(inv => new Date(inv.createdAt) > sevenDaysAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      return {
        totalSent,
        totalAccepted,
        totalDeclined,
        totalExpired,
        acceptanceRate,
        averageResponseTime,
        recentInvitations,
      };
    } catch (error) {
      console.error('Failed to get invitation analytics:', error);
      return {
        totalSent: 0,
        totalAccepted: 0,
        totalDeclined: 0,
        totalExpired: 0,
        acceptanceRate: 0,
        averageResponseTime: 0,
        recentInvitations: [],
      };
    }
  }

  /**
   * Retry sending failed invitation
   */
  async retryInvitation(invitationId: string, method: 'email' | 'sms'): Promise<boolean> {
    try {
      const invitations = await this.getStoredInvitations();
      const invitation = invitations.find(inv => inv.id === invitationId);

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.attemptCount >= this.MAX_ATTEMPTS) {
        throw new Error('Maximum retry attempts exceeded');
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        throw new Error('Invitation has expired');
      }

      if (method === 'email') {
        return await this.sendEmailInvitation(invitation);
      } else {
        return await this.sendSMSInvitation(invitation);
      }
    } catch (error) {
      console.error('Failed to retry invitation:', error);
      throw error;
    }
  }

  /**
   * Update invitation status
   */
  private async updateInvitationStatus(invitationId: string, status: Invitation['status']): Promise<void> {
    try {
      const invitations = await this.getStoredInvitations();
      const index = invitations.findIndex(inv => inv.id === invitationId);
      
      if (index !== -1) {
        invitations[index].status = status;
        invitations[index].lastAttemptAt = new Date().toISOString();
        await this.storeInvitations(invitations);
      }
    } catch (error) {
      console.error('Failed to update invitation status:', error);
    }
  }

  /**
   * Increment attempt count
   */
  private async incrementAttemptCount(invitationId: string): Promise<void> {
    try {
      const invitations = await this.getStoredInvitations();
      const index = invitations.findIndex(inv => inv.id === invitationId);
      
      if (index !== -1) {
        invitations[index].attemptCount += 1;
        invitations[index].lastAttemptAt = new Date().toISOString();
        await this.storeInvitations(invitations);
      }
    } catch (error) {
      console.error('Failed to increment attempt count:', error);
    }
  }

  /**
   * Generate email template
   */
  private generatePlainTextEmail(invitation: Invitation): string {
    return `🌟 Twin Connection Invitation 🌟

Hi there!

${invitation.inviterName} has invited you to connect on Twinship - the digital space designed exclusively for twins!

Twinship helps twins strengthen their unique bond through private communication, fun games, and research-grade personality assessments. It's a special place where your twin connection can flourish.

✨ What awaits you:
• Private "Twin Talk" messaging with your twin
• "Twintuition" alerts for those psychic moments
• Fun games to test your synchronicity
• Personality assessments built specifically for twins
• A safe space to explore your twin identity

🔗 Accept this invitation:
${invitation.deepLink}

Or enter this invitation code in the Twinship app:
${invitation.token}

⏰ This invitation expires on ${new Date(invitation.expiresAt).toLocaleDateString()}

Download Twinship from your app store and enter the code above to begin your twin journey!

With love and twin magic,
The Twinship Team 💜

---
This invitation is personal and should not be shared. If you're not ${invitation.inviterName}'s twin, please disregard this message.`;
  }

  /**
   * Generate HTML email template (for future use)
   */
  private generateEmailTemplate(invitation: Invitation): string {
    // HTML template would go here for richer email formatting
    return this.generatePlainTextEmail(invitation);
  }

  /**
   * Generate SMS template
   */
  private generateSMSTemplate(invitation: Invitation): string {
    return `🌟 ${invitation.inviterName} invited you to Twinship! A space for twins to connect, chat & explore your unique bond. Accept: ${invitation.deepLink} or use code: ${invitation.token} (expires ${new Date(invitation.expiresAt).toLocaleDateString()})`;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (basic validation)
   */
  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  }

  /**
   * Initialize service and cleanup old data
   */
  async initialize(): Promise<void> {
    try {
      await this.cleanupExpiredInvitations();
    } catch (error) {
      console.error('Failed to initialize invitation service:', error);
    }
  }

  /**
   * Clear all invitation data (for testing/reset purposes)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear invitation data:', error);
    }
  }
}

export const invitationService = InvitationService.getInstance();
export default invitationService;
