/**
 * Temporal Decision Synchrony Game - Decision Scenarios
 *
 * Rapid-fire decision scenarios that reveal personality traits and values.
 * Used to measure alignment and synchrony in twin decision-making.
 */

export interface DecisionScenario {
  id: string;
  category: 'values' | 'lifestyle' | 'priorities' | 'relationships' | 'career' | 'leisure' | 'ethics';
  prompt: string;
  optionA: string;
  optionB: string;
}

export const decisionScenarios: DecisionScenario[] = [
  // VALUES
  {
    id: 'val_001',
    category: 'values',
    prompt: 'Would you rather:',
    optionA: 'Save money for the future',
    optionB: 'Spend money living in the moment'
  },
  {
    id: 'val_002',
    category: 'values',
    prompt: 'What matters more to you:',
    optionA: 'Being respected',
    optionB: 'Being liked'
  },
  {
    id: 'val_003',
    category: 'values',
    prompt: 'Would you prefer to be:',
    optionA: 'Remarkably intelligent',
    optionB: 'Exceptionally kind'
  },
  {
    id: 'val_004',
    category: 'values',
    prompt: 'What is more important:',
    optionA: 'Following your heart',
    optionB: 'Following your head'
  },
  {
    id: 'val_005',
    category: 'values',
    prompt: 'Would you rather be known for:',
    optionA: 'Your achievements',
    optionB: 'Your character'
  },

  // LIFESTYLE
  {
    id: 'life_001',
    category: 'lifestyle',
    prompt: 'Where would you rather live:',
    optionA: 'Bustling city',
    optionB: 'Peaceful countryside'
  },
  {
    id: 'life_002',
    category: 'lifestyle',
    prompt: 'How do you prefer to wake up:',
    optionA: 'Early morning (sunrise)',
    optionB: 'Late morning (sleeping in)'
  },
  {
    id: 'life_003',
    category: 'lifestyle',
    prompt: 'Your ideal Friday night:',
    optionA: 'Going out with friends',
    optionB: 'Cozy night at home'
  },
  {
    id: 'life_004',
    category: 'lifestyle',
    prompt: 'Would you rather:',
    optionA: 'Plan everything in advance',
    optionB: 'Be spontaneous and flexible'
  },
  {
    id: 'life_005',
    category: 'lifestyle',
    prompt: 'For a vacation, you prefer:',
    optionA: 'Adventurous exploration',
    optionB: 'Relaxing and recharging'
  },
  {
    id: 'life_006',
    category: 'lifestyle',
    prompt: 'Your morning routine is:',
    optionA: 'Structured and consistent',
    optionB: 'Flexible and varied'
  },

  // PRIORITIES
  {
    id: 'pri_001',
    category: 'priorities',
    prompt: 'What matters more to you:',
    optionA: 'Financial security',
    optionB: 'Personal fulfillment'
  },
  {
    id: 'pri_002',
    category: 'priorities',
    prompt: 'In life, you prioritize:',
    optionA: 'Experiences over possessions',
    optionB: 'Possessions over experiences'
  },
  {
    id: 'pri_003',
    category: 'priorities',
    prompt: 'What is more important:',
    optionA: 'Being right',
    optionB: 'Being happy'
  },
  {
    id: 'pri_004',
    category: 'priorities',
    prompt: 'Would you rather:',
    optionA: 'Have an exciting life',
    optionB: 'Have a peaceful life'
  },
  {
    id: 'pri_005',
    category: 'priorities',
    prompt: 'What matters more:',
    optionA: 'Winning',
    optionB: 'Participating'
  },

  // RELATIONSHIPS
  {
    id: 'rel_001',
    category: 'relationships',
    prompt: 'In friendships, you value:',
    optionA: 'Deep connections with few people',
    optionB: 'Many casual friendships'
  },
  {
    id: 'rel_002',
    category: 'relationships',
    prompt: 'When someone upsets you:',
    optionA: 'Address it immediately',
    optionB: 'Give yourself time to cool off'
  },
  {
    id: 'rel_003',
    category: 'relationships',
    prompt: 'Would you rather be:',
    optionA: 'The one who gives advice',
    optionB: 'The one who listens'
  },
  {
    id: 'rel_004',
    category: 'relationships',
    prompt: 'In a disagreement, you:',
    optionA: 'Stand your ground',
    optionB: 'Compromise easily'
  },
  {
    id: 'rel_005',
    category: 'relationships',
    prompt: 'What do you prefer:',
    optionA: 'Quality time together',
    optionB: 'Independent parallel activities'
  },

  // CAREER
  {
    id: 'car_001',
    category: 'career',
    prompt: 'In your career, you prefer:',
    optionA: 'Stability and routine',
    optionB: 'Variety and change'
  },
  {
    id: 'car_002',
    category: 'career',
    prompt: 'Would you rather:',
    optionA: 'Work independently',
    optionB: 'Work on a team'
  },
  {
    id: 'car_003',
    category: 'career',
    prompt: 'What motivates you more:',
    optionA: 'Recognition and praise',
    optionB: 'Personal satisfaction'
  },
  {
    id: 'car_004',
    category: 'career',
    prompt: 'Your work style is:',
    optionA: 'Methodical and careful',
    optionB: 'Fast-paced and efficient'
  },
  {
    id: 'car_005',
    category: 'career',
    prompt: 'Would you prefer to:',
    optionA: 'Lead others',
    optionB: 'Support a great leader'
  },

  // LEISURE
  {
    id: 'lei_001',
    category: 'leisure',
    prompt: 'Free time activity:',
    optionA: 'Physical and active',
    optionB: 'Mental and creative'
  },
  {
    id: 'lei_002',
    category: 'leisure',
    prompt: 'For entertainment, you prefer:',
    optionA: 'Movies and TV shows',
    optionB: 'Books and podcasts'
  },
  {
    id: 'lei_003',
    category: 'leisure',
    prompt: 'Would you rather:',
    optionA: 'Try new hobbies often',
    optionB: 'Master one hobby deeply'
  },
  {
    id: 'lei_004',
    category: 'leisure',
    prompt: 'Your ideal weekend involves:',
    optionA: 'Being outdoors in nature',
    optionB: 'Indoor comfort and coziness'
  },
  {
    id: 'lei_005',
    category: 'leisure',
    prompt: 'When consuming content:',
    optionA: 'Fiction and fantasy',
    optionB: 'Non-fiction and documentaries'
  },

  // ETHICS
  {
    id: 'eth_001',
    category: 'ethics',
    prompt: 'What is more important:',
    optionA: 'Being honest',
    optionB: 'Being tactful'
  },
  {
    id: 'eth_002',
    category: 'ethics',
    prompt: 'If you found money:',
    optionA: 'Try to find the owner',
    optionB: 'Keep it if unclaimed'
  },
  {
    id: 'eth_003',
    category: 'ethics',
    prompt: 'Would you rather:',
    optionA: 'Follow rules strictly',
    optionB: 'Bend rules when needed'
  },
  {
    id: 'eth_004',
    category: 'ethics',
    prompt: 'What matters more:',
    optionA: 'Loyalty to friends',
    optionB: 'Doing what is right'
  },
  {
    id: 'eth_005',
    category: 'ethics',
    prompt: 'In moral dilemmas:',
    optionA: 'Greater good for many',
    optionB: 'Individual rights matter most'
  }
];

/**
 * Get a random selection of scenarios
 * @param count Number of scenarios to return
 * @returns Array of randomly selected scenarios
 */
export function getRandomScenarios(count: number): DecisionScenario[] {
  const shuffled = [...decisionScenarios].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get scenarios by category
 * @param category The category to filter by
 * @returns Array of scenarios in the specified category
 */
export function getScenariosByCategory(
  category: DecisionScenario['category']
): DecisionScenario[] {
  return decisionScenarios.filter((scenario) => scenario.category === category);
}

/**
 * Get a balanced selection across all categories
 * @param perCategory Number of scenarios per category
 * @returns Array of balanced scenarios
 */
export function getBalancedScenarios(perCategory: number = 2): DecisionScenario[] {
  const categories: DecisionScenario['category'][] = [
    'values',
    'lifestyle',
    'priorities',
    'relationships',
    'career',
    'leisure',
    'ethics'
  ];

  const balanced: DecisionScenario[] = [];
  categories.forEach((category) => {
    const categoryScenarios = getScenariosByCategory(category);
    const shuffled = [...categoryScenarios].sort(() => Math.random() - 0.5);
    balanced.push(...shuffled.slice(0, perCategory));
  });

  return balanced.sort(() => Math.random() - 0.5);
}
