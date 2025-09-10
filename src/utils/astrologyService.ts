/**
 * Astrology Birth Chart Service
 * Generates personalized birth charts and twin synastry analysis
 */

export interface BirthData {
  dateOfBirth: Date;
  timeOfBirth?: string; // "HH:MM" format
  placeOfBirth?: string;
  name: string;
}

export interface ZodiacSign {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  rulingPlanet: string;
  dates: string;
  traits: string[];
  compatibility: string[];
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  house?: number;
  degree: number;
  retrograde: boolean;
}

export interface BirthChart {
  id: string;
  userId: string;
  generatedAt: string;
  
  // Core placements
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  risingSign: ZodiacSign;
  
  // Planet positions
  planets: PlanetPosition[];
  
  // Elements and modalities
  elementDistribution: Record<string, number>;
  modalityDistribution: Record<string, number>;
  dominantElement: string;
  dominantModality: string;
  
  // Houses
  houses: Array<{
    number: number;
    sign: string;
    planets: string[];
    meaning: string;
  }>;
  
  // Aspects
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspect: 'Conjunction' | 'Opposition' | 'Trine' | 'Square' | 'Sextile';
    orb: number;
    interpretation: string;
  }>;
  
  // Personal insights
  personalityInsights: string[];
  strengthAreas: string[];
  challengeAreas: string[];
  lifeThemes: string[];
}

export interface TwinSynastry {
  pairId: string;
  twin1Chart: string; // chart ID
  twin2Chart: string; // chart ID
  generatedAt: string;
  
  // Compatibility scores
  overallCompatibility: number; // 0-100
  emotionalHarmony: number; // Moon aspects
  communicationFlow: number; // Mercury aspects
  romanticConnection: number; // Venus aspects
  energyAlignment: number; // Mars aspects
  
  // Element compatibility
  elementHarmony: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  
  // Significant aspects between twins
  majorAspects: Array<{
    twin1Planet: string;
    twin2Planet: string;
    aspect: string;
    strength: 'Powerful' | 'Moderate' | 'Weak';
    interpretation: string;
  }>;
  
  // Twin flame indicators
  twinFlameMarkers: Array<{
    indicator: string;
    present: boolean;
    description: string;
  }>;
  
  // Relationship insights
  strengths: string[];
  challenges: string[];
  growthOpportunities: string[];
  soulLessons: string[];
}

// Zodiac sign definitions
export const ZODIAC_SIGNS: Record<string, ZodiacSign> = {
  aries: {
    name: 'Aries',
    symbol: '♈',
    element: 'Fire',
    modality: 'Cardinal',
    rulingPlanet: 'Mars',
    dates: 'March 21 - April 19',
    traits: ['Independent', 'Energetic', 'Impulsive', 'Leader', 'Adventurous'],
    compatibility: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius']
  },
  taurus: {
    name: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    modality: 'Fixed',
    rulingPlanet: 'Venus',
    dates: 'April 20 - May 20',
    traits: ['Reliable', 'Practical', 'Stubborn', 'Sensual', 'Loyal'],
    compatibility: ['Virgo', 'Capricorn', 'Cancer', 'Pisces']
  },
  gemini: {
    name: 'Gemini',
    symbol: '♊',
    element: 'Air',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    dates: 'May 21 - June 20',
    traits: ['Curious', 'Adaptable', 'Communicative', 'Restless', 'Witty'],
    compatibility: ['Libra', 'Aquarius', 'Aries', 'Leo']
  },
  cancer: {
    name: 'Cancer',
    symbol: '♋',
    element: 'Water',
    modality: 'Cardinal',
    rulingPlanet: 'Moon',
    dates: 'June 21 - July 22',
    traits: ['Nurturing', 'Intuitive', 'Emotional', 'Protective', 'Home-loving'],
    compatibility: ['Scorpio', 'Pisces', 'Taurus', 'Virgo']
  },
  leo: {
    name: 'Leo',
    symbol: '♌',
    element: 'Fire',
    modality: 'Fixed',
    rulingPlanet: 'Sun',
    dates: 'July 23 - August 22',
    traits: ['Confident', 'Creative', 'Generous', 'Dramatic', 'Proud'],
    compatibility: ['Aries', 'Sagittarius', 'Gemini', 'Libra']
  },
  virgo: {
    name: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    modality: 'Mutable',
    rulingPlanet: 'Mercury',
    dates: 'August 23 - September 22',
    traits: ['Analytical', 'Perfectionist', 'Helpful', 'Practical', 'Health-conscious'],
    compatibility: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio']
  },
  libra: {
    name: 'Libra',
    symbol: '♎',
    element: 'Air',
    modality: 'Cardinal',
    rulingPlanet: 'Venus',
    dates: 'September 23 - October 22',
    traits: ['Balanced', 'Diplomatic', 'Social', 'Indecisive', 'Harmony-seeking'],
    compatibility: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius']
  },
  scorpio: {
    name: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    modality: 'Fixed',
    rulingPlanet: 'Pluto',
    dates: 'October 23 - November 21',
    traits: ['Intense', 'Mysterious', 'Passionate', 'Transformative', 'Intuitive'],
    compatibility: ['Cancer', 'Pisces', 'Virgo', 'Capricorn']
  },
  sagittarius: {
    name: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    modality: 'Mutable',
    rulingPlanet: 'Jupiter',
    dates: 'November 22 - December 21',
    traits: ['Adventurous', 'Philosophical', 'Optimistic', 'Freedom-loving', 'Honest'],
    compatibility: ['Aries', 'Leo', 'Libra', 'Aquarius']
  },
  capricorn: {
    name: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    modality: 'Cardinal',
    rulingPlanet: 'Saturn',
    dates: 'December 22 - January 19',
    traits: ['Ambitious', 'Disciplined', 'Responsible', 'Traditional', 'Patient'],
    compatibility: ['Taurus', 'Virgo', 'Scorpio', 'Pisces']
  },
  aquarius: {
    name: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    modality: 'Fixed',
    rulingPlanet: 'Uranus',
    dates: 'January 20 - February 18',
    traits: ['Independent', 'Innovative', 'Humanitarian', 'Eccentric', 'Detached'],
    compatibility: ['Gemini', 'Libra', 'Aries', 'Sagittarius']
  },
  pisces: {
    name: 'Pisces',
    symbol: '♓',
    element: 'Water',
    modality: 'Mutable',
    rulingPlanet: 'Neptune',
    dates: 'February 19 - March 20',
    traits: ['Intuitive', 'Compassionate', 'Dreamy', 'Sensitive', 'Artistic'],
    compatibility: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn']
  }
};

/**
 * Calculate sun sign from birth date
 */
export const calculateSunSign = (birthDate: Date): ZodiacSign => {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return ZODIAC_SIGNS.aries;
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return ZODIAC_SIGNS.taurus;
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return ZODIAC_SIGNS.gemini;
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return ZODIAC_SIGNS.cancer;
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return ZODIAC_SIGNS.leo;
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return ZODIAC_SIGNS.virgo;
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return ZODIAC_SIGNS.libra;
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return ZODIAC_SIGNS.scorpio;
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return ZODIAC_SIGNS.sagittarius;
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return ZODIAC_SIGNS.capricorn;
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return ZODIAC_SIGNS.aquarius;
  return ZODIAC_SIGNS.pisces;
};

/**
 * Generate a simplified birth chart
 * Note: This is a basic implementation. Full accuracy requires astronomical calculations
 */
export const generateBirthChart = async (birthData: BirthData): Promise<BirthChart> => {
  const sunSign = calculateSunSign(birthData.dateOfBirth);
  
  // Simplified moon and rising calculation (would need proper astronomical data)
  const moonSignNames = Object.keys(ZODIAC_SIGNS);
  const moonIndex = (birthData.dateOfBirth.getDate() + birthData.name.length) % 12;
  const moonSign = ZODIAC_SIGNS[moonSignNames[moonIndex]];
  
  const risingIndex = (birthData.dateOfBirth.getMonth() + birthData.name.charCodeAt(0)) % 12;
  const risingSign = ZODIAC_SIGNS[moonSignNames[risingIndex]];
  
  // Create basic planet positions (simplified)
  const planets: PlanetPosition[] = [
    { planet: 'Sun', sign: sunSign.name, degree: birthData.dateOfBirth.getDate() * 3, retrograde: false },
    { planet: 'Moon', sign: moonSign.name, degree: birthData.dateOfBirth.getMonth() * 25, retrograde: false },
    { planet: 'Mercury', sign: sunSign.name, degree: birthData.dateOfBirth.getDate() * 2, retrograde: false },
    { planet: 'Venus', sign: moonSign.name, degree: birthData.dateOfBirth.getDate() * 4, retrograde: false },
    { planet: 'Mars', sign: risingSign.name, degree: birthData.dateOfBirth.getMonth() * 30, retrograde: false }
  ];
  
  return {
    id: `chart-${birthData.name}-${Date.now()}`,
    userId: birthData.name,
    generatedAt: new Date().toISOString(),
    sunSign,
    moonSign,
    risingSign,
    planets,
    elementDistribution: {
      Fire: [sunSign, moonSign, risingSign].filter(s => s.element === 'Fire').length,
      Earth: [sunSign, moonSign, risingSign].filter(s => s.element === 'Earth').length,
      Air: [sunSign, moonSign, risingSign].filter(s => s.element === 'Air').length,
      Water: [sunSign, moonSign, risingSign].filter(s => s.element === 'Water').length
    },
    modalityDistribution: {
      Cardinal: [sunSign, moonSign, risingSign].filter(s => s.modality === 'Cardinal').length,
      Fixed: [sunSign, moonSign, risingSign].filter(s => s.modality === 'Fixed').length,
      Mutable: [sunSign, moonSign, risingSign].filter(s => s.modality === 'Mutable').length
    },
    dominantElement: sunSign.element,
    dominantModality: sunSign.modality,
    houses: [], // Simplified - would need birth time and location
    aspects: [], // Simplified - would need full calculations
    personalityInsights: [
      `Your ${sunSign.name} sun gives you ${sunSign.traits.slice(0, 2).join(' and ').toLowerCase()} qualities`,
      `Your ${moonSign.name} moon makes you emotionally ${moonSign.traits[0].toLowerCase()}`,
      `Your ${risingSign.name} rising presents you as ${risingSign.traits[0].toLowerCase()} to others`
    ],
    strengthAreas: [...sunSign.traits.slice(0, 2), ...moonSign.traits.slice(0, 1)],
    challengeAreas: [sunSign.traits[2], moonSign.traits[2]].filter(Boolean),
    lifeThemes: [`${sunSign.element} energy`, `${moonSign.element} emotions`, `${risingSign.element} presentation`]
  };
};

/**
 * Generate twin synastry analysis
 */
export const generateTwinSynastry = async (chart1: BirthChart, chart2: BirthChart): Promise<TwinSynastry> => {
  // Calculate compatibility scores
  const elementCompatibility = calculateElementCompatibility(chart1, chart2);
  const sunSignCompatibility = chart1.sunSign.compatibility.includes(chart2.sunSign.name) ? 85 : 65;
  const moonSignCompatibility = chart1.moonSign.compatibility.includes(chart2.moonSign.name) ? 90 : 70;
  
  const overallCompatibility = Math.round(
    (elementCompatibility + sunSignCompatibility + moonSignCompatibility) / 3
  );
  
  return {
    pairId: `synastry-${chart1.userId}-${chart2.userId}`,
    twin1Chart: chart1.id,
    twin2Chart: chart2.id,
    generatedAt: new Date().toISOString(),
    overallCompatibility,
    emotionalHarmony: moonSignCompatibility,
    communicationFlow: 75,
    romanticConnection: 80,
    energyAlignment: sunSignCompatibility,
    elementHarmony: {
      fire: chart1.elementDistribution.Fire + chart2.elementDistribution.Fire,
      earth: chart1.elementDistribution.Earth + chart2.elementDistribution.Earth,
      air: chart1.elementDistribution.Air + chart2.elementDistribution.Air,
      water: chart1.elementDistribution.Water + chart2.elementDistribution.Water
    },
    majorAspects: [
      {
        twin1Planet: 'Sun',
        twin2Planet: 'Moon',
        aspect: 'Trine',
        strength: 'Powerful',
        interpretation: 'Your core selves harmonize beautifully with each other\'s emotional nature'
      }
    ],
    twinFlameMarkers: [
      {
        indicator: 'Complementary Elements',
        present: chart1.dominantElement !== chart2.dominantElement,
        description: 'Different dominant elements suggest complementary energies'
      },
      {
        indicator: 'Synchronized Moon Signs',
        present: chart1.moonSign.element === chart2.moonSign.element,
        description: 'Similar lunar elements indicate emotional understanding'
      }
    ],
    strengths: [
      `Strong ${chart1.dominantElement}-${chart2.dominantElement} balance`,
      'Intuitive emotional connection',
      'Complementary personality traits'
    ],
    challenges: [
      'Potential for mirroring each other\'s weaknesses',
      'Need for individual identity development'
    ],
    growthOpportunities: [
      'Learning from each other\'s elemental strengths',
      'Developing independence while maintaining connection'
    ],
    soulLessons: [
      'Balance between unity and individuality',
      'Embracing both similarities and differences'
    ]
  };
};

const calculateElementCompatibility = (chart1: BirthChart, chart2: BirthChart): number => {
  const elements1 = chart1.elementDistribution;
  const elements2 = chart2.elementDistribution;
  
  // Compatible elements: Fire+Air, Earth+Water
  let compatibility = 0;
  
  // Fire and Air compatibility
  compatibility += Math.min(elements1.Fire, elements2.Air) * 20;
  compatibility += Math.min(elements1.Air, elements2.Fire) * 20;
  
  // Earth and Water compatibility
  compatibility += Math.min(elements1.Earth, elements2.Water) * 20;
  compatibility += Math.min(elements1.Water, elements2.Earth) * 20;
  
  // Same element bonus
  compatibility += Math.min(elements1.Fire, elements2.Fire) * 15;
  compatibility += Math.min(elements1.Earth, elements2.Earth) * 15;
  compatibility += Math.min(elements1.Air, elements2.Air) * 15;
  compatibility += Math.min(elements1.Water, elements2.Water) * 15;
  
  return Math.min(100, compatibility);
};