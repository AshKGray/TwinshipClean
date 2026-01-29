# Story 3.2: Send Twintuition Alert with Emotion Recognition

Status: drafted

## Story

As a **user sending a Twintuition alert**,
I want **to select an emotion and send an alert to my twin**,
so that **my twin knows I'm thinking of them and what I'm feeling**.

## Acceptance Criteria

1. EmotionPalette displays 8 emotions in grid layout (2x4 or 4x2)
2. Each emotion shows icon, name, and color
3. User can select one primary emotion (tap to select, selected state visible)
4. Intensity slider ranges from 1-10 with clear labels ("Low" to "High")
5. Optional message input with 100-character limit and live counter
6. Real-time character count displays remaining characters (e.g., "42 remaining")
7. Preview card shows complete alert before sending (type, emotion, intensity, message)
8. Send button triggers validation and sends alert via mock WebSocket
9. Confirmation animation and haptic feedback on successful send
10. Alert saved to twintuitionStore and AsyncStorage
11. Alert sent via mock WebSocket to twin's device
12. Error handling for validation failures with clear, actionable messages

## Tasks / Subtasks

- [ ] **Task 1**: Create EmotionPalette component (AC: 1-3)
  - [ ] Create `src/components/twintuition/EmotionPalette.tsx`
  - [ ] Define 8 emotions with icons and colors (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
  - [ ] Create grid layout (2x4 or 4x2 depending on screen orientation)
  - [ ] Implement EmotionCard component with icon, name, color
  - [ ] Add tap handler for emotion selection
  - [ ] Add visual selected state (border, scale, glow)
  - [ ] Add haptic feedback on selection
  - [ ] Ensure only one emotion can be selected at a time

- [ ] **Task 2**: Implement intensity slider (AC: 4)
  - [ ] Add Slider component from react-native or custom implementation
  - [ ] Configure slider: min=1, max=10, step=1
  - [ ] Add labels: "Low" (left), "High" (right)
  - [ ] Display current intensity value above slider
  - [ ] Add haptic feedback on value change
  - [ ] Style slider thumb and track with galaxy theme

- [ ] **Task 3**: Implement optional message input (AC: 5-6)
  - [ ] Add TextInput for message (multiline, max 100 characters)
  - [ ] Implement character counter with live updates
  - [ ] Display remaining characters (100 - currentLength)
  - [ ] Visual feedback when approaching limit (change color at 90 chars)
  - [ ] Prevent input beyond 100 characters
  - [ ] Add placeholder: "Add a message (optional)"

- [ ] **Task 4**: Create alert preview card (AC: 7)
  - [ ] Create `src/components/twintuition/AlertPreview.tsx`
  - [ ] Display: alert type icon, emotion icon, intensity level
  - [ ] Display message preview (if provided)
  - [ ] Show preview before send button
  - [ ] Style preview card with galaxy theme

- [ ] **Task 5**: Implement send functionality (AC: 8-11)
  - [ ] Create `src/services/twintuitionService.ts`
  - [ ] Implement `sendAlert()` method with validation
  - [ ] Validate: emotion selected, intensity 1-10, message ≤ 100 chars
  - [ ] Create TwintuitionAlert object with UUID, timestamp
  - [ ] Save alert to twintuitionStore
  - [ ] Persist alert to AsyncStorage
  - [ ] Send alert via mock WebSocket (chatService)
  - [ ] Handle send success and errors

- [ ] **Task 6**: Implement confirmation and error handling (AC: 9, 12)
  - [ ] Create success confirmation animation (checkmark, fade out)
  - [ ] Add success haptic feedback pattern
  - [ ] Display "Alert Sent!" message
  - [ ] Navigate back to previous screen after 1.5 seconds
  - [ ] Implement error message component for validation failures
  - [ ] Display specific errors: "Please select an emotion", "Message too long"
  - [ ] Allow user to correct and retry

- [ ] **Task 7**: Create twintuitionStore (AC: 10)
  - [ ] Create `src/state/twintuitionStore.ts` with Zustand
  - [ ] Define state: alerts array, selected type, selected emotion, intensity
  - [ ] Implement actions: sendAlert, setEmotion, setIntensity, setMessage
  - [ ] Add AsyncStorage persistence middleware
  - [ ] Implement selectors: getAlerts, getUnseenCount

- [ ] **Task 8**: Integrate with mock WebSocket (AC: 11)
  - [ ] Use existing chatService mock WebSocket (EventEmitter)
  - [ ] Emit 'twintuition:send' event with alert data
  - [ ] Add simulated network delay (100-500ms)
  - [ ] Handle mock delivery confirmation

- [ ] **Task 9**: Write unit tests
  - [ ] Test emotion selection updates state correctly
  - [ ] Test intensity slider validates range (1-10)
  - [ ] Test message length validation (max 100 chars)
  - [ ] Test alert object creation with correct fields
  - [ ] Test AsyncStorage save operation
  - [ ] Test validation error messages display correctly

- [ ] **Task 10**: Write integration tests
  - [ ] Test complete send flow: select emotion → set intensity → enter message → send
  - [ ] Test alert saved to store and AsyncStorage
  - [ ] Test mock WebSocket emits alert
  - [ ] Test confirmation animation plays
  - [ ] Test error handling for invalid inputs

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Zustand `twintuitionStore` manages alert composition state
- State persists across navigation (draft alerts)
- Clear state after successful send
- AsyncStorage persistence for sent alerts only

**Emotion Definitions:**
```typescript
type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'anticipation';

interface EmotionMetadata {
  emotion: EmotionType;
  label: string;
  icon: IconName;
  color: string;
  description: string;
}

const EMOTIONS: EmotionMetadata[] = [
  { emotion: 'joy', label: 'Joy', icon: 'happy', color: '#FFD700', description: 'Happy, excited, delighted' },
  { emotion: 'sadness', label: 'Sadness', icon: 'sad', color: '#4A90E2', description: 'Sad, down, melancholy' },
  { emotion: 'anger', label: 'Anger', icon: 'flame', color: '#E74C3C', description: 'Frustrated, annoyed, upset' },
  { emotion: 'fear', label: 'Fear', icon: 'warning', color: '#9B59B6', description: 'Anxious, worried, scared' },
  { emotion: 'surprise', label: 'Surprise', icon: 'flash', color: '#F39C12', description: 'Shocked, amazed, astonished' },
  { emotion: 'disgust', label: 'Disgust', icon: 'close-circle', color: '#16A085', description: 'Repulsed, uncomfortable' },
  { emotion: 'trust', label: 'Trust', icon: 'checkmark-circle', color: '#27AE60', description: 'Safe, confident, secure' },
  { emotion: 'anticipation', label: 'Anticipation', icon: 'hourglass', color: '#E67E22', description: 'Eager, hopeful, looking forward' }
];
```

**Alert Object Structure:**
```typescript
interface TwintuitionAlert {
  id: string;                    // UUID v4
  type: 'feeling' | 'thought' | 'action';
  emotion: EmotionType;
  intensity: number;             // 1-10
  message?: string;              // Optional, max 100 chars
  senderId: string;              // Current user ID
  receiverId: string;            // Twin's user ID
  sentAt: string;                // ISO 8601 timestamp
  receivedAt?: string;           // Null until received
  seenAt?: string;               // Null until seen
  isSynchronous: boolean;        // False initially, updated if sync detected
}
```

**Validation Rules:**
```typescript
const validateAlert = (draft: AlertDraft): ValidationResult => {
  const errors: string[] = [];

  if (!draft.emotion) {
    errors.push('Please select an emotion');
  }

  if (draft.intensity < 1 || draft.intensity > 10) {
    errors.push('Intensity must be between 1 and 10');
  }

  if (draft.message && draft.message.length > 100) {
    errors.push('Message must be 100 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
```

**Mock WebSocket Integration:**
```typescript
// Use existing chatService from Epic 2
import { chatService } from '@/services/chatService';

// Send alert
chatService.emit('twintuition:send', {
  alert: alertObject,
  to: twinId
});

// Simulate delivery with delay
setTimeout(() => {
  // Mock delivery confirmation
  chatService.emit('twintuition:delivered', {
    alertId: alertObject.id
  });
}, Math.random() * 400 + 100); // 100-500ms delay
```

### Source Tree Components

**Files to Create:**
- `src/components/twintuition/EmotionPalette.tsx` - 8-emotion grid selector
- `src/components/twintuition/EmotionCard.tsx` - Individual emotion option
- `src/components/twintuition/AlertPreview.tsx` - Preview card before sending
- `src/components/twintuition/AlertComposer.tsx` - Main composition screen
- `src/services/twintuitionService.ts` - Alert sending logic
- `src/state/twintuitionStore.ts` - Twintuition state management

**Files to Modify:**
- `src/screens/twintuition/TwintuitionScreen.tsx` - Navigate to AlertComposer after type selection
- `src/services/chatService.ts` - Add twintuition event handlers
- `src/types/index.ts` - Add EmotionType, TwintuitionAlert types

**Design System Components to Use:**
- Galaxy background for consistency
- NativeWind classes for styling
- React Native Slider or @react-native-community/slider
- React Native Reanimated for confirmation animation
- Expo Haptics for feedback
- TextInput with multiline support

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/components/twintuition/EmotionPalette.test.tsx`
- `__tests__/components/twintuition/AlertComposer.test.tsx`
- `__tests__/services/twintuitionService.test.ts`
- `__tests__/state/twintuitionStore.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock AsyncStorage using @react-native-async-storage/async-storage mock
- Mock chatService for WebSocket testing
- Mock uuid for deterministic IDs

**Key Test Scenarios:**
1. Emotion selection updates store state
2. Intensity slider value changes correctly (1-10 range)
3. Message input enforces 100-character limit
4. Character counter displays correctly
5. Validation catches missing emotion, invalid intensity, long message
6. Alert object created with correct structure and fields
7. AsyncStorage saves alert after send
8. Mock WebSocket emits alert with correct data
9. Confirmation animation plays on success
10. Error messages display for validation failures

### Project Structure Notes

**Alignment with Unified Structure:**
- Components in `/src/components/twintuition/`
- Services in `/src/services/`
- State in `/src/state/`
- Tests mirror source structure in `__tests__/`

**Emotion Color Palette:**
```typescript
{
  joy:          '#FFD700',  // Gold - bright, cheerful
  sadness:      '#4A90E2',  // Blue - calm, melancholic
  anger:        '#E74C3C',  // Red - intense, passionate
  fear:         '#9B59B6',  // Purple - mysterious, anxious
  surprise:     '#F39C12',  // Orange - energetic, unexpected
  disgust:      '#16A085',  // Teal - complex, uncomfortable
  trust:        '#27AE60',  // Green - safe, reliable
  anticipation: '#E67E22'   // Dark orange - eager, excited
}
```

**Character Counter Logic:**
```typescript
const remaining = 100 - message.length;
const color = remaining < 10 ? 'text-red-400' : 'text-gray-400';
// Display: "42 remaining" or "9 remaining" (red)
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] TwintuitionAlert interface
- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] EmotionType enum
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Send alert flow
- [Source: docs/tech-spec-epic-3.md#APIs-and-Interfaces] twintuitionService methods
- [Source: docs/tech-spec-epic-3.md#Dependencies-and-Integrations] Mock WebSocket integration
- [Source: docs/epics.md#Story-3.2] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Emotion recognition requirements

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
