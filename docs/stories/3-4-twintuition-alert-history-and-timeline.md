# Story 3.4: Twintuition Alert History and Timeline

Status: drafted

## Story

As a **paired user**,
I want **to view all past Twintuition alerts in a chronological timeline**,
so that **I can see our connection patterns over time and revisit meaningful moments**.

## Acceptance Criteria

1. Chronological list of all sent and received alerts (newest first)
2. Filter by alert type (All, Feeling, Thought, Action)
3. Filter by date range (Last day, Last week, Last month, All time, Custom range)
4. Filter by emotion (All, or select specific emotion from 8 options)
5. Filter for synchronous alerts only (toggle switch)
6. Each alert card displays: type icon, emotion icon/color, message preview, relative timestamp
7. Relative timestamps use human-readable format ("2 hours ago", "Yesterday", "March 15")
8. Visual badge/indicator for synchronous alerts ("Sync Moment" icon with glow)
9. FlatList with pagination (load 20 alerts per page)
10. Infinite scroll loads older alerts as user scrolls to bottom
11. Tap alert card to navigate to full detail view
12. Empty state message if no alerts match current filters ("No alerts found")

## Tasks / Subtasks

- [ ] **Task 1**: Create TwintuitionHistory screen (AC: 1, 6-7)
  - [ ] Create `src/screens/twintuition/TwintuitionHistory.tsx`
  - [ ] Implement FlatList to display alert cards
  - [ ] Sort alerts by sentAt timestamp (descending)
  - [ ] Create AlertCard component for list items
  - [ ] Display alert type icon, emotion icon, message preview
  - [ ] Format timestamps using date-fns (relative format)
  - [ ] Apply galaxy background for consistency

- [ ] **Task 2**: Implement filter UI (AC: 2-5)
  - [ ] Create FilterBar component at top of screen
  - [ ] Add alert type filter dropdown (All, Feeling, Thought, Action)
  - [ ] Add date range filter (predefined ranges + custom)
  - [ ] Add emotion filter (All + 8 emotions)
  - [ ] Add synchronous-only toggle switch
  - [ ] Implement filter state management in component
  - [ ] Apply filters to alert query

- [ ] **Task 3**: Implement alert filtering logic (AC: 2-5)
  - [ ] Add `getAlertHistory()` method to twintuitionStore
  - [ ] Implement AlertFilters interface
  - [ ] Filter by alert type (if not "All")
  - [ ] Filter by date range (start/end dates)
  - [ ] Filter by emotion (if not "All")
  - [ ] Filter by isSynchronous flag (if toggle enabled)
  - [ ] Return filtered and sorted alerts

- [ ] **Task 4**: Create AlertCard component (AC: 6-8)
  - [ ] Create `src/components/twintuition/AlertCard.tsx`
  - [ ] Display alert type icon (left side)
  - [ ] Display emotion icon with color (left side, below type)
  - [ ] Display message preview (first 60 chars, truncate with "...")
  - [ ] Display relative timestamp (right side, top)
  - [ ] Add "Sync Moment" badge if isSynchronous (top-right corner)
  - [ ] Style badge with glow effect using galaxy colors
  - [ ] Add subtle card shadow and border radius

- [ ] **Task 5**: Implement pagination and infinite scroll (AC: 9-10)
  - [ ] Configure FlatList with `getItemLayout` for performance
  - [ ] Implement pagination: load 20 alerts initially
  - [ ] Add `onEndReached` handler for infinite scroll
  - [ ] Load next 20 alerts when user scrolls to bottom
  - [ ] Show loading indicator while fetching more alerts
  - [ ] Optimize with `windowSize` and `maxToRenderPerBatch`

- [ ] **Task 6**: Implement alert detail navigation (AC: 11)
  - [ ] Add tap handler to AlertCard
  - [ ] Navigate to AlertDetail screen with alertId param
  - [ ] Pass full alert object via navigation params
  - [ ] Ensure navigation works for both sent and received alerts

- [ ] **Task 7**: Implement empty state (AC: 12)
  - [ ] Create EmptyState component
  - [ ] Display message: "No alerts found" with filter suggestions
  - [ ] Show different messages based on filter state:
    - No alerts ever: "Start by sending a Twintuition alert to your twin!"
    - No alerts matching filters: "No alerts match your current filters. Try adjusting them."
  - [ ] Add illustration or icon for empty state

- [ ] **Task 8**: Implement custom date range picker (AC: 3)
  - [ ] Use react-native-calendars or similar for date picker
  - [ ] Allow user to select start and end dates
  - [ ] Validate that end date is after start date
  - [ ] Apply custom date range to filter

- [ ] **Task 9**: Optimize performance for large datasets (AC: 9-10)
  - [ ] Use React.memo for AlertCard to prevent unnecessary re-renders
  - [ ] Implement FlatList optimization props
  - [ ] Add keyExtractor for stable list keys
  - [ ] Test with 1000+ mock alerts for performance
  - [ ] Ensure smooth 60 FPS scrolling

- [ ] **Task 10**: Write unit tests
  - [ ] Test getAlertHistory filters correctly by type
  - [ ] Test date range filtering works correctly
  - [ ] Test emotion filtering works correctly
  - [ ] Test synchronous-only filter works
  - [ ] Test sorting by timestamp (descending)
  - [ ] Test pagination returns correct batches
  - [ ] Test relative timestamp formatting

- [ ] **Task 11**: Write integration tests
  - [ ] Test complete filter flow: apply filters → alerts update
  - [ ] Test pagination: scroll to bottom → more alerts load
  - [ ] Test tap alert card → navigate to detail
  - [ ] Test empty state displays when no alerts match
  - [ ] Test filter reset shows all alerts again

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- `twintuitionStore` provides `getAlertHistory(filters)` selector
- Filter state managed locally in TwintuitionHistory component
- No need to persist filter preferences (reset on navigation)

**AlertFilters Interface:**
```typescript
interface AlertFilters {
  type?: 'feeling' | 'thought' | 'action';  // undefined = all
  startDate?: string;                        // ISO 8601 date
  endDate?: string;                          // ISO 8601 date
  emotion?: EmotionType;                     // undefined = all
  onlySynchronous?: boolean;                 // default: false
}
```

**getAlertHistory Implementation:**
```typescript
const getAlertHistory = (filters?: AlertFilters): TwintuitionAlert[] => {
  let alerts = [...state.alerts]; // Clone array

  // Filter by type
  if (filters?.type) {
    alerts = alerts.filter(a => a.type === filters.type);
  }

  // Filter by date range
  if (filters?.startDate || filters?.endDate) {
    alerts = alerts.filter(a => {
      const alertDate = new Date(a.sentAt);
      if (filters.startDate && alertDate < new Date(filters.startDate)) return false;
      if (filters.endDate && alertDate > new Date(filters.endDate)) return false;
      return true;
    });
  }

  // Filter by emotion
  if (filters?.emotion) {
    alerts = alerts.filter(a => a.emotion === filters.emotion);
  }

  // Filter by synchronous
  if (filters?.onlySynchronous) {
    alerts = alerts.filter(a => a.isSynchronous);
  }

  // Sort by sentAt descending (newest first)
  alerts.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return alerts;
};
```

**Relative Timestamp Formatting:**
```typescript
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true }); // "2 hours ago"
  }

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`; // "Yesterday at 3:45 PM"
  }

  // More than 1 day ago
  return format(date, 'MMM d, yyyy'); // "March 15, 2025"
};
```

**Pagination Strategy:**
```typescript
const PAGE_SIZE = 20;

const [alerts, setAlerts] = useState<TwintuitionAlert[]>([]);
const [page, setPage] = useState(0);
const [hasMore, setHasMore] = useState(true);

const loadMoreAlerts = () => {
  const allAlerts = twintuitionStore.getAlertHistory(filters);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const newAlerts = allAlerts.slice(start, end);

  if (newAlerts.length < PAGE_SIZE) {
    setHasMore(false); // No more alerts to load
  }

  setAlerts(prev => [...prev, ...newAlerts]);
  setPage(prev => prev + 1);
};

// In FlatList
<FlatList
  data={alerts}
  onEndReached={() => hasMore && loadMoreAlerts()}
  onEndReachedThreshold={0.5}
  ListFooterComponent={hasMore ? <LoadingSpinner /> : null}
/>
```

**Synchronicity Badge:**
```typescript
{alert.isSynchronous && (
  <View className="absolute top-2 right-2 bg-stellar-blue/20 rounded-full px-2 py-1 flex-row items-center">
    <Icon name="flash" size={12} color="#4A9FFF" />
    <Text className="text-stellar-blue text-xs ml-1">Sync</Text>
    {/* Add glow effect using shadow or LinearGradient */}
  </View>
)}
```

### Source Tree Components

**Files to Create:**
- `src/screens/twintuition/TwintuitionHistory.tsx` - Main history screen
- `src/components/twintuition/AlertCard.tsx` - Individual alert card
- `src/components/twintuition/FilterBar.tsx` - Filter controls
- `src/components/twintuition/EmptyState.tsx` - Empty state UI
- `src/screens/twintuition/AlertDetail.tsx` - Full alert detail view

**Files to Modify:**
- `src/state/twintuitionStore.ts` - Add getAlertHistory selector
- `src/navigation/AppNavigator.tsx` - Add TwintuitionHistory route
- `src/types/index.ts` - Add AlertFilters interface

**Design System Components to Use:**
- FlatList for efficient rendering
- React Native Gesture Handler for swipe actions (optional)
- date-fns for timestamp formatting
- NativeWind classes for styling
- Galaxy background for consistency
- Expo Vector Icons for alert type and emotion icons

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/twintuition/TwintuitionHistory.test.tsx`
- `__tests__/components/twintuition/AlertCard.test.tsx`
- `__tests__/components/twintuition/FilterBar.test.tsx`
- `__tests__/state/twintuitionStore.test.ts` (getAlertHistory)

**Testing Framework:**
- Jest + React Native Testing Library
- Mock date-fns for deterministic timestamp testing
- Mock FlatList pagination with test data

**Key Test Scenarios:**
1. All alerts render in chronological order (newest first)
2. Type filter shows only matching alerts
3. Date range filter shows only alerts in range
4. Emotion filter shows only matching alerts
5. Synchronous-only filter shows only sync alerts
6. Pagination loads 20 alerts per page
7. Infinite scroll loads more on scroll to bottom
8. Tap alert navigates to detail screen
9. Relative timestamps format correctly
10. Synchronicity badge displays on sync alerts
11. Empty state displays when no alerts match filters

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens in `/src/screens/twintuition/`
- Components in `/src/components/twintuition/`
- State in `/src/state/`
- Tests mirror source structure in `__tests__/`

**Filter Bar Layout:**
```
[Type: All ▼] [Date: Last week ▼] [Emotion: All ▼] [○ Sync Only]
```

**Alert Card Layout:**
```
┌─────────────────────────────────────────────────┐
│ [Type Icon]  "Thinking of you!"        2 hrs ago│
│ [Emotion]    [Sync Badge if applicable]         │
│              Joy · Intensity 8                   │
└─────────────────────────────────────────────────┘
```

**Performance Optimizations:**
- `getItemLayout` for FlatList to enable optimizations
- `windowSize={10}` to render only visible + nearby items
- `maxToRenderPerBatch={10}` to limit initial render batch
- `updateCellsBatchingPeriod={50}` to debounce updates
- React.memo on AlertCard to prevent re-renders

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] TwintuitionAlert interface
- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] AlertFilters interface
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Alert history flow
- [Source: docs/tech-spec-epic-3.md#APIs-and-Interfaces] getAlertHistory selector
- [Source: docs/epics.md#Story-3.4] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Alert history requirements

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
