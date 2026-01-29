### Epic 2: Psychic Games - Quick Start Implementation Guide

**For Developers Completing the Integration**

---

## What's Already Built

### ✅ Core Infrastructure (100% Complete)
- **gamesStore.ts** - Complete state management with all game types
- **PsychicGamesHub.tsx** - Main hub screen with game cards
- **ResultsDashboard.tsx** - Results viewer with filtering
- **mazeAnalysis.ts** - Complete maze analysis algorithms
- **emotionAnalysis.ts** - Complete emotion overlap calculations
- **decisionAnalysis.ts** - Complete decision value alignment
- **duoMatching.ts** - Complete duo matching service
- **iconicDuos.ts** - Database of 10 iconic twin pairs

### 🔨 Existing Game Screens (Need Integration)
- CognitiveSyncMaze.tsx
- EmotionalResonanceMapping.tsx
- TemporalDecisionSync.tsx
- IconicDuoMatcher.tsx

---

## Integration Steps (Priority Order)

### Step 1: Add to Navigation (30 min)

**File**: `src/navigation/AppNavigator.tsx`

Add these routes to the Stack navigator:

```typescript
// Import new screens
import { PsychicGamesHub } from '../screens/games/PsychicGamesHub';
import { ResultsDashboard } from '../screens/games/ResultsDashboard';

// In MainStack component:
<Stack.Screen
  name="PsychicGamesHub"
  component={PsychicGamesHub}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="ResultsDashboard"
  component={ResultsDashboard}
  options={{ headerShown: false }}
/>
```

**Test**: Navigate to PsychicGamesHub from HomeScreen

---

### Step 2: Update Maze Game Integration (1 hour)

**File**: `src/screens/games/CognitiveSyncMaze.tsx`

Add these imports:
```typescript
import { useGamesStore } from '../../state/gamesStore';
import { mazeAnalysisService } from '../../services/games/mazeAnalysis';
```

Update the component:
```typescript
export const CognitiveSyncMaze = ({ navigation }: any) => {
  const { startGameSession, completeGameSession } = useGamesStore();
  const { userProfile, twinProfile } = useTwinStore();

  const [sessionId, setSessionId] = useState<string | null>(null);

  // On game start
  useEffect(() => {
    if (gamePhase === 'playing' && !sessionId) {
      const id = startGameSession(
        'maze',
        userProfile!.id,
        twinProfile?.id
      );
      setSessionId(id);
    }
  }, [gamePhase]);

  // On game completion
  const completeMaze = () => {
    const mazeData = {
      moves: touchPath.map((point, idx) => ({
        direction: calculateDirection(point, touchPath[idx - 1]),
        timestamp: point.timestamp - startTime!,
        wasError: !isValidPath(point),
        corrected: false, // Calculate based on backtracking
      })),
      completionTime: endTime! - startTime!,
      errorCount: mistakes.length,
      correctionsCount: mistakes.filter(m => m.correctionType === 'backtrack').length,
      mazeId: 'maze_01',
    };

    completeGameSession(sessionId!, mazeData);

    // Check if twin completed
    const { twinSession } = useGamesStore.getState().getTwinComparison(
      'maze',
      userProfile!.id,
      twinProfile!.id
    );

    if (twinSession) {
      // Navigate to results
      navigation.navigate('MazeResults', { sessionId });
    } else {
      // Show waiting screen
      setGamePhase('waiting');
    }
  };
};
```

---

### Step 3: Create MazeResults Screen (1 hour)

**File**: `src/screens/games/MazeResults.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { useGamesStore, MazeResult } from '../../state/gamesStore';
import { useTwinStore } from '../../state/twinStore';
import { mazeAnalysisService } from '../../services/games/mazeAnalysis';
import CosmicCard from '../../components/common/CosmicCard';

export const MazeResults: React.FC = ({ route, navigation }: any) => {
  const { sessionId } = route.params;
  const { getSessionById, getTwinComparison, saveResult } = useGamesStore();
  const { userProfile, twinProfile } = useTwinStore();
  const [result, setResult] = useState<MazeResult | null>(null);

  useEffect(() => {
    const session = getSessionById(sessionId);
    if (!session) return;

    const { userSession, twinSession } = getTwinComparison(
      'maze',
      userProfile!.id,
      twinProfile!.id
    );

    if (userSession && twinSession) {
      const mazeResult = mazeAnalysisService.compareTwinSessions(
        userSession.rawData,
        twinSession.rawData
      );
      setResult(mazeResult);
      saveResult(mazeResult);
    }
  }, []);

  if (!result) {
    return <LoadingScreen />;
  }

  return (
    <ImageBackground source={require('../../../assets/galaxybackground.png')}>
      <SafeAreaView>
        <ScrollView>
          {/* Overall Score */}
          <CosmicCard elevation={2} glowBorder accentColor="stellar-blue">
            <Text style={styles.scoreLabel}>Synchronicity Score</Text>
            <Text style={styles.scoreValue}>
              {result.synchronicity.overallScore}/100
            </Text>
          </CosmicCard>

          {/* Direction Preferences Chart */}
          <CosmicCard elevation={1}>
            <Text style={styles.sectionTitle}>Navigation Patterns</Text>
            {/* Add DirectionChart component here */}
            <DirectionPreferenceChart data={result.directionPreferences} />
          </CosmicCard>

          {/* Insights */}
          <CosmicCard elevation={1}>
            <Text style={styles.sectionTitle}>Insights</Text>
            {result.insights.map((insight, idx) => (
              <Text key={idx} style={styles.insightText}>
                • {insight}
              </Text>
            ))}
          </CosmicCard>

          {/* Share Button */}
          <NeonButton
            variant="primary"
            accentColor="stellar-blue"
            onPress={() => handleShare(result)}
          >
            Share Results
          </NeonButton>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
```

---

### Step 4: Repeat for Other Games (3-4 hours total)

Follow the same pattern for:
- EmotionalResonanceMapping → EmotionResults
- TemporalDecisionSync → DecisionResults
- IconicDuoMatcher → DuoResults

Each follows the same structure:
1. Import gamesStore and analysis service
2. Start session on game begin
3. Save data on completion
4. Check for twin completion
5. Navigate to results or waiting screen

---

### Step 5: Create Data Files (1 hour)

**File**: `src/data/decisionScenarios.ts`

```typescript
export const DECISION_SCENARIOS = [
  {
    id: 'd1',
    category: 'risk',
    question: 'Your friend asks to borrow $500. They have a history of not paying back loans.',
    options: [
      'Lend it without hesitation',
      'Refuse politely',
      'Offer a smaller amount',
      'Suggest alternatives (bank loan, payment plan)',
    ],
  },
  {
    id: 'd2',
    category: 'ethics',
    question: 'You see someone shoplifting baby formula from a grocery store.',
    options: [
      'Report it to store security',
      'Ignore it',
      'Offer to buy it for them',
      'Talk to them privately',
    ],
  },
  // Add 23 more scenarios across all 4 categories
];
```

**File**: `src/data/duoQuizQuestions.ts`

```typescript
export const DUO_QUIZ_QUESTIONS = [
  {
    id: 'q1',
    category: 'relationship',
    question: 'How do you typically spend time together?',
    options: [
      'Constant adventures and new experiences',
      'Comfortable routines and familiar activities',
      'A mix of both depending on the mood',
      'Separate activities, checking in regularly',
    ],
  },
  // Add 14 more questions
];
```

---

### Step 6: Add Visualization Components (2-3 hours)

Create these reusable chart components:

**File**: `src/components/games/DirectionChart.tsx`
```typescript
// Bar chart showing direction preferences for both twins
// Use react-native-svg or react-native-chart-kit
```

**File**: `src/components/games/OverlapVisualization.tsx`
```typescript
// Venn diagram showing emotional vocabulary overlap
// Custom SVG implementation
```

**File**: `src/components/games/CategoryRadarChart.tsx`
```typescript
// Radar/spider chart for decision category breakdown
// Use victory-native or custom SVG
```

---

### Step 7: Testing (2-3 hours)

**Unit Tests**:
```bash
# Test analysis services
npm test src/services/games/mazeAnalysis.test.ts
npm test src/services/games/emotionAnalysis.test.ts
npm test src/services/games/decisionAnalysis.test.ts
npm test src/services/games/duoMatching.test.ts

# Test store
npm test src/state/gamesStore.test.ts
```

**Integration Tests**:
```typescript
// Test complete flow
describe('Maze Game Flow', () => {
  it('completes full game and generates results', async () => {
    // Start session
    const sessionId = startGameSession('maze', 'user1', 'user2');

    // Complete game
    completeGameSession(sessionId, mockMazeData);

    // Analyze with twin
    const result = compareTwinSessions(mockData1, mockData2);

    expect(result.synchronicity.overallScore).toBeGreaterThan(0);
  });
});
```

---

## Common Issues & Solutions

### Issue: "Cannot find module gamesStore"
**Solution**: Make sure import path is correct:
```typescript
import { useGamesStore } from '../../state/gamesStore';
```

### Issue: "Navigation prop undefined"
**Solution**: Ensure screen is added to Stack navigator and receives navigation prop:
```typescript
<Stack.Screen name="MazeResults" component={MazeResults} />
```

### Issue: "getTwinComparison returns undefined"
**Solution**: Ensure both twins have completed the game and sessions are saved:
```typescript
const comparison = getTwinComparison('maze', userId, twinId);
if (!comparison.userSession || !comparison.twinSession) {
  // Show waiting state
  return <WaitingForTwinScreen />;
}
```

### Issue: "Insights are empty"
**Solution**: Check that analysis service is generating insights:
```typescript
const result = mazeAnalysisService.compareTwinSessions(data1, data2);
console.log('Insights:', result.insights); // Debug
```

---

## Performance Optimization

### Lazy Load Chart Libraries
```typescript
const DirectionChart = lazy(() => import('./DirectionChart'));

<Suspense fallback={<LoadingSkeleton />}>
  <DirectionChart data={preferences} />
</Suspense>
```

### Memoize Expensive Calculations
```typescript
const synchronicityScore = useMemo(
  () => calculateScore(session1, session2),
  [session1, session2]
);
```

### Virtualize Result Lists
```typescript
<FlatList
  data={results}
  renderItem={renderResultCard}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## Testing Checklist

- [ ] Navigate to PsychicGamesHub from Home
- [ ] See 4 game cards displayed
- [ ] Tap maze game and play through
- [ ] Complete maze and save session
- [ ] Mock twin completion (for testing)
- [ ] View MazeResults with synchronicity score
- [ ] Navigate to ResultsDashboard
- [ ] Filter results by game type
- [ ] View insights for each game
- [ ] Share results (if implemented)

---

## File Checklist

### Core Files (✅ Complete)
- [x] `/src/state/gamesStore.ts`
- [x] `/src/screens/games/PsychicGamesHub.tsx`
- [x] `/src/screens/games/ResultsDashboard.tsx`
- [x] `/src/services/games/mazeAnalysis.ts`
- [x] `/src/services/games/emotionAnalysis.ts`
- [x] `/src/services/games/decisionAnalysis.ts`
- [x] `/src/services/games/duoMatching.ts`
- [x] `/src/data/iconicDuos.ts`

### Integration Files (🔨 Needed)
- [ ] Update `/src/screens/games/CognitiveSyncMaze.tsx`
- [ ] Create `/src/screens/games/MazeResults.tsx`
- [ ] Update `/src/screens/games/EmotionalResonanceMapping.tsx`
- [ ] Create `/src/screens/games/EmotionResults.tsx`
- [ ] Update `/src/screens/games/TemporalDecisionSync.tsx`
- [ ] Create `/src/screens/games/DecisionResults.tsx`
- [ ] Update `/src/screens/games/IconicDuoMatcher.tsx`
- [ ] Create `/src/screens/games/DuoResults.tsx`

### Data Files (🔨 Needed)
- [ ] Create `/src/data/decisionScenarios.ts`
- [ ] Create `/src/data/duoQuizQuestions.ts`

### Component Files (🔨 Needed)
- [ ] Create `/src/components/games/DirectionChart.tsx`
- [ ] Create `/src/components/games/OverlapVisualization.tsx`
- [ ] Create `/src/components/games/CategoryRadarChart.tsx`
- [ ] Create `/src/components/games/DuoShareCard.tsx`

---

## Estimated Time to Complete

- **Navigation Integration**: 30 min
- **Maze Game + Results**: 2 hours
- **Emotion Game + Results**: 2 hours
- **Decision Game + Results**: 2 hours
- **Duo Quiz + Results**: 2 hours
- **Data Files Creation**: 1 hour
- **Chart Components**: 3 hours
- **Testing & Debugging**: 3 hours

**Total**: ~15-20 hours for complete Epic 2 implementation

---

## Success Criteria

When Epic 2 is fully complete, you should be able to:

1. ✅ Navigate from Home to Psychic Games Hub
2. ✅ See all 4 games with proper icons and descriptions
3. ✅ Play each game and have data saved
4. ✅ Complete a game and see waiting state for twin
5. ✅ Mock twin completion and see results
6. ✅ View synchronicity scores with insights
7. ✅ Navigate to Results Dashboard
8. ✅ Filter results and view trends
9. ✅ Share results (optional but recommended)
10. ✅ All tests passing with >80% coverage

---

## Support Resources

- **Technical Spec**: `/docs/tech-spec-epic-2.md`
- **Implementation Summary**: `/docs/epic-2-implementation-summary.md`
- **Story Files**: `/docs/stories/2-*.md`
- **Existing Components**: Check `/src/components/common/` for reusable pieces
- **Theme Colors**: `/src/theme/colors.ts` for accent colors

---

## Next Steps After Epic 2

Once Epic 2 is complete:
1. Add AI-powered insight generation (use OpenAI API)
2. Implement social sharing with custom share cards
3. Add game result push notifications
4. Create achievements for completion milestones
5. Integrate with Epic 7 Firebase for real-time sync

---

**Questions?** Refer to the technical spec or implementation summary documents.

Good luck! The hardest part (algorithms and state management) is already done. 🚀
