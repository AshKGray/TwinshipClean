// New game types for the sophisticated twin connection system
export type TwinGameType = 'cognitive_sync_maze' | 'emotional_resonance' | 'temporal_decision' | 'iconic_duo';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

// Cognitive & Psychological Insights
export interface GameInsight {
  type: string;
  message: string;
  significance?: 'high' | 'medium' | 'low';
  data: any;
}

export interface TwinGameSession {
  id: string;
  gameType: TwinGameType;
  twins: {
    user1: TwinGamePlayer;
    user2: TwinGamePlayer;
  };
  status: 'waiting' | 'in_progress' | 'analyzing' | 'completed' | 'cancelled';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  insights: GameInsight[];
  synchronicityScore: number;
  metrics: {
    synchronicity: SynchronicityMetrics;
    cognitivePatterns?: CognitivePatterns;
    emotionalResonance?: EmotionalMetrics;
    decisionAlignment?: DecisionMetrics;
  };
}

export interface TwinGamePlayer {
  id: string;
  name: string;
  choices: any[];
  responseData: any;
  completionTime?: number;
}

// Cognitive Pattern Analysis (for Maze game)
export interface CognitivePatterns {
  pathwaySimilarity: number;
  decisionTiming: TimingPattern[];
  errorCorrectionStyle: 'immediate' | 'delayed' | 'backtrack';
  approachStrategy: 'systematic' | 'intuitive' | 'hybrid';
  directionalBias: {
    leftTurns: number;
    rightTurns: number;
    preference: 'left' | 'right' | 'balanced';
  };
}

export interface TimingPattern {
  phase: string;
  avgResponseTime: number;
  consistency: number;
}

// Emotional Resonance Metrics
export interface EmotionalMetrics {
  vocabularyOverlap: number;
  somaticSimilarity: number;
  colorEmotionAlignment: number;
  intensityCorrelation: number;
  dominantEmotions: string[];
}

// Decision Pattern Analysis
export interface DecisionMetrics {
  valueAlignment: number;
  riskToleranceGap: number;
  stressResponseSimilarity: number;
  temporalSync: number;
  dominantValues: string[];
}

// Synchronicity Calculations
export interface SynchronicityMetrics {
  overallScore: number;
  cognitiveSync: number;
  emotionalSync: number;
  temporalSync: number;
  intuitionAccuracy: number;
}

// Game Configurations
export interface TwinGameConfig {
  id: TwinGameType;
  name: string;
  description: string;
  psychologicalFocus: string;
  icon: string;
  difficulty: GameDifficulty;
  insightExample: string;
  timeLimit?: number;
  rounds?: number;
}

// Maze Game Specific
export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

export interface MazeError {
  position: TouchPoint;
  correctionTime: number;
  correctionType: 'immediate' | 'backtrack';
}

export interface MazePath {
  points: TouchPoint[];
  errors: MazeError[];
  totalTime: number;
  completionStatus: 'completed' | 'abandoned';
}

// Emotional Resonance Specific
export interface EmotionalResponse {
  imageId: string;
  emotionalRatings: {
    [emotion: string]: number;
  };
  somaticLocation: {
    x: number;
    y: number;
    area: 'head' | 'chest' | 'stomach' | 'full';
  };
  colorAssociation: string;
  wordAssociations: string[];
  responseTime: number;
}

// Temporal Decision Specific
export interface Decision {
  scenarioId: string;
  choices: string[];
  timeToDecide: number;
  timestamp: number;
  stressLevel: 'low' | 'medium' | 'high';
}

export interface DecisionScenario {
  id: string;
  title: string;
  prompt: string;
  options: string[];
  timeLimit: number;
  category: 'crisis' | 'resource' | 'social' | 'ethical';
}

// Iconic Duo Specific
export interface DuoProfile {
  id: string;
  names: string;
  category: string;
  description: string;
  dynamics: string[];
  color: string;
  icon: string;
}

export interface DuoMatchResult {
  matchedDuo: DuoProfile;
  perceptionGap: number;
  alignmentAreas: string[];
  divergenceAreas: string[];
}

// Achievement System (Updated)
export interface TwinAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'insight' | 'synchronicity' | 'discovery' | 'milestone';
  requirement: {
    type: 'sync_score' | 'game_count' | 'insight_count' | 'special';
    value: number;
    gameType?: TwinGameType;
  };
}

// Game State (Updated)
export interface TwinGameState {
  currentSession: TwinGameSession | null;
  gameHistory: TwinGameSession[];
  insights: GameInsight[];
  achievements: TwinAchievement[];
  synchronicityProfile: {
    cognitive: CognitivePatterns | null;
    emotional: EmotionalMetrics | null;
    decision: DecisionMetrics | null;
    relationship: DuoMatchResult | null;
  };
}

// Analytics (Updated)
export interface TwinGameAnalytics {
  sessionId: string;
  gameType: TwinGameType;
  duration: number;
  synchronicityScore: number;
  insightsGenerated: number;
  keyDiscoveries: string[];
  twinConnectionStrength: number;
}

// Visual Effects (kept for continuity)
export interface ParticleEffect {
  id: string;
  type: 'success' | 'sync' | 'mystical' | 'insight';
  x: number;
  y: number;
  color: string;
  duration: number;
}

export interface SoundEffect {
  type: 'match' | 'miss' | 'sync' | 'countdown' | 'mystical' | 'discovery';
  volume: number;
}

// Re-export any hooks or stores if they exist
// export * from '../../../state/stores/games/gameStore';
// export * from '../../../hooks/games/useGameConfig';