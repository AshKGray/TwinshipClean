# Story 5.4: Population Insights Dashboard

**Story ID**: 5-4
**Epic**: Epic 5 - Research & Analytics Infrastructure
**Status**: Drafted
**Priority**: Medium
**Estimated Effort**: Medium (5-6 hours)
**Dependencies**: Story 5.3 (data submission pipeline), backend API (Phase 2)

---

## Story

**As a** research participant
**I want** to see insights from broader twin population
**So that** I can compare our connection to others

---

## Acceptance Criteria

1. Display total twin pairs in research study
2. Show user's synchronicity scores vs population average
3. Percentile rankings displayed (25th, 50th, 75th, 90th)
4. Bell curve visualization with user's position
5. Twin type breakdown (identical, fraternal, other)
6. Interesting population findings displayed (3-5 insights)
7. Filter by game type to see specific comparisons
8. User can see "You're in the X percentile"
9. Population stats cached for 7 days
10. Refresh button fetches latest data
11. Comparison shows: user score, average, percentile
12. Option to share position on leaderboard

---

## Tasks

### Task 1: Create PopulationStatistics Data Model
**Estimated**: 30 minutes
- Define PopulationStatistics interface
- Add InsightStatement type
- Create percentile breakdown structure
- Add game-specific stats structure
- Add cache metadata (lastUpdated, sampleSize)

**Files**:
- `src/models/PopulationStatistics.ts`

### Task 2: Implement PopulationStatsService
**Estimated**: 1.5 hours
- Create populationStatsService.ts
- Implement fetchPopulationStats():
  - GET request to research API
  - Parse response
  - Validate data structure
- Implement getCachedStats():
  - Check cache age (< 7 days)
  - Return cached data if fresh
- Implement refreshStats():
  - Force fetch new data
  - Update cache
- Implement compareToPopulation(userScore, gameType):
  - Calculate percentile rank
  - Determine if above/below average
  - Calculate z-score
- Mock data for MVP (no backend yet)

**Files**:
- `src/services/research/populationStatsService.ts`
- `src/services/research/mockPopulationData.ts` (MVP only)

### Task 3: Update ResearchStore for Population Stats
**Estimated**: 30 minutes
- Add population stats state
- Implement setPopulationStats(stats)
- Implement getPopulationStats()
- Implement getCachedAge() (hours since last update)
- Add persistence for cached stats

**Files**:
- `src/state/researchStore.ts` (update)

### Task 4: Design PopulationInsights Screen UI
**Estimated**: 2 hours
- Create PopulationInsights.tsx with galaxy background
- Add header section:
  - Title: "How You Compare"
  - Sample size badge (e.g., "Based on 1,234 twin pairs")
  - Last updated timestamp
- Add overall synchronicity comparison:
  - User's average score (large number)
  - Population average
  - Your percentile (highlighted)
- Add bell curve chart showing distribution
- Mark user's position on curve
- Add twin type breakdown (pie chart)
- Add interesting findings section
- Add game type filter dropdown
- Add refresh button
- Add "Join Leaderboard" CTA

**Files**:
- `src/screens/research/PopulationInsights.tsx`
- `src/components/research/PopulationChart.tsx`
- `src/components/research/BellCurveChart.tsx`

### Task 5: Implement Bell Curve Visualization
**Estimated**: 1.5 hours
- Create BellCurveChart component using react-native-chart-kit
- Display normal distribution curve
- Plot population data points
- Highlight user's position with marker
- Show percentile lines (25th, 50th, 75th, 90th)
- Add labels and legends
- Use galaxy color palette
- Responsive sizing

**Files**:
- `src/components/research/BellCurveChart.tsx`

### Task 6: Implement Game-Specific Comparisons
**Estimated**: 1 hour
- Add game type filter (All Games, Maze, Emotion, Decision, Duo)
- Filter population stats by selected game
- Update charts when filter changes
- Show game-specific insights
- Display game icon next to comparison
- Update percentile calculation for filtered data

**Files**:
- `src/screens/research/PopulationInsights.tsx` (update)
- `src/components/research/GameFilterDropdown.tsx`

### Task 7: Create Mock Population Data (MVP)
**Estimated**: 45 minutes
- Generate realistic mock data:
  - Total pairs: ~5,000
  - Synchronicity scores: Normal distribution (mean: 65, stddev: 15)
  - Twin type breakdown: 40% identical, 45% fraternal, 15% other
  - Game-specific averages
  - 5-7 interesting findings
- Structure matches PopulationStatistics interface
- Cache mock data (refresh after 7 days shows "updated" data)

**Files**:
- `src/services/research/mockPopulationData.ts`

---

## Development Notes

**Key Implementation Details:**
- Population stats are read-only (no user submissions in this story)
- MVP uses mock data; replace with real API in Phase 2
- Cache is intentional to reduce API load
- Bell curve should be smooth and visually appealing
- Insights should be engaging and non-judgmental

**Interesting Findings Examples:**
- "Identical twins score 12% higher on emotional resonance on average"
- "Geographically separated twins show similar synchronicity to co-located twins"
- "Twins who play games together weekly score 23% higher"
- "The most common synchronicity score is 68/100"
- "92% of twin pairs score above 50% synchronicity"

**Edge Cases:**
- User has no game data yet (show population stats only, no personal comparison)
- User's score is extreme outlier (> 3 std dev from mean)
- Population data is stale (> 30 days) - show warning
- API fetch fails (use cached data, show "Using cached data" message)
- No cached data and API fails (show error, allow retry)

**Performance Considerations:**
- Chart rendering should be fast (< 1 second)
- Use memoization for percentile calculations
- Cache parsed population data in memory
- Lazy load chart library

---

## Architecture Decisions

**Data Flow:**
```
User navigates to PopulationInsights
  ↓
Check cache age
  ↓
[If > 7 days] → Fetch new data
  ↓
populationStatsService.fetchPopulationStats()
  ↓
[Success] → Cache data, display
[Failure] → Use cached data if available
  ↓
Get user's game results from assessmentStore
  ↓
calculatePercentile(userScore, populationData)
  ↓
Display:
  - Your score vs average
  - Percentile rank
  - Bell curve with your position
  - Interesting findings
```

**Percentile Calculation:**
```typescript
function calculatePercentile(userScore: number, populationScores: number[]): number {
  const sorted = populationScores.sort((a, b) => a - b);
  const belowCount = sorted.filter(score => score < userScore).length;
  return Math.round((belowCount / sorted.length) * 100);
}
```

**Mock Data Structure:**
```typescript
const mockPopulationData: PopulationStatistics = {
  totalPairs: 5234,
  sampleSize: 5234,
  lastUpdated: "2025-11-01T00:00:00Z",
  twinTypeBreakdown: {
    identical: 40,
    fraternal: 45,
    other: 15
  },
  gameStats: {
    maze: {
      averageSynchronicity: 63,
      standardDeviation: 14,
      percentiles: { p25: 52, p50: 63, p75: 74, p90: 82 }
    },
    emotion: {
      averageSynchronicity: 67,
      standardDeviation: 16,
      percentiles: { p25: 55, p50: 67, p75: 79, p90: 87 }
    }
  },
  interestingFindings: [
    {
      category: "Twin Type",
      statement: "Identical twins score 12% higher on emotional resonance",
      significance: "high"
    }
  ]
};
```

---

## Testing Requirements

### Unit Tests
- calculatePercentile() logic correct
- Cache age calculation (hours since lastUpdated)
- z-score calculation
- Mock data structure validation
- Filter logic (by game type)

### Integration Tests
- Fetch population stats → Cache → Display
- Refresh stats → Update cache → Update UI
- Cache expires → Auto-refresh on next visit
- Filter by game → Update charts

### UI Tests
- All sections render correctly
- Bell curve displays with user marker
- Percentile text displays
- Twin type pie chart renders
- Interesting findings display
- Refresh button works

### E2E Tests
- Navigate to insights → See comparison
- Filter by game → See updated stats
- Refresh data → See loading → See updated

### Visual Tests
- Bell curve is smooth and centered
- User marker is clearly visible
- Galaxy color palette used consistently
- Charts are readable on small screens

---

## Related Documentation

- [Source: docs/tech-spec-epic-5.md#Population-Insights] Detailed workflow
- [Source: docs/tech-spec-epic-5.md#Data-Models] PopulationStatistics interface
- [Source: docs/Twinship PRD.md#Research-Integration] PRD requirements
- [Source: docs/epics.md#Story-5.4] Epic definition

---

## Story Completion Checklist

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] UI tests written and passing
- [ ] E2E test for insights flow passing
- [ ] Visual tests for charts passing
- [ ] Code reviewed and approved
- [ ] Manual testing on iOS and Android
- [ ] Charts tested on various screen sizes
- [ ] Mock data validated for realism
- [ ] No high-severity bugs
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

---

## Phase 2 Migration Notes

**When Backend API is Ready:**
1. Replace mockPopulationData.ts with real API calls
2. Update fetchPopulationStats() to use actual endpoint
3. Add authentication headers to API requests
4. Implement error handling for API failures
5. Update cache invalidation strategy if needed
6. Test with real population data
7. Validate insights match real patterns
