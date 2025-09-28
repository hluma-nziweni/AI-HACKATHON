export type AssistantMeeting = {
  id: string;
  title: string;
  start: number | string;
  durationMinutes: number;
  category?: string;
  priority?: string;
  location?: string;
};

export type AssistantFocusBlock = {
  id: string;
  title: string;
  start: number | string;
  durationMinutes: number;
  mode?: string;
};

export type AssistantContext = {
  displayName?: string;
  heartRate: number;
  hrv: number;
  calendarLoad: number;
  unreadEmails: number;
  sleepQuality: number;
  stepsToday: number;
  lastBreakMinutesAgo: number;
  sentimentScore: number;
  focusEnergy?: number;
  hydration?: number;
  meetings?: AssistantMeeting[];
  focusBlocks?: AssistantFocusBlock[];
  notifications?: {
    pending?: number;
    urgent?: number;
  };
  lastNightSleepHours?: number;
};

export type AssistantStress = {
  score: number;
  level: 'steady' | 'elevated' | 'critical';
  label: string;
  headline: string;
  rationale: string[];
  signals: {
    heartRate: number;
    heartRateVariability: number;
    unreadEmails: number;
    calendarLoad: number;
    lastBreakMinutesAgo: number;
    sleepQuality: number;
  };
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact?: string;
  category?: string;
  timeframe?: string;
};

export type Automation = {
  id: string;
  title: string;
  detail: string;
  status?: string;
  type?: string;
};

export type FocusWindow = {
  id: string;
  title: string;
  start: number;
  end?: number;
  durationMinutes?: number;
  mode?: string;
  readiness?: number;
};

export type FocusSchedule = {
  nextFocusBlock: FocusWindow | null;
  nextRecoveryBlock: {
    id: string;
    title: string;
    start: number;
    durationMinutes: number;
    focus: string;
  };
  suppressedNotifications: {
    until: number;
    count: number;
  };
};

export type TimelineItem = {
  id: string;
  timeLabel: string;
  label: string;
  type: string;
  status: string;
  detail: string;
};

export type AssistantProject = {
  _id: number;
  title: string;
  description?: string;
  research_area: string;
  start_date: string;
  end_date: string;
  institution?: string | null;
  status?: string;
  role?: string;
  priority?: string;
};

export type AssistantTasksBucketItem = {
  id: string;
  title: string;
  detail?: string;
  suggestion?: string;
  action?: string;
  type?: string;
  urgency?: string;
};

export type AssistantTasksPlan = {
  today: AssistantTasksBucketItem[];
  tomorrow: AssistantTasksBucketItem[];
  upcoming: AssistantTasksBucketItem[];
};

export type AssistantInsightsPlan = {
  flowHistory: { time: string; focus: number }[];
  loadTrend: { day: string; load: number }[];
  highlights: string[];
};

export type AssistantIntegration = {
  id: string;
  service: string;
  description: string;
  connected: boolean;
  premium: boolean;
  category?: string;
};

export type AssistantPlan = {
  schedule: {
    projects: AssistantProject[];
    highlights?: string[];
    timeline?: TimelineItem[];
  };
  tasks: AssistantTasksPlan;
  insights: AssistantInsightsPlan;
  integrations: AssistantIntegration[];
};

export type AssistantScenario = {
  id: string;
  label: string;
  description: string;
};

export type AssistantMetrics = {
  cognitiveLoad: number;
  fatigue: number;
  focusReadiness: number;
  bufferTime: number;
};

export type AssistantLLM = {
  enabled: boolean;
  used: boolean;
  notes: string[];
};

export type AssistantState = {
  timestamp: string;
  context: AssistantContext;
  stress: AssistantStress;
  metrics: AssistantMetrics;
  recommendations: Recommendation[];
  automations: Automation[];
  focusSchedule: FocusSchedule;
  timeline: TimelineItem[];
  plan: AssistantPlan;
  llm: AssistantLLM;
};
