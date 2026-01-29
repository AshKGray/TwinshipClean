# Story 4.2: Twincidences Timeline View

Status: drafted

## Story

As a **paired user**,
I want **to view all twincidences in a chronological timeline**,
so that **I can see our connection patterns over time and explore our synchronicity history**.

## Acceptance Criteria

1. Main Twincidences screen with tab navigation (Timeline, Analytics, Settings)
2. Timeline tab displays reverse chronological feed (newest first) using FlatList
3. Twincidence cards display: category icon, timestamp, title, excerpt (first 100 chars of description)
4. Visual distinction between automatic (badge with detection icon) and manual (user icon) entries
5. Category-specific accent colors and icons (neon glow for automated, subtle for manual)
6. Tap card navigates to TwincidenceDetail screen
7. Infinite scroll loads 20 items at a time (pagination)
8. Month/year section headers for chronological organization
9. Pull-to-refresh triggers detection check (calls detection services) and reloads list
10. Empty state with encouragement text and "Create Your First Twincidence" button
11. Maintains 60 FPS scrolling performance with optimized rendering
12. Loading skeleton screens while initial data loads

## Tasks / Subtasks

- [ ] **Task 1**: Create main Twincidences screen with tab navigation (AC: 1)
  - [ ] Create `src/screens/twincidences/TwincidencesScreen.tsx`
  - [ ] Implement Tab.Navigator with 3 tabs: Timeline, Analytics, Settings
  - [ ] Use galaxy background and cosmic theme
  - [ ] Add header with "Twincidences" title and info icon
  - [ ] Configure tab bar with galaxy-themed styling

- [ ] **Task 2**: Implement Timeline tab component (AC: 2, 7-9)
  - [ ] Create `src/screens/twincidences/TimelineTab.tsx`
  - [ ] Use FlatList with optimized configuration:
    - getItemLayout for known heights (performance)
    - initialNumToRender: 10
    - maxToRenderPerBatch: 10
    - windowSize: 5
  - [ ] Implement pagination: Load 20 items per page
  - [ ] Add RefreshControl for pull-to-refresh
  - [ ] Add month/year SectionList headers
  - [ ] Handle empty state with custom component

- [ ] **Task 3**: Create TwincidenceCard component (AC: 3-5)
  - [ ] Create `src/components/twincidences/TwincidenceCard.tsx`
  - [ ] Display fields:
    - Category icon (left side, 40x40 with neon glow)
    - Title (bold, 18pt, neon accent color)
    - Timestamp (relative time: "2 hours ago", secondary text)
    - Excerpt (first 100 chars + "..." if longer)
    - Detection type badge ("Auto" or user avatar for manual)
  - [ ] Implement category-specific styling:
    - TWINTUITION_SYNC: Purple glow, lightning icon
    - BIOMETRIC_SYNC: Red glow, heart icon
    - LOCATION_COINCIDENCE: Blue glow, map pin icon
    - MANUAL_*: Accent color, user icon
  - [ ] Add press animation (scale down on press)
  - [ ] Add haptic feedback on press

- [ ] **Task 4**: Implement section headers for date grouping (AC: 8)
  - [ ] Create `src/components/twincidences/DateSectionHeader.tsx`
  - [ ] Group twincidences by month/year
  - [ ] Display format: "November 2025", "October 2025", etc.
  - [ ] Sticky headers (remain visible while scrolling section)
  - [ ] Galaxy-themed styling with semi-transparent background

- [ ] **Task 5**: Create empty state component (AC: 10)
  - [ ] Create `src/components/twincidences/EmptyState.tsx`
  - [ ] Display:
    - Large icon (stars or constellation)
    - Title: "No Twincidences Yet"
    - Subtitle: "Start logging your twin connection moments!"
    - "Create Your First Twincidence" button (neon glow)
  - [ ] Button navigates to CreateTwincidence modal

- [ ] **Task 6**: Implement infinite scroll pagination (AC: 7)
  - [ ] Calculate total pages based on twincidences.length / 20
  - [ ] Track current page in component state
  - [ ] Add onEndReached handler to load next page
  - [ ] Show loading indicator at bottom while loading
  - [ ] Prevent multiple simultaneous loads

- [ ] **Task 7**: Implement pull-to-refresh (AC: 9)
  - [ ] Add RefreshControl to FlatList
  - [ ] On refresh:
    - Call detection services to check for new automatic twincidences
    - Reload twincidences from store
    - Show refreshing indicator
  - [ ] Add haptic feedback on refresh start

- [ ] **Task 8**: Optimize rendering performance (AC: 11)
  - [ ] Use React.memo for TwincidenceCard
  - [ ] Implement getItemLayout to avoid dynamic height calculation
  - [ ] Use keyExtractor with twincidence.id
  - [ ] Avoid inline function definitions in render
  - [ ] Profile FPS during scrolling (React Native Performance Monitor)

- [ ] **Task 9**: Add loading states (AC: 12)
  - [ ] Create `src/components/twincidences/TwincidenceSkeleton.tsx`
  - [ ] Display 5 skeleton cards while loading
  - [ ] Animated shimmer effect using React Native Reanimated
  - [ ] Match TwincidenceCard layout

- [ ] **Task 10**: Wire up navigation (AC: 6)
  - [ ] Add onPress handler to TwincidenceCard
  - [ ] Navigate to TwincidenceDetail screen with twincidenceId param
  - [ ] Implement back navigation from detail screen

- [ ] **Task 11**: Write unit tests
  - [ ] Test TwincidenceCard renders all fields correctly
  - [ ] Test category-specific styling applied
  - [ ] Test automatic vs manual badge display
  - [ ] Test excerpt truncation (100 chars + "...")
  - [ ] Test empty state displays when no twincidences
  - [ ] Test pagination logic (20 items per page)
  - [ ] Test date grouping algorithm

- [ ] **Task 12**: Write integration tests
  - [ ] Test timeline loads with sample data
  - [ ] Test pull-to-refresh triggers reload
  - [ ] Test infinite scroll loads next page
  - [ ] Test navigation to detail screen
  - [ ] Test performance with 1000+ twincidences

- [ ] **Task 13**: Write E2E tests
  - [ ] Test full flow: Open timeline → Scroll → Tap card → View detail
  - [ ] Test empty state → Create twincidence → Appears in timeline
  - [ ] Test pull-to-refresh animation

## Dev Notes

### Architecture Patterns and Constraints

**FlatList Performance Optimization:**
- `getItemLayout`: Provide exact item height (avoid dynamic measurement)
- `keyExtractor`: Use stable IDs for efficient diffing
- `windowSize`: Reduce to 5 (fewer items rendered off-screen)
- `maxToRenderPerBatch`: Limit to 10 for smooth scrolling
- `removeClippedSubviews`: Enable for Android performance

**Date Grouping Strategy:**
- Group twincidences by month/year using reduce()
- Convert to SectionList data format
- Section headers sticky for context while scrolling

**Category Icon Mapping:**
```typescript
const CATEGORY_ICONS = {
  TWINTUITION_SYNC: 'zap',
  BIOMETRIC_SYNC: 'heart-pulse',
  LOCATION_COINCIDENCE: 'map-pin',
  MANUAL_ESP: 'brain',
  MANUAL_DREAM: 'moon',
  MANUAL_TWIN_TALK: 'message-circle',
  MANUAL_OTHER: 'sparkles'
};

const CATEGORY_COLORS = {
  TWINTUITION_SYNC: '#A78BFA', // Purple
  BIOMETRIC_SYNC: '#FB7185',   // Red
  LOCATION_COINCIDENCE: '#60A5FA', // Blue
  MANUAL_ESP: '#C084FC',       // Violet
  MANUAL_DREAM: '#818CF8',     // Indigo
  MANUAL_TWIN_TALK: '#34D399', // Green
  MANUAL_OTHER: '#FBBF24'      // Amber
};
```

### Source Tree Components

**Files to Create:**
- `src/screens/twincidences/TwincidencesScreen.tsx` - Main screen with tabs
- `src/screens/twincidences/TimelineTab.tsx` - Timeline FlatList
- `src/components/twincidences/TwincidenceCard.tsx` - List item component
- `src/components/twincidences/DateSectionHeader.tsx` - Month/year headers
- `src/components/twincidences/EmptyState.tsx` - No data state
- `src/components/twincidences/TwincidenceSkeleton.tsx` - Loading skeleton

**Files to Modify:**
- `src/navigation/AppNavigator.tsx` - Add Twincidences screen to tab navigator

**Design System Components to Use:**
- Galaxy background: `require("../../assets/galaxybackground.png")`
- NativeWind for styling
- Lucide React Native for icons
- SafeAreaView for proper insets
- Expo Haptics for feedback

### Performance Benchmarks

**Target Metrics:**
- Initial load: < 500ms for 20 twincidences
- Scroll FPS: 60 FPS constant
- Pagination load: < 200ms for next 20
- Pull-to-refresh: < 1 second
- Memory: < 100MB for 1000 twincidences

**Optimization Techniques:**
- Memoize card rendering with React.memo
- Use useMemo for expensive calculations (date grouping)
- Lazy load images with placeholder
- Virtualize list with FlatList windowing

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/twincidences/TimelineTab.test.tsx`
- `__tests__/components/twincidences/TwincidenceCard.test.tsx`
- `__tests__/components/twincidences/DateSectionHeader.test.tsx`
- `__tests__/components/twincidences/EmptyState.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock navigation using @react-navigation/native mock
- Mock twincidencesStore with sample data
- Performance profiling with React DevTools Profiler

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens in `/src/screens/twincidences/`
- Components in `/src/components/twincidences/`
- Tests co-located: `__tests__/` mirroring source

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-4.md#Detailed-Design] Timeline view design
- [Source: docs/tech-spec-epic-4.md#Acceptance-Criteria] AC-4.2 requirements
- [Source: docs/epics.md#Story-4.2] Epic story definition (6-7 hours)
- [Source: docs/tech-spec-epic-1.md] Navigation patterns from Epic 1
- [Source: docs/performance-optimization-plan.md] FlatList optimization best practices

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
