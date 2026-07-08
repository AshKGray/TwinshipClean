/**
 * Iconic Twin Duos Database
 * Famous twin/duo pairs for personality matching
 */

import { IconicDuo } from '../state/gamesStore';

export const ICONIC_DUOS: IconicDuo[] = [
  {
    id: 'fred-george',
    name: 'Fred & George Weasley',
    description:
      "The ultimate prankster pair who finish each other's sentences and schemes. Inseparable in mischief and innovation.",
    archetype: 'Synchronized Mischief',
    traits: ['playful', 'creative', 'inseparable', 'synchronized', 'witty'],
  },
  {
    id: 'mario-luigi',
    name: 'Mario & Luigi',
    description:
      'Complementary strengths where one leads and one supports. Different but unified in purpose.',
    archetype: 'Complementary Heroes',
    traits: ['balanced', 'complementary', 'supportive', 'collaborative', 'loyal'],
  },
  {
    id: 'mary-kate-ashley',
    name: 'Mary-Kate & Ashley Olsen',
    description:
      'Business partners extraordinaire who built an empire together through shared vision and complementary skills.',
    archetype: 'Power Partners',
    traits: ['collaborative', 'independent', 'ambitious', 'professional', 'balanced'],
  },
  {
    id: 'zack-cody',
    name: 'Zack & Cody',
    description:
      'Opposite personalities that balance each other perfectly. One impulsive, one cautious - together unstoppable.',
    archetype: 'Opposites Balance',
    traits: ['complementary', 'playful', 'balanced', 'different', 'harmonious'],
  },
  {
    id: 'hikaru-kaoru',
    name: 'Hikaru & Kaoru',
    description:
      'Nearly identical in interests and mannerisms, sharing a unique twin language and finishing each other\'s thoughts.',
    archetype: 'Mirror Twins',
    traits: ['inseparable', 'synchronized', 'telepathic', 'identical', 'playful'],
  },
  {
    id: 'phoebe-ursula',
    name: 'Phoebe & Ursula',
    description:
      'Independent lives but still connected. Different paths, different personalities, yet undeniably bonded.',
    archetype: 'Independent Spirits',
    traits: ['independent', 'different', 'free-spirited', 'unique', 'quirky'],
  },
  {
    id: 'tweedledee-tweedledum',
    name: 'Tweedledee & Tweedledum',
    description:
      'Identical in every way, moving and thinking as one. Perfect synchronization in all aspects.',
    archetype: 'Perfect Synchrony',
    traits: ['identical', 'synchronized', 'harmonious', 'inseparable', 'matching'],
  },
  {
    id: 'sherlock-mycroft',
    name: 'Sherlock & Mycroft Holmes',
    description:
      'Brilliant minds with competitive edge. Push each other to excellence through rivalry and mutual respect.',
    archetype: 'Competitive Intellectuals',
    traits: ['competitive', 'clever', 'independent', 'challenging', 'intellectual'],
  },
  {
    id: 'dipper-mabel',
    name: 'Dipper & Mabel Pines',
    description:
      'Different interests and personalities, but fiercely protective of each other. Complementary adventurers.',
    archetype: 'Adventure Companions',
    traits: ['complementary', 'loyal', 'playful', 'protective', 'balanced'],
  },
  {
    id: 'tia-tamera',
    name: 'Tia & Tamera',
    description:
      'Separated but reunited, blending different upbringings into a unique twin bond. Adaptable and harmonious.',
    archetype: 'Reunited Spirits',
    traits: ['harmonious', 'adaptable', 'balanced', 'collaborative', 'understanding'],
  },
];

// Helper function to get duo by ID
export const getDuoById = (id: string): IconicDuo | undefined => {
  return ICONIC_DUOS.find((duo) => duo.id === id);
};

// Helper function to get random duo (for testing)
export const getRandomDuo = (): IconicDuo => {
  const randomIndex = Math.floor(Math.random() * ICONIC_DUOS.length);
  return ICONIC_DUOS[randomIndex];
};
