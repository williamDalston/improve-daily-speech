/**
 * Content Programming Agent
 * Manages topic packs, challenges, and retention mechanics
 */

export interface TopicPack {
  id: string;
  name: string;
  description: string;
  emoji: string;
  topics: TopicItem[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  tags: string[];
  unlockRequirement?: UnlockRequirement;
}

export interface TopicItem {
  id: string;
  title: string;
  description: string;
  order: number;
  lengthMinutes: number;
  stylePrompt?: string;
}

export interface UnlockRequirement {
  type: 'episodes_completed' | 'streak_days' | 'pack_completed' | 'pro_only';
  value?: number;
  packId?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'daily' | 'weekly' | 'achievement';
  goal: ChallengeGoal;
  reward?: ChallengeReward;
  expiresAt?: Date;
}

export interface ChallengeGoal {
  type: 'listen_minutes' | 'complete_episodes' | 'complete_pack' | 'streak_days' | 'share_episode' | 'create_flashcards';
  target: number;
  progress?: number;
}

export interface ChallengeReward {
  type: 'badge' | 'narrator_style' | 'topic_pack' | 'xp';
  value: string | number;
  description: string;
}

// ============ CURATED TOPIC PACKS ============

export const TOPIC_PACKS: TopicPack[] = [
  // === Beginner Packs ===
  {
    id: 'thinking-clearly',
    name: 'Thinking Clearly',
    description: 'Master the art of critical thinking and avoid common mental traps',
    emoji: '🧠',
    difficulty: 'beginner',
    estimatedMinutes: 50,
    tags: ['psychology', 'decision-making', 'self-improvement'],
    topics: [
      {
        id: 'tc-1',
        title: 'Cognitive Biases: Why Your Brain Lies to You',
        description: 'The sneaky shortcuts your brain takes that lead you astray',
        order: 1,
        lengthMinutes: 10,
      },
      {
        id: 'tc-2',
        title: 'Confirmation Bias: Seeing What You Want to See',
        description: 'Why we cherry-pick evidence and how to stop',
        order: 2,
        lengthMinutes: 10,
      },
      {
        id: 'tc-3',
        title: 'The Dunning-Kruger Effect Explained',
        description: 'Why the least competent are often the most confident',
        order: 3,
        lengthMinutes: 10,
      },
      {
        id: 'tc-4',
        title: 'Logical Fallacies You Encounter Every Day',
        description: 'Spot bad arguments in news, ads, and conversations',
        order: 4,
        lengthMinutes: 10,
      },
      {
        id: 'tc-5',
        title: 'How to Actually Change Your Mind',
        description: 'The science of updating beliefs with new evidence',
        order: 5,
        lengthMinutes: 10,
      },
    ],
  },
  {
    id: 'money-fundamentals',
    name: 'Money Fundamentals',
    description: 'Build a solid foundation in personal finance and economics',
    emoji: '💰',
    difficulty: 'beginner',
    estimatedMinutes: 50,
    tags: ['finance', 'economics', 'practical'],
    topics: [
      {
        id: 'mf-1',
        title: 'How Money Actually Works',
        description: 'From barter to Bitcoin: the evolution of currency',
        order: 1,
        lengthMinutes: 10,
      },
      {
        id: 'mf-2',
        title: 'Compound Interest: The 8th Wonder of the World',
        description: 'Why starting early matters more than starting big',
        order: 2,
        lengthMinutes: 10,
      },
      {
        id: 'mf-3',
        title: 'Inflation: The Silent Wealth Destroyer',
        description: 'Why your money buys less over time and what to do about it',
        order: 3,
        lengthMinutes: 10,
      },
      {
        id: 'mf-4',
        title: 'Stocks, Bonds, and Index Funds Explained Simply',
        description: 'A no-jargon guide to where to put your money',
        order: 4,
        lengthMinutes: 10,
      },
      {
        id: 'mf-5',
        title: 'The Psychology of Spending',
        description: 'Why we buy things we don\'t need and how to stop',
        order: 5,
        lengthMinutes: 10,
      },
    ],
  },
  // === Intermediate Packs ===
  {
    id: 'geopolitics-101',
    name: '7 Days of Geopolitics',
    description: 'Understand the forces shaping our world today',
    emoji: '🌍',
    difficulty: 'intermediate',
    estimatedMinutes: 70,
    tags: ['politics', 'history', 'current-events'],
    unlockRequirement: { type: 'episodes_completed', value: 3 },
    topics: [
      {
        id: 'geo-1',
        title: 'Why Geography Determines Power',
        description: 'How mountains, rivers, and ports shape nations',
        order: 1,
        lengthMinutes: 10,
      },
      {
        id: 'geo-2',
        title: 'The US-China Rivalry Explained',
        description: 'The new cold war and what it means for everyone',
        order: 2,
        lengthMinutes: 10,
      },
      {
        id: 'geo-3',
        title: 'Why the Middle East Is Always in Conflict',
        description: 'Oil, religion, and colonial borders',
        order: 3,
        lengthMinutes: 10,
      },
      {
        id: 'geo-4',
        title: 'Russia\'s Strategic Mindset',
        description: 'Understanding the logic behind Russian foreign policy',
        order: 4,
        lengthMinutes: 10,
      },
      {
        id: 'geo-5',
        title: 'The Future of Europe',
        description: 'Unity, fragmentation, and the EU\'s challenges',
        order: 5,
        lengthMinutes: 10,
      },
      {
        id: 'geo-6',
        title: 'Africa Rising: The Continent\'s Moment',
        description: 'Demographics, resources, and potential',
        order: 6,
        lengthMinutes: 10,
      },
      {
        id: 'geo-7',
        title: 'Climate Change as a Geopolitical Force',
        description: 'How warming reshapes borders and power',
        order: 7,
        lengthMinutes: 10,
      },
    ],
  },
  {
    id: 'weird-history',
    name: 'History\'s Weirdest Moments',
    description: 'Fascinating true stories they didn\'t teach you in school',
    emoji: '📜',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    tags: ['history', 'entertainment', 'culture'],
    topics: [
      {
        id: 'wh-1',
        title: 'The Dancing Plague of 1518',
        description: 'When hundreds danced themselves to death',
        order: 1,
        lengthMinutes: 10,
      },
      {
        id: 'wh-2',
        title: 'The Great Emu War',
        description: 'Australia vs. birds (the birds won)',
        order: 2,
        lengthMinutes: 10,
      },
      {
        id: 'wh-3',
        title: 'The Man Who Sold the Eiffel Tower Twice',
        description: 'History\'s greatest con artist',
        order: 3,
        lengthMinutes: 10,
      },
      {
        id: 'wh-4',
        title: 'The Cadaver Synod',
        description: 'When the Pope put a dead body on trial',
        order: 4,
        lengthMinutes: 10,
      },
      {
        id: 'wh-5',
        title: 'The London Beer Flood',
        description: 'A tidal wave of beer kills 8 people',
        order: 5,
        lengthMinutes: 10,
      },
    ],
  },
  // === Advanced Packs ===
  {
    id: 'consciousness-deep-dive',
    name: 'The Mystery of Consciousness',
    description: 'Explore the hardest problem in science',
    emoji: '🔮',
    difficulty: 'advanced',
    estimatedMinutes: 75,
    tags: ['philosophy', 'neuroscience', 'deep'],
    unlockRequirement: { type: 'pack_completed', packId: 'thinking-clearly' },
    topics: [
      {
        id: 'con-1',
        title: 'What Is Consciousness?',
        description: 'The hard problem that stumps scientists',
        order: 1,
        lengthMinutes: 15,
        stylePrompt: 'Take an academic, philosophical approach. Assume the listener has some background in philosophy.',
      },
      {
        id: 'con-2',
        title: 'Do Animals Have Consciousness?',
        description: 'From octopuses to elephants: the spectrum of awareness',
        order: 2,
        lengthMinutes: 15,
      },
      {
        id: 'con-3',
        title: 'Could AI Become Conscious?',
        description: 'The debate between philosophers and computer scientists',
        order: 3,
        lengthMinutes: 15,
      },
      {
        id: 'con-4',
        title: 'The Neuroscience of Self',
        description: 'Where does "you" live in the brain?',
        order: 4,
        lengthMinutes: 15,
      },
      {
        id: 'con-5',
        title: 'Altered States: Dreams, Psychedelics, and Meditation',
        description: 'What unusual states teach us about normal consciousness',
        order: 5,
        lengthMinutes: 15,
      },
    ],
  },
];

// ============ CHALLENGES ============

export function generateDailyChallenges(userId: string, completedEpisodes: number): Challenge[] {
  const challenges: Challenge[] = [];
  const today = new Date();

  // Daily listening challenge
  challenges.push({
    id: `daily-listen-${today.toISOString().split('T')[0]}`,
    name: 'Daily Learner',
    description: 'Listen to at least 10 minutes today',
    emoji: '🎧',
    type: 'daily',
    goal: { type: 'listen_minutes', target: 10 },
    reward: { type: 'xp', value: 50, description: '50 XP' },
    expiresAt: new Date(today.setHours(23, 59, 59, 999)),
  });

  // Progressive challenge based on history
  if (completedEpisodes >= 5) {
    challenges.push({
      id: `daily-create-${today.toISOString().split('T')[0]}`,
      name: 'Creator Mode',
      description: 'Generate a new episode on a topic you\'ve never explored',
      emoji: '✨',
      type: 'daily',
      goal: { type: 'complete_episodes', target: 1 },
      reward: { type: 'xp', value: 100, description: '100 XP' },
      expiresAt: new Date(today.setHours(23, 59, 59, 999)),
    });
  }

  return challenges;
}

export function generateWeeklyChallenges(): Challenge[] {
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  weekEnd.setHours(23, 59, 59, 999);

  return [
    {
      id: `weekly-streak-${Date.now()}`,
      name: 'Consistency Champion',
      description: 'Maintain a 5-day listening streak',
      emoji: '🔥',
      type: 'weekly',
      goal: { type: 'streak_days', target: 5 },
      reward: { type: 'badge', value: 'streak-champion', description: 'Streak Champion badge' },
      expiresAt: weekEnd,
    },
    {
      id: `weekly-pack-${Date.now()}`,
      name: 'Pack Finisher',
      description: 'Complete any topic pack this week',
      emoji: '📚',
      type: 'weekly',
      goal: { type: 'complete_pack', target: 1 },
      reward: { type: 'xp', value: 250, description: '250 XP + Unlock new pack' },
      expiresAt: weekEnd,
    },
    {
      id: `weekly-share-${Date.now()}`,
      name: 'Knowledge Spreader',
      description: 'Share an episode or quote with someone',
      emoji: '🌟',
      type: 'weekly',
      goal: { type: 'share_episode', target: 1 },
      reward: { type: 'xp', value: 75, description: '75 XP' },
      expiresAt: weekEnd,
    },
  ];
}

export function generateAchievements(): Challenge[] {
  return [
    {
      id: 'achievement-first-episode',
      name: 'First Steps',
      description: 'Complete your first episode',
      emoji: '🎉',
      type: 'achievement',
      goal: { type: 'complete_episodes', target: 1 },
      reward: { type: 'badge', value: 'first-steps', description: 'First Steps badge' },
    },
    {
      id: 'achievement-10-episodes',
      name: 'Curious Mind',
      description: 'Complete 10 episodes',
      emoji: '🧠',
      type: 'achievement',
      goal: { type: 'complete_episodes', target: 10 },
      reward: { type: 'narrator_style', value: 'enthusiastic', description: 'Unlock Enthusiastic narrator' },
    },
    {
      id: 'achievement-50-episodes',
      name: 'Knowledge Seeker',
      description: 'Complete 50 episodes',
      emoji: '📖',
      type: 'achievement',
      goal: { type: 'complete_episodes', target: 50 },
      reward: { type: 'topic_pack', value: 'consciousness-deep-dive', description: 'Unlock advanced pack' },
    },
    {
      id: 'achievement-30-day-streak',
      name: 'Unstoppable',
      description: 'Maintain a 30-day streak',
      emoji: '🔥',
      type: 'achievement',
      goal: { type: 'streak_days', target: 30 },
      reward: { type: 'badge', value: 'unstoppable', description: 'Unstoppable badge' },
    },
    {
      id: 'achievement-flashcard-master',
      name: 'Flashcard Master',
      description: 'Create flashcards for 10 episodes',
      emoji: '🃏',
      type: 'achievement',
      goal: { type: 'create_flashcards', target: 10 },
      reward: { type: 'xp', value: 500, description: '500 XP' },
    },
  ];
}

// ============ PERSONALIZED RECOMMENDATIONS ============

export interface UserPreferences {
  interests: string[];
  completedPacks: string[];
  completedTopics: string[];
  averageListenMinutes: number;
}

export function getRecommendedPacks(prefs: UserPreferences): TopicPack[] {
  return TOPIC_PACKS.filter(pack => {
    // Skip completed packs
    if (prefs.completedPacks.includes(pack.id)) return false;

    // Check unlock requirements
    if (pack.unlockRequirement) {
      const { type, value, packId } = pack.unlockRequirement;
      if (type === 'pack_completed' && packId && !prefs.completedPacks.includes(packId)) {
        return false;
      }
      if (type === 'episodes_completed' && value && prefs.completedTopics.length < value) {
        return false;
      }
    }

    // Prioritize packs matching user interests
    const matchingTags = pack.tags.filter(tag => prefs.interests.includes(tag));
    return matchingTags.length > 0 || prefs.interests.length === 0;
  }).sort((a, b) => {
    // Sort by interest match, then difficulty
    const aMatch = a.tags.filter(tag => prefs.interests.includes(tag)).length;
    const bMatch = b.tags.filter(tag => prefs.interests.includes(tag)).length;
    if (bMatch !== aMatch) return bMatch - aMatch;

    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });
}

export function getDailyTopicSuggestion(prefs: UserPreferences): TopicItem | null {
  const recommendedPacks = getRecommendedPacks(prefs);
  if (recommendedPacks.length === 0) return null;

  // Find next uncompleted topic in first recommended pack
  const pack = recommendedPacks[0];
  const nextTopic = pack.topics.find(topic => !prefs.completedTopics.includes(topic.id));

  return nextTopic || null;
}
