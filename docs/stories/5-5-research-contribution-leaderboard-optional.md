# Story 5.5: Research Contribution Leaderboard (Optional)

**Story ID**: 5-5
**Epic**: Epic 5 - Research & Analytics Infrastructure
**Status**: Drafted
**Priority**: Low
**Estimated Effort**: Medium (5-6 hours)
**Dependencies**: Story 5.2 (contribution tracking)

---

## Story

**As a** competitive research participant
**I want** to see my rank among contributors
**So that** I feel motivated to contribute more

---

## Acceptance Criteria

1. User can opt-in to appear on leaderboard
2. Leaderboard shows top 100 contributors
3. Each entry shows: rank, anonymous name, score, badges
4. Anonymous names format: "Twin Pair #1234"
5. Contribution score calculated from: games + days active + data completeness
6. User's position highlighted on leaderboard
7. Weekly, monthly, and all-time rankings available
8. Badges display for milestones (100 games, 1000 data points, etc.)
9. User can tap badge to view description
10. Opt-out removes user from leaderboard
11. Privacy-preserving (no personal info shown)
12. Leaderboard updates weekly

---

## Tasks

### Task 1: Create Leaderboard Data Models
**Estimated**: 30 minutes
- Define LeaderboardEntry interface
- Create Badge interface
- Add period type (weekly, monthly, all-time)
- Create contribution score formula
- Define badge criteria

**Files**:
- `src/models/LeaderboardEntry.ts`
- `src/models/Badge.ts`

### Task 2: Implement Contribution Score Calculation
**Estimated**: 1 hour
- Create leaderboardService.ts
- Implement calculateContributionScore(userId):
  - Games completed * 10 points
  - Days active * 5 points
  - Data completeness (0-100%) * 20 points
  - Bonus for consistency (7-day streak * 25 points)
- Implement getContributionMetrics(userId)
- Add score caching for performance

**Files**:
- `src/services/research/leaderboardService.ts`

### Task 3: Implement Badge System
**Estimated**: 1 hour
- Create badgeService.ts
- Define badges:
  - "First Steps" - First contribution
  - "Contributor" - 10 contributions
  - "Dedicated" - 100 contributions
  - "Data Champion" - 1000 data points
  - "Consistent" - 7-day streak
  - "Top 10%" - Rank in top 10%
- Implement checkBadges(userId):
  - Check criteria for all badges
  - Award new badges
  - Store in researchStore
- Implement getBadges(userId)
- Create badge icons (galaxy-themed)

**Files**:
- `src/services/research/badgeService.ts`
- `assets/badges/` (badge icons)

### Task 4: Update ResearchStore for Leaderboard
**Estimated**: 30 minutes
- Add leaderboard opt-in state
- Implement updateLeaderboard(entries)
- Implement getLeaderboard(period)
- Add user's rank and badges state
- Add persistence for leaderboard cache

**Files**:
- `src/state/researchStore.ts` (update)

### Task 5: Design Leaderboard Screen UI
**Estimated**: 2 hours
- Create Leaderboard.tsx with galaxy background
- Add opt-in prompt for first-time visitors
- Add period selector (Weekly, Monthly, All-Time)
- Add leaderboard list (FlatList):
  - Rank badge (gold, silver, bronze for top 3)
  - Anonymous name
  - Contribution score
  - Badges earned (up to 5 visible)
- Highlight user's position (if opted in)
- Add user's stats section at top:
  - Your rank
  - Your score
  - Your badges
  - Next milestone progress bar
- Add badge showcase modal
- Add opt-out button in settings

**Files**:
- `src/screens/research/Leaderboard.tsx`
- `src/components/research/LeaderboardEntry.tsx`
- `src/components/research/BadgeShowcase.tsx`

### Task 6: Implement Leaderboard Entry Component
**Estimated**: 1 hour
- Create LeaderboardEntry.tsx
- Display rank with special styling for top 3
- Generate anonymous name (Twin Pair #XXXX)
- Display contribution score
- Display badges (horizontal row)
- Add tap to view user's badge collection
- Use galaxy color palette
- Add subtle animations on scroll

**Files**:
- `src/components/research/LeaderboardEntry.tsx`

### Task 7: Implement Badge Showcase Modal
**Estimated**: 1 hour
- Create BadgeShowcase.tsx modal
- Display user's earned badges (grid layout)
- Show locked badges (grayed out) with requirements
- Add progress bars for badges in progress
- Display badge descriptions
- Add "Close" button
- Smooth animations

**Files**:
- `src/components/research/BadgeShowcase.tsx`

### Task 8: Implement Opt-In/Opt-Out Logic
**Estimated**: 45 minutes
- Add leaderboard opt-in toggle in settings
- Show confirmation dialog on opt-in:
  - Explain what's visible (rank, score, badges)
  - Confirm no personal info shared
- On opt-in:
  - Calculate score
  - Add to leaderboard (local cache)
  - Show "You're ranked #XX" toast
- On opt-out:
  - Remove from leaderboard display
  - Keep score for user's own view
- Persist preference

**Files**:
- `src/screens/settings/ResearchSettings.tsx` (update)
- `src/services/research/leaderboardService.ts` (update)

### Task 9: Create Mock Leaderboard Data (MVP)
**Estimated**: 30 minutes
- Generate realistic mock leaderboard:
  - 100 entries with scores 50-2500
  - Realistic score distribution (few high scorers, many medium)
  - Random badge assignments
  - User's position based on their actual score
- Update weekly with slight variations
- Structure matches LeaderboardEntry interface

**Files**:
- `src/services/research/mockLeaderboardData.ts`

---

## Development Notes

**Key Implementation Details:**
- Leaderboard is completely optional (no pressure to opt in)
- Anonymous names ensure privacy
- Score formula encourages both quantity and consistency
- Badges provide milestones and motivation
- Weekly updates keep competition fresh

**Badge Criteria:**
| Badge | Requirement | Points |
|-------|-------------|--------|
| First Steps | 1 contribution | - |
| Contributor | 10 contributions | - |
| Dedicated | 100 contributions | - |
| Data Champion | 1000 data points | - |
| Weekly Warrior | 7-day contribution streak | - |
| Top 10% | Rank in top 10% | - |
| Top 100 | Rank in top 100 | - |
| Consistency King/Queen | 30-day streak | - |

**Score Formula:**
```typescript
function calculateContributionScore(userId: string): number {
  const metrics = getContributionMetrics(userId);

  let score = 0;
  score += metrics.gamesCompleted * 10;       // 10 pts per game
  score += metrics.daysActive * 5;            // 5 pts per day active
  score += metrics.dataCompleteness * 20;     // 0-20 pts for completeness
  score += (metrics.longestStreak / 7) * 25;  // 25 pts per week streak

  return Math.round(score);
}
```

**Edge Cases:**
- User has same score as others (tie-breaking by timestamp)
- User opts out then opts back in (restore previous rank)
- User completes games while opted out (score still calculated)
- Leaderboard has < 100 entries (show all available)
- User is only contributor (rank #1 with score)

**Performance Considerations:**
- Leaderboard cached for 7 days (updated weekly)
- FlatList for efficient scrolling
- Lazy load badge details
- Memoize score calculations

---

## Architecture Decisions

**Anonymous Name Generation:**
```typescript
function generateAnonymousName(userId: string): string {
  const hash = hashUserId(userId);
  const number = parseInt(hash.substring(0, 8), 16) % 10000;
  return `Twin Pair #${number.toString().padStart(4, '0')}`;
  // Examples: "Twin Pair #0001", "Twin Pair #5234"
}
```

**Leaderboard Update Flow:**
```
Weekly cron job (backend)
  ↓
Calculate scores for all opted-in users
  ↓
Rank by score (ties broken by earlier timestamp)
  ↓
Generate leaderboard array (top 100)
  ↓
Store in API
  ↓
App fetches on next visit
  ↓
Cache locally for 7 days
```

**Badge Check Flow:**
```
User completes game
  ↓
contributionTracker.trackContribution()
  ↓
badgeService.checkBadges(userId)
  ↓
For each badge:
  ↓
  Check criteria (e.g., contributions >= 100)
  ↓
  [If met and not already earned]
    ↓
    Award badge
    ↓
    Show toast: "Badge Earned: Dedicated Contributor!"
    ↓
    Update leaderboard score
```

---

## Testing Requirements

### Unit Tests
- calculateContributionScore() formula correct
- Badge criteria checks work
- Anonymous name generation consistent
- Tie-breaking logic
- Opt-in/opt-out state management

### Integration Tests
- Complete game → Score updated → Leaderboard rank updated
- Award badge → Score increases → New rank
- Opt in → Appear on leaderboard
- Opt out → Disappear from leaderboard
- Weekly update → Leaderboard refreshed

### UI Tests
- Leaderboard renders 100 entries
- User's position highlighted
- Badges display correctly
- Period filter works (weekly, monthly, all-time)
- Opt-in prompt displays for new users

### E2E Tests
- Opt in → See your rank → View badges
- Complete games → Score increases → Rank improves
- Earn badge → See toast notification
- Opt out → Removed from leaderboard

### Visual Tests
- Top 3 ranks have special styling (gold, silver, bronze)
- User's entry is highlighted
- Badges are visually distinct
- Galaxy color palette consistent

---

## Related Documentation

- [Source: docs/tech-spec-epic-5.md#Leaderboard] Detailed implementation
- [Source: docs/tech-spec-epic-5.md#Data-Models] LeaderboardEntry interface
- [Source: docs/Twinship PRD.md#Future-Enhancements] Gamification features
- [Source: docs/epics.md#Story-5.5] Epic definition

---

## Story Completion Checklist

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] UI tests written and passing
- [ ] E2E test for leaderboard flow passing
- [ ] Visual tests for ranking display passing
- [ ] Code reviewed and approved
- [ ] Manual testing on iOS and Android
- [ ] Badge icons created and validated
- [ ] Privacy review (no PII exposed)
- [ ] No high-severity bugs
- [ ] Documentation updated
- [ ] Sprint status updated to "done"

---

## Phase 2 Enhancements

**When Backend API is Ready:**
1. Real-time leaderboard updates
2. Social features (view friend's ranks)
3. Leaderboard notifications (moved up/down)
4. Seasonal competitions
5. Team challenges (twin pair vs twin pair)
6. Custom badges for research milestones
7. Leaderboard filters (by twin type, location, etc.)
