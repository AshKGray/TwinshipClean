/**
 * Iconic Duo Quiz - Personality Assessment Questions
 *
 * Questions designed to map twins to famous iconic duos based on
 * personality traits, relationship dynamics, and complementary characteristics.
 */

export interface QuizOption {
  text: string;
  /** Trait scores this option contributes to */
  traits: {
    leadership?: number;
    spontaneity?: number;
    humor?: number;
    loyalty?: number;
    adventure?: number;
    creativity?: number;
    logic?: number;
    empathy?: number;
    energy?: number;
    wisdom?: number;
    optimism?: number;
    protectiveness?: number;
  };
}

export interface DuoQuizQuestion {
  id: string;
  question: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
}

export const duoQuizQuestions: DuoQuizQuestion[] = [
  {
    id: 'q_001',
    question: 'When faced with a challenge, you typically:',
    options: [
      {
        text: 'Take charge and lead the way',
        traits: { leadership: 3, logic: 2 }
      },
      {
        text: 'Come up with creative solutions',
        traits: { creativity: 3, spontaneity: 2 }
      },
      {
        text: 'Support others while staying calm',
        traits: { empathy: 3, loyalty: 2 }
      },
      {
        text: 'Analyze all options carefully',
        traits: { logic: 3, wisdom: 2 }
      }
    ]
  },
  {
    id: 'q_002',
    question: 'Your idea of a perfect Saturday is:',
    options: [
      {
        text: 'An impromptu adventure to somewhere new',
        traits: { spontaneity: 3, adventure: 3 }
      },
      {
        text: 'A well-planned day with friends',
        traits: { leadership: 2, loyalty: 2 }
      },
      {
        text: 'Relaxing at home with a good book or show',
        traits: { wisdom: 2, empathy: 2 }
      },
      {
        text: 'Trying something creative or artistic',
        traits: { creativity: 3, spontaneity: 2 }
      }
    ]
  },
  {
    id: 'q_003',
    question: 'When someone tells a joke, you usually:',
    options: [
      {
        text: 'Laugh out loud and share it with everyone',
        traits: { humor: 3, energy: 3 }
      },
      {
        text: 'Appreciate it with a knowing smile',
        traits: { humor: 2, wisdom: 2 }
      },
      {
        text: 'Try to top it with an even better joke',
        traits: { humor: 3, spontaneity: 2 }
      },
      {
        text: 'Analyze why it is or is not funny',
        traits: { logic: 3, wisdom: 1 }
      }
    ]
  },
  {
    id: 'q_004',
    question: 'Your approach to friendship is:',
    options: [
      {
        text: 'Ride-or-die loyalty no matter what',
        traits: { loyalty: 3, protectiveness: 3 }
      },
      {
        text: 'Always bringing fun and energy to the group',
        traits: { energy: 3, humor: 2 }
      },
      {
        text: 'Being the wise advisor everyone trusts',
        traits: { wisdom: 3, empathy: 2 }
      },
      {
        text: 'Creating memorable experiences together',
        traits: { creativity: 2, adventure: 3 }
      }
    ]
  },
  {
    id: 'q_005',
    question: 'When making decisions, you rely most on:',
    options: [
      {
        text: 'Your gut instinct and intuition',
        traits: { spontaneity: 3, empathy: 2 }
      },
      {
        text: 'Logic and careful analysis',
        traits: { logic: 3, wisdom: 2 }
      },
      {
        text: 'What feels right for everyone involved',
        traits: { empathy: 3, loyalty: 2 }
      },
      {
        text: 'What seems most exciting',
        traits: { adventure: 3, energy: 2 }
      }
    ]
  },
  {
    id: 'q_006',
    question: 'In a crisis situation, you are most likely to:',
    options: [
      {
        text: 'Stay calm and think of a solution',
        traits: { logic: 3, leadership: 2 }
      },
      {
        text: 'Protect those you care about first',
        traits: { protectiveness: 3, loyalty: 3 }
      },
      {
        text: 'Keep spirits high with humor',
        traits: { humor: 3, optimism: 2 }
      },
      {
        text: 'Improvise and adapt quickly',
        traits: { spontaneity: 3, creativity: 2 }
      }
    ]
  },
  {
    id: 'q_007',
    question: 'Your communication style is best described as:',
    options: [
      {
        text: 'Direct and to the point',
        traits: { leadership: 2, logic: 2 }
      },
      {
        text: 'Warm and encouraging',
        traits: { empathy: 3, optimism: 2 }
      },
      {
        text: 'Witty with playful banter',
        traits: { humor: 3, energy: 2 }
      },
      {
        text: 'Thoughtful and insightful',
        traits: { wisdom: 3, logic: 2 }
      }
    ]
  },
  {
    id: 'q_008',
    question: 'What role do you naturally take in group projects:',
    options: [
      {
        text: 'The organizer who keeps everyone on track',
        traits: { leadership: 3, logic: 2 }
      },
      {
        text: 'The creative mind generating ideas',
        traits: { creativity: 3, spontaneity: 2 }
      },
      {
        text: 'The supportive teammate helping others',
        traits: { empathy: 3, loyalty: 2 }
      },
      {
        text: 'The energizer keeping morale high',
        traits: { energy: 3, humor: 2 }
      }
    ]
  },
  {
    id: 'q_009',
    question: 'Your biggest strength in relationships is:',
    options: [
      {
        text: 'Unwavering loyalty and trust',
        traits: { loyalty: 3, protectiveness: 2 }
      },
      {
        text: 'Bringing joy and laughter',
        traits: { humor: 3, optimism: 3 }
      },
      {
        text: 'Understanding and emotional support',
        traits: { empathy: 3, wisdom: 2 }
      },
      {
        text: 'Keeping things exciting and fresh',
        traits: { adventure: 3, spontaneity: 2 }
      }
    ]
  },
  {
    id: 'q_010',
    question: 'When exploring new places, you:',
    options: [
      {
        text: 'Research everything beforehand',
        traits: { logic: 3, wisdom: 2 }
      },
      {
        text: 'Wing it and see where you end up',
        traits: { spontaneity: 3, adventure: 3 }
      },
      {
        text: 'Follow recommendations from locals',
        traits: { empathy: 2, wisdom: 2 }
      },
      {
        text: 'Lead your group to the best spots',
        traits: { leadership: 3, energy: 2 }
      }
    ]
  },
  {
    id: 'q_011',
    question: 'Your approach to problem-solving is:',
    options: [
      {
        text: 'Break it down logically step by step',
        traits: { logic: 3, wisdom: 2 }
      },
      {
        text: 'Think outside the box for unique solutions',
        traits: { creativity: 3, spontaneity: 2 }
      },
      {
        text: 'Consider how it affects everyone involved',
        traits: { empathy: 3, loyalty: 2 }
      },
      {
        text: 'Dive in and figure it out as you go',
        traits: { adventure: 2, energy: 3 }
      }
    ]
  },
  {
    id: 'q_012',
    question: 'What describes your sense of humor:',
    options: [
      {
        text: 'Quick-witted and sarcastic',
        traits: { humor: 3, logic: 1 }
      },
      {
        text: 'Goofy and silly',
        traits: { humor: 3, spontaneity: 2 }
      },
      {
        text: 'Clever wordplay and puns',
        traits: { humor: 2, wisdom: 2, creativity: 2 }
      },
      {
        text: 'Observational and relatable',
        traits: { humor: 2, empathy: 2 }
      }
    ]
  },
  {
    id: 'q_013',
    question: 'In conflicts, you tend to:',
    options: [
      {
        text: 'Stand your ground firmly',
        traits: { leadership: 3, protectiveness: 2 }
      },
      {
        text: 'Find creative compromises',
        traits: { creativity: 2, empathy: 3 }
      },
      {
        text: 'Defuse tension with humor',
        traits: { humor: 3, optimism: 2 }
      },
      {
        text: 'Analyze both sides objectively',
        traits: { logic: 3, wisdom: 2 }
      }
    ]
  },
  {
    id: 'q_014',
    question: 'Your ideal way to cheer someone up is:',
    options: [
      {
        text: 'Make them laugh until they forget their troubles',
        traits: { humor: 3, energy: 2 }
      },
      {
        text: 'Listen and offer thoughtful advice',
        traits: { empathy: 3, wisdom: 2 }
      },
      {
        text: 'Distract them with an adventure',
        traits: { adventure: 3, spontaneity: 2 }
      },
      {
        text: 'Show them they can count on you',
        traits: { loyalty: 3, protectiveness: 2 }
      }
    ]
  },
  {
    id: 'q_015',
    question: 'When learning something new, you prefer to:',
    options: [
      {
        text: 'Jump in and learn by doing',
        traits: { spontaneity: 3, adventure: 2 }
      },
      {
        text: 'Study the theory first',
        traits: { logic: 3, wisdom: 2 }
      },
      {
        text: 'Learn from others experiences',
        traits: { empathy: 2, wisdom: 2 }
      },
      {
        text: 'Find creative ways to practice',
        traits: { creativity: 3, energy: 2 }
      }
    ]
  },
  {
    id: 'q_016',
    question: 'Your attitude toward rules is:',
    options: [
      {
        text: 'Rules are meant to be followed',
        traits: { logic: 2, loyalty: 2 }
      },
      {
        text: 'Rules are more like guidelines',
        traits: { spontaneity: 3, creativity: 2 }
      },
      {
        text: 'Rules should consider everyone fairly',
        traits: { empathy: 3, wisdom: 2 }
      },
      {
        text: 'I make my own rules',
        traits: { leadership: 3, adventure: 2 }
      }
    ]
  },
  {
    id: 'q_017',
    question: 'How do you handle unexpected changes to plans:',
    options: [
      {
        text: 'Get excited about new possibilities',
        traits: { spontaneity: 3, optimism: 3 }
      },
      {
        text: 'Adapt and make the best of it',
        traits: { wisdom: 2, empathy: 2 }
      },
      {
        text: 'Take charge and reorganize',
        traits: { leadership: 3, logic: 2 }
      },
      {
        text: 'Find the humor in the chaos',
        traits: { humor: 3, energy: 2 }
      }
    ]
  },
  {
    id: 'q_018',
    question: 'What motivates you most:',
    options: [
      {
        text: 'Protecting and supporting loved ones',
        traits: { protectiveness: 3, loyalty: 3 }
      },
      {
        text: 'Achieving goals and success',
        traits: { leadership: 3, logic: 2 }
      },
      {
        text: 'Creating and experiencing joy',
        traits: { humor: 2, optimism: 3, energy: 2 }
      },
      {
        text: 'Exploring and discovering new things',
        traits: { adventure: 3, creativity: 2 }
      }
    ]
  },
  {
    id: 'q_019',
    question: 'Your superpower would be:',
    options: [
      {
        text: 'Super intelligence',
        traits: { logic: 3, wisdom: 3 }
      },
      {
        text: 'Shape-shifting',
        traits: { creativity: 3, spontaneity: 2 }
      },
      {
        text: 'Empathic connection',
        traits: { empathy: 3, loyalty: 2 }
      },
      {
        text: 'Super speed',
        traits: { energy: 3, adventure: 2 }
      }
    ]
  },
  {
    id: 'q_020',
    question: 'In your friend group, you are known as:',
    options: [
      {
        text: 'The leader everyone follows',
        traits: { leadership: 3, protectiveness: 2 }
      },
      {
        text: 'The fun one who lights up the room',
        traits: { humor: 3, energy: 3 }
      },
      {
        text: 'The wise sage with great advice',
        traits: { wisdom: 3, empathy: 2 }
      },
      {
        text: 'The wild card with crazy ideas',
        traits: { spontaneity: 3, creativity: 2, adventure: 2 }
      }
    ]
  },
  {
    id: 'q_021',
    question: 'Your dream vacation involves:',
    options: [
      {
        text: 'Backpacking through unknown territories',
        traits: { adventure: 3, spontaneity: 3 }
      },
      {
        text: 'A well-organized cultural tour',
        traits: { wisdom: 2, logic: 2 }
      },
      {
        text: 'Fun activities with close friends',
        traits: { loyalty: 2, energy: 3 }
      },
      {
        text: 'Creating art or content',
        traits: { creativity: 3, empathy: 1 }
      }
    ]
  },
  {
    id: 'q_022',
    question: 'When someone needs help, you:',
    options: [
      {
        text: 'Drop everything to be there',
        traits: { loyalty: 3, protectiveness: 3 }
      },
      {
        text: 'Offer practical solutions',
        traits: { logic: 3, leadership: 2 }
      },
      {
        text: 'Provide emotional support',
        traits: { empathy: 3, wisdom: 2 }
      },
      {
        text: 'Try to make them smile',
        traits: { humor: 3, optimism: 2 }
      }
    ]
  }
];

/**
 * Calculate trait scores from quiz responses
 * @param responses Array of selected option indices (0-3) for each question
 * @returns Object with trait scores
 */
export function calculateTraitScores(responses: number[]): {
  leadership: number;
  spontaneity: number;
  humor: number;
  loyalty: number;
  adventure: number;
  creativity: number;
  logic: number;
  empathy: number;
  energy: number;
  wisdom: number;
  optimism: number;
  protectiveness: number;
} {
  const scores = {
    leadership: 0,
    spontaneity: 0,
    humor: 0,
    loyalty: 0,
    adventure: 0,
    creativity: 0,
    logic: 0,
    empathy: 0,
    energy: 0,
    wisdom: 0,
    optimism: 0,
    protectiveness: 0
  };

  responses.forEach((responseIndex, questionIndex) => {
    if (questionIndex >= duoQuizQuestions.length) return;

    const question = duoQuizQuestions[questionIndex];
    const selectedOption = question.options[responseIndex];

    if (!selectedOption) return;

    Object.entries(selectedOption.traits).forEach(([trait, value]) => {
      scores[trait as keyof typeof scores] += value || 0;
    });
  });

  return scores;
}

/**
 * Get a random subset of questions
 * @param count Number of questions to return
 * @returns Array of randomly selected questions
 */
export function getRandomQuestions(count: number): DuoQuizQuestion[] {
  const shuffled = [...duoQuizQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, duoQuizQuestions.length));
}
