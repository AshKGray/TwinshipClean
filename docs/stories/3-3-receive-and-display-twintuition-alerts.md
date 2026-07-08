# Story 3.3: Receive and Display Twintuition Alerts

Status: drafted

## Story

As a **user receiving a Twintuition alert**,
I want **to see my twin's alert immediately with visual and push notifications**,
so that **I feel connected in real-time**.

## Acceptance Criteria

1. Incoming alerts trigger in-app banner notification if app is in foreground
2. In-app banner slides from top with smooth animation (60 FPS)
3. Banner displays: alert type icon, emotion icon, sender name, message preview (first 40 chars)
4. Banner auto-dismisses after 10 seconds if not interacted with
5. User can tap banner to view full alert details
6. User can swipe banner up to dismiss manually
7. Push notification sent if app is in background or closed
8. Push notification displays alert preview and sender name
9. Alert marked with receivedAt timestamp upon delivery
10. Alert stored in twintuitionStore and AsyncStorage
11. "Mark as Seen" action updates seenAt timestamp
12. Quick-reply option from notification navigates to AlertComposer with replyTo field populated

## Tasks / Subtasks

- [ ] **Task 1**: Create in-app notification banner component (AC: 1-3)
  - [ ] Create `src/components/twintuition/TwintuitionNotification.tsx`
  - [ ] Implement slide-down animation from top using React Native Reanimated
  - [ ] Display alert type icon (from alert.type)
  - [ ] Display emotion icon and color (from alert.emotion)
  - [ ] Display sender's name (from twinStore twin profile)
  - [ ] Display message preview (truncate to 40 chars with "...")
  - [ ] Style banner with galaxy theme, semi-transparent background
  - [ ] Position banner at top of screen (below status bar)

- [ ] **Task 2**: Implement banner interaction handlers (AC: 4-6)
  - [ ] Add auto-dismiss timer (10 seconds) using setTimeout
  - [ ] Clear timer if user interacts with banner
  - [ ] Implement tap handler to navigate to full alert detail
  - [ ] Implement PanGestureHandler for swipe-up dismiss
  - [ ] Animate banner out on dismiss (slide up)
  - [ ] Add haptic feedback on tap and swipe

- [ ] **Task 3**: Implement push notification handling (AC: 7-8)
  - [ ] Create `src/services/notificationService.ts`
  - [ ] Request push notification permissions on first launch
  - [ ] Implement `scheduleAlert()` method for background notifications
  - [ ] Configure notification payload with alert data
  - [ ] Display notification title: "{Twin Name} sent you a Twintuition alert"
  - [ ] Display notification body: Emotion + message preview
  - [ ] Handle notification tap to open app and navigate to alert detail
  - [ ] Mock notifications for development (local only, Epic 7 for Firebase)

- [ ] **Task 4**: Implement alert receive logic (AC: 9-10)
  - [ ] Add WebSocket listener in chatService for 'twintuition:incoming' event
  - [ ] Implement `receiveAlert()` in twintuitionService
  - [ ] Update alert with receivedAt timestamp
  - [ ] Save alert to twintuitionStore
  - [ ] Persist alert to AsyncStorage
  - [ ] Trigger appropriate notification (in-app or push based on app state)
  - [ ] Check for synchronicity detection (call synchronicity logic from Story 3.5)

- [ ] **Task 5**: Implement "Mark as Seen" functionality (AC: 11)
  - [ ] Add `markAlertSeen()` action to twintuitionStore
  - [ ] Update alert.seenAt with current timestamp
  - [ ] Save updated alert to AsyncStorage
  - [ ] Automatically mark as seen when user taps notification
  - [ ] Optionally mark as seen after 3 seconds of viewing detail

- [ ] **Task 6**: Implement quick-reply functionality (AC: 12)
  - [ ] Add "Reply" button to notification banner
  - [ ] Add "Reply" action to push notification
  - [ ] Navigate to AlertComposer with replyTo parameter
  - [ ] Pre-populate AlertComposer with same emotion and type (optional)
  - [ ] Link reply to original alert (alert.repliedTo field)

- [ ] **Task 7**: Update twintuitionStore for receiving (AC: 9-11)
  - [ ] Add `receiveAlert()` action
  - [ ] Add `markAlertSeen()` action
  - [ ] Add selector `getUnseenCount()` for badge count
  - [ ] Update AsyncStorage persistence middleware

- [ ] **Task 8**: Integrate with mock WebSocket (AC: 9)
  - [ ] Add listener in chatService for 'twintuition:incoming' event
  - [ ] Trigger receiveAlert when event received
  - [ ] Simulate realistic network latency (100-500ms)
  - [ ] Handle edge cases: duplicate alerts, out-of-order delivery

- [ ] **Task 9**: Write unit tests
  - [ ] Test alert receives and saves to store correctly
  - [ ] Test receivedAt timestamp is set
  - [ ] Test seenAt timestamp updates on mark seen
  - [ ] Test notification triggers for background/foreground states
  - [ ] Test banner auto-dismiss after 10 seconds
  - [ ] Test quick-reply navigation with replyTo

- [ ] **Task 10**: Write integration tests
  - [ ] Test complete receive flow: WebSocket → store → notification
  - [ ] Test banner displays with correct alert data
  - [ ] Test tap banner navigates to detail
  - [ ] Test swipe dismisses banner
  - [ ] Test push notification sent when app in background
  - [ ] Test mark as seen updates store and AsyncStorage

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- `twintuitionStore` manages all received alerts
- Alert added to store immediately upon receipt
- receivedAt and seenAt timestamps tracked separately
- AsyncStorage persists all received alerts

**Notification Strategy:**
```typescript
// Determine notification type based on app state
const appState = AppState.currentState;

if (appState === 'active') {
  // Show in-app banner
  showInAppBanner(alert);
} else {
  // Send push notification
  notificationService.scheduleAlert(alert);
}
```

**In-App Banner Component:**
```typescript
interface TwintuitionNotificationProps {
  alert: TwintuitionAlert;
  onDismiss: () => void;
  onTap: () => void;
}

const TwintuitionNotification: React.FC<TwintuitionNotificationProps> = ({
  alert,
  onDismiss,
  onTap
}) => {
  // Slide animation from top
  const translateY = useSharedValue(-100);

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(0);

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      translateY.value = withSpring(-100);
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // Render banner with alert data
};
```

**Push Notification Payload:**
```typescript
{
  title: `${twinName} sent you a Twintuition alert`,
  body: `${emotionLabel}: ${message.substring(0, 40)}...`,
  data: {
    alertId: alert.id,
    type: 'twintuition',
    senderId: alert.senderId
  },
  categoryIdentifier: 'TWINTUITION_ALERT',
  sound: 'default'
}
```

**WebSocket Listener:**
```typescript
// In chatService or twintuitionService
chatService.on('twintuition:incoming', (data) => {
  const alert: TwintuitionAlert = data.alert;

  // Add receivedAt timestamp
  alert.receivedAt = new Date().toISOString();

  // Save to store
  twintuitionStore.receiveAlert(alert);

  // Trigger notification
  if (AppState.currentState === 'active') {
    showInAppBanner(alert);
  } else {
    notificationService.scheduleAlert(alert);
  }

  // Check synchronicity (Story 3.5)
  twintuitionService.checkSynchronicity(alert);
});
```

**Mark as Seen Logic:**
```typescript
const markAlertSeen = (alertId: string) => {
  const alert = twintuitionStore.getAlertById(alertId);
  if (!alert || alert.seenAt) return; // Already seen

  const updatedAlert = {
    ...alert,
    seenAt: new Date().toISOString()
  };

  twintuitionStore.updateAlert(alertId, updatedAlert);
  // AsyncStorage updates automatically via persistence middleware
};
```

### Source Tree Components

**Files to Create:**
- `src/components/twintuition/TwintuitionNotification.tsx` - In-app banner component
- `src/services/notificationService.ts` - Push notification handling
- `src/screens/twintuition/AlertDetail.tsx` - Full alert detail screen

**Files to Modify:**
- `src/services/chatService.ts` - Add 'twintuition:incoming' listener
- `src/services/twintuitionService.ts` - Add receiveAlert() method
- `src/state/twintuitionStore.ts` - Add receiveAlert, markAlertSeen actions
- `src/navigation/AppNavigator.tsx` - Add AlertDetail route, handle deep links
- `App.tsx` - Add notification permission request on startup

**Design System Components to Use:**
- React Native Reanimated for slide animation
- React Native Gesture Handler for swipe gesture
- Expo Notifications for push notifications
- Expo Haptics for interaction feedback
- AppState API to detect foreground/background
- SafeAreaView for proper top inset

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/components/twintuition/TwintuitionNotification.test.tsx`
- `__tests__/services/notificationService.test.ts`
- `__tests__/services/twintuitionService.test.ts` (receiveAlert)
- `__tests__/state/twintuitionStore.test.ts` (receive actions)

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AppState API
- Mock expo-notifications
- Mock React Native Reanimated
- Mock setTimeout for auto-dismiss testing

**Key Test Scenarios:**
1. Alert received via WebSocket updates store with receivedAt
2. In-app banner displays when app is active
3. Push notification sent when app is background/inactive
4. Banner shows correct alert data (type, emotion, message preview)
5. Banner auto-dismisses after 10 seconds
6. Tap banner navigates to alert detail
7. Swipe gesture dismisses banner
8. Mark as seen updates seenAt timestamp
9. Quick-reply navigates to AlertComposer with replyTo
10. AsyncStorage persists received alerts

### Project Structure Notes

**Alignment with Unified Structure:**
- Components in `/src/components/twintuition/`
- Services in `/src/services/`
- State in `/src/state/`
- Screens in `/src/screens/twintuition/`
- Tests mirror source structure in `__tests__/`

**Banner Position:**
- Top of screen, below status bar
- SafeAreaView top inset respected
- Absolute positioning with zIndex: 1000
- Width: 90% of screen, centered horizontally

**Animation Timing:**
```typescript
{
  slideIn: 300ms (spring physics),
  slideOut: 200ms (spring physics),
  autoDismiss: 10000ms (10 seconds)
}
```

**Notification Permissions:**
- Request on first app launch
- Store permission status in AsyncStorage
- Re-prompt if user denies (with explanation)
- Graceful fallback to in-app only if permission denied

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] TwintuitionAlert interface
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Receive alert flow
- [Source: docs/tech-spec-epic-3.md#APIs-and-Interfaces] notificationService methods
- [Source: docs/tech-spec-epic-3.md#Dependencies-and-Integrations] expo-notifications integration
- [Source: docs/epics.md#Story-3.3] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Real-time alert requirements

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by story-context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

<!-- Links to debug logs will be added during implementation -->

### Completion Notes List

<!-- Implementation notes will be added here by dev agent -->

### File List

<!-- Files created/modified will be listed here by dev agent -->
