import { BehaviorEvent, SyncEvent, SyncPattern, TwintuitionConfig, LocationSyncData, EmotionalSyncData, TemporalSyncData } from '../types/twintuition';

/**
 * Advanced AI-powered behavior analysis for detecting twin synchronicity
 */

// Distance calculation for location sync
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Time difference calculation
function getTimeDifferenceMinutes(time1: string, time2: string): number {
  const date1 = new Date(time1);
  const date2 = new Date(time2);
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60);
}

// Text similarity using simple Jaccard index
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Emotion similarity calculation
function calculateEmotionSimilarity(emotion1: string, emotion2: string): number {
  if (emotion1 === emotion2) return 1.0;
  
  const emotionGroups = {
    positive: ['happy', 'excited', 'joyful', 'content', 'elated'],
    negative: ['sad', 'angry', 'frustrated', 'disappointed', 'hurt'],
    anxious: ['worried', 'nervous', 'stressed', 'anxious', 'overwhelmed'],
    calm: ['peaceful', 'relaxed', 'serene', 'tranquil', 'centered']
  };
  
  for (const group of Object.values(emotionGroups)) {
    if (group.includes(emotion1) && group.includes(emotion2)) {
      return 0.7; // Same emotional category
    }
  }
  
  return 0.0;
}

// Main pattern analysis function
export async function analyzePatterns(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  
  if (events.length < 2) return patterns;
  
  // Group events by twin pairs
  const twinPairs = new Map<string, BehaviorEvent[]>();
  
  events.forEach(event => {
    const key = [event.userId, event.twinId].filter(Boolean).sort().join('-');
    if (!twinPairs.has(key)) {
      twinPairs.set(key, []);
    }
    twinPairs.get(key)!.push(event);
  });
  
  // Analyze each twin pair
  for (const [pairKey, pairEvents] of twinPairs) {
    // 1. Simultaneous Action Detection
    const simultaneousPatterns = await detectSimultaneousActions(pairEvents, config);
    patterns.push(...simultaneousPatterns);
    
    // 2. Mood Synchronization Detection
    const moodPatterns = await detectMoodSynchronization(pairEvents, config);
    patterns.push(...moodPatterns);
    
    // 3. App Usage Synchronization
    const appPatterns = await detectAppSynchronization(pairEvents, config);
    patterns.push(...appPatterns);
    
    // 4. Location Synchronization (if enabled)
    if (config.enableLocationSync) {
      const locationPatterns = await detectLocationSynchronization(pairEvents, config);
      patterns.push(...locationPatterns);
    }
    
    // 5. Temporal Patterns
    const temporalPatterns = await detectTemporalPatterns(pairEvents, config);
    patterns.push(...temporalPatterns);
  }
  
  // Sort by confidence and return top patterns
  return patterns
    .filter(p => p.confidence >= config.minConfidenceThreshold)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Limit to top 5 patterns
}

// Real-time synchronicity detection
export async function detectSynchronicity(
  newEvent: BehaviorEvent,
  recentEvents: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncEvent | null> {
  const twinEvents = recentEvents.filter(e => 
    e.twinId === newEvent.userId || e.userId === newEvent.twinId
  );
  
  if (twinEvents.length === 0) return null;
  
  // Check for immediate synchronicity
  const syncTimeWindow = config.timeWindowMinutes * 60 * 1000; // Convert to milliseconds
  const newEventTime = new Date(newEvent.timestamp).getTime();
  
  const recentTwinEvents = twinEvents.filter(e => {
    const eventTime = new Date(e.timestamp).getTime();
    return (newEventTime - eventTime) <= syncTimeWindow;
  });
  
  if (recentTwinEvents.length === 0) return null;
  
  // Find the most synchronous event
  let bestMatch: { event: BehaviorEvent; confidence: number } | null = null;
  
  for (const twinEvent of recentTwinEvents) {
    const timeDiff = getTimeDifferenceMinutes(newEvent.timestamp, twinEvent.timestamp);
    const maxAllowedDiff = config.timeWindowMinutes;
    
    if (timeDiff <= maxAllowedDiff) {
      let confidence = 1 - (timeDiff / maxAllowedDiff); // Time-based confidence
      
      // Boost confidence based on action similarity
      if (newEvent.type === twinEvent.type && newEvent.action === twinEvent.action) {
        confidence *= 1.5;
      }
      
      // Boost for location similarity
      if (newEvent.location && twinEvent.location) {
        const distance = calculateDistance(
          newEvent.location.latitude, newEvent.location.longitude,
          twinEvent.location.latitude, twinEvent.location.longitude
        );
        if (distance < 1000) { // Within 1km
          confidence *= 1.3;
        }
      }
      
      // Boost for emotional similarity
      if (newEvent.context?.emotion && twinEvent.context?.emotion) {
        const emotionSim = calculateEmotionSimilarity(newEvent.context.emotion, twinEvent.context.emotion);
        confidence *= (1 + emotionSim * 0.5);
      }
      
      confidence = Math.min(1.0, confidence); // Cap at 1.0
      
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { event: twinEvent, confidence };
      }
    }
  }
  
  if (bestMatch && bestMatch.confidence >= config.minConfidenceThreshold) {
    return {
      type: determineSyncType(newEvent, bestMatch.event),
      confidence: bestMatch.confidence,
      description: generateSyncDescription(newEvent, bestMatch.event, bestMatch.confidence),
      involvedEvents: [newEvent, bestMatch.event],
      detectedAt: new Date().toISOString(),
    };
  }
  
  return null;
}

// Helper function to determine sync type
function determineSyncType(event1: BehaviorEvent, event2: BehaviorEvent): SyncEvent['type'] {
  if (event1.type === 'app_interaction' && event2.type === 'app_interaction') {
    return 'app_synchronization';
  }
  
  if (event1.type === 'mood_update' && event2.type === 'mood_update') {
    return 'mood_synchronization';
  }
  
  if (event1.location && event2.location) {
    return 'location_synchronization';
  }
  
  if (event1.action === event2.action) {
    return 'simultaneous_action';
  }
  
  return 'temporal_pattern';
}

// Generate descriptive text for sync events
function generateSyncDescription(event1: BehaviorEvent, event2: BehaviorEvent, confidence: number): string {
  const confidencePercent = Math.round(confidence * 100);
  const timeDiff = getTimeDifferenceMinutes(event1.timestamp, event2.timestamp);
  
  if (event1.type === 'app_interaction' && event2.type === 'app_interaction') {
    return `Both twins ${event1.action.replace('_', ' ')} within ${Math.round(timeDiff)} minutes of each other`;
  }
  
  if (event1.type === 'mood_update' && event2.type === 'mood_update') {
    return `Twins experienced similar emotions (${event1.context?.emotion || 'unknown'}) at nearly the same time`;
  }
  
  return `Twins performed synchronized actions with ${confidencePercent}% confidence`;
}

// Specific pattern detection functions
async function detectSimultaneousActions(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  const actionGroups = new Map<string, BehaviorEvent[]>();
  
  // Group events by action type
  events.forEach(event => {
    const key = `${event.type}-${event.action}`;
    if (!actionGroups.has(key)) {
      actionGroups.set(key, []);
    }
    actionGroups.get(key)!.push(event);
  });
  
  // Find simultaneous actions
  for (const [actionKey, actionEvents] of actionGroups) {
    if (actionEvents.length >= 2) {
      // Check if events happened within time window
      const sortedEvents = actionEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const timeDiff = getTimeDifferenceMinutes(sortedEvents[i].timestamp, sortedEvents[i + 1].timestamp);
        if (timeDiff <= config.timeWindowMinutes) {
          const confidence = Math.max(0.5, 1 - (timeDiff / config.timeWindowMinutes));
          
          patterns.push({
            type: 'simultaneous_action',
            confidence,
            description: `Both twins ${sortedEvents[i].action.replace('_', ' ')} within ${Math.round(timeDiff)} minutes`,
            events: [sortedEvents[i], sortedEvents[i + 1]],
            detectedFeatures: ['timing', 'action_type'],
          });
        }
      }
    }
  }
  
  return patterns;
}

async function detectMoodSynchronization(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  const moodEvents = events.filter(e => e.type === 'mood_update');
  
  if (moodEvents.length < 2) return patterns;
  
  // Compare mood events across twins
  for (let i = 0; i < moodEvents.length - 1; i++) {
    for (let j = i + 1; j < moodEvents.length; j++) {
      const event1 = moodEvents[i];
      const event2 = moodEvents[j];
      
      // Skip if same user
      if (event1.userId === event2.userId) continue;
      
      const timeDiff = getTimeDifferenceMinutes(event1.timestamp, event2.timestamp);
      if (timeDiff <= config.timeWindowMinutes * 2) { // Longer window for moods
        const emotion1 = event1.context?.mood || event1.context?.emotion || 'unknown';
        const emotion2 = event2.context?.mood || event2.context?.emotion || 'unknown';
        
        const emotionSimilarity = calculateEmotionSimilarity(emotion1, emotion2);
        if (emotionSimilarity > 0.5) {
          const timeConfidence = Math.max(0.3, 1 - (timeDiff / (config.timeWindowMinutes * 2)));
          const confidence = (emotionSimilarity + timeConfidence) / 2;
          
          patterns.push({
            type: 'mood_synchronization',
            confidence,
            description: `Both twins experienced ${emotion1} emotions within ${Math.round(timeDiff)} minutes`,
            events: [event1, event2],
            detectedFeatures: ['emotion_similarity', 'timing'],
          });
        }
      }
    }
  }
  
  return patterns;
}

async function detectAppSynchronization(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  const appEvents = events.filter(e => e.type === 'app_interaction');
  
  if (appEvents.length < 2) return patterns;
  
  // Look for app opens/actions at similar times
  const openEvents = appEvents.filter(e => e.action === 'open_app');
  
  for (let i = 0; i < openEvents.length - 1; i++) {
    for (let j = i + 1; j < openEvents.length; j++) {
      const event1 = openEvents[i];
      const event2 = openEvents[j];
      
      if (event1.userId === event2.userId) continue;
      
      const timeDiff = getTimeDifferenceMinutes(event1.timestamp, event2.timestamp);
      if (timeDiff <= config.timeWindowMinutes) {
        const confidence = Math.max(0.6, 1 - (timeDiff / config.timeWindowMinutes));
        
        patterns.push({
          type: 'app_synchronization',
          confidence,
          description: `Both twins opened the app within ${Math.round(timeDiff)} minutes of each other`,
          events: [event1, event2],
          detectedFeatures: ['app_timing', 'simultaneous_usage'],
        });
      }
    }
  }
  
  return patterns;
}

async function detectLocationSynchronization(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  const locationEvents = events.filter(e => e.location);
  
  if (locationEvents.length < 2) return patterns;
  
  for (let i = 0; i < locationEvents.length - 1; i++) {
    for (let j = i + 1; j < locationEvents.length; j++) {
      const event1 = locationEvents[i];
      const event2 = locationEvents[j];
      
      if (event1.userId === event2.userId || !event1.location || !event2.location) continue;
      
      const distance = calculateDistance(
        event1.location.latitude, event1.location.longitude,
        event2.location.latitude, event2.location.longitude
      );
      
      const timeDiff = getTimeDifferenceMinutes(event1.timestamp, event2.timestamp);
      
      if (distance < 5000 && timeDiff <= config.timeWindowMinutes * 3) { // Within 5km and extended time
        const locationConfidence = Math.max(0.3, 1 - (distance / 5000));
        const timeConfidence = Math.max(0.3, 1 - (timeDiff / (config.timeWindowMinutes * 3)));
        const confidence = (locationConfidence + timeConfidence) / 2;
        
        patterns.push({
          type: 'location_synchronization',
          confidence,
          description: `Twins were ${Math.round(distance)}m apart within ${Math.round(timeDiff)} minutes`,
          events: [event1, event2],
          detectedFeatures: ['proximity', 'timing'],
        });
      }
    }
  }
  
  return patterns;
}

async function detectTemporalPatterns(
  events: BehaviorEvent[],
  config: TwintuitionConfig
): Promise<SyncPattern[]> {
  const patterns: SyncPattern[] = [];
  
  // Group events by hour of day
  const hourlyActivity = new Map<number, BehaviorEvent[]>();
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    if (!hourlyActivity.has(hour)) {
      hourlyActivity.set(hour, []);
    }
    hourlyActivity.get(hour)!.push(event);
  });
  
  // Find hours with activity from both twins
  for (const [hour, hourEvents] of hourlyActivity) {
    const userIds = new Set(hourEvents.map(e => e.userId));
    if (userIds.size >= 2) { // Both twins active in this hour
      const confidence = Math.min(1.0, hourEvents.length * 0.2); // More events = higher confidence
      
      patterns.push({
        type: 'temporal_pattern',
        confidence,
        description: `Both twins show synchronized activity patterns around ${hour}:00`,
        events: hourEvents.slice(0, 5), // Limit events
        detectedFeatures: ['daily_rhythm', 'activity_timing'],
      });
    }
  }
  
  return patterns;
}

// Advanced analytics functions
export function calculateSyncScore(events: BehaviorEvent[]): number {
  if (events.length < 2) return 0;
  
  // Calculate various sync metrics
  const timeSyncScore = calculateTimeSync(events);
  const actionSyncScore = calculateActionSync(events);
  const emotionSyncScore = calculateEmotionSync(events);
  
  // Weighted average
  return Math.round((timeSyncScore * 0.4 + actionSyncScore * 0.4 + emotionSyncScore * 0.2) * 100);
}

function calculateTimeSync(events: BehaviorEvent[]): number {
  const timestamps = events.map(e => new Date(e.timestamp).getTime());
  timestamps.sort((a, b) => a - b);
  
  let syncScore = 0;
  let comparisons = 0;
  
  for (let i = 0; i < timestamps.length - 1; i++) {
    for (let j = i + 1; j < timestamps.length; j++) {
      const timeDiff = Math.abs(timestamps[j] - timestamps[i]) / (1000 * 60); // minutes
      if (timeDiff <= 60) { // Within 1 hour
        syncScore += Math.max(0, 1 - (timeDiff / 60));
        comparisons++;
      }
    }
  }
  
  return comparisons > 0 ? syncScore / comparisons : 0;
}

function calculateActionSync(events: BehaviorEvent[]): number {
  const actions = events.map(e => `${e.type}-${e.action}`);
  const uniqueActions = new Set(actions);
  const duplicateActions = actions.length - uniqueActions.size;
  
  return duplicateActions / Math.max(1, actions.length);
}

function calculateEmotionSync(events: BehaviorEvent[]): number {
  const emotions = events
    .map(e => e.context?.emotion || e.context?.mood)
    .filter(Boolean);
  
  if (emotions.length < 2) return 0;
  
  let similaritySum = 0;
  let comparisons = 0;
  
  for (let i = 0; i < emotions.length - 1; i++) {
    for (let j = i + 1; j < emotions.length; j++) {
      similaritySum += calculateEmotionSimilarity(emotions[i], emotions[j]);
      comparisons++;
    }
  }
  
  return comparisons > 0 ? similaritySum / comparisons : 0;
}