# Story 3.6: Twintuition Pattern Analysis Dashboard

Status: drafted

## Story

As a **paired user**,
I want **to see patterns and insights about when and how we send alerts**,
so that **I can understand our connection rhythms and discover trends in our synchronicity**.

## Acceptance Criteria

1. Time window selector with preset options (Last week, Last month, Last 3 months, All time)
2. Synchronicity Score Trend line chart showing score progression over time
3. Emotion Frequency chart (bar chart or pie chart) showing distribution of emotions
4. Time-of-Day Heatmap displaying 24-hour distribution of alert activity
5. Day-of-Week bar chart showing weekly patterns
6. Top insight cards with auto-generated statements:
   - Most common emotion and its percentage
   - Most active hour of day and day of week
   - Overall synchronicity rate (percentage)
   - Average response time to twin's alerts
7. Total alerts metric displaying sent + received count
8. All charts render in under 1 second with smooth animations
9. Charts are tappable to show detailed breakdowns
10. Share insights feature (screenshot or generated share card)
11. All charts use galaxy theme colors for visual consistency

## Tasks / Subtasks

- [ ] **Task 1**: Create TwintuitionInsights dashboard screen (AC: 1, 7)
  - [ ] Create `src/screens/twintuition/TwintuitionInsights.tsx`
  - [ ] Apply galaxy background for consistency
  - [ ] Add time window selector at top (dropdown or segmented control)
  - [ ] Implement time window state management
  - [ ] Display total alerts metric prominently
  - [ ] Create scrollable view for charts and insights

- [ ] **Task 2**: Implement pattern analysis data aggregation (AC: 2-7)
  - [ ] Add `generatePatternAnalysis()` to twintuitionService
  - [ ] Query alerts within selected time window
  - [ ] Calculate total sent/received counts
  - [ ] Calculate synchronicity rate (% of synchronous alerts)
  - [ ] Calculate average response time
  - [ ] Determine most common emotion (frequency count)
  - [ ] Build hourly distribution array (24 elements, 0-23 hours)
  - [ ] Build weekly distribution array (7 elements, 0-6 days)
  - [ ] Calculate synchronicity score trend over time

- [ ] **Task 3**: Create Synchronicity Trend line chart (AC: 2)
  - [ ] Use react-native-chart-kit LineChart or react-native-svg + d3
  - [ ] X-axis: Time periods (weeks or months depending on window)
  - [ ] Y-axis: Synchronicity score (0-100)
  - [ ] Plot trend line showing score progression
  - [ ] Add gradient fill under line (galaxy colors)
  - [ ] Show data points with dots
  - [ ] Enable tap to see exact values

- [ ] **Task 4**: Create Emotion Frequency chart (AC: 3)
  - [ ] Use BarChart or PieChart from react-native-chart-kit
  - [ ] Display all 8 emotions with their frequencies
  - [ ] Use emotion-specific colors for bars/slices
  - [ ] Show percentages on chart
  - [ ] Tap emotion to filter history to that emotion

- [ ] **Task 5**: Create Time-of-Day Heatmap (AC: 4)
  - [ ] Create custom heatmap component with react-native-svg
  - [ ] Display 24-hour grid (0-23 hours)
  - [ ] Color intensity based on alert count (gradient from dark to bright)
  - [ ] Use galaxy theme colors (dark blue to bright blue)
  - [ ] Label hours with AM/PM format
  - [ ] Highlight most active hour with border or glow

- [ ] **Task 6**: Create Day-of-Week bar chart (AC: 5)
  - [ ] Use BarChart from react-native-chart-kit
  - [ ] X-axis: Days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  - [ ] Y-axis: Alert count
  - [ ] Color bars with galaxy gradient
  - [ ] Highlight most active day

- [ ] **Task 7**: Create auto-generated insight cards (AC: 6)
  - [ ] Create InsightCard component
  - [ ] Generate insight text based on pattern data:
    - "Joy is your most shared emotion (42%)"
    - "You're most active at 8 PM"
    - "Wednesdays are your peak connection day"
    - "You have a 23% synchronicity rate"
    - "You reply to alerts in 15 minutes on average"
  - [ ] Display cards in grid layout (2 columns)
  - [ ] Use icons to illustrate each insight

- [ ] **Task 8**: Implement chart tap interactions (AC: 9)
  - [ ] Add onPress handlers to all charts
  - [ ] Show modal or bottom sheet with detailed breakdown
  - [ ] Display exact values and percentages
  - [ ] Allow navigation to filtered history from chart

- [ ] **Task 9**: Implement share insights feature (AC: 10)
  - [ ] Add "Share" button in header
  - [ ] Generate shareable image with key insights
  - [ ] Use react-native-view-shot to capture screen
  - [ ] Include: synchronicity score, top emotion, time window
  - [ ] Share via expo-sharing
  - [ ] Style share card with galaxy theme

- [ ] **Task 10**: Optimize chart rendering performance (AC: 8)
  - [ ] Memoize chart data calculations
  - [ ] Use React.memo for chart components
  - [ ] Lazy load charts (render as user scrolls)
  - [ ] Cache pattern analysis results (1 hour TTL)
  - [ ] Ensure < 1 second render time
  - [ ] Test with large datasets (1000+ alerts)

- [ ] **Task 11**: Apply galaxy theme to all charts (AC: 11)
  - [ ] Use consistent color palette across all charts
  - [ ] Line chart: stellar-blue gradient
  - [ ] Bar charts: nebula-rose to solar-amber gradient
  - [ ] Heatmap: dark blue to bright blue gradient
  - [ ] Pie chart: emotion-specific colors
  - [ ] Add subtle glow effects to chart elements

- [ ] **Task 12**: Write unit tests
  - [ ] Test generatePatternAnalysis with various time windows
  - [ ] Test metric calculations (synchronicity rate, avg response time)
  - [ ] Test hourly and weekly distribution aggregation
  - [ ] Test most common emotion detection
  - [ ] Test edge cases: no alerts, all synchronous, single emotion

- [ ] **Task 13**: Write integration tests
  - [ ] Test time window change updates all charts
  - [ ] Test chart tap interactions show details
  - [ ] Test share feature generates image
  - [ ] Test charts render with correct data
  - [ ] Test performance with large dataset

## Dev Notes

### Architecture Patterns and Constraints

**State Management Pattern:**
- Pattern analysis calculated on-demand (not persisted)
- Results cached for 1 hour to avoid recalculation
- Time window selection managed in component state

**Pattern Analysis Data Structure:**
```typescript
interface AlertPattern {
  userId: string;
  twinId: string;
  timeWindow: {
    start: string;                 // ISO 8601 date
    end: string;                   // ISO 8601 date
  };
  metrics: {
    totalAlerts: number;
    sentAlerts: number;
    receivedAlerts: number;
    averageResponseTime: number;   // Milliseconds
    synchronicityRate: number;     // Percentage (0-100)
    mostCommonEmotion: EmotionType;
    mostActiveHour: number;        // 0-23
    mostActiveDay: number;         // 0-6 (0=Sunday)
  };
  emotionFrequency: {
    [key in EmotionType]: number;  // Count per emotion
  };
  hourlyDistribution: number[];    // 24-element array
  weeklyDistribution: number[];    // 7-element array
  synchronicityTrend: {
    date: string;
    score: number;
  }[];
}
```

**Pattern Analysis Algorithm:**
```typescript
const generatePatternAnalysis = (
  userId: string,
  twinId: string,
  timeWindow: { start: string; end: string }
): AlertPattern => {
  // Get alerts in time window
  const alerts = twintuitionStore.getAlertHistory({
    startDate: timeWindow.start,
    endDate: timeWindow.end
  });

  // Calculate metrics
  const totalAlerts = alerts.length;
  const sentAlerts = alerts.filter(a => a.senderId === userId).length;
  const receivedAlerts = alerts.filter(a => a.receiverId === userId).length;
  const synchronousAlerts = alerts.filter(a => a.isSynchronous).length;
  const synchronicityRate = (synchronousAlerts / totalAlerts) * 100 || 0;

  // Calculate average response time
  const responseTimes: number[] = [];
  alerts.forEach(alert => {
    if (alert.repliedTo) {
      const originalAlert = alerts.find(a => a.id === alert.repliedTo);
      if (originalAlert) {
        const timeDiff = new Date(alert.sentAt).getTime() - new Date(originalAlert.sentAt).getTime();
        responseTimes.push(timeDiff);
      }
    }
  });
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  // Emotion frequency
  const emotionFrequency: Record<EmotionType, number> = {
    joy: 0, sadness: 0, anger: 0, fear: 0,
    surprise: 0, disgust: 0, trust: 0, anticipation: 0
  };
  alerts.forEach(alert => {
    emotionFrequency[alert.emotion]++;
  });

  // Most common emotion
  const mostCommonEmotion = Object.entries(emotionFrequency)
    .sort(([, a], [, b]) => b - a)[0][0] as EmotionType;

  // Hourly distribution (0-23)
  const hourlyDistribution = new Array(24).fill(0);
  alerts.forEach(alert => {
    const hour = new Date(alert.sentAt).getHours();
    hourlyDistribution[hour]++;
  });
  const mostActiveHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));

  // Weekly distribution (0-6, 0=Sunday)
  const weeklyDistribution = new Array(7).fill(0);
  alerts.forEach(alert => {
    const day = new Date(alert.sentAt).getDay();
    weeklyDistribution[day]++;
  });
  const mostActiveDay = weeklyDistribution.indexOf(Math.max(...weeklyDistribution));

  // Synchronicity trend (group by week or month)
  const synchronicityTrend = calculateTrend(alerts, timeWindow);

  return {
    userId,
    twinId,
    timeWindow,
    metrics: {
      totalAlerts,
      sentAlerts,
      receivedAlerts,
      averageResponseTime,
      synchronicityRate,
      mostCommonEmotion,
      mostActiveHour,
      mostActiveDay
    },
    emotionFrequency,
    hourlyDistribution,
    weeklyDistribution,
    synchronicityTrend
  };
};
```

**Time Window Presets:**
```typescript
const TIME_WINDOWS = {
  WEEK: { label: 'Last Week', days: 7 },
  MONTH: { label: 'Last Month', days: 30 },
  THREE_MONTHS: { label: 'Last 3 Months', days: 90 },
  ALL_TIME: { label: 'All Time', days: null }
};

const getTimeWindow = (preset: keyof typeof TIME_WINDOWS) => {
  const end = new Date();
  const start = preset === 'ALL_TIME'
    ? new Date(0) // Beginning of time
    : new Date(end.getTime() - TIME_WINDOWS[preset].days * 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};
```

**Insight Generation:**
```typescript
const generateInsights = (pattern: AlertPattern): string[] => {
  const insights: string[] = [];

  // Most common emotion
  const emotionPercentage = Math.round(
    (pattern.emotionFrequency[pattern.metrics.mostCommonEmotion] / pattern.metrics.totalAlerts) * 100
  );
  insights.push(
    `${capitalizeEmotion(pattern.metrics.mostCommonEmotion)} is your most shared emotion (${emotionPercentage}%)`
  );

  // Most active hour
  const hourLabel = format12Hour(pattern.metrics.mostActiveHour);
  insights.push(`You're most active at ${hourLabel}`);

  // Most active day
  const dayLabel = getDayName(pattern.metrics.mostActiveDay);
  insights.push(`${dayLabel}s are your peak connection day`);

  // Synchronicity rate
  insights.push(`You have a ${Math.round(pattern.metrics.synchronicityRate)}% synchronicity rate`);

  // Average response time
  if (pattern.metrics.averageResponseTime > 0) {
    const responseMinutes = Math.round(pattern.metrics.averageResponseTime / (60 * 1000));
    insights.push(`You reply to alerts in ${responseMinutes} minutes on average`);
  }

  return insights;
};
```

**Chart Configuration (react-native-chart-kit):**
```typescript
const chartConfig = {
  backgroundColor: '#1a1a2e',
  backgroundGradientFrom: '#16213e',
  backgroundGradientTo: '#0f3460',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74, 159, 255, ${opacity})`, // stellar-blue
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#4A9FFF'
  }
};
```

### Source Tree Components

**Files to Create:**
- `src/screens/twintuition/TwintuitionInsights.tsx` - Main insights dashboard
- `src/components/twintuition/InsightCard.tsx` - Individual insight display
- `src/components/twintuition/TimeOfDayHeatmap.tsx` - Custom heatmap component
- `src/services/twintuitionService.ts` - Add generatePatternAnalysis method
- `src/utils/chartHelpers.ts` - Chart data formatting utilities

**Files to Modify:**
- `src/state/twintuitionStore.ts` - Add pattern analysis caching
- `src/navigation/AppNavigator.tsx` - Add TwintuitionInsights route

**Design System Components to Use:**
- react-native-chart-kit for line, bar, and pie charts
- react-native-svg for custom heatmap
- NativeWind for styling
- Galaxy background for consistency
- expo-sharing for share functionality
- react-native-view-shot for screenshot capture

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/twintuition/TwintuitionInsights.test.tsx`
- `__tests__/services/twintuitionService.test.ts` (generatePatternAnalysis)
- `__tests__/components/twintuition/InsightCard.test.tsx`
- `__tests__/utils/chartHelpers.test.ts`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock react-native-chart-kit
- Mock date-fns for time window calculations
- Mock large datasets for performance testing

**Key Test Scenarios:**
1. Pattern analysis calculates correct metrics
2. Time window change updates all charts
3. Emotion frequency counts are accurate
4. Hourly and weekly distributions are correct
5. Most common emotion detected correctly
6. Synchronicity rate calculated correctly
7. Average response time calculated correctly
8. Insights generated with correct text
9. Charts render with correct data
10. Share feature generates image successfully
11. Performance: analysis completes in < 1 second

### Project Structure Notes

**Alignment with Unified Structure:**
- Screens in `/src/screens/twintuition/`
- Components in `/src/components/twintuition/`
- Services in `/src/services/`
- Utils in `/src/utils/`
- Tests mirror source structure in `__tests__/`

**Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│ [Time Window Selector]                  │
├─────────────────────────────────────────┤
│ Total Alerts: 247                       │
├─────────────────────────────────────────┤
│ [Synchronicity Trend Line Chart]        │
├─────────────────────────────────────────┤
│ [Insight Card] [Insight Card]           │
│ [Insight Card] [Insight Card]           │
├─────────────────────────────────────────┤
│ [Emotion Frequency Chart]               │
├─────────────────────────────────────────┤
│ [Time-of-Day Heatmap]                   │
├─────────────────────────────────────────┤
│ [Day-of-Week Bar Chart]                 │
└─────────────────────────────────────────┘
```

**Color Palette for Charts:**
```typescript
{
  lineChart: '#4A9FFF' (stellar-blue),
  barChartGradient: ['#FF6B9D', '#FFB84D'], // nebula-rose to solar-amber
  heatmapGradient: ['#0f3460', '#4A9FFF'], // dark blue to stellar-blue
  emotions: {
    joy: '#FFD700',
    sadness: '#4A90E2',
    anger: '#E74C3C',
    // ... (use emotion-specific colors)
  }
}
```

**Performance Optimizations:**
- Memoize generatePatternAnalysis results
- Cache results for 1 hour (TTL)
- Use React.memo for all chart components
- Lazy render charts below fold
- Debounce time window changes (300ms)

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-3.md#Data-Models-and-Contracts] AlertPattern interface
- [Source: docs/tech-spec-epic-3.md#Workflows-and-Sequencing] Pattern analysis flow
- [Source: docs/tech-spec-epic-3.md#APIs-and-Interfaces] generatePatternAnalysis method
- [Source: docs/tech-spec-epic-3.md#Dependencies-and-Integrations] react-native-chart-kit
- [Source: docs/epics.md#Story-3.6] Epic story definition and effort estimate
- [Source: docs/Twinship PRD.md#Twintuition-Button] Pattern tracking requirements

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
