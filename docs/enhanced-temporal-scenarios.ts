// Add this to your TemporalDecisionSync.tsx file

export const enhancedScenarios: Scenario[] = [
  // Original 5 scenarios (keep these)
  {
    id: 'fire_rescue',
    title: 'Emergency Evacuation',
    prompt: 'Your house is on fire! You can save 3 items:',
    options: ['Photo albums', 'Laptop/work', 'Pet supplies', 'Important documents', 'Jewelry/valuables', 'Artwork', 'Cash/cards', 'Family heirlooms', 'Electronics', 'Clothing'],
    timeLimit: 60,
    category: 'crisis'
  },
  // ... existing scenarios ...

  // NEW SCENARIOS - Crisis Category
  {
    id: 'building_evac',
    title: 'Office Emergency',
    prompt: 'Building evacuation! Grab 3 things from your office:',
    options: ['Work laptop', 'Personal items', 'Project files', 'Coffee mug', 'Awards/certificates', 'Plants', 'Backup drive', 'Medications', 'Phone charger', 'Jacket'],
    timeLimit: 45,
    category: 'crisis'
  },
  {
    id: 'ship_sinking',
    title: 'Lifeboat Selection',
    prompt: 'Ship sinking! Choose 5 people for your lifeboat:',
    options: ['Doctor', 'Child', 'Elderly person', 'Pregnant woman', 'Ship captain', 'Engineer', 'Your friend', 'Celebrity', 'Scientist', 'Teacher', 'Criminal', 'Athlete'],
    timeLimit: 50,
    category: 'crisis'
  },
  {
    id: 'pandemic_supplies',
    title: 'Lockdown Shopping',
    prompt: 'Last store run before lockdown. Pick 10 items:',
    options: ['Toilet paper', 'Bread', 'Water', 'Medications', 'Batteries', 'Canned food', 'Fresh produce', 'Alcohol', 'Books', 'Games', 'Chocolate', 'Coffee', 'Pasta', 'First aid'],
    timeLimit: 60,
    category: 'crisis'
  },
  {
    id: 'earthquake_kit',
    title: 'Disaster Prep',
    prompt: 'Building earthquake kit. Select 7 essentials:',
    options: ['Water bottles', 'Flashlight', 'Radio', 'Blankets', 'Food bars', 'Whistle', 'Cash', 'Maps', 'Medications', 'Tools', 'Rope', 'Matches'],
    timeLimit: 40,
    category: 'crisis'
  },
  {
    id: 'nuclear_skills',
    title: 'Apocalypse Training',
    prompt: 'Nuclear threat! Learn 3 skills quickly:',
    options: ['First aid', 'Water purification', 'Farming', 'Self-defense', 'Radio operation', 'Navigation', 'Hunting', 'Construction', 'Leadership', 'Psychology'],
    timeLimit: 35,
    category: 'crisis'
  },
  {
    id: 'flood_rescue',
    title: 'Rising Waters',
    prompt: 'Flood warning! Save 5 irreplaceable items:',
    options: ['Family photos', 'Legal documents', 'Grandmas ring', 'Childhood toy', 'Art collection', 'Wine collection', 'Book collection', 'Music instruments', 'Medals/trophies', 'Letters'],
    timeLimit: 45,
    category: 'crisis'
  },
  {
    id: 'animal_encounter',
    title: 'Wildlife Defense',
    prompt: 'Bear approaching! Pick 3 defense tools:',
    options: ['Pepper spray', 'Whistle', 'Flashlight', 'Food to throw', 'Stick', 'Rocks', 'Jacket to look bigger', 'Phone for noise', 'Flare', 'Knife'],
    timeLimit: 20,
    category: 'crisis'
  },
  {
    id: 'wilderness_survival',
    title: 'Lost in Woods',
    prompt: 'Choose 4 survival priorities:',
    options: ['Find water', 'Build shelter', 'Make fire', 'Signal for help', 'Find food', 'Stay put', 'Follow stream', 'Climb high point', 'Build weapons', 'Rest'],
    timeLimit: 30,
    category: 'crisis'
  },

  // Resource Allocation Category
  {
    id: 'lottery_allocation',
    title: 'Sudden Wealth',
    prompt: 'Won $10M lottery! Allocate across 5 categories:',
    options: ['Real estate', 'Investments', 'Charity', 'Family gifts', 'Travel', 'Education', 'Business startup', 'Debt payment', 'Savings', 'Luxury items', 'Art', 'Experiences'],
    timeLimit: 60,
    category: 'resource'
  },
  {
    id: 'last_day_earth',
    title: 'Final Day',
    prompt: 'Last day on Earth. Plan 6 activities:',
    options: ['Family time', 'Favorite meal', 'Watch sunset', 'Call friends', 'Write letters', 'Party', 'Solitude', 'Adventure', 'Give away possessions', 'Confession', 'Sleep', 'Create art'],
    timeLimit: 50,
    category: 'resource'
  },
  {
    id: 'time_travel',
    title: 'Historical Visits',
    prompt: 'Time machine fuel for 3 trips. Visit:',
    options: ['Ancient Egypt', 'Renaissance', 'Dinosaur era', 'Future 3000', 'Meet grandparents', 'Woodstock', 'Rome empire', 'See yourself as baby', 'Prevent tragedy', 'Meet hero'],
    timeLimit: 40,
    category: 'resource'
  },
  {
    id: 'genie_wishes',
    title: 'Three Wishes',
    prompt: 'Genie appears! Pick 3 wishes (no infinite wishes):',
    options: ['Perfect health', 'Wealth', 'World peace', 'Time travel', 'Mind reading', 'Flying', 'Immortality', 'True love', 'Wisdom', 'Fame', 'Heal others', 'Speak all languages'],
    timeLimit: 45,
    category: 'resource'
  },
  {
    id: 'superpower_selection',
    title: 'Power Selection',
    prompt: 'Choose 3 superpowers:',
    options: ['Flight', 'Invisibility', 'Super strength', 'Telepathy', 'Healing', 'Time control', 'Teleportation', 'Shape-shifting', 'Super speed', 'Element control', 'Immortality', 'X-ray vision'],
    timeLimit: 30,
    category: 'resource'
  },
  {
    id: 'library_rescue',
    title: 'Knowledge Preservation',
    prompt: 'Library burning! Save 10 books:',
    options: ['Encyclopedia', 'Shakespeare', 'Bible', 'Science textbook', 'History book', 'Philosophy', 'Poetry', 'How-to guides', 'Fiction classics', 'Art books', 'Children books', 'Personal diary'],
    timeLimit: 50,
    category: 'resource'
  },
  {
    id: 'colony_ship',
    title: 'Space Colony',
    prompt: 'Select 8 professions for Mars colony:',
    options: ['Doctor', 'Engineer', 'Farmer', 'Teacher', 'Psychologist', 'Cook', 'Security', 'Scientist', 'Artist', 'Leader', 'Mechanic', 'Pilot', 'Biologist', 'Programmer'],
    timeLimit: 55,
    category: 'resource'
  },
  {
    id: 'final_meal',
    title: 'Last Restaurant',
    prompt: 'Restaurant closing forever. Order 5 dishes:',
    options: ['Signature appetizer', 'Soup', 'Salad', 'Pasta', 'Steak', 'Seafood', 'Vegetarian special', 'Chef surprise', 'Dessert', 'Wine pairing', 'Bread basket', 'Cheese plate'],
    timeLimit: 40,
    category: 'resource'
  },

  // Social Dynamics Category
  {
    id: 'wedding_party',
    title: 'Wedding Planning',
    prompt: 'Choose 6 people for wedding party:',
    options: ['Best friend', 'Sibling', 'Parent', 'Cousin', 'College friend', 'Work friend', 'Childhood friend', 'New friend', 'Mentor', 'Partner\'s friend', 'Neighbor', 'Online friend'],
    timeLimit: 45,
    category: 'social'
  },
  {
    id: 'quarantine_bubble',
    title: 'Isolation Partners',
    prompt: 'Pick 4 quarantine companions:',
    options: ['Romantic partner', 'Best friend', 'Family member', 'Pet', 'Roommate', 'Coworker', 'Neighbor', 'Doctor', 'Trainer', 'Therapist', 'Chef', 'Entertainer'],
    timeLimit: 35,
    category: 'social'
  },
  {
    id: 'road_trip_crew',
    title: 'Cross-Country Drive',
    prompt: 'Select 5 road trip partners:',
    options: ['Music lover', 'Navigator', 'Comedian', 'Photographer', 'Foodie', 'Night driver', 'Planner', 'Spontaneous one', 'Quiet one', 'Storyteller', 'Game master', 'Mechanic'],
    timeLimit: 40,
    category: 'social'
  },
  {
    id: 'startup_team',
    title: 'Dream Team',
    prompt: 'Hire 7 key roles for startup:',
    options: ['CEO', 'CTO', 'CFO', 'Designer', 'Developer', 'Marketer', 'Salesperson', 'HR manager', 'Lawyer', 'Accountant', 'Intern', 'Advisor', 'Investor', 'Assistant'],
    timeLimit: 50,
    category: 'social'
  },
  {
    id: 'dinner_party',
    title: 'Historical Dinner',
    prompt: 'Invite 8 historical figures:',
    options: ['Einstein', 'Cleopatra', 'Shakespeare', 'MLK Jr', 'Marie Curie', 'Da Vinci', 'Socrates', 'Joan of Arc', 'Gandhi', 'Mozart', 'Lincoln', 'Frida Kahlo'],
    timeLimit: 55,
    category: 'social'
  },
  {
    id: 'support_network',
    title: 'Crisis Contacts',
    prompt: 'Identify 5 emergency contacts:',
    options: ['Parent', 'Sibling', 'Best friend', 'Partner', 'Therapist', 'Mentor', 'Neighbor', 'Coworker', 'Doctor', 'Lawyer', 'Spiritual advisor', 'Online friend'],
    timeLimit: 40,
    category: 'social'
  },
  {
    id: 'heist_crew',
    title: 'Ocean\'s Team',
    prompt: 'Assign 6 heist roles:',
    options: ['Mastermind', 'Hacker', 'Con artist', 'Muscle', 'Driver', 'Inside person', 'Lookout', 'Safe cracker', 'Distraction', 'Tech expert', 'Negotiator', 'Cleaner'],
    timeLimit: 45,
    category: 'social'
  },
  {
    id: 'reality_show',
    title: 'Show Elimination',
    prompt: 'Vote off 3 contestants:',
    options: ['The leader', 'The villain', 'The sweetheart', 'The comedian', 'The strategist', 'The underdog', 'The athlete', 'The artist', 'The parent', 'The rebel', 'The flirt', 'The mentor'],
    timeLimit: 30,
    category: 'social'
  },

  // Ethical Dilemmas Category
  {
    id: 'medical_resources',
    title: 'Hospital Triage',
    prompt: 'Limited ventilators. Prioritize 5 patients:',
    options: ['Child', 'Doctor', 'Elderly person', 'Pregnant woman', 'Criminal', 'Celebrity', 'Scientist', 'Teacher', 'Single parent', 'Teenager', 'Veteran', 'Artist'],
    timeLimit: 50,
    category: 'ethical'
  },
  {
    id: 'scholarship_awards',
    title: 'Education Funding',
    prompt: 'Award scholarships to 3 students:',
    options: ['Straight A student', 'Financial need', 'First generation', 'Athlete', 'Artist', 'Volunteer', 'Single parent', 'Refugee', 'Disabled student', 'Rural student', 'STEM focus', 'Leader'],
    timeLimit: 45,
    category: 'ethical'
  },
  {
    id: 'species_preservation',
    title: 'Conservation Choice',
    prompt: 'Save 5 species from extinction:',
    options: ['Bees', 'Elephants', 'Coral reefs', 'Tigers', 'Whales', 'Pandas', 'Rainforest trees', 'Polar bears', 'Rhinos', 'Sea turtles', 'Butterflies', 'Wolves'],
    timeLimit: 40,
    category: 'ethical'
  },
  {
    id: 'cultural_preservation',
    title: 'Heritage Protection',
    prompt: 'Protect 7 cultural traditions:',
    options: ['Indigenous languages', 'Folk music', 'Traditional medicine', 'Oral histories', 'Crafts', 'Dances', 'Recipes', 'Ceremonies', 'Stories', 'Art forms', 'Games', 'Beliefs'],
    timeLimit: 50,
    category: 'ethical'
  },
  {
    id: 'information_leak',
    title: 'Whistleblower',
    prompt: 'Company scandal! Warn 4 people:',
    options: ['Boss', 'Coworkers', 'Media', 'Family', 'Authorities', 'Lawyer', 'Union', 'Shareholders', 'Customers', 'Competitors', 'Friend at company', 'Public'],
    timeLimit: 35,
    category: 'ethical'
  },
  {
    id: 'justice_reform',
    title: 'Legal Changes',
    prompt: 'Reform 3 laws first:',
    options: ['Drug laws', 'Immigration', 'Healthcare', 'Education', 'Environment', 'Criminal justice', 'Tax code', 'Labor laws', 'Privacy rights', 'Voting rights', 'Housing', 'Corporate regulation'],
    timeLimit: 45,
    category: 'ethical'
  }
];

// Enhanced analysis functions to add to TemporalDecisionSync.tsx

export const analyzePersonalityFromDecisions = (decisions: Decision[]): PersonalityProfile => {
  const profile: PersonalityProfile = {
    leadership: calculateLeadershipScore(decisions),
    empathy: calculateEmpathyScore(decisions),
    pragmatism: calculatePragmatismScore(decisions),
    riskTolerance: calculateRiskScore(decisions),
    socialFocus: calculateSocialScore(decisions),
    ethicalAlignment: calculateEthicalScore(decisions),
    stressResponse: analyzeStressResponse(decisions),
    dominantArchetype: ''
  };
  
  profile.dominantArchetype = determineArchetype(profile);
  return profile;
};

const calculateLeadershipScore = (decisions: Decision[]): number => {
  let score = 50;
  decisions.forEach(d => {
    // Fast decisions indicate leadership
    if (d.timeToDecide < 20) score += 5;
    // Choosing roles like 'CEO', 'Leader', 'Mastermind' indicates leadership
    if (d.choices.some(c => ['CEO', 'Leader', 'Mastermind', 'Captain'].includes(c))) score += 10;
  });
  return Math.min(100, score);
};

const calculateEmpathyScore = (decisions: Decision[]): number => {
  let score = 50;
  decisions.forEach(d => {
    // Prioritizing vulnerable people (children, elderly, pregnant)
    if (d.choices.some(c => ['Child', 'Elderly person', 'Pregnant woman'].includes(c))) score += 8;
    // Choosing helping professions
    if (d.choices.some(c => ['Doctor', 'Teacher', 'Therapist', 'Nurse'].includes(c))) score += 5;
  });
  return Math.min(100, score);
};

// Compare twin profiles
export const compareTwinProfiles = (
  profile1: PersonalityProfile, 
  profile2: PersonalityProfile
): TwinDynamicAnalysis => {
  const leadershipGap = Math.abs(profile1.leadership - profile2.leadership);
  const complementarity = calculateComplementarity(profile1, profile2);
  
  let dynamicType: 'balanced' | 'leader_follower' | 'complementary' | 'conflicting';
  
  if (leadershipGap < 15 && complementarity > 70) {
    dynamicType = 'balanced';
  } else if (leadershipGap > 40) {
    dynamicType = 'leader_follower';
  } else if (complementarity > 60) {
    dynamicType = 'complementary';
  } else {
    dynamicType = 'conflicting';
  }
  
  return {
    dynamicType,
    leadershipBalance: {
      twin1Role: profile1.leadership > profile2.leadership ? 'leader' : 'supporter',
      twin2Role: profile2.leadership > profile1.leadership ? 'leader' : 'supporter',
      isHealthy: leadershipGap < 50 && complementarity > 50
    },
    strengths: identifyStrengths(profile1, profile2),
    challenges: identifyChallenges(profile1, profile2),
    recommendations: generateRecommendations(dynamicType, profile1, profile2)
  };
};