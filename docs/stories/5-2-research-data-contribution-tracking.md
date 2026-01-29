# Story 5.2: Research Data Contribution Tracking

**Story ID**: 5-2
**Epic**: Epic 5 - Research & Analytics Infrastructure
**Status**: Drafted
**Priority**: High
**Estimated Effort**: Medium (5-6 hours)
**Dependencies**: Story 5.1 (consent management)

---

## Story

**As a** research participant
**I want** to see what data I've contributed
**So that** I understand my research impact

---

## Acceptance Criteria

1. Dashboard displays total contributions count
2. Dashboard shows total data points contributed
3. Breakdown by contribution type (pie chart)
4. Timeline of contributions visible
5. Recent contributions list (last 10) with details
6. Each contribution shows: type, date, data points, status
7. Anonymization indicator on each contribution
8. Pause/resume contribution controls work
9. GDPR export generates complete JSON file
10. Export includes: consent history, contributions, game data
11. Revoke consent stops future submissions
12. Contribution count updates in real-time after game completion

---

## Tasks

### Task 1: Create ContributionRecord Data Model
**Estimated**: 30 minutes
- Define ContributionRecord interface
- Create ContributionType enum (GAME_MAZE, GAME_EMOTION, etc.)
- Add submission status tracking
- Add dataPointCount field

**Files**:
- `src/models/ContributionRecord.ts`

### Task 2: Implement ContributionTracker Service
**Estimated**: 1 hour
- Create contributionTracker.ts
- Implement trackContribution(type, dataPointCount)
- Implement getContributionSummary(userId)
- Implement calculateContributionScore(userId)
- Add contribution logging logic

**Files**:
- `src/services/research/contributionTracker.ts`

### Task 3: Update ResearchStore for Contributions
**Estimated**: 45 minutes
- Add contribution state to researchStore
- Implement logContribution(record)
- Implement getContributions(userId)
- Implement getContributionCount(userId, type?)
- Implement getTotalDataPoints(userId)
- Add persistence for contribution records

**Files**:
- `src/state/researchStore.ts` (update)

### Task 4: Design ContributionDashboard UI
**Estimated**: 2 hours
- Create ContributionDashboard.tsx with galaxy background
- Add summary section:
  - Total contributions count (large number)
  - Total data points (badge-style)
  - First/last contribution dates
- Add pie chart for contribution breakdown by type
- Add timeline visualization
- Add recent contributions list (FlatList)
- Add pause/resume toggle
- Add export button
- Add revoke consent button

**Files**:
- `src/screens/research/ContributionDashboard.tsx`
- `src/components/research/ContributionMetric.tsx`
- `src/components/research/ContributionPieChart.tsx`

### Task 5: Implement Contribution List Component
**Estimated**: 1 hour
- Create ContributionListItem component
- Display: icon, type name, date, data points
- Add anonymization indicator badge
- Add submission status indicator (pending, submitted, failed)
- Handle tap to view details
- Use FlatList for performance

**Files**:
- `src/components/research/ContributionListItem.tsx`

### Task 6: Implement Pause/Resume Controls
**Estimated**: 30 minutes
- Add toggle switch for pause/resume
- Pausing sets consent level to NONE temporarily
- Resuming restores previous consent level
- Show confirmation dialog on pause
- Update UI to reflect paused state

**Files**:
- `src/screens/research/ContributionDashboard.tsx` (update)
- `src/services/research/consentService.ts` (update)

### Task 7: Implement GDPR Export Functionality
**Estimated**: 1.5 hours
- Create exportService.ts
- Implement exportAllData(userId)
- Generate JSON with:
  - Consent history (all consent changes)
  - Contribution log (all records)
  - Game data (all sessions)
  - Anonymized data (what was submitted)
- Add export to file (FileSystem API)
- Add share functionality (Share API)
- Show progress indicator during export
- Ensure < 10 second completion

**Files**:
- `src/services/research/exportService.ts`
- `src/screens/research/DataExportScreen.tsx`

### Task 8: Integrate Real-Time Updates
**Estimated**: 30 minutes
- Hook into game completion events
- Trigger contribution tracking automatically
- Update dashboard in real-time
- Show toast notification on new contribution
- Refresh contribution count

**Files**:
- `src/state/assessmentStore.ts` (update to trigger tracking)
- `src/screens/research/ContributionDashboard.tsx` (update)

---

## Development Notes

**Key Implementation Details:**
- Contribution tracking happens automatically after game completion (if consent granted)
- Dashboard should load quickly (< 500ms) even with 1000+ contributions
- Pie chart should use galaxy color palette
- Timeline should be scrollable with lazy loading
- Export format should be human-readable JSON (not minified)

**Edge Cases:**
- User has no contributions yet (show empty state with encouragement)
- User pauses contributions mid-game session (finish current session, then pause)
- Export fails due to storage permissions (show error, offer alternative)
- User has contributed 10,000+ data points (ensure performance)

**Performance Considerations:**
- Use FlatList for contributions list (virtual scrolling)
- Cache contribution summary calculations
- Lazy load timeline data
- Export in chunks if > 1000 contributions

---

## Architecture Decisions

**Data Flow for Contribution Tracking:**
```
Game completes
  ↓
Check: Consent granted?
  ↓
[If yes] → Track contribution
  ↓
contributionTracker.trackContribution(type, count)
  ↓
researchStore.logContribution(record)
  ↓
Persist to AsyncStorage
  ↓
Update dashboard UI
  ↓
Show toast: "Contribution recorded"
```

**GDPR Export Structure:**
```json
{
  "exportDate": "2025-11-18T12:00:00Z",
  "userId": "user-uuid",
  "consent": {
    "history": [
      {
        "level": "anonymous",
        "date": "2025-01-01T00:00:00Z",
        "policyVersion": "1.0"
      }
    ]
  },
  "contributions": [
    {
      "id": "contrib-uuid",
      "type": "game_maze",
      "date": "2025-01-15T14:30:00Z",
      "dataPoints": 45,
      "status": "submitted"
    }
  ],
  "gameData": [
    {
      "gameType": "maze",
      "session": { ... }
    }
  ]
}
```

---

## Testing Requirements

### Unit Tests
- trackContribution() creates correct record
- getContributionSummary() calculates totals correctly
- calculateContributionScore() formula correct
- exportAllData() generates valid JSON
- Pause/resume logic updates consent level

### Integration Tests
- Complete game → Contribution tracked → Dashboard updated
- Pause contributions → No new contributions logged
- Resume → Contributions restart
- Export → File generated with all data
- Revoke consent → Queue cleared (Story 5.3 dependency)

### UI Tests
- Dashboard loads with correct metrics
- Pie chart renders with contributions
- Recent contributions list displays
- Pause toggle works
- Export button triggers export

### E2E Tests
- Complete game → See contribution in dashboard
- Pause → Complete game → No new contribution
- Export data → Verify JSON structure

### Performance Tests
- Dashboard load time with 1000 contributions (< 500ms)
- Export time with 500 games (< 10 seconds)
- Contribution list scroll performance

---

## Related Documentation

- [Source: docs/tech-spec-epic-5.md#Contribution-Tracking] Service implementation
- [Source: docs/tech-spec-epic-5.md#Data-Models] ContributionRecord interface
- [Source: docs/tech-spec-epic-5.md#GDPR-Compliance] Export requirements
- [Source: docs/epics.md#Story-5.2] Epic definition

---

## Story Completion Checklist

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] UI tests written and passing
- [ ] E2E test for contribution flow passing
- [ ] Performance tests passing (dashboard load < 500ms, export < 10s)
- [ ] Code reviewed and approved
- [ ] Manual testing on iOS and Android
- [ ] GDPR export validated by legal/privacy
- [ ] No high-severity bugs
- [ ] Documentation updated
- [ ] Sprint status updated to "done"
