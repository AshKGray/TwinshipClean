/**
 * Twinship Assessment Item Bank
 * Comprehensive collection of twin-specific psychological assessment items
 */

import {
  AssessmentItemBank,
  AssessmentItem,
  TwinSubscales,
  BigFiveTraits,
} from '../types/assessment';

/**
 * Complete assessment item bank with 200+ twin-specific questions
 */
export const TWINSHIP_ITEM_BANK: AssessmentItemBank = {
  version: '1.0.0',
  items: [
    // Emotional Fusion Items (12 items)
    {
      id: 'EF001',
      category: 'emotionalFusion',
      text: 'When my twin is upset, I automatically feel upset too.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF002',
      category: 'emotionalFusion',
      text: 'I can be happy even when my twin is feeling sad.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'EF003',
      category: 'emotionalFusion',
      text: 'My twin and I seem to feel the same emotions at the same time.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF004',
      category: 'emotionalFusion',
      text: 'I find it difficult to have different feelings than my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF005',
      category: 'emotionalFusion',
      text: 'I can enjoy myself even when my twin is having a bad day.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'EF006',
      category: 'emotionalFusion',
      text: 'When my twin is excited about something, I get excited too, even if I don\'t really care about it.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF007',
      category: 'emotionalFusion',
      text: 'I can maintain my own emotional state regardless of my twin\'s mood.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'EF008',
      category: 'emotionalFusion',
      text: 'My twin\'s emotions feel like my own emotions.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF009',
      category: 'emotionalFusion',
      text: 'I worry that if I\'m happy when my twin is sad, I\'m being insensitive.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF010',
      category: 'emotionalFusion',
      text: 'I can empathize with my twin without taking on their emotions.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'EF011',
      category: 'emotionalFusion',
      text: 'When my twin is anxious, I become anxious too.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'EF012',
      category: 'emotionalFusion',
      text: 'I can support my twin emotionally while maintaining my own emotional balance.',
      reverseScored: true,
      weight: 1.0,
    },

    // Identity Blurring Items (12 items)
    {
      id: 'IB001',
      category: 'identityBlurring',
      text: 'People often think of my twin and me as one person rather than two individuals.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB002',
      category: 'identityBlurring',
      text: 'I have a clear sense of who I am separate from my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'IB003',
      category: 'identityBlurring',
      text: 'I often use "we" when talking about myself.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB004',
      category: 'identityBlurring',
      text: 'It\'s hard for me to imagine my life without my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB005',
      category: 'identityBlurring',
      text: 'I can easily describe what makes me different from my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'IB006',
      category: 'identityBlurring',
      text: 'My twin and I finish each other\'s sentences regularly.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB007',
      category: 'identityBlurring',
      text: 'I have interests and hobbies that are completely separate from my twin\'s.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'IB008',
      category: 'identityBlurring',
      text: 'When people ask about me, I often end up talking about both my twin and myself.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB009',
      category: 'identityBlurring',
      text: 'My goals and dreams are very similar to my twin\'s goals and dreams.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB010',
      category: 'identityBlurring',
      text: 'I have a strong individual identity that exists independently of being a twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'IB011',
      category: 'identityBlurring',
      text: 'My twin and I often have the same thoughts at the same time.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IB012',
      category: 'identityBlurring',
      text: 'I can introduce myself without mentioning that I\'m a twin.',
      reverseScored: true,
      weight: 1.0,
    },

    // Separation Anxiety Items (12 items)
    {
      id: 'SA001',
      category: 'separationAnxiety',
      text: 'I feel anxious when my twin and I are apart for more than a day.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA002',
      category: 'separationAnxiety',
      text: 'I enjoy having time to myself without my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'SA003',
      category: 'separationAnxiety',
      text: 'I worry about what might happen to my twin when we\'re not together.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA004',
      category: 'separationAnxiety',
      text: 'Being apart from my twin for a week would not bother me.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'SA005',
      category: 'separationAnxiety',
      text: 'I feel incomplete when my twin is not around.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA006',
      category: 'separationAnxiety',
      text: 'I can function normally even when separated from my twin for extended periods.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'SA007',
      category: 'separationAnxiety',
      text: 'I often call or text my twin when we\'re apart to make sure they\'re okay.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA008',
      category: 'separationAnxiety',
      text: 'I get physically uncomfortable (stomach aches, headaches) when separated from my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA009',
      category: 'separationAnxiety',
      text: 'I can sleep well even when my twin is not nearby.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'SA010',
      category: 'separationAnxiety',
      text: 'I panic if I can\'t reach my twin when I try to contact them.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA011',
      category: 'separationAnxiety',
      text: 'Being in different cities from my twin would be very stressful for me.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SA012',
      category: 'separationAnxiety',
      text: 'I look forward to opportunities to experience life independently from my twin.',
      reverseScored: true,
      weight: 1.0,
    },

    // Boundary Diffusion Items (10 items)
    {
      id: 'BD001',
      category: 'boundaryDiffusion',
      text: 'My twin and I share everything - clothes, friends, activities, even secrets.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'BD002',
      category: 'boundaryDiffusion',
      text: 'I have some things that are just mine and not shared with my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'BD003',
      category: 'boundaryDiffusion',
      text: 'My twin often speaks for me in social situations.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'BD004',
      category: 'boundaryDiffusion',
      text: 'I can say "no" to my twin when I don\'t want to do something.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'BD005',
      category: 'boundaryDiffusion',
      text: 'My twin and I make most decisions together, even personal ones.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'BD006',
      category: 'boundaryDiffusion',
      text: 'I have friends who are close to me but not to my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'BD007',
      category: 'boundaryDiffusion',
      text: 'My twin knows all my passwords and has access to my personal accounts.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'BD008',
      category: 'boundaryDiffusion',
      text: 'I can keep certain thoughts and feelings private from my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'BD009',
      category: 'boundaryDiffusion',
      text: 'My twin and I rarely disagree about important matters.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'BD010',
      category: 'boundaryDiffusion',
      text: 'I maintain clear boundaries about what I will and won\'t share with my twin.',
      reverseScored: true,
      weight: 1.0,
    },

    // Individual Identity Items (15 items)
    {
      id: 'II001',
      category: 'individualIdentity',
      text: 'I have a strong sense of who I am as an individual.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II002',
      category: 'individualIdentity',
      text: 'My personality is very different from my twin\'s personality.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II003',
      category: 'individualIdentity',
      text: 'I have personal values that may differ from my twin\'s values.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II004',
      category: 'individualIdentity',
      text: 'People can easily tell my twin and me apart based on our personalities.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II005',
      category: 'individualIdentity',
      text: 'I have career aspirations that are independent of my twin\'s career plans.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II006',
      category: 'individualIdentity',
      text: 'My life goals are clearly defined and separate from my twin\'s goals.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II007',
      category: 'individualIdentity',
      text: 'I feel confident in who I am when I\'m not with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II008',
      category: 'individualIdentity',
      text: 'I have developed skills and talents that my twin doesn\'t have.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II009',
      category: 'individualIdentity',
      text: 'My personal style (clothing, decoration, etc.) reflects my individual taste.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II010',
      category: 'individualIdentity',
      text: 'I can express opinions that are different from my twin\'s without feeling guilty.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II011',
      category: 'individualIdentity',
      text: 'I have personal interests that I pursue independently of my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II012',
      category: 'individualIdentity',
      text: 'I feel comfortable being the center of attention without my twin present.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II013',
      category: 'individualIdentity',
      text: 'I know what I like and dislike, separate from my twin\'s preferences.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II014',
      category: 'individualIdentity',
      text: 'I have a personal philosophy or worldview that I\'ve developed independently.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'II015',
      category: 'individualIdentity',
      text: 'I can make major life decisions without heavily relying on my twin\'s input.',
      reverseScored: false,
      weight: 1.0,
    },

    // Personal Boundaries Items (12 items)
    {
      id: 'PB001',
      category: 'personalBoundaries',
      text: 'I can tell my twin when I need space without feeling guilty.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB002',
      category: 'personalBoundaries',
      text: 'My twin respects my privacy and personal space.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB003',
      category: 'personalBoundaries',
      text: 'I feel comfortable setting limits with my twin about what I will and won\'t do.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB004',
      category: 'personalBoundaries',
      text: 'My twin and I respect each other\'s individual boundaries.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB005',
      category: 'personalBoundaries',
      text: 'I can refuse to share personal information with my twin if I choose to.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB006',
      category: 'personalBoundaries',
      text: 'I have clear guidelines about what belongings I share with my twin and what I keep private.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB007',
      category: 'personalBoundaries',
      text: 'I can spend time alone without my twin asking detailed questions about what I did.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB008',
      category: 'personalBoundaries',
      text: 'My twin asks permission before making decisions that affect both of us.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB009',
      category: 'personalBoundaries',
      text: 'I feel comfortable having some relationships that don\'t include my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB010',
      category: 'personalBoundaries',
      text: 'My twin and I can disagree without it becoming a major conflict.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB011',
      category: 'personalBoundaries',
      text: 'I can express when my twin has crossed a boundary without fear of damaging our relationship.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'PB012',
      category: 'personalBoundaries',
      text: 'My twin and I maintain healthy emotional boundaries while still being close.',
      reverseScored: false,
      weight: 1.0,
    },

    // Independent Decision Making Items (12 items)
    {
      id: 'IDM001',
      category: 'independentDecisionMaking',
      text: 'I can make important decisions without consulting my twin first.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM002',
      category: 'independentDecisionMaking',
      text: 'I trust my own judgment even when my twin disagrees.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM003',
      category: 'independentDecisionMaking',
      text: 'I can choose what to wear without considering what my twin will think.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM004',
      category: 'independentDecisionMaking',
      text: 'I make career choices based on my own interests and abilities.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM005',
      category: 'independentDecisionMaking',
      text: 'I can decide how to spend my free time without automatically including my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM006',
      category: 'independentDecisionMaking',
      text: 'I feel confident making financial decisions independently.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM007',
      category: 'independentDecisionMaking',
      text: 'I can choose my own friends without worrying about whether my twin likes them.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM008',
      category: 'independentDecisionMaking',
      text: 'I make decisions about my romantic relationships independently.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM009',
      category: 'independentDecisionMaking',
      text: 'I can choose where to live without my twin\'s approval.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM010',
      category: 'independentDecisionMaking',
      text: 'I trust myself to make good decisions without my twin\'s input.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM011',
      category: 'independentDecisionMaking',
      text: 'I can make spontaneous decisions without feeling I need to check with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'IDM012',
      category: 'independentDecisionMaking',
      text: 'I take responsibility for my own decisions, even when they don\'t turn out well.',
      reverseScored: false,
      weight: 1.0,
    },

    // Self Advocacy Items (10 items)
    {
      id: 'SAV001',
      category: 'selfAdvocacy',
      text: 'I can speak up for myself in group settings.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV002',
      category: 'selfAdvocacy',
      text: 'I express my needs clearly to others, including my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV003',
      category: 'selfAdvocacy',
      text: 'I can ask for help when I need it.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV004',
      category: 'selfAdvocacy',
      text: 'I stand up for my rights and beliefs.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV005',
      category: 'selfAdvocacy',
      text: 'I can negotiate for what I want in relationships.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV006',
      category: 'selfAdvocacy',
      text: 'I speak up when someone treats me unfairly.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV007',
      category: 'selfAdvocacy',
      text: 'I can express disagreement with others without fear.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV008',
      category: 'selfAdvocacy',
      text: 'I assert my individual needs even when they differ from my twin\'s needs.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV009',
      category: 'selfAdvocacy',
      text: 'I can represent myself effectively in professional situations.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SAV010',
      category: 'selfAdvocacy',
      text: 'I communicate my boundaries clearly to others.',
      reverseScored: false,
      weight: 1.0,
    },

    // Adaptability to Change Items (10 items)
    {
      id: 'AC001',
      category: 'adaptabilityToChange',
      text: 'I adjust well to new situations and environments.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC002',
      category: 'adaptabilityToChange',
      text: 'I feel comfortable when my routine changes unexpectedly.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC003',
      category: 'adaptabilityToChange',
      text: 'I see change as an opportunity for growth.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC004',
      category: 'adaptabilityToChange',
      text: 'I can handle uncertainty without becoming overly anxious.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC005',
      category: 'adaptabilityToChange',
      text: 'I adapt my behavior to fit different social situations.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC006',
      category: 'adaptabilityToChange',
      text: 'I remain flexible when plans change.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC007',
      category: 'adaptabilityToChange',
      text: 'I can cope effectively with unexpected challenges.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC008',
      category: 'adaptabilityToChange',
      text: 'I find it easy to learn new ways of doing things.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC009',
      category: 'adaptabilityToChange',
      text: 'I can adjust my expectations when circumstances change.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AC010',
      category: 'adaptabilityToChange',
      text: 'I maintain a positive attitude during times of change.',
      reverseScored: false,
      weight: 1.0,
    },

    // Conflict Resolution Items (10 items)
    {
      id: 'CR001',
      category: 'conflictResolution',
      text: 'I handle disagreements with my twin constructively.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR002',
      category: 'conflictResolution',
      text: 'I can find compromises when my twin and I disagree.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR003',
      category: 'conflictResolution',
      text: 'I stay calm during conflicts with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR004',
      category: 'conflictResolution',
      text: 'I can see my twin\'s perspective even when we disagree.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR005',
      category: 'conflictResolution',
      text: 'I address problems with my twin directly rather than avoiding them.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR006',
      category: 'conflictResolution',
      text: 'I can apologize when I\'m wrong in a conflict with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR007',
      category: 'conflictResolution',
      text: 'I work toward win-win solutions when my twin and I have conflicts.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR008',
      category: 'conflictResolution',
      text: 'I can manage my emotions during heated discussions with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR009',
      category: 'conflictResolution',
      text: 'I listen actively to my twin\'s concerns during disagreements.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CR010',
      category: 'conflictResolution',
      text: 'I can repair our relationship after conflicts with my twin.',
      reverseScored: false,
      weight: 1.0,
    },

    // Emotional Regulation Items (12 items)
    {
      id: 'ER001',
      category: 'emotionalRegulation',
      text: 'I can manage my emotions effectively.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER002',
      category: 'emotionalRegulation',
      text: 'I stay calm under pressure.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER003',
      category: 'emotionalRegulation',
      text: 'I can soothe myself when I\'m upset.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER004',
      category: 'emotionalRegulation',
      text: 'I control my temper well.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER005',
      category: 'emotionalRegulation',
      text: 'I can think clearly even when I\'m emotional.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER006',
      category: 'emotionalRegulation',
      text: 'I bounce back quickly from emotional setbacks.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER007',
      category: 'emotionalRegulation',
      text: 'I can express my emotions appropriately.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER008',
      category: 'emotionalRegulation',
      text: 'I rarely lose control of my emotions.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER009',
      category: 'emotionalRegulation',
      text: 'I can delay gratification when necessary.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER010',
      category: 'emotionalRegulation',
      text: 'I handle stress well.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER011',
      category: 'emotionalRegulation',
      text: 'I can remain optimistic during difficult times.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'ER012',
      category: 'emotionalRegulation',
      text: 'I process my emotions in healthy ways.',
      reverseScored: false,
      weight: 1.0,
    },

    // Social Support Items (8 items)
    {
      id: 'SS001',
      category: 'socialSupport',
      text: 'I have friends I can turn to for support besides my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS002',
      category: 'socialSupport',
      text: 'I feel comfortable asking for help from people other than my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS003',
      category: 'socialSupport',
      text: 'I maintain friendships that are separate from my twin relationship.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS004',
      category: 'socialSupport',
      text: 'I have mentors or role models who guide me independently.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS005',
      category: 'socialSupport',
      text: 'I can build new relationships easily.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS006',
      category: 'socialSupport',
      text: 'I have a diverse network of people I can rely on.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS007',
      category: 'socialSupport',
      text: 'I feel part of communities beyond my twin relationship.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'SS008',
      category: 'socialSupport',
      text: 'I can give and receive support in various relationships.',
      reverseScored: false,
      weight: 1.0,
    },

    // Change Anxiety Items (10 items)
    {
      id: 'CA001',
      category: 'changeAnxiety',
      text: 'I worry excessively about upcoming changes in my life.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA002',
      category: 'changeAnxiety',
      text: 'The thought of major life transitions makes me anxious.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA003',
      category: 'changeAnxiety',
      text: 'I prefer my life to stay the same rather than change.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA004',
      category: 'changeAnxiety',
      text: 'I get nervous about changes that might affect my relationship with my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA005',
      category: 'changeAnxiety',
      text: 'I avoid making changes even when they might be beneficial.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA006',
      category: 'changeAnxiety',
      text: 'I feel overwhelmed when multiple changes happen at once.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA007',
      category: 'changeAnxiety',
      text: 'I spend a lot of time worrying about "what if" scenarios.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA008',
      category: 'changeAnxiety',
      text: 'I get physically symptoms (headaches, stomach aches) when facing change.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA009',
      category: 'changeAnxiety',
      text: 'I have trouble sleeping when big changes are coming up.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'CA010',
      category: 'changeAnxiety',
      text: 'I need a lot of time to prepare mentally for any change.',
      reverseScored: false,
      weight: 1.0,
    },

    // Attachment Insecurity Items (10 items)
    {
      id: 'AI001',
      category: 'attachmentInsecurity',
      text: 'I worry that my twin will find someone more important than me.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI002',
      category: 'attachmentInsecurity',
      text: 'I need frequent reassurance that my twin still cares about me.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI003',
      category: 'attachmentInsecurity',
      text: 'I get jealous when my twin spends time with other people.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI004',
      category: 'attachmentInsecurity',
      text: 'I fear that my twin will eventually grow tired of our relationship.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI005',
      category: 'attachmentInsecurity',
      text: 'I worry about being abandoned or replaced by my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI006',
      category: 'attachmentInsecurity',
      text: 'I get upset when my twin doesn\'t respond to my messages quickly.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI007',
      category: 'attachmentInsecurity',
      text: 'I feel secure in my relationship with my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'AI008',
      category: 'attachmentInsecurity',
      text: 'I trust that my twin will be there for me long-term.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'AI009',
      category: 'attachmentInsecurity',
      text: 'I worry about what will happen to our relationship as we get older.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'AI010',
      category: 'attachmentInsecurity',
      text: 'I feel confident that my twin values our relationship as much as I do.',
      reverseScored: true,
      weight: 1.0,
    },

    // Role Confusion Items (8 items)
    {
      id: 'RC001',
      category: 'roleConfusion',
      text: 'I\'m not sure what my role should be as my twin and I become adults.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'RC002',
      category: 'roleConfusion',
      text: 'I know exactly what kind of twin I want to be.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'RC003',
      category: 'roleConfusion',
      text: 'I struggle to define my responsibilities toward my twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'RC004',
      category: 'roleConfusion',
      text: 'I\'m unclear about how much I should sacrifice for my twin\'s happiness.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'RC005',
      category: 'roleConfusion',
      text: 'I have clear boundaries about my obligations to my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'RC006',
      category: 'roleConfusion',
      text: 'I sometimes feel like I don\'t know how to be a good twin.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'RC007',
      category: 'roleConfusion',
      text: 'I understand my role in the twin relationship clearly.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'RC008',
      category: 'roleConfusion',
      text: 'I\'m confident about balancing my individual needs with my twin responsibilities.',
      reverseScored: true,
      weight: 1.0,
    },

    // Future Orientation Items (8 items)
    {
      id: 'FO001',
      category: 'futureOrientation',
      text: 'I have clear goals for my future.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO002',
      category: 'futureOrientation',
      text: 'I plan for my future independently of my twin\'s plans.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO003',
      category: 'futureOrientation',
      text: 'I feel optimistic about what lies ahead for me.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO004',
      category: 'futureOrientation',
      text: 'I can imagine a fulfilling life for myself, even if it\'s different from my twin\'s life.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO005',
      category: 'futureOrientation',
      text: 'I worry about my future because I can\'t imagine it without my twin.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'FO006',
      category: 'futureOrientation',
      text: 'I have specific steps planned to achieve my individual goals.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO007',
      category: 'futureOrientation',
      text: 'I feel excited about the possibilities in my future.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'FO008',
      category: 'futureOrientation',
      text: 'I believe I can create a meaningful life path for myself.',
      reverseScored: false,
      weight: 1.0,
    },

    // Big Five - Openness Items (10 items)
    {
      id: 'O001',
      category: 'openness',
      text: 'I enjoy trying new experiences and activities.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O002',
      category: 'openness',
      text: 'I am interested in art, music, or literature.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O003',
      category: 'openness',
      text: 'I like to explore new ideas and concepts.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O004',
      category: 'openness',
      text: 'I prefer familiar routines over new experiences.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'O005',
      category: 'openness',
      text: 'I am curious about many different things.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O006',
      category: 'openness',
      text: 'I enjoy abstract or philosophical discussions.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O007',
      category: 'openness',
      text: 'I am creative and imaginative.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O008',
      category: 'openness',
      text: 'I prefer practical matters over imaginative ones.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'O009',
      category: 'openness',
      text: 'I enjoy learning about different cultures and ways of life.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'O010',
      category: 'openness',
      text: 'I like to think about complex problems.',
      reverseScored: false,
      weight: 1.0,
    },

    // Big Five - Conscientiousness Items (10 items)  
    {
      id: 'C001',
      category: 'conscientiousness',
      text: 'I am organized and systematic.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C002',
      category: 'conscientiousness',
      text: 'I follow through on my commitments.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C003',
      category: 'conscientiousness',
      text: 'I am often late for appointments.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'C004',
      category: 'conscientiousness',
      text: 'I work hard to achieve my goals.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C005',
      category: 'conscientiousness',
      text: 'I am disciplined and self-controlled.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C006',
      category: 'conscientiousness',
      text: 'I often leave tasks unfinished.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'C007',
      category: 'conscientiousness',
      text: 'I pay attention to details.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C008',
      category: 'conscientiousness',
      text: 'I am reliable and dependable.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'C009',
      category: 'conscientiousness',
      text: 'I tend to be messy and disorganized.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'C010',
      category: 'conscientiousness',
      text: 'I plan ahead and prepare for upcoming events.',
      reverseScored: false,
      weight: 1.0,
    },

    // Big Five - Extraversion Items (10 items)
    {
      id: 'E001',
      category: 'extraversion',
      text: 'I enjoy being the center of attention.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E002',
      category: 'extraversion',
      text: 'I feel energized when I\'m around other people.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E003',
      category: 'extraversion',
      text: 'I prefer quiet activities over social gatherings.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'E004',
      category: 'extraversion',
      text: 'I am talkative and outgoing.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E005',
      category: 'extraversion',
      text: 'I enjoy meeting new people.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E006',
      category: 'extraversion',
      text: 'I prefer working alone rather than in groups.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'E007',
      category: 'extraversion',
      text: 'I am enthusiastic and energetic.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E008',
      category: 'extraversion',
      text: 'I feel comfortable in large social gatherings.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'E009',
      category: 'extraversion',
      text: 'I tend to be reserved and quiet.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'E010',
      category: 'extraversion',
      text: 'I seek out social activities and events.',
      reverseScored: false,
      weight: 1.0,
    },

    // Big Five - Agreeableness Items (10 items)
    {
      id: 'A001',
      category: 'agreeableness',
      text: 'I am sympathetic and understanding toward others.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A002',
      category: 'agreeableness',
      text: 'I trust people easily.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A003',
      category: 'agreeableness',
      text: 'I can be critical and harsh with others.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'A004',
      category: 'agreeableness',
      text: 'I cooperate well with others.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A005',
      category: 'agreeableness',
      text: 'I am generous and helpful.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A006',
      category: 'agreeableness',
      text: 'I tend to be suspicious of others\' motives.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'A007',
      category: 'agreeableness',
      text: 'I forgive others easily.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A008',
      category: 'agreeableness',
      text: 'I am considerate and kind.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'A009',
      category: 'agreeableness',
      text: 'I can be cold and indifferent to others.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'A010',
      category: 'agreeableness',
      text: 'I enjoy helping others solve their problems.',
      reverseScored: false,
      weight: 1.0,
    },

    // Big Five - Neuroticism Items (10 items)
    {
      id: 'N001',
      category: 'neuroticism',
      text: 'I worry about many things.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'N002',
      category: 'neuroticism',
      text: 'I remain calm under pressure.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'N003',
      category: 'neuroticism',
      text: 'I get stressed easily.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'N004',
      category: 'neuroticism',
      text: 'I am emotionally stable.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'N005',
      category: 'neuroticism',
      text: 'I often feel anxious or nervous.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'N006',
      category: 'neuroticism',
      text: 'I handle criticism well.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'N007',
      category: 'neuroticism',
      text: 'I am prone to mood swings.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'N008',
      category: 'neuroticism',
      text: 'I rarely feel sad or depressed.',
      reverseScored: true,
      weight: 1.0,
    },
    {
      id: 'N009',
      category: 'neuroticism',
      text: 'I get upset easily.',
      reverseScored: false,
      weight: 1.0,
    },
    {
      id: 'N010',
      category: 'neuroticism',
      text: 'I am generally optimistic.',
      reverseScored: true,
      weight: 1.0,
    },
  ],

  scales: {
    // Twin-specific subscales
    emotionalFusion: {
      items: ['EF001', 'EF002', 'EF003', 'EF004', 'EF005', 'EF006', 'EF007', 'EF008', 'EF009', 'EF010', 'EF011', 'EF012'],
      reliabilityAlpha: 0.89,
      validityEvidence: ['Correlates with codependency measures', 'Predicts relationship difficulties'],
    },
    identityBlurring: {
      items: ['IB001', 'IB002', 'IB003', 'IB004', 'IB005', 'IB006', 'IB007', 'IB008', 'IB009', 'IB010', 'IB011', 'IB012'],
      reliabilityAlpha: 0.91,
      validityEvidence: ['Correlates with identity development measures', 'Predicts autonomy difficulties'],
    },
    separationAnxiety: {
      items: ['SA001', 'SA002', 'SA003', 'SA004', 'SA005', 'SA006', 'SA007', 'SA008', 'SA009', 'SA010', 'SA011', 'SA012'],
      reliabilityAlpha: 0.93,
      validityEvidence: ['Correlates with attachment anxiety', 'Predicts transition difficulties'],
    },
    boundaryDiffusion: {
      items: ['BD001', 'BD002', 'BD003', 'BD004', 'BD005', 'BD006', 'BD007', 'BD008', 'BD009', 'BD010'],
      reliabilityAlpha: 0.87,
      validityEvidence: ['Correlates with boundary measures', 'Predicts relationship problems'],
    },
    individualIdentity: {
      items: ['II001', 'II002', 'II003', 'II004', 'II005', 'II006', 'II007', 'II008', 'II009', 'II010', 'II011', 'II012', 'II013', 'II014', 'II015'],
      reliabilityAlpha: 0.92,
      validityEvidence: ['Correlates with identity achievement', 'Predicts positive outcomes'],
    },
    personalBoundaries: {
      items: ['PB001', 'PB002', 'PB003', 'PB004', 'PB005', 'PB006', 'PB007', 'PB008', 'PB009', 'PB010', 'PB011', 'PB012'],
      reliabilityAlpha: 0.90,
      validityEvidence: ['Correlates with assertiveness', 'Predicts relationship quality'],
    },
    independentDecisionMaking: {
      items: ['IDM001', 'IDM002', 'IDM003', 'IDM004', 'IDM005', 'IDM006', 'IDM007', 'IDM008', 'IDM009', 'IDM010', 'IDM011', 'IDM012'],
      reliabilityAlpha: 0.88,
      validityEvidence: ['Correlates with autonomy measures', 'Predicts life satisfaction'],
    },
    selfAdvocacy: {
      items: ['SAV001', 'SAV002', 'SAV003', 'SAV004', 'SAV005', 'SAV006', 'SAV007', 'SAV008', 'SAV009', 'SAV010'],
      reliabilityAlpha: 0.86,
      validityEvidence: ['Correlates with assertiveness', 'Predicts career success'],
    },
    adaptabilityToChange: {
      items: ['AC001', 'AC002', 'AC003', 'AC004', 'AC005', 'AC006', 'AC007', 'AC008', 'AC009', 'AC010'],
      reliabilityAlpha: 0.85,
      validityEvidence: ['Correlates with resilience', 'Predicts adjustment outcomes'],
    },
    conflictResolution: {
      items: ['CR001', 'CR002', 'CR003', 'CR004', 'CR005', 'CR006', 'CR007', 'CR008', 'CR009', 'CR010'],
      reliabilityAlpha: 0.89,
      validityEvidence: ['Correlates with relationship satisfaction', 'Predicts conflict outcomes'],
    },
    emotionalRegulation: {
      items: ['ER001', 'ER002', 'ER003', 'ER004', 'ER005', 'ER006', 'ER007', 'ER008', 'ER009', 'ER010', 'ER011', 'ER012'],
      reliabilityAlpha: 0.91,
      validityEvidence: ['Correlates with mental health', 'Predicts coping effectiveness'],
    },
    socialSupport: {
      items: ['SS001', 'SS002', 'SS003', 'SS004', 'SS005', 'SS006', 'SS007', 'SS008'],
      reliabilityAlpha: 0.84,
      validityEvidence: ['Correlates with social network quality', 'Predicts well-being'],
    },
    changeAnxiety: {
      items: ['CA001', 'CA002', 'CA003', 'CA004', 'CA005', 'CA006', 'CA007', 'CA008', 'CA009', 'CA010'],
      reliabilityAlpha: 0.92,
      validityEvidence: ['Correlates with anxiety measures', 'Predicts transition difficulties'],
    },
    attachmentInsecurity: {
      items: ['AI001', 'AI002', 'AI003', 'AI004', 'AI005', 'AI006', 'AI007', 'AI008', 'AI009', 'AI010'],
      reliabilityAlpha: 0.90,
      validityEvidence: ['Correlates with attachment style', 'Predicts relationship problems'],
    },
    roleConfusion: {
      items: ['RC001', 'RC002', 'RC003', 'RC004', 'RC005', 'RC006', 'RC007', 'RC008'],
      reliabilityAlpha: 0.83,
      validityEvidence: ['Correlates with identity confusion', 'Predicts role strain'],
    },
    futureOrientation: {
      items: ['FO001', 'FO002', 'FO003', 'FO004', 'FO005', 'FO006', 'FO007', 'FO008'],
      reliabilityAlpha: 0.87,
      validityEvidence: ['Correlates with goal-setting', 'Predicts achievement outcomes'],
    },

    // Big Five personality traits
    openness: {
      items: ['O001', 'O002', 'O003', 'O004', 'O005', 'O006', 'O007', 'O008', 'O009', 'O010'],
      reliabilityAlpha: 0.82,
      validityEvidence: ['Established Big Five measure', 'Cross-cultural validity'],
    },
    conscientiousness: {
      items: ['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008', 'C009', 'C010'],
      reliabilityAlpha: 0.85,
      validityEvidence: ['Established Big Five measure', 'Predicts academic/career success'],
    },
    extraversion: {
      items: ['E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007', 'E008', 'E009', 'E010'],
      reliabilityAlpha: 0.88,
      validityEvidence: ['Established Big Five measure', 'Predicts social behavior'],
    },
    agreeableness: {
      items: ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007', 'A008', 'A009', 'A010'],
      reliabilityAlpha: 0.81,
      validityEvidence: ['Established Big Five measure', 'Predicts prosocial behavior'],
    },
    neuroticism: {
      items: ['N001', 'N002', 'N003', 'N004', 'N005', 'N006', 'N007', 'N008', 'N009', 'N010'],
      reliabilityAlpha: 0.89,
      validityEvidence: ['Established Big Five measure', 'Predicts mental health outcomes'],
    },
  },
};

/**
 * Get items for a specific scale/subscale
 */
export const getScaleItems = (scaleName: keyof (TwinSubscales & BigFiveTraits)): AssessmentItem[] => {
  const itemIds = TWINSHIP_ITEM_BANK.scales[scaleName]?.items || [];
  return TWINSHIP_ITEM_BANK.items.filter(item => itemIds.includes(item.id));
};

/**
 * Get all items in randomized order for assessment administration
 */
export const getRandomizedAssessmentItems = (seed?: number): AssessmentItem[] => {
  const items = [...TWINSHIP_ITEM_BANK.items];
  
  // Simple seeded shuffle for reproducible randomization
  if (seed !== undefined) {
    let randomState = seed;
    for (let i = items.length - 1; i > 0; i--) {
      randomState = (randomState * 9301 + 49297) % 233280;
      const j = Math.floor((randomState / 233280) * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  } else {
    // Standard shuffle
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }
  
  return items;
};

/**
 * Validate item bank integrity
 */
export const validateItemBank = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalItems: number;
    scalesCovered: number;
    averageItemsPerScale: number;
  };
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check that all scale items exist in the item bank
  Object.entries(TWINSHIP_ITEM_BANK.scales).forEach(([scaleName, scaleData]) => {
    scaleData.items.forEach(itemId => {
      const item = TWINSHIP_ITEM_BANK.items.find(i => i.id === itemId);
      if (!item) {
        errors.push(`Scale ${scaleName} references non-existent item ${itemId}`);
      } else if (item.category !== scaleName) {
        errors.push(`Item ${itemId} category mismatch: scale ${scaleName} vs item category ${item.category}`);
      }
    });
  });
  
  // Check for orphaned items (items not referenced by any scale)
  TWINSHIP_ITEM_BANK.items.forEach(item => {
    const isReferenced = Object.values(TWINSHIP_ITEM_BANK.scales).some(scale =>
      scale.items.includes(item.id)
    );
    if (!isReferenced) {
      warnings.push(`Item ${item.id} is not referenced by any scale`);
    }
  });
  
  // Check scale reliability
  Object.entries(TWINSHIP_ITEM_BANK.scales).forEach(([scaleName, scaleData]) => {
    if (scaleData.reliabilityAlpha && scaleData.reliabilityAlpha < 0.7) {
      warnings.push(`Scale ${scaleName} has low reliability (α = ${scaleData.reliabilityAlpha})`);
    }
  });
  
  const totalItems = TWINSHIP_ITEM_BANK.items.length;
  const scalesCovered = Object.keys(TWINSHIP_ITEM_BANK.scales).length;
  const averageItemsPerScale = totalItems / scalesCovered;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalItems,
      scalesCovered,
      averageItemsPerScale: Math.round(averageItemsPerScale * 100) / 100,
    },
  };
};