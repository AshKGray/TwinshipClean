# Twinship — Fable AI Handoff

_Last prepared from the latest accessible `AshKGray/TwinshipClean` GitHub repository on `main`._

## 1. Purpose of This Document

This document is intended to give Fable AI a practical working understanding of the Twinship app: what it is, what it currently contains, how navigation is wired, what screens exist, which features are mocked or unfinished, and what technologies are being used.

Use this as the starting context before making architectural, UI, bug-fix, or production-readiness changes.

---

## 2. Product Summary

**Twinship** is a React Native / Expo mobile app for twins. Its purpose is to turn the idea of a “twin connection” into interactive, measurable, and emotionally meaningful features.

The app currently centers around:

- Twin profile setup and onboarding
- Pairing with a twin by invite/share code
- Private twin chat
- Twintuition alerts and twincidence/story logging
- Twin connection games
- Personality / bond assessments
- Optional research participation
- Premium feature scaffolding
- Cosmic/neon visual identity with a galaxy background

The intended target users are twin pairs of any type: identical, fraternal, same-gender, mixed-gender, geographically close, or long-distance.

---

## 3. Current Technical Stack

### Core app stack

- **Framework:** React Native `0.79.5`
- **Runtime / tooling:** Expo SDK `53.0.22`
- **React:** `19.0.0`
- **Language:** TypeScript `~5.8.3`
- **Navigation:** React Navigation v7
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`
- **State management:** Zustand `^5.0.4`
- **Persistence:** AsyncStorage through Zustand persist middleware
- **Styling:** NativeWind / Tailwind-style React Native classes
- **Visual system:** neon accent colors, galaxy background, cosmic theme
- **Icons:** Expo vector icons / Ionicons
- **Haptics:** `expo-haptics`
- **Secure storage:** `expo-secure-store`
- **Notifications:** `expo-notifications`
- **Images:** `expo-image`, `expo-image-picker`, `expo-image-manipulator`
- **Payments/subscriptions:** `react-native-purchases` is installed, but premium flow still appears scaffolded rather than production-complete
- **AI SDKs installed:** OpenAI, Anthropic SDK, Grok API service files exist
- **Performance tooling:** BMAD method files, navigation tracking, performance profiler/dashboard utilities
- **Testing:** Jest, React Native Testing Library, ts-jest

### Important package/config files

- `package.json` — dependency list, scripts, patched dependencies
- `app.json` — Expo app config
- `tsconfig.json` — TypeScript settings
- `babel.config.js` — module resolution / NativeWind setup if present
- `.bmad-core/` and `.bmad-mobile-app/` — performance/build methodology tooling

### Expo app config currently shows

- App name: `twinship`
- Slug: `twinship`
- URL scheme: `twinship`
- Version: `1.0`
- Orientation: portrait
- New architecture enabled
- iOS bundle identifier: `com.twinship.app`
- Android package: `com.twinship.app`
- Plugins include:
  - `expo-asset`
  - `expo-mail-composer`
  - `expo-secure-store`
  - `expo-web-browser`

> Note: Some older repo docs mention `com.vibecode.twinship`. Treat `app.json` as the more current source unless the owner confirms otherwise.

---

## 4. How to Run / Validate Locally

From the repository root:

```bash
npm install
npm start
npm run ios
npm run android
npm run web
npm run typecheck
npm run lint
npm test
```

Available scripts in `package.json` include:

```bash
npm start
npm run ios
npm run android
npm run web
npm test
npm run test:watch
npm run test:coverage
npm run typecheck
npm run lint
npm run bmad:build
npm run bmad:measure
npm run bmad:analyze
npm run bmad:dashboard
npm run bmad:deploy:staging
npm run bmad:deploy:production
```

---

## 5. High-Level Architecture

### Primary folders

```text
src/
  api/                 AI/API provider wrappers and service APIs
  components/          Shared and feature-specific UI components
  hooks/               Feature hooks
  navigation/          AppNavigator and feature navigation
  screens/             Top-level screens and feature screen folders
  services/            Chat, invitation, storage, encryption, subscription, twintuition, etc.
  state/               Zustand stores
  types/               Shared TypeScript types
  utils/               Styling helpers, performance tools, zodiac, PDF/export helpers, lazy loading
assets/                Galaxy background, app icons, visual assets
docs/                  Project documentation
backend/               Backend scaffolding exists but frontend still relies heavily on mock/local behavior
```

### Main state stores

The app uses feature-specific Zustand stores. The most important confirmed store is `src/state/twinStore.ts`, which persists core profile and twin state under the storage key `twin-storage`.

Important state concepts:

- `isOnboarded`
- `userProfile`
- `twinProfile`
- `themeColor`
- `twintuitionAlerts`
- `gameResults`
- `stories`
- `syncScore`
- `shareCode`
- `paired`
- `pendingInvitation`
- `invitationToken`
- `invitationStatus`
- `invitationHistory`
- `researchParticipation`
- `notificationsEnabled`

The store also includes actions for:

- Setting user/twin profiles
- Calculating zodiac sign from birth date
- Pairing and unpairing
- Adding twintuition alerts
- Adding game results and recalculating sync score
- Adding/updating stories
- Research and notification settings

---

## 6. Navigation Overview

Main file: `src/navigation/AppNavigator.tsx`

Twinship uses a hybrid navigation model:

```text
NavigationContainer
  Stack.Navigator
    If not authenticated:
      Login
      Register
      ForgotPassword

    Else if authenticated but not onboarded:
      Onboarding

    Else:
      Main Tab Navigator
      Additional stack screens for chat, games, assessment, premium, research, settings, pairing
```

### Root conditional flow

1. `useAuthStore()` initializes authentication.
2. `deepLinkService.initialize()` runs on app load.
3. If user is not authenticated:
   - Show auth flow.
4. If authenticated but not onboarded:
   - Show onboarding flow.
5. If authenticated and onboarded:
   - Show main app.

### Bottom tabs

The bottom tab navigator currently has these tab screens:

| Tab route | Component | Purpose |
|---|---|---|
| `Twindex` | `HomeScreen` | Main dashboard / feature hub |
| `Twgames` | `TwinGamesHub` | Twin connection games hub |
| `Twinalert` | `TwintuitionScreen` | Twintuition alert access |
| `Twintuition` | `TwintuitionScreen` | Twincidence / twintuition feature area |
| `Twinbox` | `TwinTalkScreen` | Private twin chat |

The tab navigator currently starts on `Twinbox`, not `Twindex`.

### Stack routes registered after onboarding

Confirmed routes include:

- `Main`
- `TwinTalk`
- `Twintuition`
- `Twingames`
- `Twinquiry`
- `Twinsettings`
- `Twinvitation`
- `SendInvitation`
- `ReceiveInvitation`
- `InvitationAnalytics`
- `AssessmentIntro`
- `AssessmentSurvey`
- `AssessmentLoading`
- `AssessmentResults`
- `AssessmentRecommendations`
- `PairComparison`
- `Premium`
- `PremiumFeatures`
- `TwinGamesHub`
- `CognitiveSyncMaze`
- `EmotionalResonanceMapping`
- `IconicDuoMatcher`
- `TemporalDecisionSync`
- `cognitive_sync_maze`
- `emotional_resonance`
- `temporal_decision`
- `iconic_duo`
- `ConsentScreen`
- `ResearchParticipationScreen`
- `ResearchDashboardScreen`
- `ResearchVoluntary`
- `ResearchParticipation`
- `GameStats`
- `Home`
- `Settings`
- `Recommendations`
- `AssessmentDetails`
- `Pair`

### Navigation technical notes

- Heavy screens are lazy-loaded with custom lazy/skeleton utilities.
- Game screens are preloaded after the tab navigator mounts.
- BMAD navigation tracking records screen views and navigation timing.
- Performance logs are printed in development.
- Some route aliases exist as placeholders or duplicate routes, likely to prevent navigation failures from older screen calls.

---

## 7. Screen-by-Screen Functional Outline

### 7.1 Authentication screens

#### `LoginScreen`

Purpose: User sign-in entry.

Expected function:

- Allows existing users to log in.
- Routes to the app if authenticated.
- Links to registration and password reset.

Current caveat:

- Authentication architecture exists, but verify whether it is mock/local or backed by real production endpoints before treating it as production-ready.

#### `RegisterScreen`

Purpose: New user account creation.

Expected function:

- Captures account credentials.
- Creates authenticated user state.
- Likely transitions to onboarding.

#### `ForgotPasswordScreen`

Purpose: Password reset flow.

Expected function:

- Allows user to request/reset credentials.

---

### 7.2 `OnboardingScreen`

Purpose: First-time user profile setup.

Documented internal onboarding steps:

1. Welcome
2. Photo setup
3. Personal details
4. Twin type selection
5. Color / accent theme selection
6. Profile review

Important outputs:

- Sets `isOnboarded = true`
- Creates/updates `userProfile`
- Stores accent color/theme
- Collects twin type and birth details
- Birth date is used by `twinStore` to compute zodiac sign

Current caveat:

- In `AppNavigator`, the `onComplete` prop passed to `OnboardingScreen` is currently an empty function. Confirm whether onboarding internally calls the store directly or whether completion is partially broken.

---

### 7.3 `HomeScreen` / `Twindex`

Purpose: Main feature dashboard.

Visible sections/functions:

- App title: `Twinship`
- Tagline: `Twinfinity...and beyond!`
- Twin connection status card
- Pair button
- User/twin initials display
- Quick actions list
- Recent activity placeholder

Quick action routes:

| Button | Route | Function |
|---|---|---|
| Private Chat | `TwinTalk` | Open twin chat |
| Twintuition Alerts | `Twintuition` | Open twintuition/twincidence area |
| Personality Assessment | `AssessmentIntro` | Start assessment; marked premium |
| Twin Games | `Twingames` | Open games hub |
| Twincidence Log | `Twintuition` | Track twin moments/stories |
| Research Studies | `Twinquiry` | Open research dashboard |

Current caveats:

- “Connected” text may display even when a real backend pairing has not occurred, depending on local state.
- Recent Activity currently appears as an empty placeholder.
- Stories are stated as integrated into Twincidence Log rather than separate story screens.

---

### 7.4 `PairScreen` / `Twinvitation` / `Pair`

Purpose: Connect the user to their twin.

Current confirmed behavior:

- Generates a share code from a UUID fragment.
- Lets the user copy their share code to clipboard.
- Lets the user enter a twin’s code.
- Accepts any non-empty code as connected for MVP/demo behavior.
- Uses haptic feedback.
- Sets `paired = true` and temp connection status to `connected`.
- Auto-navigates to the `Twinbox` tab after successful pairing.

Development test codes:

| Code | Mock pair created |
|---|---|
| `TEST` | Jordan + Alex, male/female |
| `TESTTWIN` | Alex + Jordan, female/female |
| `TESTBLUE` | Marcus + Michael, male/male |

Additional test behavior:

- Creates mock user/twin profiles.
- Attempts to set app icon based on twin gender combination.
- Adds a mock welcome chat message.
- Navigates to chat automatically.

Known caveats:

- Real pairing backend is not complete.
- Share code does not appear to be validated against a server.
- Entering any non-empty code can mark the user as paired.
- Console logging is heavy and should be cleaned up for production.

---

### 7.5 `TwinTalkScreen` / `Twinbox` / `TwinTalk`

Purpose: Private chat between paired twins.

Confirmed features:

- Chat header with twin avatar initial and online/connecting/reconnecting/offline state.
- Message list rendered with `FlatList`.
- Pull-to-refresh reconnect simulation.
- Text input with send button.
- Return key can send message.
- Typing indicator support.
- Message long-press menu scaffold:
  - Delete Message
  - Copy Text
  - Reply
- Scroll-to-bottom button.
- Video call button placeholder.
- Settings button routes to `Twinsettings`.
- If no user/twin profile exists, screen shows a “Pair with Twin” prompt.
- Twintuition alert send handler exists and currently logs/simulates alert behavior.

Known caveats:

- Chat is currently based on local/mock service behavior, not a production real-time backend.
- Video calling is explicitly “coming soon.”
- Camera/gallery button currently only triggers haptics and has no real send-image implementation.
- Delete/copy/reply actions are scaffolded but not fully implemented.
- Twintuition alert delivery logs instead of sending true push notification/backend event.
- Sync moment detection is TODO and needs backend coordination.

---

### 7.6 `TwintuitionScreen` / `Twinalert` / `Twintuition`

Purpose: Twintuition alerts, twin moments, and twincidence/story logging.

Expected function:

- Shows or manages “twintuition” events.
- Tracks alerts/moments between twins.
- Acts as the destination for both Twintuition Alerts and Twincidence Log from Home.

State involved:

- `twintuitionAlerts`
- `stories`
- alert read/unread state

Known caveats:

- True real-time alert matching/delivery likely needs backend work.
- Story functionality was removed as separate screens and is intended to be integrated here.

---

### 7.7 `TwinGamesHub` / `Twingames` / `TwinGamesHub`

Purpose: Hub for twin connection games.

Confirmed game routes registered:

- `CognitiveSyncMaze`
- `EmotionalResonanceMapping`
- `IconicDuoMatcher`
- `TemporalDecisionSync`

Also registered lowercase/internal aliases:

- `cognitive_sync_maze`
- `emotional_resonance`
- `temporal_decision`
- `iconic_duo`

State involved:

- `gameResults`
- `syncScore`
- `GameType`
- `GameInsight`

Game result behavior:

- Game results are stored in Zustand.
- `calculateSyncScore()` averages all stored result scores.
- Per-game stats include played count, average score, and best score.

Known caveats:

- Confirm whether all game screens render correctly and whether they save results consistently.
- Older docs mention game names like ColorSync/NumberIntuition, but current code routes point to the four newer game screens listed above.

---

### 7.8 Assessment screens

Purpose: Measure twin/personality/bond dynamics and produce results/recommendations.

Registered assessment flow:

1. `AssessmentIntro`
2. `AssessmentSurvey`
3. `AssessmentLoading`
4. `AssessmentResults`
5. `AssessmentRecommendations`
6. `PairComparison`

Expected flow:

- User starts or resumes assessment.
- User answers questions.
- Loading/processing screen calculates or simulates results.
- Results and recommendations are shown.
- Premium gating may apply to results/recommendations.
- Pair comparison can compare twin responses when both users have data.

Known caveats:

- Validate whether scoring is real, mocked, or partially implemented.
- Premium paywall behavior needs verification.
- Routes `Recommendations` and `AssessmentDetails` are registered as placeholders to assessment components.

---

### 7.9 Premium screens

Registered routes:

- `Premium`
- `PremiumFeatures`

Purpose:

- Present paid features/subscription upgrade flow.
- Gate features such as advanced assessments, analytics, or premium insights.

Installed support:

- `react-native-purchases` dependency exists.

Known caveats:

- Payment integration is documented as scaffolded/incomplete.
- Verify RevenueCat/product IDs/store configuration before assuming purchases work.

---

### 7.10 Research screens

Registered routes:

- `Twinquiry`
- `ConsentScreen`
- `ResearchParticipationScreen`
- `ResearchDashboardScreen`
- `ResearchVoluntary`
- `ResearchParticipation`

Purpose:

- Let twins optionally participate in research.
- Manage consent and participation.
- Show research dashboard/status.

State involved:

- `researchParticipation`
- `hasActiveResearchStudies`
- `researchContributions`

Known caveats:

- Research telemetry/backend endpoints are documented as needing production backend support.
- Consent/IRB/legal wording should be reviewed before public release.

---

### 7.11 `SettingsScreen` / `Twinsettings` / `Settings`

Purpose:

- App and user settings.
- Likely manages theme/accent, notifications, research participation, account controls, premium links, etc.

Known caveat:

- Verify actual settings actions before relying on them for production account/privacy behavior.

---

### 7.12 Invitation screens

Registered routes:

- `SendInvitation`
- `ReceiveInvitation`
- `InvitationAnalytics`

Purpose:

- More advanced invitation flow beyond the simple PairScreen share code.
- Token-based invitation receiving.
- Invitation analytics/history.

Known caveats:

- The main PairScreen still uses local share-code/dev-code behavior.
- Verify whether invitation service has real backend support or only local/mock state.

---

## 8. Known Problems / Broken or Incomplete Areas

### Highest-priority production blockers

1. **No confirmed production backend for pairing**
   - Current PairScreen can mark paired locally.
   - Any non-empty code may connect in MVP/demo behavior.
   - Development codes create mock twins.

2. **Chat is mock/local rather than true production real-time**
   - Existing docs describe EventEmitter/mock WebSocket behavior.
   - Needs a real backend: Firebase, Supabase Realtime, Socket.io, custom WebSocket, etc.

3. **Twintuition alert delivery is not production-real**
   - Current behavior logs/simulates alerts.
   - Push notifications and backend sync-window detection need implementation.

4. **Premium/subscription flow is scaffolded**
   - Dependency exists.
   - Product/revenue/store integration must be verified and completed.

5. **Research telemetry needs backend/legal review**
   - Research participation concepts exist.
   - Backend endpoints and consent/legal correctness need validation.

6. **Authentication may not be production-complete**
   - Auth screens and store exist.
   - Confirm whether login/register/forgot password are connected to real auth.

7. **Navigation has duplicate/placeholder routes**
   - Several routes alias to other components to avoid missing-route errors.
   - Needs cleanup once final screen map is stable.

8. **Documentation drift exists**
   - README, CLAUDE.md, and navigation docs do not fully match current code in all places.
   - Example: older docs mention `com.vibecode.twinship`; current `app.json` uses `com.twinship.app`.
   - Older docs mention games no longer matching current registered routes.

### Medium-priority technical debt

- Heavy console logging in PairScreen and navigation/performance tooling.
- Some BMAD TypeScript errors are documented.
- Several UI controls are placeholders:
  - Video call
  - Camera/gallery message attachment
  - Copy/delete/reply message actions
- Need to confirm all lazy-loaded screens build under Expo SDK 53/RN 0.79.5.
- Need to confirm React Native Skia compatibility because `@shopify/react-native-skia` is installed as a next version.
- Potential dependency duplication: AsyncStorage appears in both dependencies and devDependencies.
- Patched dependency references mention older versions than package versions in at least one place; validate patches are still applicable.

---

## 9. Recommended Fable AI Work Order

### Step 1 — Establish app truth

- Run `npm install`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm start` and test on iOS simulator first.
- Record actual errors instead of relying on docs.

### Step 2 — Fix startup/navigation blockers

- Confirm auth flow behavior.
- Confirm onboarding completion sets `isOnboarded` correctly.
- Confirm authenticated/onboarded user lands where intended.
- Decide whether initial tab should be `Twinbox` or `Twindex`.
- Remove or document route aliases only after screens are stable.

### Step 3 — Stabilize core MVP path

MVP path should probably be:

```text
Register/Login
  → Onboarding
  → Pair with Twin
  → Chat
  → Send Twintuition Alert
  → Play Game
  → View Sync/Result
```

Make this path reliable before expanding premium/research/story depth.

### Step 4 — Replace mock connection layer

Choose backend approach and implement:

- Auth
- User profile persistence
- Twin pairing/invitation code validation
- Real-time chat
- Push notifications
- Twintuition simultaneous-event detection
- Media messages if desired

### Step 5 — Clean production UX

- Remove dev mode panel or hide behind `__DEV__`.
- Remove heavy console logs.
- Replace placeholder alerts with real feature states.
- Add loading/error/empty states.
- Confirm accessibility and safe-area behavior.

---

## 10. Suggested Backend Entities

A production backend will likely need these entities:

```text
User
  id
  email/phone/auth provider id
  profile fields
  createdAt

TwinProfile
  userId
  name
  birthDate
  twinType
  accentColor
  profilePicture

TwinPair
  id
  userAId
  userBId
  status
  createdAt

Invitation
  id
  senderId
  recipientEmail/phone/userId
  token/code
  status
  expiresAt

Message
  id
  pairId
  senderId
  text/media
  createdAt
  deliveredAt
  readAt

TwintuitionEvent
  id
  pairId
  senderId
  type
  timestamp
  matchedEventId

GameSession
  id
  pairId
  gameType
  userAResult
  userBResult
  syncScore
  insights

AssessmentSession
  id
  userId or pairId
  responses
  results
  recommendations

Story/Twincidence
  id
  pairId
  title
  content
  photos
  tags
  createdAt

ResearchConsent
  userId
  consentVersion
  acceptedAt
  withdrawnAt
```

---

## 11. Files Fable AI Should Read First

Start with these files in this order:

1. `package.json`
2. `app.json`
3. `CLAUDE.md`
4. `src/navigation/AppNavigator.tsx`
5. `src/state/twinStore.ts`
6. `src/state/authStore.ts`
7. `src/state/chatStore.ts`
8. `src/screens/OnboardingScreen.tsx`
9. `src/screens/HomeScreen.tsx`
10. `src/screens/PairScreen.tsx`
11. `src/screens/chat/TwinTalkScreen.tsx`
12. `src/screens/TwintuitionScreen.tsx`
13. `src/screens/TwinGamesHub.tsx`
14. `src/screens/games/CognitiveSyncMaze.tsx`
15. `src/screens/games/EmotionalResonanceMapping.tsx`
16. `src/screens/games/IconicDuoMatcher.tsx`
17. `src/screens/games/TemporalDecisionSync.tsx`
18. `src/screens/assessment/*`
19. `src/screens/premium/PremiumScreen.tsx`
20. `src/screens/research/*`
21. `src/services/chatService.ts`
22. `src/services/invitationService.ts`
23. `src/services/twintuitionService.ts`
24. `src/services/subscriptionService.ts`
25. `.bmad-mobile-app/*`
26. `docs/navigation-flow-documentation.md`
27. `docs/testing-and-build-strategy.md`
28. `docs/performance-analysis-report.md`

---

## 12. Important Implementation Notes

- The app’s visual identity is neon/cosmic and uses `assets/galaxybackground.png` heavily.
- Accent colors are controlled through `ThemeColor` values in `twinStore` and neon utility functions.
- `TwinProfile` includes fields for name, age, gender, orientation visibility, twin type, deceased twin flag, birth details, zodiac sign, profile picture, accent color, and connection state.
- Zodiac sign is auto-derived from birth date in `setUserProfile` and `setTwinProfile`.
- Games currently use the newer four-game model, not the older game names in some documentation.
- Stories are no longer separate navigation screens; they are meant to be integrated into Twincidence Log/Twintuition.
- The app has performance instrumentation built in, but it may add noise during development.
- Treat README status badges/claims as aspirational until validated by current CI/test output.

---

## 13. Concise Current Status

Twinship is a visually developed Expo/React Native app with a clear product concept and many screen scaffolds already registered. The strongest current pieces are the UI direction, app navigation skeleton, profile/twin state model, local persistence, pairing demo mode, chat UI, game result model, and assessment/research/premium screen architecture.

The main gap is production infrastructure. Pairing, chat, Twintuition alerts, research telemetry, authentication, and premium payments all appear to need real backend/service completion before the app can be considered production-ready.

---

## 14. Suggested First Prompt to Fable AI

```text
You are working on the Twinship React Native/Expo app in this repository. First read docs/FABLE_AI_HANDOFF.md, package.json, app.json, CLAUDE.md, src/navigation/AppNavigator.tsx, src/state/twinStore.ts, src/screens/HomeScreen.tsx, src/screens/PairScreen.tsx, and src/screens/chat/TwinTalkScreen.tsx.

Your first task is not to add features. Your first task is to verify the current app state by running install/typecheck/lint/tests/start, then produce a short report of actual build/runtime errors and the smallest safe fix plan to make the main MVP flow stable: auth/onboarding → pair twin → chat → send twintuition alert → play one game → view result.

Do not assume existing docs are fully current. Use the code as source of truth and update docs when you find drift.
```
