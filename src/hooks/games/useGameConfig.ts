import { TwinGameConfig, SymbolChoice } from '../../types/games';

export const GAME_CONFIGS: Record<string, TwinGameConfig> = {
  cognitive_sync_maze: {
    id: 'cognitive_sync_maze',
    name: 'Cognitive Synchrony Maze',
    description: 'Navigate identical mazes to reveal how your minds work in harmony',
    psychologicalFocus: 'Problem-solving patterns & decision-making styles',
    icon: 'git-branch',
    difficulty: 'medium',
    insightExample: 'You both favor right-hand turns 73% of the time',
    timeLimit: 120,
    rounds: 1
  },
  emotional_resonance: {
    id: 'emotional_resonance',
    name: 'Emotional Resonance Mapping',
    description: 'Explore emotional synchrony through abstract imagery and sensations',
    psychologicalFocus: 'Emotional processing & empathic connection',
    icon: 'heart-circle',
    difficulty: 'hard',
    insightExample: 'Your emotional vocabularies overlap by 67%',
    rounds: 4
  },
  temporal_decision: {
    id: 'temporal_decision',
    name: 'Temporal Decision Synchrony',
    description: 'Make rapid-fire decisions to uncover shared values and instincts',
    psychologicalFocus: 'Values alignment & stress responses',
    icon: 'timer',
    difficulty: 'medium',
    insightExample: 'You both become 40% more pragmatic under pressure',
    rounds: 5
  },
  iconic_duo: {
    id: 'iconic_duo',
    name: 'Which Iconic Duo Are You?',
    description: 'Discover which famous pair best represents your twin dynamic',
    psychologicalFocus: 'Relationship dynamics & self-perception',
    icon: 'people',
    difficulty: 'easy',
    insightExample: "You're most like Fred & George Weasley: synchronized mischief",
    rounds: 1
  }
};

// Keep symbol choices as they're still used in the new system
export const SYMBOL_CHOICES: SymbolChoice[] = [
  { id: 'infinity', symbol: '∞', meaning: 'Eternal Connection', category: 'mystical' },
  { id: 'triangle', symbol: '△', meaning: 'Balance & Harmony', category: 'geometric' },
  { id: 'circle', symbol: '○', meaning: 'Unity & Wholeness', category: 'geometric' },
  { id: 'star', symbol: '✦', meaning: 'Guidance & Light', category: 'cosmic' },
  { id: 'moon', symbol: '☽', meaning: 'Intuition & Mystery', category: 'cosmic' },
  { id: 'spiral', symbol: '🌀', meaning: 'Growth & Evolution', category: 'mystical' },
  { id: 'hexagon', symbol: '⬡', meaning: 'Perfect Structure', category: 'geometric' },
  { id: 'yin_yang', symbol: '☯', meaning: 'Duality & Balance', category: 'mystical' },
  { id: 'lotus', symbol: '🪷', meaning: 'Spiritual Awakening', category: 'mystical' },
  { id: 'diamond', symbol: '◊', meaning: 'Clarity & Strength', category: 'geometric' }
];

// New emotion choices for emotional resonance game
export const EMOTION_RATINGS = [
  'joy',
  'sadness',
  'peace',
  'anxiety',
  'love',
  'curiosity'
];

// Word options for emotional resonance
export const EMOTION_WORDS = [
  'flowing', 'sharp', 'warm', 'cold', 'expansive', 'contained',
  'rising', 'falling', 'vibrant', 'muted', 'chaotic', 'ordered',
  'ancient', 'new', 'familiar', 'strange', 'peaceful', 'energetic'
];

// Color choices for emotional associations
export const EMOTION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#F9C74F', '#90BE6D', '#8B5CF6',
  '#F72585', '#4361EE', '#F77F00', '#06FFA5', '#FF006E', '#3A86FF'
];

export const useGameConfig = () => {
  const getGameConfig = (gameType: string): TwinGameConfig | undefined => {
    return GAME_CONFIGS[gameType];
  };

  const getSymbolChoices = (): SymbolChoice[] => SYMBOL_CHOICES;
  
  const getEmotionRatings = (): string[] => EMOTION_RATINGS;
  
  const getEmotionWords = (): string[] => EMOTION_WORDS;
  
  const getEmotionColors = (): string[] => EMOTION_COLORS;
  
  const getNumberRange = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { min: 1, max: 5 };
      case 'medium': return { min: 1, max: 10 };
      case 'hard': return { min: 1, max: 20 };
      default: return { min: 1, max: 10 };
    }
  };

  return {
    getGameConfig,
    getSymbolChoices,
    getEmotionRatings,
    getEmotionWords,
    getEmotionColors,
    getNumberRange,
    allGames: Object.values(GAME_CONFIGS)
  };
};

export default useGameConfig;