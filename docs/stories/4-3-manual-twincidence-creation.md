# Story 4.3: Manual Twincidence Creation

Status: drafted

## Story

As a **paired user**,
I want **to manually create and edit twincidences**,
so that **I can document moments the app didn't automatically detect**.

## Acceptance Criteria

1. Floating action button (FAB) on Twincidences timeline opens creation modal
2. Category selection from predefined list: ESP, Dream, Twin-Talk, Other
3. Title field (required, max 100 characters, real-time character count)
4. Description field (optional, rich text or markdown, max 2000 characters)
5. Photo picker: Up to 10 photos from camera or gallery with thumbnails
6. Video picker: Up to 3 videos, max 60 seconds each with duration display
7. Voice note recorder: Max 3 minutes with waveform visualization and playback
8. Date/time picker defaults to current time, editable for past events
9. Custom tags input (comma-separated, auto-suggest from existing tags)
10. "Save as Draft" and "Publish" buttons
11. Form validation prevents invalid submissions (title required, media within limits)
12. Draft auto-saved every 30 seconds to prevent data loss
13. Navigate back to timeline with new entry highlighted and scrolled into view
14. Edit existing manual twincidences with same form
15. Delete twincidences with confirmation dialog

## Tasks / Subtasks

- [ ] **Task 1**: Create CreateTwincidence modal screen (AC: 1)
  - [ ] Create `src/screens/twincidences/CreateTwincidenceScreen.tsx`
  - [ ] Display as modal (slide up animation)
  - [ ] Add close button (X) in top-left
  - [ ] Add galaxy background
  - [ ] Use KeyboardAvoidingView for form inputs
  - [ ] Add FAB component to TimelineTab:
    - Position: bottom-right, floating
    - Icon: Plus icon with neon glow
    - Haptic feedback on press
    - Navigate to CreateTwincidence modal

- [ ] **Task 2**: Implement category selection (AC: 2)
  - [ ] Create category selector component
  - [ ] Display 4 options: ESP, Dream, Twin-Talk, Other
  - [ ] Visual design: Cards with icons and names
  - [ ] Highlight selected category with neon glow
  - [ ] Map selections to TwincidenceCategory enum:
    - ESP → MANUAL_ESP
    - Dream → MANUAL_DREAM
    - Twin-Talk → MANUAL_TWIN_TALK
    - Other → MANUAL_OTHER

- [ ] **Task 3**: Implement title and description fields (AC: 3-4)
  - [ ] Title TextInput:
    - Placeholder: "Give your twincidence a title..."
    - Max 100 characters
    - Character counter below field (e.g., "75/100")
    - Required field indicator (red asterisk)
    - Validation error if empty on submit
  - [ ] Description TextInput:
    - Placeholder: "Describe what happened..."
    - Multiline with 8 lines visible
    - Max 2000 characters
    - Character counter
    - Optional markdown support (bold, italic, lists)
    - Auto-grow height as user types

- [ ] **Task 4**: Implement photo picker (AC: 5)
  - [ ] Create `src/components/twincidences/MediaPicker.tsx`
  - [ ] Photo picker features:
    - "Add Photos" button with camera icon
    - Opens expo-image-picker with options: camera or gallery
    - Multi-select up to 10 photos
    - Display thumbnails in horizontal ScrollView
    - Remove button on each thumbnail
    - Show count: "5/10 photos"
    - Compress images to max 1MB using expo-image-manipulator
  - [ ] Request camera and media library permissions
  - [ ] Handle permission denial gracefully

- [ ] **Task 5**: Implement video picker (AC: 6)
  - [ ] Video picker features:
    - "Add Video" button with video icon
    - Opens expo-image-picker for video
    - Limit to 3 videos
    - Max 60 seconds per video (validation)
    - Display thumbnails with play icon overlay
    - Show duration on thumbnail (e.g., "0:45")
    - Remove button on each thumbnail
    - Show count: "2/3 videos"
  - [ ] Validate video duration before adding
  - [ ] Show error if video > 60 seconds

- [ ] **Task 6**: Implement voice note recorder (AC: 7)
  - [ ] Create `src/components/twincidences/VoiceRecorder.tsx`
  - [ ] Voice recorder features:
    - "Record Voice Note" button with microphone icon
    - Record modal with waveform visualization (expo-av + react-native-svg)
    - Max 3 minutes recording time
    - Live timer during recording
    - Pause/resume buttons
    - Stop recording button
    - Playback controls after recording (play, pause, seek)
    - Delete recording option
    - Only 1 voice note per twincidence
  - [ ] Request microphone permission
  - [ ] Use expo-av for recording (Audio.Recording)
  - [ ] Save to app documents directory

- [ ] **Task 7**: Implement date/time picker (AC: 8)
  - [ ] Add date/time field
  - [ ] Default to current date/time
  - [ ] Tap opens native date/time picker
  - [ ] Allow selection of past dates (no future dates)
  - [ ] Display format: "Nov 18, 2025 at 3:45 PM"
  - [ ] Use @react-native-community/datetimepicker

- [ ] **Task 8**: Implement tags input (AC: 9)
  - [ ] Create tags input component
  - [ ] Comma-separated input field
  - [ ] Auto-suggest dropdown from existing tags (query twincidencesStore)
  - [ ] Display tags as chips below input
  - [ ] Remove tag on chip tap
  - [ ] Trim whitespace, convert to lowercase
  - [ ] Max 10 tags per twincidence

- [ ] **Task 9**: Implement form validation (AC: 11)
  - [ ] Validate on submit:
    - Title required (non-empty after trim)
    - Title max 100 characters
    - Description max 2000 characters
    - Photos max 10
    - Videos max 3, each max 60 seconds
    - Voice note max 3 minutes
    - Date not in future
  - [ ] Display validation errors below fields
  - [ ] Disable submit buttons until valid
  - [ ] Scroll to first error on submit

- [ ] **Task 10**: Implement save and draft functionality (AC: 10, 12)
  - [ ] "Save as Draft" button:
    - Saves to AsyncStorage with status: 'draft'
    - Does not appear in timeline
    - Accessible from drafts section
  - [ ] "Publish" button:
    - Creates Twincidence with status: 'published'
    - Adds to timeline
    - Calls twincidencesStore.createTwincidence()
  - [ ] Auto-save draft every 30 seconds:
    - Use useEffect with setInterval
    - Save to temporary AsyncStorage key
    - Clear temp key on publish or discard
  - [ ] Restore draft on screen reopen if exists

- [ ] **Task 11**: Implement navigation and highlighting (AC: 13)
  - [ ] On publish:
    - Close modal
    - Navigate to Timeline tab
    - Scroll to newly created twincidence
    - Highlight with animation (scale pulse, neon glow)
    - Haptic feedback (success)

- [ ] **Task 12**: Implement edit mode (AC: 14)
  - [ ] CreateTwincidence accepts optional twincidenceId param
  - [ ] If twincidenceId provided:
    - Load existing twincidence data
    - Populate all form fields
    - Change title to "Edit Twincidence"
    - Only allow editing manual twincidences
    - Update existing twincidence on save
  - [ ] Track edit in version history

- [ ] **Task 13**: Implement delete functionality (AC: 15)
  - [ ] Add "Delete" button in edit mode
  - [ ] Show confirmation dialog:
    - Title: "Delete Twincidence?"
    - Message: "This cannot be undone."
    - Buttons: "Cancel" and "Delete" (red)
  - [ ] On confirm:
    - Call twincidencesStore.deleteTwincidence(id)
    - Navigate back to timeline
    - Show toast: "Twincidence deleted"
    - Haptic feedback (warning)

- [ ] **Task 14**: Write unit tests
  - [ ] Test form validation logic (all rules)
  - [ ] Test category selection updates state
  - [ ] Test character counters accurate
  - [ ] Test media limit enforcement (10 photos, 3 videos)
  - [ ] Test tag parsing and chip display
  - [ ] Test auto-save timer triggers
  - [ ] Test draft save/load

- [ ] **Task 15**: Write integration tests
  - [ ] Test complete flow: Open modal → Fill form → Add media → Publish → Verify in timeline
  - [ ] Test draft flow: Create draft → Close → Reopen → Draft restored
  - [ ] Test edit flow: Edit existing → Update fields → Save → Verify changes
  - [ ] Test delete flow: Delete → Confirm → Verify removed from timeline
  - [ ] Test permission requests (camera, microphone, photos)

- [ ] **Task 16**: Write E2E tests
  - [ ] Test full creation: FAB → Category → Title → Photos → Publish → Timeline
  - [ ] Test validation: Submit without title → See error
  - [ ] Test media pickers: Add photo from gallery → Verify thumbnail
  - [ ] Test voice recorder: Record 10 seconds → Playback → Verify waveform

## Dev Notes

### Architecture Patterns and Constraints

**Form State Management:**
- Use local state (useState) for form fields
- Don't update store until publish
- Separate draft storage from published twincidences

**Media Handling:**
- Photos: expo-image-picker with compression
- Videos: expo-image-picker with duration validation
- Voice: expo-av for recording and playback
- Store media as URIs, copy to app documents directory

**Permissions Flow:**
```typescript
const requestCameraPermission = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Camera access is needed to add photos.');
  }
  return status === 'granted';
};
```

**Auto-Save Implementation:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (hasUnsavedChanges) {
      saveDraft();
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [formData]);
```

### Source Tree Components

**Files to Create:**
- `src/screens/twincidences/CreateTwincidenceScreen.tsx` - Main creation form
- `src/components/twincidences/MediaPicker.tsx` - Photo/video picker
- `src/components/twincidences/VoiceRecorder.tsx` - Voice recording component
- `src/components/twincidences/TagsInput.tsx` - Tag input with autocomplete
- `src/components/twincidences/FloatingActionButton.tsx` - FAB component

**Files to Modify:**
- `src/screens/twincidences/TimelineTab.tsx` - Add FAB
- `src/navigation/AppNavigator.tsx` - Add CreateTwincidence modal route

**Design System Components to Use:**
- Galaxy background for consistency
- NativeWind for form styling
- Expo Haptics for feedback
- Lucide React Native for icons

### Media Compression Settings

**Photos:**
- Max dimensions: 1920x1920
- Quality: 0.7
- Format: JPEG
- Max file size: 1MB

**Videos:**
- Max duration: 60 seconds
- Quality: medium
- No compression (rely on picker quality)

**Voice Notes:**
- Format: m4a (AAC)
- Bitrate: 128kbps
- Sample rate: 44100Hz
- Mono channel

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/twincidences/CreateTwincidenceScreen.test.tsx`
- `__tests__/components/twincidences/MediaPicker.test.tsx`
- `__tests__/components/twincidences/VoiceRecorder.test.tsx`
- `__tests__/components/twincidences/TagsInput.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock expo-image-picker, expo-av, expo-media-library
- Mock AsyncStorage for draft persistence

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens in `/src/screens/twincidences/`
- Components in `/src/components/twincidences/`
- Media stored in app documents directory
- Drafts stored in AsyncStorage with prefix `twinship:drafts:`

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-4.md#Data-Models-and-Contracts] MediaItem interface
- [Source: docs/tech-spec-epic-4.md#Acceptance-Criteria] AC-4.3 requirements
- [Source: docs/epics.md#Story-4.3] Epic story definition (8-9 hours)
- [Source: docs/Twinship PRD.md#Twincidences-Log] Manual entry requirements

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
