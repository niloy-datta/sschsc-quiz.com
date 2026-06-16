export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0 to 3
  explanation: string;
  subject: string;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  accuracy: string;
  avatar: string;
  isCurrentUser?: boolean;
}

export interface SubjectBattle {
  id: string;
  name: string;
  subtitle: string;
  chaptersCount: number;
  battlesActive: number;
  xpReward: number;
  icon: string;
  color: "purple" | "cyan" | "gold" | "green";
}

export interface Mission {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
}

export interface WeaknessItem {
  subject: string;
  chapter: string;
  accuracy: number; // percentage
  status: "critical" | "warning" | "stable";
}

// User Stats HUD Dashboard
export const userStats = {
  name: "তাহমিদ রহমান",
  rank: 18,
  totalUsers: 14520,
  xp: 4850,
  streak: 7,
  winRate: "৭8%",
  battlesPlayed: 142,
  level: 12,
  nextLevelXp: 6000,
  levelProgress: 75, // percentage
};

// 5-Question Level Detector MCQ (30-second challenge)
export const levelDetectorQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "একটি বস্তুকে খাড়া ওপরের দিকে ১০০ m/s বেগে নিক্ষেপ করলে এটি সর্বোচ্চ কত উচ্চতায় উঠবে? (g = 9.8 m/s²)",
    options: [
      "৫১০.২ মিটার",
      "২৫৫.১ মিটার",
      "৯৮০.০ মিটার",
      "৫০.১ মিটার"
    ],
    correctAnswer: 0, // 510.2m (u^2 / 2g = 10000 / 19.6 = 510.2)
    explanation: "সর্বোচ্চ উচ্চতার সূত্র: H = u² / 2g। এখানে u = ১০০ m/s এবং g = ৯.৮ m/s²। অতএব H = (১০০)² / (২ × ৯.৮) = ১০০০০ / ১৯.৬ = ৫১০.২ মিটার।",
    subject: "পদার্থবিজ্ঞান"
  },
  {
    id: "q2",
    question: "নিচের কোনটির তড়িৎ ঋণাত্মকতা সবচেয়ে বেশি?",
    options: [
      "ক্লোরিন (Cl)",
      "ফ্লোরিন (F)",
      "অক্সিজেন (O)",
      "নাইট্রোজেন (N)"
    ],
    correctAnswer: 1, // Fluorine
    explanation: "পর্যায় সারণীর সমস্ত মৌলের মধ্যে ফ্লোরিনের (F) তড়িৎ ঋণাত্মকতা সবচেয়ে বেশি, যার মান ৪.০। ক্লোরিনের ৩.০ এবং অক্সিজেনের ৩.৫।",
    subject: "রসায়ন"
  },
  {
    id: "q3",
    question: "পাকস্থলীতে প্রোটিন পরিপাককারী সক্রিয় এনজাইম কোনটি?",
    options: [
      "পেপসিন",
      "ট্রিপসিন",
      "অ্যামাইলেজ",
      "লাইপেজ"
    ],
    correctAnswer: 0, // Pepsin
    explanation: "পাকস্থলীতে হাইড্রোক্লোরিক অ্যাসিডের উপস্থিতিতে নিষ্ক্রিয় পেপসিনোজেন সক্রিয় পেপসিনে পরিণত হয়, যা প্রোটিনকে প্রোটিওজ ও পেপটনে রূপান্তর করে।",
    subject: "জীববিজ্ঞান"
  },
  {
    id: "q4",
    question: "যদি y = ln(x) হয়, তবে d²/dx² (y) এর মান কত?",
    options: [
      "1/x",
      "-1/x²",
      "e^x",
      "-1/x"
    ],
    correctAnswer: 1, // -1/x^2
    explanation: "y = ln(x) কে প্রথমবার অন্তরীকরণ করলে পাওয়া যায় dy/dx = ১/x। দ্বিতীয়বার অন্তরীকরণ করলে d²/dx² = d/dx (x⁻¹) = -১ · x⁻² = -১/x²।",
    subject: "উচ্চতর গণিত"
  },
  {
    id: "q5",
    question: "একটি সমকোণী ত্রিভুজের অতিভুজ ৫ সে.মি. এবং ভূমি ৩ সে.মি. হলে এর ক্ষেত্রফল কত বর্গ সে.মি.?",
    options: [
      "১২",
      "৬",
      "১৫",
      "৭.৫"
    ],
    correctAnswer: 1, // 6
    explanation: "পিথাগোরাসের উপপাদ্য অনুযায়ী, লম্ব = √(অতিভুজ² - ভূমি²) = √(৫² - ৩²) = √(২৫ - ৯) = √১৬ = ৪ সে.মি.। সমকোণী ত্রিভুজের ক্ষেত্রফল = ১/২ × ভূমি × লম্ব = ১/২ × ৩ × ৪ = ৬ বর্গ সে.মি.।",
    subject: "উচ্চতর গণিত"
  }
];

// Leaderboard stand-ups
export const leaderboardUsers: LeaderboardUser[] = [
  {
    rank: 1,
    name: "ফাহিম মুনতাসির",
    points: 12450,
    accuracy: "৯৮%",
    avatar: "👑"
  },
  {
    rank: 2,
    name: "সাদিয়া ইসলাম",
    points: 11820,
    accuracy: "৯৬%",
    avatar: "⚡"
  },
  {
    rank: 3,
    name: "আরিয়ান আহমেদ",
    points: 11340,
    accuracy: "৯৫%",
    avatar: "🔥"
  },
  {
    rank: 4,
    name: "নুসরাত জাহান",
    points: 9800,
    accuracy: "৯১%",
    avatar: "🌌"
  },
  {
    rank: 5,
    name: "রিফাত আল হাসান",
    points: 9420,
    accuracy: "৯০%",
    avatar: "🛡️"
  },
  {
    rank: 6,
    name: "মায়মুনা আক্তার",
    points: 8900,
    accuracy: "৮৯%",
    avatar: "🧬"
  },
  {
    rank: 18,
    name: "তাহমিদ রহমান (আপনি)",
    points: 4850,
    accuracy: "৮৭%",
    avatar: "🚀",
    isCurrentUser: true
  }
];

// Subject Arena Levels
export const subjectBattles: SubjectBattle[] = [
  {
    id: "physics",
    name: "পদার্থবিজ্ঞান",
    subtitle: "বলবিদ্যা ও আধুনিক তড়িৎ শক্তি",
    chaptersCount: 14,
    battlesActive: 1540,
    xpReward: 500,
    icon: "⚛️",
    color: "purple"
  },
  {
    id: "chemistry",
    name: "রসায়নবিজ্ঞান",
    subtitle: "জৈব যৌগ ও রাসায়নিক বিক্রিয়া",
    chaptersCount: 12,
    battlesActive: 1210,
    xpReward: 500,
    icon: "🧪",
    color: "cyan"
  },
  {
    id: "biology",
    name: "জীববিজ্ঞান",
    subtitle: "কোষ বিভাজন ও জিনতত্ত্ব",
    chaptersCount: 24,
    battlesActive: 1840,
    xpReward: 600,
    icon: "🧬",
    color: "green"
  },
  {
    id: "math",
    name: "উচ্চতর গণিত",
    subtitle: "ক্যালকুলাস ও ত্রিকোণমিতি যুদ্ধ",
    chaptersCount: 16,
    battlesActive: 950,
    xpReward: 600,
    icon: "📐",
    color: "gold"
  }
];

// Daily Streak Mission
export const dailyMissions: Mission[] = [
  {
    id: "m1",
    title: "যেকোনো বিষয়ে ৩টি চ্যাপ্টার কুইজ সম্পন্ন করো",
    xp: 150,
    completed: true
  },
  {
    id: "m2",
    title: "আজকের লাইভ ব্যাটেলে অংশ নিয়ে ১টি ম্যাচ জয় করো",
    xp: 250,
    completed: false
  },
  {
    id: "m3",
    title: "পদার্থবিজ্ঞানের 'বলবিদ্যা' চ্যাপ্টারের ভুল প্রশ্নের রিভিউ করো",
    xp: 100,
    completed: false
  }
];

// Weakness Analysis Heatmap Report
export const weaknessReports: WeaknessItem[] = [
  {
    subject: "পদার্থবিজ্ঞান",
    chapter: "কাজ, শক্তি ও ক্ষমতা",
    accuracy: 42,
    status: "critical"
  },
  {
    subject: "রসায়ন",
    chapter: "জৈব রসায়ন",
    accuracy: 58,
    status: "warning"
  },
  {
    subject: "উচ্চতর গণিত",
    chapter: "ত্রিকোণমিতি",
    accuracy: 65,
    status: "warning"
  },
  {
    subject: "জীববিজ্ঞান",
    chapter: "কোষ বিভাজন",
    accuracy: 88,
    status: "stable"
  }
];

// SSC/HSC Selection Paths
export const educationPaths = [
  {
    id: "ssc",
    name: "SSC বিজ্ঞান যুদ্ধঘর",
    tag: "শ্রেণী: ৯ম-১০ম",
    description: "পদার্থ, রসায়ন, জীববিজ্ঞান ও গণিতের বোর্ড প্রশ্ন ও অধ্যায়ভিত্তিক রিয়েল-টাইম লাইভ কুইজ ব্যাটল।",
    badge: "এসএসসি ২০২৬/২০২৭",
    accent: "purple"
  },
  {
    id: "hsc",
    name: "HSC বিজ্ঞান যুদ্ধঘর",
    tag: "শ্রেণী: ১১শ-১২শ",
    description: "বিশ্ববিদ্যালয় ভর্তি পরীক্ষার ব্যাসিক ও এইচএসসি সৃজনশীল MCQ এর দ্রুত সমাধান কৌশল ও মক টেস্ট।",
    badge: "এইচএসসি ২০২৫/২০২৬",
    accent: "cyan"
  }
];
