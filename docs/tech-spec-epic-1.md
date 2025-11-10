# Epic Technical Specification: User Onboarding & Twin Pairing

Date: 2025-11-03
Author: Ashley
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational user experience for Twinship by implementing the complete onboarding and twin pairing workflow. This epic enables new users to create accounts, customize their profile with galaxy-themed accent colors, generate secure invitation links, and successfully pair with their twin. The pairing process is the critical gateway that unlocks all twin-specific features including games, Twintuition alerts, and shared stories.

This specification covers the client-side implementation using React Native, Expo, TypeScript, and Zustand state management. The epic consists of 5 sequential stories that guide users from initial registration through successful twin pairing and concludes with an optional tutorial introducing key app features.

## Objectives and Scope

**In Scope:**
- User registration with profile creation (name, email, birthdate, twin type)
- Galaxy-themed accent color selection with live preview
- Invitation code generation and sharing (email/SMS)
- Invitation code acceptance and twin pairing flow
- Celebration animations upon successful pairing
- Optional onboarding tutorial with key feature highlights
- Local data persistence using AsyncStorage
- State management using Zustand stores
- Form validation and error handling

**Out of Scope:**
- Backend API implementation (handled separately)
- Firebase/backend authentication (covered in Epic 7)
- Real-time synchronization of profile data (Epic 7)
- Premium subscription features (Epic 5)
- Deep linking for invitation URLs (Phase 2)
- Email verification workflow (Phase 2)
- Social auth (Google, Apple Sign-In) (Phase 2)

**Success Criteria:**
- Users can complete registration in under 2 minutes
- Invitation codes are unique and shareable
- Twin pairing succeeds with valid invitation codes
- Profile data persists across app restarts
- UI maintains 60 FPS during animations
- Form validation provides clear, actionable error messages

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Navigation Layer** (`src/navigation/AppNavigator.tsx`):
   - RegisterScreen as initial route for new users
   - Color selection, invitation, and pairing screens in onboarding stack
   - Auto-navigation to TwinTalk after successful pairing

2. **State Management** (`src/state/`):
   - `twinStore.ts`: User profiles, twin connection, pairing status
   - `tempTwinStore.ts`: Temporary profile data during registration
   - `invitationStore.ts`: Invitation code generation and validation

3. **Services Layer** (`src/services/`):
   - `invitationService.ts`: Code generation, validation, and pairing logic
   - `storageService.ts`: AsyncStorage persistence utilities
   - `encryptionService.ts`: Secure invitation code generation

4. **UI Components** (`src/components/`):
   - `common/`: Reusable galaxy-themed buttons, inputs, cards
   - `onboarding/`: Color selection, twin type selector, tutorial carousel

**Design System Integration:**
- Galaxy-themed color palette from `src/theme/colors.ts`
- NativeWind/Tailwind CSS for consistent styling
- React Native Reanimated for smooth animations
- Expo Haptics for tactile feedback

**Existing Patterns:**
- Uses existing `galaxybackground.png` for consistent cosmic aesthetic
- Follows established navigation patterns with auto-navigation after pairing
- Integrates with TEST/TESTTWIN development codes in PairScreen
- Maintains existing form validation patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `invitationService.ts` | Generate unique invitation codes, validate codes, manage invitation state | User profile data, invitation code | Invitation object, validation result | Story 1.3, 1.4 |
| `storageService.ts` | Persist and retrieve data from AsyncStorage | Key-value pairs, objects | Stored data, retrieval results | Stories 1.1-1.5 |
| `twinStore.ts` | Manage user profile, twin connection state, pairing status | Profile data, twin data, actions | Store state, selectors | Stories 1.1-1.5 |
| `tempTwinStore.ts` | Temporary storage during registration flow | Registration form data | Temp profile data | Story 1.1 |
| `invitationStore.ts` | Manage invitation codes and pairing attempts | Invitation codes, status updates | Invitation state | Stories 1.3, 1.4 |
| `RegisterScreen.tsx` | User registration UI and form validation | User input | Profile creation | Story 1.1 |
| `ColorSelectionScreen.tsx` | Galaxy theme selection with live preview | User color choice | Selected accent color | Story 1.2 |
| `InvitationScreen.tsx` | Generate and share invitation codes | User profile | Invitation code, sharing options | Story 1.3 |
| `PairScreen.tsx` | Accept invitation and pair twins | Invitation code input | Pairing result, navigation | Story 1.4 |
| `TutorialScreen.tsx` | Onboarding tutorial carousel | None | Tutorial completion | Story 1.5 |

**Module Dependencies:**
- `invitationService` depends on `nanoid` for unique ID generation
- All stores depend on `zustand` and `AsyncStorage` persistence middleware
- All screens depend on `react-navigation` for routing
- UI components depend on `NativeWind`, `react-native-reanimated`, `expo-haptics`

### Data Models and Contracts

**UserProfile Interface:**
```typescript
interface UserProfile {
  id: string;                    // UUID v4
  name: string;                  // 1-50 characters
  email: string;                 // Valid email format
  birthdate: string;             // ISO 8601 date
  age: number;                   // Calculated from birthdate
  twinType: 'identical' | 'fraternal' | 'other';
  accentColor: ThemeColor;       // Galaxy theme selection
  twinId?: string;               // UUID of paired twin (optional until paired)
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Invitation Interface:**
```typescript
interface Invitation {
  id: string;                    // UUID v4
  code: string;                  // 8-character alphanumeric (e.g., "AB12CD34")
  createdBy: string;             // User ID who created invitation
  createdAt: string;             // ISO 8601 timestamp
  expiresAt: string;             // ISO 8601 timestamp (7 days from creation)
  status: 'pending' | 'accepted' | 'expired';
  acceptedBy?: string;           // User ID who accepted (optional)
  acceptedAt?: string;           // ISO 8601 timestamp (optional)
}
```

**TwinConnection Interface:**
```typescript
interface TwinConnection {
  id: string;                    // UUID v4 for the pair
  twin1Id: string;               // User ID of first twin
  twin2Id: string;               // User ID of second twin
  pairedAt: string;              // ISO 8601 timestamp
  invitationId: string;          // Reference to invitation used
}
```

**ThemeColor Type:**
```typescript
type ThemeColor =
  | 'nebula-rose'
  | 'stellar-blue'
  | 'orbit-sage'
  | 'solar-amber'
  | 'celestial-indigo'
  | 'comet-coral'
  | 'aurora-teal'
  | 'meteor-copper';
```

**Form Validation Schema:**
```typescript
// Registration form validation
const registrationSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/  // Letters, spaces, hyphens, apostrophes
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  birthdate: {
    required: true,
    minAge: 13,  // COPPA compliance
    maxAge: 120
  },
  twinType: {
    required: true,
    enum: ['identical', 'fraternal', 'other']
  }
};

// Invitation code validation
const invitationCodeSchema = {
  code: {
    required: true,
    length: 8,
    pattern: /^[A-Z0-9]{8}$/  // Uppercase letters and numbers only
  }
};
```

### APIs and Interfaces

**Zustand Store Actions:**

```typescript
// twinStore actions
interface TwinStoreActions {
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setTwinConnection: (connection: TwinConnection) => void;
  clearUserData: () => void;

  // Computed selectors
  isPaired: () => boolean;
  getTwinProfile: () => UserProfile | null;
}

// invitationStore actions
interface InvitationStoreActions {
  createInvitation: (userId: string) => Promise<Invitation>;
  validateInvitation: (code: string) => Promise<boolean>;
  acceptInvitation: (code: string, userId: string) => Promise<TwinConnection>;
  getInvitation: (code: string) => Invitation | null;
  expireOldInvitations: () => void;
}
```

**Service Method Signatures:**

```typescript
// invitationService.ts
class InvitationService {
  generateCode(): string;
  // Returns: 8-character alphanumeric code (e.g., "AB12CD34")

  async createInvitation(userId: string): Promise<Invitation>;
  // Creates new invitation with 7-day expiration

  async validateCode(code: string): Promise<{ valid: boolean; invitation?: Invitation; error?: string }>;
  // Checks if code exists, not expired, not already accepted

  async pairTwins(invitationCode: string, acceptingUserId: string): Promise<{ success: boolean; connection?: TwinConnection; error?: string }>;
  // Creates twin connection, updates invitation status
}

// storageService.ts
class StorageService {
  async save<T>(key: string, value: T): Promise<void>;
  async get<T>(key: string): Promise<T | null>;
  async remove(key: string): Promise<void>;
  async clear(): Promise<void>;
}
```

**React Navigation Type Definitions:**

```typescript
type OnboardingStackParamList = {
  Register: undefined;
  ColorSelection: { profile: Partial<UserProfile> };
  Invitation: { profile: UserProfile };
  Pair: undefined;
  Tutorial: { skipEnabled: boolean };
};

// Navigation prop type
type RegisterScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Register'>;
```

### Workflows and Sequencing

**Registration Flow (Stories 1.1, 1.2):**
```
User opens app
  ↓
RegisterScreen displays
  ↓
User enters: name, email, birthdate
  ↓
User selects twin type
  ↓
Validation checks:
  - Name: 1-50 chars, valid characters
  - Email: valid format
  - Birthdate: age 13+
  - Twin type: one of enum values
  ↓
[If valid] → Save to tempTwinStore
  ↓
Navigate to ColorSelection
  ↓
User selects galaxy theme color
  ↓
Live preview updates sample UI
  ↓
User confirms selection
  ↓
Create full UserProfile object
  ↓
Save to twinStore + AsyncStorage
  ↓
Navigate to Invitation screen
```

**Invitation Generation Flow (Story 1.3):**
```
InvitationScreen loads
  ↓
Display user's profile preview
  ↓
User taps "Generate Invitation"
  ↓
invitationService.generateCode()
  → Creates 8-char code
  → Stores in invitationStore
  → Sets 7-day expiration
  ↓
Display invitation code prominently
  ↓
Provide sharing options:
  - Copy to clipboard
  - Share via SMS (React Native Share)
  - Share via Email
  ↓
[User shares code with twin]
  ↓
Screen shows "Waiting for twin..." status
```

**Twin Pairing Flow (Story 1.4):**
```
PairScreen loads (new user path)
  ↓
User enters invitation code (8 chars)
  ↓
Validation:
  - Code format check (uppercase, 8 chars)
  - Real-time validation feedback
  ↓
User taps "Connect" or presses Enter
  ↓
invitationService.validateCode(code)
  ↓
[If invalid] → Show error message
  ↓
[If valid] → Retrieve invitation details
  ↓
Show twin preview (name, twin type)
  ↓
User confirms pairing
  ↓
invitationService.pairTwins(code, userId)
  ↓
Create TwinConnection object
  ↓
Update both user profiles with twinId
  ↓
Mark invitation as "accepted"
  ↓
Save to twinStore + AsyncStorage
  ↓
Trigger celebration animation:
  - Particle effects
  - Haptic feedback (success)
  - Success message
  ↓
Wait 1.5 seconds
  ↓
Auto-navigate to TwinTalk
```

**Tutorial Flow (Story 1.5):**
```
TutorialScreen loads (after pairing)
  ↓
Display swipeable carousel:
  Screen 1: "Welcome to Twinship"
  Screen 2: "Play Psychic Games"
  Screen 3: "Send Twintuition Alerts"
  Screen 4: "Share Your Story"
  Screen 5: "Contribute to Research"
  ↓
User can:
  - Swipe to next screen
  - Tap "Skip" to exit
  - Reach end and tap "Get Started"
  ↓
Mark tutorial as completed in AsyncStorage
  ↓
Navigate to Home screen
```

**Error Handling Sequences:**

*Invalid Invitation Code:*
```
User enters code → Validate → [Invalid]
  ↓
Display error: "Invalid invitation code"
  ↓
Clear input field
  ↓
Allow retry
```

*Expired Invitation:*
```
User enters code → Validate → [Expired]
  ↓
Display error: "This invitation has expired"
  ↓
Suggest: "Ask your twin to generate a new code"
```

*Already Accepted Invitation:*
```
User enters code → Validate → [Already used]
  ↓
Display error: "This invitation has already been accepted"
  ↓
Suggest: "Use a different invitation code"
```

*Network Issues (Phase 2):*
```
Action attempted → Network unavailable
  ↓
Show toast: "No internet connection"
  ↓
Queue action for retry
  ↓
Retry when connection restored
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Screen Load Time**: < 300ms for all onboarding screens
- **Form Validation**: < 50ms response time for input validation
- **Invitation Code Generation**: < 100ms
- **Twin Pairing**: < 500ms for complete pairing flow (local only, no network)
- **Animation Frame Rate**: Maintain 60 FPS for all animations and transitions
- **Memory Usage**: < 100MB for entire onboarding flow
- **AsyncStorage Operations**: < 50ms for save/retrieve operations

**Performance Requirements:**
1. **Smooth Animations**: All screen transitions and celebration animations must maintain 60 FPS using React Native Reanimated
2. **Instant Feedback**: Form validation provides immediate visual feedback (< 50ms after keystroke)
3. **Efficient Rendering**: Use React.memo and useMemo for expensive components (ColorSelection preview)
4. **Lazy Loading**: Tutorial screens load on-demand, not all upfront
5. **Optimized Images**: Galaxy background uses optimized image asset (< 500KB)

**Performance Optimizations:**
- Debounce email validation (300ms) to avoid excessive re-renders
- Use FlatList for color selection grid to handle large lists efficiently
- Memoize accent color calculations in theme preview
- Minimize re-renders using Zustand's selective subscriptions
- Preload tutorial images during pairing celebration

**Linked PRD/Architecture Sections:**
- PRD: "Technical Architecture" - React Native Reanimated for smooth transitions
- Architecture: "Mobile-Specific UI Patterns" - Performance considerations for animations

### Security

**Authentication & Authorization:**
- **COPPA Compliance**: Minimum age of 13 enforced at registration
- **Email Validation**: Regex validation prevents malformed emails
- **Input Sanitization**: All user inputs sanitized before storage

**Data Protection:**
- **Local Storage Encryption**: AsyncStorage data encrypted at rest (iOS Keychain, Android EncryptedSharedPreferences)
- **Invitation Code Security**:
  - 8-character alphanumeric codes provide 2.8 trillion combinations
  - Codes expire after 7 days
  - One-time use only (marked as accepted after pairing)
- **No Sensitive Data in Logs**: PII never logged to console or crash reports

**Input Validation:**
- **Name Field**: Maximum 50 characters, letters/spaces/hyphens/apostrophes only
- **Email Field**: RFC 5322 compliant email format
- **Birthdate**: Age between 13-120 years
- **Invitation Code**: Uppercase letters and numbers only, exactly 8 characters

**Threat Mitigation:**
- **XSS Prevention**: All user input escaped before display
- **Injection Prevention**: No dynamic code execution from user input
- **Brute Force Protection**: Rate limiting invitation code attempts (Phase 2 - backend)

**Privacy:**
- User data stored locally until Epic 7 (Firebase sync)
- No data shared with third parties during onboarding
- Clear privacy policy presented before registration

**Linked PRD/Architecture Sections:**
- PRD: "Data & Privacy" - Encryption and consent requirements
- Architecture: "Security Implementation" - Input validation with Joi patterns

### Reliability/Availability

**Error Handling:**
- **Graceful Degradation**: App functions offline with AsyncStorage only
- **Validation Errors**: Clear, actionable error messages for all validation failures
- **Network Errors**: Friendly error messages with retry suggestions (Phase 2)
- **Storage Errors**: Fallback to in-memory state if AsyncStorage fails
- **Crash Prevention**: Try-catch blocks around all async operations

**Data Persistence:**
- **Auto-Save**: Profile data automatically saved to AsyncStorage after each step
- **Recovery**: App restores to last saved state if interrupted
- **Backup Strategy**: AsyncStorage data persists across app restarts
- **Migration**: Version migration logic for future schema changes

**Availability Targets:**
- **Local Operations**: 99.9% availability (only fails if device storage full)
- **Offline Support**: Full functionality without network connection
- **Recovery Time**: < 1 second to restore state from AsyncStorage

**Resilience Patterns:**
- **Retry Logic**: Auto-retry failed AsyncStorage operations (3 attempts, exponential backoff)
- **Circuit Breaker**: Disable invitation code validation if validation service fails repeatedly (Phase 2)
- **Fallback Values**: Default accent color if selection fails (celestial-indigo)
- **State Rollback**: Revert to previous state if operation fails

**Data Integrity:**
- **Atomic Operations**: Profile updates are all-or-nothing (no partial updates)
- **Validation Before Save**: All data validated before persisting
- **Invitation Uniqueness**: Duplicate codes prevented by generation algorithm
- **Referential Integrity**: Twin connections reference valid user IDs

**Linked PRD/Architecture Sections:**
- Architecture: "State Management" - Zustand persistence middleware
- Architecture: "Error Handling Strategy" - Global error handlers

### Observability

**Logging:**
- **Info Level**: User actions (registration started, color selected, invitation generated, pairing successful)
- **Debug Level**: Validation failures, navigation events
- **Error Level**: Exceptions, AsyncStorage failures, unexpected states
- **No PII**: Never log email, name, or other PII

**Metrics Tracking:**
- **Registration Funnel**: Track completion rate at each step
  - Step 1: Registration form → Step 2: Color selection (expected: >95%)
  - Step 2: Color selection → Step 3: Invitation (expected: >98%)
  - Step 4: Pairing → Step 5: Tutorial (expected: >90%)
- **Time Metrics**: Track time spent on each screen
- **Error Rates**: Track validation errors, failed pairing attempts
- **Feature Adoption**: Track tutorial completion vs skip rate

**Monitoring:**
- **Performance Monitoring**: Track screen load times, animation FPS
- **Crash Reporting**: Integrate with Sentry or Crashlytics
- **User Session Tracking**: Track onboarding flow completion
- **AsyncStorage Health**: Monitor storage quota and operation success rate

**Debugging Support:**
- **Development Mode**: Enable verbose logging in __DEV__
- **Test Codes**: "TEST" and "TESTTWIN" codes for rapid development testing
- **State Inspector**: Redux DevTools compatible Zustand inspector
- **Network Inspector**: Flipper integration for debugging (Phase 2)

**Telemetry:**
- **Anonymous Usage Stats**: Opt-in telemetry for feature usage
- **Performance Telemetry**: FPS, memory usage, load times
- **Error Telemetry**: Crash reports, exception tracking
- **Funnel Analytics**: Drop-off rates at each onboarding step

**Linked PRD/Architecture Sections:**
- PRD: "Success Metrics" - User engagement and retention tracking
- Architecture: "Development Workflow" - Monitoring with DataDog/LogRocket

## Dependencies and Integrations

### NPM Dependencies

**Core Framework:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `expo` | 53.0.22 | React Native framework | Core platform |
| `react` | 19.0.0 | UI library | All screens |
| `react-native` | 0.79.5 | Mobile platform | All screens |
| `typescript` | 5.8.3 | Type safety | All code |

**Navigation:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `@react-navigation/native` | 7.1.6 | Navigation library | Screen routing |
| `@react-navigation/native-stack` | 7.3.2 | Stack navigator | Onboarding flow |
| `react-native-screens` | 4.11.1 | Native screen optimization | Performance |
| `react-native-safe-area-context` | 5.4.0 | Safe area handling | Screen layouts |

**State Management:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `zustand` | 5.0.4 | State management | twinStore, invitationStore |
| `@react-native-async-storage/async-storage` | 2.1.2 | Local persistence | Profile storage |

**UI & Styling:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `nativewind` | 4.1.23 | Tailwind CSS for RN | All styling |
| `tailwindcss` | 3.4.17 | CSS framework | Theme system |
| `@expo/vector-icons` | 14.1.0 | Icon library | UI icons |
| `react-native-reanimated` | 3.17.4 | Animations | Celebration animations |
| `expo-linear-gradient` | 14.1.5 | Gradients | Color previews |
| `expo-haptics` | 14.1.4 | Haptic feedback | Button interactions |

**Form & Input:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `expo-clipboard` | 7.1.4 | Clipboard access | Copy invitation code |
| `react-native-gesture-handler` | 2.24.0 | Gesture handling | Swipe gestures |

**Utilities:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `uuid` | 11.1.0 | UUID generation | User IDs, invitation IDs |
| `expo-crypto` | 14.0.2 | Cryptographic functions | Secure code generation |
| `expo-constants` | 17.1.5 | App constants | Environment detection |

**Sharing:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `expo-sharing` | 13.1.5 | Native share dialog | Share invitation |
| `expo-sms` | 13.1.4 | SMS integration | Send invitation via SMS |
| `expo-mail-composer` | 14.1.6 | Email composition | Send invitation via email |

**Testing:**
| Package | Version | Purpose | Epic 1 Usage |
|---------|---------|---------|--------------|
| `jest` | 29.7.0 | Test framework | Unit tests |
| `@testing-library/react-native` | 13.3.3 | Component testing | Screen tests |
| `@testing-library/jest-native` | 5.4.3 | Native matchers | Assertions |

### External Integrations

**Phase 1 (Epic 1 - Local Only):**
- No external API integrations
- All data stored locally in AsyncStorage
- No network dependencies

**Phase 2 (Epic 7 - Backend Integration):**
- Firebase Authentication (email/password)
- Firestore for profile synchronization
- Cloud Functions for invitation validation

### Internal Module Dependencies

**Epic 1 depends on:**
- Existing `src/navigation/AppNavigator.tsx` for routing
- Existing `src/state/twinStore.ts` and `tempTwinStore.ts` for state
- Existing `assets/galaxybackground.png` for UI consistency
- Existing color theme system from Tailwind config

**Epic 1 provides foundation for:**
- **Epic 2** (Games): Requires paired twins to play together
- **Epic 3** (Twintuition): Requires twin connection for alerts
- **Epic 5** (Research): Requires user profiles for consent
- **Epic 6** (Design System): Uses galaxy color palette
- **Epic 7** (Backend Sync): Profiles will sync to Firebase

### Version Constraints

**Minimum Supported Versions:**
- iOS: 13.4+ (Expo SDK 53 requirement)
- Android: API 23+ (Android 6.0+)
- Node.js: 18+ (for development)

**Known Issues & Patches:**
- `react-native@0.79.2.patch`: Custom modifications (see patches/ directory)
- `expo-asset@11.1.5.patch`: Asset handling improvements

### Breaking Changes & Migration

**If upgrading dependencies:**
1. **React Native 0.79.5 → 0.80+**: Check navigation API changes
2. **React 19.0.0**: Already on latest, monitor future changes
3. **Zustand 5.0.4**: Middleware API stable, monitor v6
4. **NativeWind 4.1.23**: Check Tailwind v4 compatibility when released

**Schema Migration Strategy:**
- AsyncStorage keys versioned: `twinship:v1:userProfile`
- Migration function runs on app startup
- Fallback to defaults if migration fails

## Acceptance Criteria (Authoritative)

### AC-1.1: User Registration and Profile Creation
1. User can input name (1-50 characters, letters/spaces/hyphens/apostrophes only)
2. User can input email (valid email format required)
3. User can input birthdate (age 13-120 enforced)
4. User can select twin type from: identical, fraternal, other
5. Form validates all fields in real-time with clear error messages
6. Submit button disabled until all fields valid
7. Profile data persists to AsyncStorage upon successful submission
8. Profile data loads in twinStore with correct schema
9. Navigation proceeds to ColorSelection screen after save

### AC-1.2: Galaxy Theme Accent Color Selection
1. Display 8 galaxy-themed color options in grid layout
2. Each color shows name and preview swatch
3. Tapping color updates live preview of UI elements
4. Preview shows sample button, card, and text with selected color
5. Selected color persists to user profile in twinStore
6. Color selection survives app restart (AsyncStorage)
7. Navigation proceeds to Invitation screen after selection
8. Color is applied app-wide after selection

### AC-1.3: Generate Twin Invitation Link
1. Invitation code generated is exactly 8 characters
2. Code uses only uppercase letters and numbers (A-Z, 0-9)
3. Code is cryptographically unique (no duplicates)
4. Invitation stored with 7-day expiration timestamp
5. Code displayed prominently on screen
6. "Copy to Clipboard" button copies code successfully
7. "Share via SMS" opens native SMS with pre-filled message
8. "Share via Email" opens native email with pre-filled message
9. Invitation status shows as "pending" in invitationStore

### AC-1.4: Accept Twin Invitation and Pair
1. User can input 8-character invitation code
2. Code input auto-capitalizes and validates format in real-time
3. Invalid code shows error message immediately
4. Expired code shows specific "expired" error message
5. Already-used code shows specific "already accepted" error
6. Valid code shows twin preview (name, twin type) before confirmation
7. "Connect" button or Enter key initiates pairing
8. Successful pairing creates TwinConnection object
9. Both user profiles updated with twinId references
10. Invitation marked as "accepted" with timestamp
11. Celebration animation plays (particles, haptic feedback)
12. Auto-navigation to TwinTalk after 1.5 seconds
13. Pairing survives app restart (persisted to AsyncStorage)

### AC-1.5: Onboarding Tutorial Walkthrough
1. Tutorial displays 5 screens in swipeable carousel
2. Screen 1: Welcome message with app overview
3. Screen 2: Games feature explanation with visual
4. Screen 3: Twintuition alerts explanation with visual
5. Screen 4: Story vault explanation with visual
6. Screen 5: Research participation explanation with visual
7. User can swipe left/right to navigate screens
8. "Skip" button available on all screens
9. "Get Started" button on final screen
10. Tutorial completion flag saved to AsyncStorage
11. Tutorial never shown again after completion
12. Navigation proceeds to Home screen after completion

### AC-1.6: Cross-Cutting Requirements
1. All screens use `galaxybackground.png` for consistency
2. All animations maintain 60 FPS
3. All buttons provide haptic feedback on press
4. All screens respect safe area insets
5. All forms show validation errors clearly
6. All AsyncStorage operations handle errors gracefully
7. All screens support both iOS and Android
8. TEST/TESTTWIN development codes work in PairScreen

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-1.1: User Registration** | | | |
| AC-1.1.1: Name input validation | Data Models: UserProfile, registrationSchema | RegisterScreen.tsx, twinStore.setUserProfile() | Unit test: regex validation<br>E2E test: Invalid name rejected |
| AC-1.1.2: Email validation | Data Models: registrationSchema | RegisterScreen.tsx validation logic | Unit test: Email regex<br>E2E test: Invalid email rejected |
| AC-1.1.3: Birthdate validation | Data Models: registrationSchema, age calculation | RegisterScreen.tsx, age calculation utility | Unit test: Age boundaries (12, 13, 120, 121)<br>Integration test: Date picker |
| AC-1.1.4: Twin type selection | Data Models: UserProfile.twinType enum | RegisterScreen.tsx picker component | Unit test: Enum validation<br>UI test: All options selectable |
| AC-1.1.5: Real-time validation | Workflows: Registration Flow | Form validation logic with debounce | Integration test: Error messages appear<br>Performance test: < 50ms response |
| AC-1.1.6: Submit button state | Workflows: Registration Flow | Button disabled state logic | UI test: Button enables when valid |
| AC-1.1.7: AsyncStorage persistence | Services: storageService.save() | AsyncStorage, twinStore persist middleware | Integration test: Data survives app restart |
| AC-1.1.8: Store update | APIs: twinStore.setUserProfile() | twinStore Zustand actions | Unit test: Store state updated correctly |
| AC-1.1.9: Navigation | Workflows: Registration Flow | React Navigation navigate() | E2E test: ColorSelection loads |
| **AC-1.2: Color Selection** | | | |
| AC-1.2.1: 8 color options | Data Models: ThemeColor type | ColorSelectionScreen.tsx grid | UI test: 8 colors render |
| AC-1.2.2: Color preview | Services: Theme utilities | Color swatch components | Visual test: Colors display correctly |
| AC-1.2.3: Live preview update | Workflows: Registration Flow | Preview component with selected color | Integration test: Preview updates on tap |
| AC-1.2.4: Sample UI elements | Data Models: ThemeColor integration | Preview card with button, text samples | Visual test: All elements themed |
| AC-1.2.5: Color persistence | Services: storageService, twinStore | UserProfile.accentColor field | Integration test: Color saved correctly |
| AC-1.2.6: App restart survival | Services: AsyncStorage persistence | Zustand persist middleware | Integration test: Color loads on restart |
| AC-1.2.7: Navigation | Workflows: Registration Flow | React Navigation | E2E test: Invitation screen loads |
| AC-1.2.8: App-wide application | Services: Theme system | getNeonAccentColor() utility | Integration test: Color applied globally |
| **AC-1.3: Invitation Generation** | | | |
| AC-1.3.1: 8-character code | Services: invitationService.generateCode() | nanoid or custom generator | Unit test: Length === 8 |
| AC-1.3.2: Uppercase alphanumeric | Data Models: invitationCodeSchema | Code generation algorithm | Unit test: Regex /^[A-Z0-9]{8}$/ |
| AC-1.3.3: Uniqueness | Services: invitationService | UUID for invitation ID | Unit test: No duplicates in 10K generations |
| AC-1.3.4: 7-day expiration | Data Models: Invitation.expiresAt | Date calculation logic | Unit test: expiresAt = createdAt + 7 days |
| AC-1.3.5: Code display | UI: InvitationScreen | Code display component | UI test: Code visible and readable |
| AC-1.3.6: Clipboard copy | Services: expo-clipboard | Clipboard.setStringAsync() | Integration test: Code in clipboard |
| AC-1.3.7: SMS sharing | Services: expo-sms | SMS.sendSMSAsync() | Integration test: SMS opens with code |
| AC-1.3.8: Email sharing | Services: expo-mail-composer | MailComposer.composeAsync() | Integration test: Email opens with code |
| AC-1.3.9: Invitation status | Data Models: Invitation.status | invitationStore state | Unit test: Status === 'pending' |
| **AC-1.4: Twin Pairing** | | | |
| AC-1.4.1: Code input | UI: PairScreen | TextInput with validation | UI test: Input accepts 8 chars |
| AC-1.4.2: Auto-capitalize | UI: PairScreen TextInput | TextInput autoCapitalize prop | UI test: Lowercase converts to uppercase |
| AC-1.4.3: Invalid code error | Services: invitationService.validateCode() | Validation logic | Unit test: Returns error for invalid code |
| AC-1.4.4: Expired code error | Services: invitationService.validateCode() | Expiration check logic | Unit test: Expired code detected |
| AC-1.4.5: Used code error | Services: invitationService.validateCode() | Status check logic | Unit test: Accepted invitation rejected |
| AC-1.4.6: Twin preview | Data Models: Invitation, UserProfile | Preview component | Integration test: Twin name displayed |
| AC-1.4.7: Connect action | Workflows: Twin Pairing Flow | Button onPress + Enter key handler | UI test: Both methods trigger pairing |
| AC-1.4.8: TwinConnection creation | Services: invitationService.pairTwins() | TwinConnection object | Unit test: Correct twin IDs |
| AC-1.4.9: Profile updates | APIs: twinStore.updateUserProfile() | Store action | Integration test: twinId added to profiles |
| AC-1.4.10: Invitation acceptance | Data Models: Invitation.status | Store update | Unit test: Status === 'accepted' |
| AC-1.4.11: Celebration animation | Workflows: Twin Pairing Flow | Reanimated animation + Haptics | Visual test: Animation plays<br>Integration test: Haptic fires |
| AC-1.4.12: Auto-navigation | Workflows: Twin Pairing Flow | setTimeout + navigation.navigate() | E2E test: TwinTalk loads after 1.5s |
| AC-1.4.13: Persistence | Services: AsyncStorage | twinStore persist | Integration test: Pairing survives restart |
| **AC-1.5: Tutorial** | | | |
| AC-1.5.1: 5-screen carousel | UI: TutorialScreen | Carousel/FlatList component | UI test: 5 items render |
| AC-1.5.2-6: Screen content | UI: Tutorial slide components | Individual slide components | Visual test: All content displays |
| AC-1.5.7: Swipe navigation | UI: Gesture handling | react-native-gesture-handler | Integration test: Swipe changes screen |
| AC-1.5.8: Skip button | UI: Skip button | Button component | UI test: Skip exits tutorial |
| AC-1.5.9: Get Started button | UI: Final screen button | Button component | UI test: Button exits tutorial |
| AC-1.5.10: Completion flag | Services: AsyncStorage | Tutorial completion key | Integration test: Flag saved |
| AC-1.5.11: Never shown again | Services: AsyncStorage check | App startup logic | Integration test: Tutorial skipped if completed |
| AC-1.5.12: Navigation | Workflows: Tutorial Flow | React Navigation | E2E test: Home screen loads |
| **AC-1.6: Cross-Cutting** | | | |
| AC-1.6.1: Galaxy background | UI: All screens | GalaxyBackground component | Visual test: Background on all screens |
| AC-1.6.2: 60 FPS animations | Performance: Animation Frame Rate | React Native Reanimated | Performance test: FPS monitor |
| AC-1.6.3: Haptic feedback | UI: All interactive elements | expo-haptics | Integration test: Haptics fire on press |
| AC-1.6.4: Safe area insets | UI: All screens | SafeAreaView component | UI test: Content within safe areas |
| AC-1.6.5: Validation errors | UI: All forms | Error message components | UI test: Errors display correctly |
| AC-1.6.6: Error handling | Services: All AsyncStorage operations | Try-catch blocks | Unit test: Errors handled gracefully |
| AC-1.6.7: Platform support | All: iOS and Android | Platform-specific code | Integration test: Both platforms work |
| AC-1.6.8: Development codes | UI: PairScreen | TEST/TESTTWIN code handling | E2E test: Dev codes create mock twins |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-1.1 | AsyncStorage quota exceeded on device | Low | High | Implement storage monitoring, compression, cleanup of old data | Story 1.1 |
| R-1.2 | Invitation code collisions (duplicate codes generated) | Very Low | High | Use cryptographic random generation (expo-crypto), UUID for invitation ID | Story 1.3 |
| R-1.3 | User abandons onboarding before pairing | Medium | Medium | Save progress at each step, allow resume from last step | Stories 1.1-1.5 |
| R-1.4 | Poor performance on low-end Android devices | Medium | Medium | Test on low-end devices, optimize animations, use FlatList | All stories |
| R-1.5 | Users share invitation codes publicly (security risk) | Medium | Low | Add expiration (7 days), one-time use only, user education | Story 1.3 |
| R-1.6 | Form validation regex doesn't cover edge cases | Low | Medium | Comprehensive unit tests, user testing with diverse names | Story 1.1 |
| R-1.7 | Navigation state lost on app backgrounding | Low | Medium | Persist navigation state to AsyncStorage | All stories |
| R-1.8 | Haptic feedback not available on all devices | Low | Low | Check device support before triggering, graceful fallback | All stories |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-1.1 | Users have reliable local storage (AsyncStorage) | Test on various devices | App unusable without storage |
| A-1.2 | Users will pair with real twins (not random people) | User education, social validation | Undermines app purpose |
| A-1.3 | 8-character codes are memorable enough to share | User testing | May need to increase length or add formatting |
| A-1.4 | 7-day expiration is sufficient for pairing | Analytics tracking | May need to adjust based on data |
| A-1.5 | Users understand twin types (identical/fraternal/other) | Clear UI labels, tooltips | May need help text or examples |
| A-1.6 | React Native Reanimated performs well on target devices | Performance testing | May need to simplify animations |
| A-1.7 | Users are comfortable sharing via SMS/email | User research | May need alternative sharing methods |
| A-1.8 | Minimum age of 13 is legally sufficient globally | Legal review | May need regional variations |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-1.1 | Should invitation codes be case-sensitive? | Medium | Story 1.3 | **Decision: No** - Auto-capitalize for better UX |
| Q-1.2 | What happens if twin never accepts invitation? | Medium | Story 1.3 | **Decision**: Code expires after 7 days, user can generate new one |
| Q-1.3 | Should we support pairing with multiple twins? | Low | Phase 2 | **Decision**: Not in MVP, single twin only |
| Q-1.4 | How to handle users under 13 (COPPA)? | High | Story 1.1 | **Decision**: Hard block at registration, require parental consent in Phase 2 |
| Q-1.5 | Should color selection be skippable with default? | Low | Story 1.2 | **Decision**: Required step, default to celestial-indigo if user force-quits |
| Q-1.6 | What if user wants to change twin after pairing? | Medium | Phase 2 | **Decision**: Not supported in MVP, contact support to unpair |
| Q-1.7 | Should tutorial be dismissible permanently or just skippable? | Low | Story 1.5 | **Decision**: Both - skip for now, never show again after completion |
| Q-1.8 | How to handle timezone differences in expiration? | Low | Story 1.3 | **Decision**: Use UTC timestamps consistently |

### Technical Debt

| Item | Description | Impact | Remediation Plan |
|------|-------------|--------|------------------|
| TD-1.1 | Mock invitation validation (no backend) | Medium | Replace with Firebase Cloud Functions in Epic 7 |
| TD-1.2 | No deep linking for invitation URLs | Low | Add universal links in Phase 2 |
| TD-1.3 | Limited email/SMS customization | Low | Enhance templates with personalization in Phase 2 |
| TD-1.4 | No offline queue for failed operations | Medium | Add retry queue in Epic 7 |
| TD-1.5 | Tutorial content hardcoded in components | Low | Move to CMS or config file for easy updates |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Validation Logic** (Story 1.1):
   - Name regex: Valid names, invalid characters, length boundaries
   - Email regex: Valid formats, invalid formats, edge cases
   - Age calculation: Boundary testing (12, 13, 120, 121 years)
   - Twin type enum: Valid values, invalid values

2. **Invitation Code Generation** (Story 1.3):
   - Length validation: Exactly 8 characters
   - Character set validation: Only A-Z and 0-9
   - Uniqueness: No duplicates in 10,000 generations
   - Expiration calculation: Correct date math (createdAt + 7 days)

3. **Invitation Validation** (Story 1.4):
   - Invalid code format: Wrong length, invalid characters
   - Code not found: Returns appropriate error
   - Expired code: Detects expiration correctly
   - Already accepted code: Rejects reuse
   - Valid code: Returns invitation data

4. **Store Actions** (Stories 1.1-1.5):
   - setUserProfile: Updates state correctly
   - updateUserProfile: Partial updates work
   - setTwinConnection: Links twins properly
   - AsyncStorage persistence: Data saved/loaded correctly

5. **Utility Functions**:
   - Theme color utilities: Correct colors returned
   - Date utilities: Age calculation, expiration logic
   - Form validation helpers: Error message generation

### Integration Tests

**Target**: All user flows end-to-end

**Key Integration Scenarios:**
1. **Complete Registration Flow** (Stories 1.1-1.2):
   - Fill form → Save to temp store → Navigate → Select color → Save to main store
   - Verify data persistence across screens
   - Check AsyncStorage contains correct data

2. **Invitation Generation and Sharing** (Story 1.3):
   - Generate code → Save to store → Copy to clipboard
   - Generate code → Share via SMS (verify intent opens)
   - Generate code → Share via email (verify composer opens)

3. **Twin Pairing Flow** (Story 1.4):
   - Enter valid code → Validate → Show preview → Confirm → Create connection
   - Verify both profiles updated
   - Verify invitation marked accepted
   - Verify navigation to TwinTalk

4. **Tutorial Completion** (Story 1.5):
   - Navigate through carousel → Complete → Save flag
   - Restart app → Verify tutorial not shown again

5. **App Restart Persistence**:
   - Complete onboarding → Kill app → Restart
   - Verify all data restored correctly
   - Verify user remains paired

### UI/Component Tests

**Target**: All screens and major components

**Testing Framework**: React Native Testing Library

**Key UI Tests:**
1. **RegisterScreen**:
   - All form fields render
   - Validation errors display correctly
   - Submit button disabled when invalid
   - Submit button enabled when valid

2. **ColorSelectionScreen**:
   - 8 color options render
   - Tapping color updates preview
   - Preview shows sample UI elements
   - Confirm button navigates forward

3. **InvitationScreen**:
   - Generated code displays
   - Copy button works
   - Share buttons trigger correct actions
   - Status text updates

4. **PairScreen**:
   - Code input accepts text
   - Auto-capitalization works
   - Error messages display
   - Twin preview shows after validation
   - Connect button triggers pairing

5. **TutorialScreen**:
   - All 5 slides render
   - Swipe navigation works
   - Skip button exits
   - Get Started button completes

### E2E Tests

**Target**: Critical user journeys

**Testing Tool**: Detox or Maestro

**Key E2E Scenarios:**
1. **Happy Path - Twin 1**:
   - Register → Select color → Generate invitation → Share
   - Expected: Invitation code generated and shareable

2. **Happy Path - Twin 2**:
   - Register → Select color → Enter invitation code → Pair → Tutorial → Home
   - Expected: Successfully paired, tutorial completed, home screen reached

3. **Error Path - Invalid Code**:
   - Register → Select color → Enter invalid code → See error
   - Expected: Clear error message, can retry

4. **Error Path - Expired Code**:
   - Generate code → Wait 7 days (mock date) → Try to use
   - Expected: "Expired" error message

5. **Recovery Path - App Interruption**:
   - Start registration → Kill app → Restart
   - Expected: Resume from last saved step

### Performance Tests

**Target Metrics:**
- Screen load: < 300ms
- Form validation: < 50ms
- Animation frame rate: 60 FPS
- Memory usage: < 100MB for onboarding flow

**Key Performance Tests:**
1. Screen transition speed (React Navigation)
2. Animation frame rate during celebration
3. AsyncStorage operation latency
4. Memory profiling during onboarding
5. Low-end device testing (Android API 23, iPhone 7)

### Accessibility Tests

**Requirements:**
- Screen reader support on all screens
- Proper focus management
- Color contrast meets WCAG AA
- Haptic feedback where appropriate

**Key Accessibility Tests:**
1. VoiceOver/TalkBack navigation through all screens
2. Color contrast validation for all text
3. Touch target size validation (min 44x44)
4. Keyboard navigation support (web fallback)

### Security Tests

**Key Security Tests:**
1. Input sanitization: XSS prevention, injection prevention
2. Code generation randomness: Statistical distribution analysis
3. AsyncStorage encryption: Verify data encrypted at rest
4. Invitation expiration: Time-based security enforcement
5. PII in logs: Verify no sensitive data in crash reports

### Regression Test Suite

**Automated regression tests run on every PR:**
1. All unit tests
2. Critical integration tests
3. Core E2E happy paths
4. Performance smoke tests

**Pre-release full regression:**
1. All unit tests
2. All integration tests
3. All E2E tests
4. Full performance suite
5. Platform-specific tests (iOS and Android)
6. Accessibility audit

### Test Data Strategy

**Development Test Codes:**
- "TEST": Creates Jordan (you) and Alex (twin) mock profiles
- "TESTTWIN": Creates Alex (you) and Jordan (twin) mock profiles
- Both codes auto-pair and navigate to TwinTalk

**Mock Data:**
- Sample user profiles with varied data
- Valid and invalid invitation codes
- Edge case names (O'Brien, Jean-Paul, etc.)
- Various birthdates (min age, max age, edge cases)

**Test Environment:**
- Local AsyncStorage (cleared between test runs)
- Mocked time for expiration testing
- Mocked navigation for isolated component tests
- Mocked clipboard/SMS/email APIs

### Definition of Done (DoD)

A story is complete when:
1. ✅ All acceptance criteria met
2. ✅ Unit tests written and passing (80%+ coverage)
3. ✅ Integration tests written and passing
4. ✅ UI tests written and passing
5. ✅ E2E tests written and passing for critical paths
6. ✅ Performance tests passing (60 FPS, < 300ms loads)
7. ✅ Accessibility requirements met
8. ✅ Code reviewed and approved
9. ✅ Manual testing on iOS and Android
10. ✅ No high-severity bugs
11. ✅ Documentation updated
12. ✅ Sprint status updated to "done"

---

## Epic 1 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Update sprint-status.yaml: `epic-1: backlog` → `epic-1: contexted`
2. Begin Story 1.1 implementation
3. Use this spec as authoritative reference during development

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Tech Lead
- [ ] QA Lead

**Last Updated**: 2025-11-03
