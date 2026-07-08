# Story 3.5: Simultaneous Alert Detection and Celebration

Status: drafted

## Story

As a **paired user**,
I want **to be notified when my twin and I send alerts at the same time**,
so that **we can celebrate our synchronicity and feel the magic of our connection**.

## Acceptance Criteria

1. Synchronicity detected when both twins send alerts within 5-minute window
2. SynchronicityEvent created with both alert IDs, time difference, and match metadata
3. Both alerts marked as isSynchronous: true
4. Synchronicity score calculated (0-100) based on time proximity, emotion match, type match
5. Special celebration animation plays for both users immediately upon detection
6. Celebration includes: particle effects (cosmic theme), haptic feedback (success pattern), optional sound effect
7. "Synchronicity Moment!" message displays with detailed information:
   - Time difference ("Both sent within 2 minutes!")
   - Emotion match indicator ("Both feeling Joy!")
   - Alert type match indicator ("Both sent Feelings")
8. Synchronicity badge appears on both alerts in history timeline
9. SynchronicityEvent stored separately in twintuitionStore for tracking
10. User's overall synchronicity score metric updated and recalculated

## Tasks / Subtasks

- [ ] **Task 1**: Implement synchronicity detection logic (AC: 1-4)
  - [ ] Add `checkSynchronicity()` method to twintuitionService
  - [ ] Query alerts sent/received in last 5 minutes when new alert arrives
  - [ ] Compare timestamps to find alerts within 5-minute window
  - [ ] Create SynchronicityEvent if match found
  - [ ] Calculate time difference in milliseconds
  - [ ] Detect emotion match (alert1.emotion === alert2.emotion)
  - [ ] Detect type match (alert1.type === alert2.type)
  - [ ] Calculate synchronicity score (0-100)

- [ ] **Task 2**: Implement synchronicity score calculation (AC: 4)
  - [ ] Create `calculateSynchronicityScore()` method
  - [ ] Base score on time proximity (closer = higher score)
  - [ ] Add bonus points for emotion match (+20 points)
  - [ ] Add bonus points for type match (+20 points)
  - [ ] Ensure score is in 0-100 range
  - [ ] Score formula: `(1 - timeDiff/5min) * 60 + emotionBonus + typeBonus`

- [ ] **Task 3**: Update alerts with synchronicity metadata (AC: 3)
  - [ ] Mark both alerts as isSynchronous: true
  - [ ] Add synchronicityEventId to both alerts
  - [ ] Update alerts in twintuitionStore
  - [ ] Persist updates to AsyncStorage

- [ ] **Task 4**: Create SynchronicityMoment celebration component (AC: 5-7)
  - [ ] Create `src/components/twintuition/SynchronicityMoment.tsx`
  - [ ] Implement particle effect animation using React Native Reanimated
  - [ ] Use cosmic theme: stars, sparkles, glow effects
  - [ ] Add success haptic feedback pattern (Expo Haptics)
  - [ ] Optional: Add celebration sound effect
  - [ ] Display "Synchronicity Moment!" title with animation
  - [ ] Show time difference in human-readable format
  - [ ] Show emotion match indicator with icons
  - [ ] Show type match indicator with icons
  - [ ] Auto-dismiss after 5 seconds or user tap

- [ ] **Task 5**: Integrate synchronicity check into alert flows (AC: 1)
  - [ ] Call checkSynchronicity() when sending alert (Story 3.2)
  - [ ] Call checkSynchronicity() when receiving alert (Story 3.3)
  - [ ] Trigger celebration if SynchronicityEvent created
  - [ ] Ensure both users see celebration (via WebSocket event)

- [ ] **Task 6**: Add synchronicity badge to AlertCard (AC: 8)
  - [ ] Modify AlertCard component to show sync badge
  - [ ] Display "Sync Moment" badge with icon
  - [ ] Add glow effect using shadows or gradient
  - [ ] Badge should be visually distinct (top-right corner)
  - [ ] Tap badge to view synchronicity details

- [ ] **Task 7**: Store SynchronicityEvent separately (AC: 9)
  - [ ] Add synchronicityEvents array to twintuitionStore
  - [ ] Add `addSynchronicityEvent()` action
  - [ ] Add `getSynchronicityEvents()` selector
  - [ ] Persist events to AsyncStorage
  - [ ] Link events to their corresponding alerts

- [ ] **Task 8**: Update user synchronicity score (AC: 10)
  - [ ] Calculate overall synchronicity rate (% of alerts that are synchronous)
  - [ ] Add `getSynchronicityScore()` selector
  - [ ] Update score whenever new sync event occurs
  - [ ] Display score in user profile or insights dashboard

- [ ] **Task 9**: Send synchronicity notification to twin (AC: 5)
  - [ ] Emit WebSocket event when synchronicity detected
  - [ ] Event: 'twintuition:synchronicity' with SynchronicityEvent data
  - [ ] Trigger celebration on both devices simultaneously
  - [ ] Handle edge case: both users detect sync (avoid duplicate celebrations)

- [ ] **Task 10**: Write unit tests
  - [ ] Test synchronicity detection with 5-minute window (within/outside)
  - [ ] Test score calculation with all combinations (time, emotion, type)
  - [ ] Test alerts marked as isSynchronous correctly
  - [ ] Test SynchronicityEvent created with correct metadata
  - [ ] Test synchronicity score updates correctly
  - [ ] Test edge cases: duplicate events, simultaneous detection

- [ ] **Task 11**: Write integration tests
  - [ ] Test complete flow: send alert → receive twin alert → sync detected → celebration
  - [ ] Test celebration animation plays
  - [ ] Test both alerts updated with sync metadata
  - [ ] Test sync badge appears in alert history
  - [ ] Test synchronicity score recalculated

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- `twintuitionStore` maintains separate arrays for alerts and synchronicityEvents
- Alerts linked to events via synchronicityEventId field
- Synchronicity detection runs on both send and receive

**5-Minute Window Logic:**
```typescript
const SYNC_WINDOW_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

const checkSynchronicity = (newAlert: TwintuitionAlert): SynchronicityEvent | null => {
  const now = new Date(newAlert.sentAt).getTime();
  const windowStart = now - SYNC_WINDOW_MS;
  const windowEnd = now + SYNC_WINDOW_MS;

  // Query alerts in window
  const recentAlerts = twintuitionStore.getAlertHistory({
    startDate: new Date(windowStart).toISOString(),
    endDate: new Date(windowEnd).toISOString()
  });

  // Find matching alert from twin
  const twinAlert = recentAlerts.find(alert =>
    alert.senderId === newAlert.receiverId && // From our twin
    alert.id !== newAlert.id && // Not the same alert
    !alert.synchronicityEventId // Not already part of sync event
  );

  if (!twinAlert) return null;

  // Create synchronicity event
  return createSynchronicityEvent(newAlert, twinAlert);
};
```

**Synchronicity Score Formula:**
```typescript
const calculateSynchronicityScore = (event: SynchronicityEvent): number => {
  const MAX_TIME_DIFF = 5 * 60 * 1000; // 5 minutes
  const timeDiff = event.timeDifference;

  // Base score: closer in time = higher score (0-60 points)
  const timeScore = (1 - (timeDiff / MAX_TIME_DIFF)) * 60;

  // Bonus points
  const emotionBonus = event.emotionMatch ? 20 : 0;
  const typeBonus = event.typeMatch ? 20 : 0;

  // Total: 0-100
  return Math.round(timeScore + emotionBonus + typeBonus);
};

// Examples:
// - Simultaneous (0ms), emotion + type match: 60 + 20 + 20 = 100 (perfect sync!)
// - 2 minutes apart, emotion match, different type: 36 + 20 + 0 = 56
// - 4 minutes apart, no matches: 12 + 0 + 0 = 12 (low sync)
```

**SynchronicityEvent Structure:**
```typescript
interface SynchronicityEvent {
  id: string;                      // UUID v4
  alert1Id: string;                // First alert (earlier timestamp)
  alert2Id: string;                // Second alert (later timestamp)
  timeDifference: number;          // Milliseconds between alerts
  detectedAt: string;              // ISO 8601 timestamp
  emotionMatch: boolean;           // Same emotion?
  typeMatch: boolean;              // Same type?
  score: number;                   // 0-100 synchronicity strength
  celebrated: boolean;             // Whether celebration shown
}
```

**Celebration Animation:**
```typescript
const SynchronicityMoment: React.FC<{ event: SynchronicityEvent }> = ({ event }) => {
  // Particle animation
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: useSharedValue(Math.random() * 300),
    y: useSharedValue(Math.random() * 500),
    opacity: useSharedValue(1)
  }));

  useEffect(() => {
    // Animate particles
    particles.forEach(p => {
      p.opacity.value = withTiming(0, { duration: 3000 });
      p.y.value = withTiming(p.y.value - 200, { duration: 3000 });
    });

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);

    // Optional sound
    // playSound('synchronicity.mp3');
  }, []);

  return (
    <View className="absolute inset-0 items-center justify-center bg-black/50">
      {/* Particle effects */}
      {particles.map(p => (
        <Animated.View key={p.id} style={[{ position: 'absolute', left: p.x, top: p.y }]}>
          <Icon name="star" color="#FFD700" size={20} />
        </Animated.View>
      ))}

      {/* Message */}
      <View className="bg-stellar-blue/90 rounded-2xl p-6">
        <Text className="text-white text-2xl font-bold mb-4">✨ Synchronicity Moment! ✨</Text>
        <Text className="text-white text-lg">
          Both sent within {formatTimeDifference(event.timeDifference)}!
        </Text>
        {event.emotionMatch && (
          <Text className="text-white text-lg">Both feeling {emotionLabel}!</Text>
        )}
        {event.typeMatch && (
          <Text className="text-white text-lg">Both sent {typeLabel}s!</Text>
        )}
        <Text className="text-white/70 text-sm mt-4">Synchronicity Score: {event.score}</Text>
      </View>
    </View>
  );
};
```

**WebSocket Synchronicity Event:**
```typescript
// When synchronicity detected on one device
chatService.emit('twintuition:synchronicity', {
  event: synchronicityEvent,
  to: twinId
});

// Listener on both devices
chatService.on('twintuition:synchronicity', (data) => {
  const event: SynchronicityEvent = data.event;

  // Mark event as celebrated to avoid duplicates
  if (twintuitionStore.isSyncEventCelebrated(event.id)) return;

  // Show celebration
  showSynchronicityMoment(event);

  // Update store
  twintuitionStore.addSynchronicityEvent(event);
  twintuitionStore.markSyncEventCelebrated(event.id);
});
```

**Overall Synchronicity Score:**
```typescript
const getSynchronicityScore = (): number => {
  const allAlerts = twintuitionStore.getAlerts();
  const syncAlerts = allAlerts.filter(a => a.isSynchronous);

  if (allAlerts.length === 0) return 0;

  // Percentage of alerts that are synchronous
  const syncRate = (syncAlerts.length / allAlerts.length) * 100;

  return Math.round(syncRate);
};

// Example: 10 alerts total, 3 synchronous → 30% synchronicity rate
```

### Source Tree Components

**Files to Create:**
- `src/components/twintuition/SynchronicityMoment.tsx` - Celebration animation
- `src/components/twintuition/SyncBadge.tsx` - Badge for alert cards

**Files to Modify:**
- `src/services/twintuitionService.ts` - Add checkSynchronicity, calculateScore
- `src/state/twintuitionStore.ts` - Add synchronicityEvents array, actions, selectors
- `src/components/twintuition/AlertCard.tsx` - Add sync badge display
- `src/services/chatService.ts` - Add 'twintuition:synchronicity' event

**Design System Components to Use:**
- React Native Reanimated for particle animations
- Expo Haptics for success feedback
- Expo Vector Icons for sparkle/star icons
- NativeWind for styling
- Optional: expo-av for sound effects

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/services/twintuitionService.test.ts` (checkSynchronicity, calculateScore)
- `__tests__/components/twintuition/SynchronicityMoment.test.tsx`
- `__tests__/state/twintuitionStore.test.ts` (sync events)

**Testing Framework:**
- Jest + React Native Testing Library
- Mock Date for deterministic timestamp testing
- Mock Haptics and sound effects
- Mock Reanimated for animation testing

**Key Test Scenarios:**
1. Synchronicity detected when alerts within 5 minutes
2. No synchronicity when alerts > 5 minutes apart
3. Score calculation correct for all combinations:
   - Simultaneous + emotion + type match = 100
   - 2 min + emotion match = 56
   - 5 min + no matches = 0-12
4. Both alerts marked as isSynchronous
5. SynchronicityEvent created with correct metadata
6. Celebration animation plays
7. Sync badge appears on alerts in history
8. Overall synchronicity score updates correctly
9. Duplicate sync events prevented
10. WebSocket event triggers celebration on twin's device

### Project Structure Notes

**Alignment with Unified Structure:**
- Components in `/src/components/twintuition/`
- Services in `/src/services/`
- State in `/src/state/`
- Tests mirror source structure in `__tests__/`

**Particle Effect Design:**
- 20-30 particles (stars, sparkles)
- Start from center, expand outward
- Fade out over 3 seconds
- Gold/yellow color (#FFD700)
- Randomized positions and velocities

**Haptic Pattern:**
```typescript
// Heavy impact on appear
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification after 200ms
setTimeout(() => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}, 200);
```

**Sync Badge Style:**
```
[⚡ Sync Moment]
- Top-right corner of alert card
- Blue glow (#4A9FFF with shadow)
- Small icon + text
- Tap to view sync event details
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] SynchronicityEvent interface
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Synchronicity detection flow
- [Source: docs/tech-spec-epic-3.md#APIs-and-Interfaces] checkSynchronicity method
- [Source: docs/epics.md#Story-3.5] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Synchronicity requirements

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
