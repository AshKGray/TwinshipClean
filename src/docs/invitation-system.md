# Twinship Invitation System

## Overview

The Twinship Invitation System is a comprehensive, secure, and user-friendly solution for connecting twins through email and SMS invitations. This system was designed to match the app's neon-themed galaxy aesthetic while providing enterprise-level security and reliability.

## Architecture

### Core Components

1. **InvitationService** (`/src/services/invitationService.ts`)
   - Handles invitation creation, sending, and management
   - Provides secure token generation and validation
   - Manages rate limiting and retry logic
   - Supports both email and SMS delivery

2. **InvitationStore** (`/src/state/invitationStore.ts`)
   - Zustand-based state management for invitation flow
   - Handles UI state, loading states, and error handling
   - Persists essential invitation data
   - Provides selector hooks for optimal performance

3. **DeepLinking** (`/src/utils/deepLinking.ts`)
   - Manages invitation deep links and URL parsing
   - Handles app state restoration from links
   - Supports universal links for cross-platform compatibility

4. **InvitationScreen** (`/src/screens/InvitationScreen.tsx`)
   - Unified component for sending and receiving invitations
   - Animated UI with proper loading states
   - Supports manual token entry as fallback

## Features

### Security & Privacy
- ✅ Cryptographically secure 256-bit invitation tokens
- ✅ Rate limiting (5 invitations per hour)
- ✅ Invitation expiration (7 days default)
- ✅ Secure token validation and format checking
- ✅ No storage of inviter's contact information
- ✅ Protection against spam and abuse

### User Experience
- ✅ Intuitive invitation flow with step-by-step guidance
- ✅ Support for both email and SMS invitations
- ✅ Real-time status updates and progress tracking
- ✅ Graceful error handling with retry logic
- ✅ Deep linking for seamless invitation acceptance
- ✅ Manual token entry as backup method
- ✅ Animated transitions and haptic feedback

### Technical Features
- ✅ Expo MailComposer integration
- ✅ Expo SMS integration
- ✅ AsyncStorage persistence
- ✅ Comprehensive analytics and history tracking
- ✅ Automatic cleanup of expired invitations
- ✅ Cross-platform compatibility

## Usage

### Basic Usage

```typescript
import { InvitationButton } from '../components/InvitationButton';
import { useInvitationStore } from '../state/invitationStore';

// Simple invitation button
<InvitationButton 
  variant="primary" 
  size="medium" 
  onPress={() => navigation.navigate('SendInvitation')}
/>

// Using the invitation store
const { createAndSendInvitation } = useInvitationStore();

await createAndSendInvitation(
  userProfile, 
  { email: 'twin@example.com', phone: '+1234567890' },
  'both' // Send via both email and SMS
);
```

### Navigation Integration

```typescript
// Navigate to send invitation screen
navigation.navigate('SendInvitation');

// Navigate to receive invitation screen
navigation.navigate('ReceiveInvitation', { token: 'invitation_token' });

// Navigate to analytics screen
navigation.navigate('InvitationAnalytics');
```

### Deep Link Handling

The system automatically handles deep links in the format:
```
twinshipvibe://invitation/[64-character-hex-token]
```

## API Reference

### InvitationService

#### Methods

- `createInvitation(inviterProfile, recipientContact)` - Create a new invitation
- `sendEmailInvitation(invitation)` - Send invitation via email
- `sendSMSInvitation(invitation)` - Send invitation via SMS
- `acceptInvitation(token)` - Accept an invitation using token
- `declineInvitation(token)` - Decline an invitation
- `getInvitationAnalytics()` - Get comprehensive analytics
- `retryInvitation(invitationId, method)` - Retry a failed invitation

#### Security Features

- Rate limiting: Maximum 5 invitations per hour
- Token validation: 64-character hexadecimal format
- Expiration: 7 days (configurable)
- Retry limits: Maximum 3 attempts per invitation

### InvitationStore

#### State

```typescript
interface InvitationState {
  currentInvitation: Invitation | null;
  isLoading: boolean;
  error: string | null;
  invitationStep: 'contact' | 'method' | 'sending' | 'sent' | 'success' | 'error';
  selectedMethod: 'email' | 'sms' | 'both' | null;
  recipientContact: {
    email?: string;
    phone?: string;
    name?: string;
  };
  analytics: InvitationAnalytics | null;
  // ... more state properties
}
```

#### Actions

- `createAndSendInvitation()` - Main invitation flow
- `processIncomingInvitation()` - Handle received invitations
- `acceptInvitation()` / `declineInvitation()` - Invitation responses
- `refreshAnalytics()` - Update analytics data
- `reset()` - Reset invitation state

### InvitationScreen Props

```typescript
interface InvitationScreenProps {
  mode?: 'send' | 'receive' | 'manual';
  invitationData?: {
    fromName: string;
    fromEmail?: string;
    fromPhone?: string;
    twinType: TwinType;
    accentColor: ThemeColor;
  };
  onComplete?: () => void;
}
```

## Component Library

### InvitationButton

A flexible button component for invitation actions:

```typescript
<InvitationButton 
  variant="primary" | "secondary" | "minimal"
  size="small" | "medium" | "large"
  showIcon={boolean}
  disabled={boolean}
  onPress={() => {}}
/>
```

### InvitationFAB

Floating Action Button for quick invitations:

```typescript
<InvitationFAB onPress={() => navigation.navigate('SendInvitation')} />
```

### InvitationStatusBadge

Shows current invitation status:

```typescript
<InvitationStatusBadge />
```

## Analytics

The system provides comprehensive analytics including:

- Total invitations sent
- Acceptance rate
- Response times
- Recent invitation history
- Retry attempts and success rates

Access analytics through:
```typescript
const analytics = useInvitationAnalytics();
```

## Error Handling

The system provides robust error handling for:

- Network connectivity issues
- Invalid email/phone formats
- Rate limiting violations
- Expired invitations
- Service unavailability (email/SMS)

Errors are displayed in user-friendly format with suggested actions.

## Customization

### Theming

The invitation system respects the user's selected neon theme:

```typescript
const themeColor = getNeonAccentColor(userProfile.accentColor);
const themeColorWithOpacity = getNeonAccentColorWithOpacity(accentColor, 0.3);
```

### Email Templates

Customize email content in `generatePlainTextEmail()` method of InvitationService.

### SMS Templates

Customize SMS content in `generateSMSTemplate()` method of InvitationService.

## Testing

### Test Scenarios

1. **Send Invitation Flow**
   - Valid email/phone input
   - Invalid input validation
   - Rate limiting behavior
   - Network error handling

2. **Receive Invitation Flow**
   - Valid token processing
   - Invalid token handling
   - Expired invitation handling
   - Deep link integration

3. **Analytics**
   - Data accuracy
   - Persistence
   - Performance with large datasets

### Mock Data

Use the included mock data for testing:

```typescript
import { mockInvitationData } from '../tests/mocks/invitationMockData';
```

## Performance Considerations

- ✅ Lazy loading of invitation history
- ✅ Efficient state management with Zustand
- ✅ Optimized re-renders with selector hooks
- ✅ Automatic cleanup of expired data
- ✅ Pagination for large datasets

## Future Enhancements

### Phase 2 Features
- [ ] Rich HTML email templates
- [ ] Push notification integration
- [ ] Batch invitation sending
- [ ] Invitation scheduling
- [ ] Advanced analytics dashboard

### Phase 3 Features
- [ ] Social media sharing
- [ ] QR code invitations
- [ ] Invitation customization
- [ ] Multi-language support
- [ ] Admin dashboard for monitoring

## Troubleshooting

### Common Issues

1. **Invitations not sending**
   - Check device email/SMS capability
   - Verify network connectivity
   - Check rate limiting status

2. **Deep links not working**
   - Verify URL scheme configuration
   - Check deep link initialization
   - Validate token format

3. **State not persisting**
   - Check AsyncStorage permissions
   - Verify persistence configuration
   - Clear storage if corrupted

### Debug Mode

Enable debug logging:

```typescript
// In development
console.log('Invitation Debug:', { token, status, error });
```

## Contributing

When contributing to the invitation system:

1. Follow the established TypeScript patterns
2. Maintain security best practices
3. Add comprehensive error handling
4. Include analytics tracking
5. Test across platforms
6. Update documentation

## Security Audit Checklist

- [ ] Token generation uses crypto-secure randomness
- [ ] Rate limiting is properly implemented
- [ ] Input validation covers all edge cases
- [ ] No sensitive data logged or persisted inappropriately
- [ ] Deep links are properly validated
- [ ] Invitation expiration is enforced
- [ ] Error messages don't leak sensitive information

This invitation system provides a solid foundation for twin connections while maintaining the special feeling that Twinship aims to create. The implementation balances security, usability, and performance to deliver a best-in-class invitation experience.