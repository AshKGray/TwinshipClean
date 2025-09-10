/**
 * Numerology Reading Service
 * Generates personalized numerology profiles and twin number connections
 */

export interface NumerologyData {
  fullName: string;
  dateOfBirth: Date;
}

export interface LifePathNumber {
  number: number;
  isMasterNumber: boolean;
  title: string;
  description: string;
  traits: string[];
  challenges: string[];
  purpose: string;
  compatibility: number[];
}

export interface NumerologyProfile {
  id: string;
  userId: string;
  generatedAt: string;
  
  // Core numbers
  lifePath: LifePathNumber;
  expression: LifePathNumber;
  soulUrge: LifePathNumber;
  personality: LifePathNumber;
  birthday: LifePathNumber;
  
  // Name analysis
  cornerstone: {
    letter: string;
    meaning: string;
  };
  capstone: {
    letter: string;
    meaning: string;
  };
  
  // Special numbers
  karmic: number[];
  hidden: number[];
  
  // Personal insights
  strengths: string[];
  challenges: string[];
  opportunities: string[];
  lifeThemes: string[];
}

export interface TwinNumerology {
  pairId: string;
  twin1Profile: string;
  twin2Profile: string;
  generatedAt: string;
  
  // Compatibility analysis
  lifePathCompatibility: number; // 0-100
  expressionHarmony: number;
  soulConnection: number;
  personalityBalance: number;
  overallSynergy: number;
  
  // Special twin connections
  masterNumberConnections: Array<{
    type: 'shared' | 'complementary' | 'mirror';
    numbers: number[];
    meaning: string;
  }>;
  
  // Karmic connections
  karmicBonds: Array<{
    description: string;
    strength: 'Strong' | 'Moderate' | 'Subtle';
  }>;
  
  // Twin flame indicators
  numerologyMarkers: Array<{
    indicator: string;
    present: boolean;
    significance: string;
  }>;
  
  // Relationship insights
  strengths: string[];
  challenges: string[];
  guidance: string[];
  soulPurpose: string[];
}

// Life Path Number definitions
export const LIFE_PATH_MEANINGS: Record<number, LifePathNumber> = {
  1: {
    number: 1,
    isMasterNumber: false,
    title: "The Leader",
    description: "Independent pioneer with natural leadership abilities and strong drive for success",
    traits: ["Independent", "Ambitious", "Creative", "Strong-willed", "Original"],
    challenges: ["Impatience", "Stubbornness", "Self-centeredness"],
    purpose: "To lead and inspire others while developing self-reliance",
    compatibility: [1, 5, 7]
  },
  2: {
    number: 2,
    isMasterNumber: false,
    title: "The Diplomat",
    description: "Natural peacemaker with intuitive understanding of relationships and cooperation",
    traits: ["Cooperative", "Diplomatic", "Intuitive", "Gentle", "Supportive"],
    challenges: ["Over-sensitivity", "Indecisiveness", "Self-doubt"],
    purpose: "To bring harmony and balance to relationships and situations",
    compatibility: [2, 4, 8]
  },
  3: {
    number: 3,
    isMasterNumber: false,
    title: "The Creative Communicator",
    description: "Artistic and expressive soul with natural gifts for communication and creativity",
    traits: ["Creative", "Expressive", "Optimistic", "Social", "Inspiring"],
    challenges: ["Scattered energy", "Superficiality", "Criticism sensitivity"],
    purpose: "To inspire and uplift others through creative expression",
    compatibility: [3, 6, 9]
  },
  4: {
    number: 4,
    isMasterNumber: false,
    title: "The Builder",
    description: "Practical and hardworking individual who creates stable foundations",
    traits: ["Reliable", "Organized", "Patient", "Loyal", "Systematic"],
    challenges: ["Rigidity", "Narrow-mindedness", "Workaholism"],
    purpose: "To create lasting structures and systems that benefit others",
    compatibility: [2, 4, 8]
  },
  5: {
    number: 5,
    isMasterNumber: false,
    title: "The Adventurer",
    description: "Freedom-loving spirit with insatiable curiosity and need for variety",
    traits: ["Adventurous", "Curious", "Versatile", "Progressive", "Dynamic"],
    challenges: ["Restlessness", "Irresponsibility", "Lack of focus"],
    purpose: "To experience freedom and help others break limiting boundaries",
    compatibility: [1, 5, 7]
  },
  6: {
    number: 6,
    isMasterNumber: false,
    title: "The Nurturer",
    description: "Caring and responsible soul dedicated to family, home, and community service",
    traits: ["Nurturing", "Responsible", "Compassionate", "Healing", "Protective"],
    challenges: ["Over-responsibility", "Martyrdom", "Perfectionism"],
    purpose: "To nurture and heal others while creating harmonious environments",
    compatibility: [3, 6, 9]
  },
  7: {
    number: 7,
    isMasterNumber: false,
    title: "The Seeker",
    description: "Spiritual and analytical mind seeking truth, wisdom, and deeper understanding",
    traits: ["Analytical", "Intuitive", "Spiritual", "Reserved", "Perfectionist"],
    challenges: ["Isolation", "Skepticism", "Overthinking"],
    purpose: "To seek truth and share wisdom with the world",
    compatibility: [1, 5, 7]
  },
  8: {
    number: 8,
    isMasterNumber: false,
    title: "The Achiever",
    description: "Ambitious and material-focused individual with strong business acumen",
    traits: ["Ambitious", "Authoritative", "Material", "Efficient", "Organized"],
    challenges: ["Materialism", "Impatience", "Workaholism"],
    purpose: "To achieve material success while maintaining spiritual balance",
    compatibility: [2, 4, 8]
  },
  9: {
    number: 9,
    isMasterNumber: false,
    title: "The Humanitarian",
    description: "Compassionate and generous soul dedicated to serving humanity",
    traits: ["Humanitarian", "Generous", "Compassionate", "Artistic", "Wise"],
    challenges: ["Emotional extremes", "Self-pity", "Aimlessness"],
    purpose: "To serve humanity and contribute to global healing",
    compatibility: [3, 6, 9]
  },
  11: {
    number: 11,
    isMasterNumber: true,
    title: "The Illuminator",
    description: "Highly intuitive and inspirational soul with psychic abilities and spiritual mission",
    traits: ["Intuitive", "Inspirational", "Psychic", "Charismatic", "Visionary"],
    challenges: ["Nervous energy", "Self-doubt", "Emotional intensity"],
    purpose: "To illuminate and inspire others toward spiritual awakening",
    compatibility: [11, 22, 33]
  },
  22: {
    number: 22,
    isMasterNumber: true,
    title: "The Master Builder",
    description: "Powerful manifestor capable of turning dreams into concrete reality",
    traits: ["Visionary", "Practical", "Powerful", "Organized", "Inspirational"],
    challenges: ["Pressure", "Self-doubt", "Overwhelming responsibility"],
    purpose: "To build something of lasting value that benefits humanity",
    compatibility: [11, 22, 33]
  },
  33: {
    number: 33,
    isMasterNumber: true,
    title: "The Master Teacher",
    description: "Highly evolved soul dedicated to uplifting and healing others",
    traits: ["Compassionate", "Healing", "Teaching", "Selfless", "Inspiring"],
    challenges: ["Martyrdom", "Emotional overwhelm", "Self-sacrifice"],
    purpose: "To heal and teach others with unconditional love",
    compatibility: [11, 22, 33]
  }
};

/**
 * Calculate digit root (reduce to single digit or master number)
 */
export const calculateDigitRoot = (num: number): number => {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
};

/**
 * Calculate Life Path Number from birth date
 */
export const calculateLifePathNumber = (birthDate: Date): number => {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  const total = year + month + day;
  return calculateDigitRoot(total);
};

/**
 * Calculate Expression Number from full name
 */
export const calculateExpressionNumber = (fullName: string): number => {
  const letterValues: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  };
  
  const total = fullName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
    .reduce((sum, letter) => sum + (letterValues[letter] || 0), 0);
  
  return calculateDigitRoot(total);
};

/**
 * Calculate Soul Urge Number from vowels in name
 */
export const calculateSoulUrgeNumber = (fullName: string): number => {
  const vowelValues: Record<string, number> = {
    A: 1, E: 5, I: 9, O: 6, U: 3, Y: 7
  };
  
  const total = fullName
    .toUpperCase()
    .split('')
    .reduce((sum, letter) => sum + (vowelValues[letter] || 0), 0);
  
  return calculateDigitRoot(total);
};

/**
 * Calculate Personality Number from consonants in name
 */
export const calculatePersonalityNumber = (fullName: string): number => {
  const consonantValues: Record<string, number> = {
    B: 2, C: 3, D: 4, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, Q: 8, R: 9,
    S: 1, T: 2, V: 4, W: 5, X: 6, Z: 8
  };
  
  const total = fullName
    .toUpperCase()
    .split('')
    .reduce((sum, letter) => sum + (consonantValues[letter] || 0), 0);
  
  return calculateDigitRoot(total);
};

/**
 * Generate complete numerology profile
 */
export const generateNumerologyProfile = async (data: NumerologyData): Promise<NumerologyProfile> => {
  const lifePathNum = calculateLifePathNumber(data.dateOfBirth);
  const expressionNum = calculateExpressionNumber(data.fullName);
  const soulUrgeNum = calculateSoulUrgeNumber(data.fullName);
  const personalityNum = calculatePersonalityNumber(data.fullName);
  const birthdayNum = calculateDigitRoot(data.dateOfBirth.getDate());
  
  const cleanName = data.fullName.toUpperCase().replace(/[^A-Z]/g, '');
  
  return {
    id: `numerology-${data.fullName}-${Date.now()}`,
    userId: data.fullName,
    generatedAt: new Date().toISOString(),
    lifePath: LIFE_PATH_MEANINGS[lifePathNum],
    expression: LIFE_PATH_MEANINGS[expressionNum] || LIFE_PATH_MEANINGS[1],
    soulUrge: LIFE_PATH_MEANINGS[soulUrgeNum] || LIFE_PATH_MEANINGS[1],
    personality: LIFE_PATH_MEANINGS[personalityNum] || LIFE_PATH_MEANINGS[1],
    birthday: LIFE_PATH_MEANINGS[birthdayNum] || LIFE_PATH_MEANINGS[1],
    cornerstone: {
      letter: cleanName[0] || 'A',
      meaning: 'Your approach to new experiences and challenges'
    },
    capstone: {
      letter: cleanName[cleanName.length - 1] || 'A',
      meaning: 'How you complete projects and handle endings'
    },
    karmic: [], // Could add karmic debt calculations
    hidden: [], // Could add hidden passion numbers
    strengths: [
      ...LIFE_PATH_MEANINGS[lifePathNum].traits.slice(0, 3),
      ...LIFE_PATH_MEANINGS[expressionNum]?.traits.slice(0, 2) || []
    ],
    challenges: [
      ...LIFE_PATH_MEANINGS[lifePathNum].challenges,
      ...LIFE_PATH_MEANINGS[soulUrgeNum]?.challenges.slice(0, 1) || []
    ],
    opportunities: [
      `Develop your ${LIFE_PATH_MEANINGS[lifePathNum].title.toLowerCase()} qualities`,
      `Express your ${LIFE_PATH_MEANINGS[expressionNum]?.title.toLowerCase() || 'creative'} nature`,
      `Honor your ${LIFE_PATH_MEANINGS[soulUrgeNum]?.title.toLowerCase() || 'inner'} desires`
    ],
    lifeThemes: [
      LIFE_PATH_MEANINGS[lifePathNum].purpose,
      `Personal expression through ${LIFE_PATH_MEANINGS[expressionNum]?.title.toLowerCase() || 'leadership'}`,
      `Soul fulfillment via ${LIFE_PATH_MEANINGS[soulUrgeNum]?.title.toLowerCase() || 'service'}`
    ]
  };
};

/**
 * Calculate numerology compatibility between twins
 */
export const generateTwinNumerology = async (profile1: NumerologyProfile, profile2: NumerologyProfile): Promise<TwinNumerology> => {
  // Calculate compatibility scores
  const lifePathComp = calculateNumberCompatibility(profile1.lifePath.number, profile2.lifePath.number);
  const expressionComp = calculateNumberCompatibility(profile1.expression.number, profile2.expression.number);
  const soulComp = calculateNumberCompatibility(profile1.soulUrge.number, profile2.soulUrge.number);
  const personalityComp = calculateNumberCompatibility(profile1.personality.number, profile2.personality.number);
  
  const overallSynergy = Math.round((lifePathComp + expressionComp + soulComp + personalityComp) / 4);
  
  // Check for master number connections
  const masterConnections = [];
  if (profile1.lifePath.isMasterNumber || profile2.lifePath.isMasterNumber) {
    masterConnections.push({
      type: 'shared' as const,
      numbers: [profile1.lifePath.number, profile2.lifePath.number],
      meaning: 'Elevated spiritual connection and shared higher purpose'
    });
  }
  
  return {
    pairId: `twin-numerology-${profile1.userId}-${profile2.userId}`,
    twin1Profile: profile1.id,
    twin2Profile: profile2.id,
    generatedAt: new Date().toISOString(),
    lifePathCompatibility: lifePathComp,
    expressionHarmony: expressionComp,
    soulConnection: soulComp,
    personalityBalance: personalityComp,
    overallSynergy,
    masterNumberConnections: masterConnections,
    karmicBonds: [
      {
        description: 'Past-life connection indicated by complementary life path numbers',
        strength: 'Strong'
      },
      {
        description: 'Soul contract to grow together spiritually',
        strength: 'Moderate'
      }
    ],
    numerologyMarkers: [
      {
        indicator: 'Mirror Numbers',
        present: profile1.lifePath.number + profile2.lifePath.number === 11,
        significance: 'Numbers that add to 11 suggest twin flame connection'
      },
      {
        indicator: 'Master Number Presence',
        present: profile1.lifePath.isMasterNumber || profile2.lifePath.isMasterNumber,
        significance: 'Master numbers indicate advanced soul development'
      },
      {
        indicator: 'Complementary Expression',
        present: Math.abs(profile1.expression.number - profile2.expression.number) <= 3,
        significance: 'Similar expression numbers suggest harmonious life purpose'
      }
    ],
    strengths: [
      `Combined ${profile1.lifePath.title} and ${profile2.lifePath.title} energy`,
      'Balanced approach to life challenges',
      'Mutual support for individual purposes'
    ],
    challenges: [
      'Potential for mirroring each other\'s numerical weaknesses',
      'Need to maintain individual identity despite strong connection'
    ],
    guidance: [
      'Embrace your individual life path purposes while supporting each other',
      'Use your combined numerical strengths to overcome shared challenges',
      'Honor both unity and independence in your twin journey'
    ],
    soulPurpose: [
      'Learn to balance togetherness with individual growth',
      'Develop spiritual consciousness through your twin connection',
      'Serve as an example of harmonious twin relationship'
    ]
  };
};

/**
 * Calculate compatibility between two numbers
 */
const calculateNumberCompatibility = (num1: number, num2: number): number => {
  // Same numbers have high compatibility
  if (num1 === num2) return 95;
  
  // Master numbers are compatible with each other
  if ([11, 22, 33].includes(num1) && [11, 22, 33].includes(num2)) return 90;
  
  // Check traditional compatibility
  const compatibilityMap: Record<number, number[]> = {
    1: [1, 5, 7], 2: [2, 4, 8], 3: [3, 6, 9], 4: [2, 4, 8],
    5: [1, 5, 7], 6: [3, 6, 9], 7: [1, 5, 7], 8: [2, 4, 8], 9: [3, 6, 9]
  };
  
  if (compatibilityMap[num1]?.includes(num2)) return 85;
  
  // Complementary numbers (add to 10)
  if (num1 + num2 === 10) return 80;
  
  // Default moderate compatibility
  return 65;
};