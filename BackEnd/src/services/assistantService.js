const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalize = (value, min, max) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
};

const DEFAULT_CONTEXT = {
  displayName: 'Jordan',
  heartRate: 86,
  hrv: 42,
  calendarLoad: 0.82,
  unreadEmails: 47,
  sleepQuality: 0.58,
  stepsToday: 1320,
  lastBreakMinutesAgo: 96,
  sentimentScore: -0.35,
  focusEnergy: 0.42,
  hydration: 0.5,
  meetings: [
    {
      id: 'standup',
      title: 'Team Standup',
      start: new Date().setHours(9, 30, 0, 0),
      durationMinutes: 20,
      category: 'sync',
      priority: 'required',
      location: 'Zoom'
    },
    {
      id: 'client-review',
      title: 'Client Feedback Review',
      start: new Date().setHours(10, 30, 0, 0),
      durationMinutes: 60,
      category: 'deep-work',
      priority: 'critical',
      location: 'Notion'
    },
    {
      id: 'one-on-one',
      title: '1:1 with Maya',
      start: new Date().setHours(13, 0, 0, 0),
      durationMinutes: 30,
      category: 'support',
      priority: 'flexible',
      location: 'Cafe'
    }
  ],
  focusBlocks: [
    {
      id: 'deep-work-block',
      title: 'Deep Work: Strategy Narrative',
      start: new Date().setHours(15, 30, 0, 0),
      durationMinutes: 90,
      mode: 'focus'
    }
  ],
  notifications: {
    pending: 24,
    urgent: 4
  },
  lastNightSleepHours: 5.8
};

const sanitizeContext = (input = {}) => {
  const context = { ...DEFAULT_CONTEXT, ...input };

  if (!Array.isArray(context.meetings)) {
    context.meetings = DEFAULT_CONTEXT.meetings;
  }

  if (!Array.isArray(context.focusBlocks)) {
    context.focusBlocks = DEFAULT_CONTEXT.focusBlocks;
  }

  context.sleepQuality = clamp(context.sleepQuality ?? DEFAULT_CONTEXT.sleepQuality, 0, 1);
  context.calendarLoad = clamp(context.calendarLoad ?? DEFAULT_CONTEXT.calendarLoad, 0, 1);
  context.focusEnergy = clamp(context.focusEnergy ?? DEFAULT_CONTEXT.focusEnergy, 0, 1);
  context.hydration = clamp(context.hydration ?? DEFAULT_CONTEXT.hydration, 0, 1);
  context.sentimentScore = clamp(context.sentimentScore ?? DEFAULT_CONTEXT.sentimentScore, -1, 1);
  context.lastNightSleepHours = clamp(context.lastNightSleepHours ?? DEFAULT_CONTEXT.lastNightSleepHours, 0, 12);
  context.stepsToday = Math.max(context.stepsToday ?? DEFAULT_CONTEXT.stepsToday, 0);
  context.lastBreakMinutesAgo = Math.max(context.lastBreakMinutesAgo ?? DEFAULT_CONTEXT.lastBreakMinutesAgo, 0);
  context.unreadEmails = Math.max(context.unreadEmails ?? DEFAULT_CONTEXT.unreadEmails, 0);
  context.heartRate = Math.max(context.heartRate ?? DEFAULT_CONTEXT.heartRate, 40);
  context.hrv = Math.max(context.hrv ?? DEFAULT_CONTEXT.hrv, 10);

  return context;
};

const buildMetrics = (context) => {
  const heartRateNorm = normalize(context.heartRate, 55, 110);
  const hrvNorm = 1 - normalize(context.hrv, 20, 90);
  const unreadNormalized = normalize(context.unreadEmails, 0, 120);
  const sentimentNorm = normalize(context.sentimentScore, -1, 1);
  const lastBreakNorm = normalize(context.lastBreakMinutesAgo, 0, 150);
  const movementNorm = 1 - normalize(context.stepsToday, 0, 8000);
  const sleepDebt = 1 - context.sleepQuality;
  const hydrationDebt = 1 - (context.hydration ?? 0.6);
  const calendarLoad = clamp(context.calendarLoad, 0, 1);

  const cognitiveLoad = clamp(
    0.4 * calendarLoad +
      0.35 * unreadNormalized +
      0.25 * sentimentNorm,
    0,
    1
  );

  const fatigue = clamp(
    0.45 * sleepDebt +
      0.25 * movementNorm +
      0.2 * lastBreakNorm +
      0.1 * hydrationDebt,
    0,
    1
  );

  const focusReadiness = clamp(1 - (0.55 * cognitiveLoad + 0.45 * fatigue), 0, 1);
  const bufferTime = clamp(1 - calendarLoad, 0, 1);

  return {
    heartRateNorm,
    hrvNorm,
    unreadNormalized,
    sentimentNorm,
    lastBreakNorm,
    movementNorm,
    sleepDebt,
    hydrationDebt,
    calendarLoad,
    cognitiveLoad,
    fatigue,
    focusReadiness,
    bufferTime
  };
};

const evaluateStress = (context, metrics) => {
  const stressScore = clamp(
    0.35 * metrics.heartRateNorm +
      0.2 * metrics.cognitiveLoad +
      0.15 * metrics.fatigue +
      0.15 * (1 - metrics.focusReadiness) +
      0.1 * metrics.sentimentNorm +
      0.05 * metrics.lastBreakNorm,
    0,
    1
  );

  let level = 'steady';
  let label = 'Centered';
  let headline = 'Systems steady and ready to focus';

  if (stressScore >= 0.7) {
    level = 'critical';
    label = 'Critical Strain';
    headline = 'High activation detected — recovery needed before the next push';
  } else if (stressScore >= 0.4) {
    level = 'elevated';
    label = 'Elevated Load';
    headline = 'Cognitive and physiological load trending high — recommend intervention';
  }

  const rationale = [];
  if (metrics.heartRateNorm > 0.6) {
    rationale.push('Heart rate trending above calm baseline');
  }
  if (metrics.cognitiveLoad > 0.6) {
    rationale.push('High cognitive load from meetings and open loops');
  }
  if (metrics.fatigue > 0.6) {
    rationale.push('Recovery debt detected from limited sleep and movement');
  }
  if (metrics.lastBreakNorm > 0.6) {
    rationale.push('Extended time since last break');
  }

  if (rationale.length === 0) {
    rationale.push('All systems within target range');
  }

  return {
    score: stressScore,
    level,
    label,
    headline,
    rationale,
    signals: {
      heartRate: context.heartRate,
      heartRateVariability: context.hrv,
      unreadEmails: context.unreadEmails,
      calendarLoad: context.calendarLoad,
      lastBreakMinutesAgo: context.lastBreakMinutesAgo,
      sleepQuality: context.sleepQuality
    }
  };
};

const buildRecommendations = (context, stress, metrics) => {
  const recommendations = [];

  if (stress.level !== 'steady' || metrics.cognitiveLoad > 0.55) {
    recommendations.push({
      id: 'guided-regulation',
      title: 'Start a guided regulation micro-break',
      description: 'Launch a 3-minute breathing reset and light movement to recover your nervous system.',
      impact: 'High',
      category: 'recovery',
      timeframe: 'Start now'
    });
  }

  if (metrics.bufferTime < 0.3) {
    recommendations.push({
      id: 'protect-focus',
      title: 'Create a focus protection window',
      description: 'Block 60 minutes this afternoon and silence notifications while inbox is auto-triaged.',
      impact: 'High',
      category: 'focus',
      timeframe: 'Today, 3:00 PM'
    });
  }

  if (context.unreadEmails > 25) {
    recommendations.push({
      id: 'inbox-triage',
      title: 'Auto-triage low-urgency messages',
      description: 'Assistant can draft replies and delay non-critical emails until after your focus block.',
      impact: 'Medium',
      category: 'automation',
      timeframe: 'Queued for 4:15 PM'
    });
  }

  if (metrics.fatigue > 0.5 || context.sleepQuality < 0.65) {
    recommendations.push({
      id: 'sleep-priming',
      title: 'Prime recovery for tonight',
      description: 'Wind-down protocol with hydration reminder and light stretching at 9:30 PM.',
      impact: 'Medium',
      category: 'wellbeing',
      timeframe: 'Tonight'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'maintain-flow',
      title: 'Maintain current cadence',
      description: 'All systems are aligned. Continue current focus block with 25-minute check-ins.',
      impact: 'Low',
      category: 'focus',
      timeframe: 'Next 90 minutes'
    });
  }

  return recommendations;
};

const buildAutomations = (context, stress, metrics) => {
  const automations = [];

  if (stress.level === 'critical' || metrics.fatigue > 0.65) {
    automations.push({
      id: 'reschedule-flexible',
      title: 'Rescheduled: 1:1 with Maya',
      detail: 'Moved to tomorrow afternoon to protect recovery window',
      status: 'completed',
      type: 'reschedule'
    });
  }

  if (context.unreadEmails > 30) {
    automations.push({
      id: 'snooze-email',
      title: 'Snoozed 28 low-priority messages',
      detail: 'Assistant will surface them after your focus block concludes',
      status: 'in-progress',
      type: 'delay'
    });
  }

  automations.push({
    id: 'buffer-created',
    title: 'Inserted 15-min decompression buffer',
    detail: 'Scheduled between client review and next meeting at 11:45 AM',
    status: 'completed',
    type: 'buffer'
  });

  return automations;
};

const buildFocusSchedule = (context, metrics, stress) => {
  const now = new Date();

  const upcomingFocusBlock = context.focusBlocks?.[0];
  const nextFocusBlock = upcomingFocusBlock
    ? {
        ...upcomingFocusBlock,
        start: upcomingFocusBlock.start,
        end: upcomingFocusBlock.start + upcomingFocusBlock.durationMinutes * 60000,
        readiness: metrics.focusReadiness
      }
    : null;

  const nextRecoveryBlock = {
    id: 'guided-reset',
    title: 'Guided Walk & Breath Reset',
    start: now.getTime() + 60 * 60 * 1000,
    durationMinutes: stress.level === 'critical' ? 20 : 12,
    focus: stress.level === 'critical' ? 'down-regulate stress response' : 'sustain focus balance'
  };

  return {
    nextFocusBlock,
    nextRecoveryBlock,
    suppressedNotifications: {
      until: nextFocusBlock ? nextFocusBlock.start : now.getTime() + 45 * 60000,
      count: context.notifications?.pending ?? 0
    }
  };
};

const buildTimeline = (context, automations) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const events = (context.meetings || []).map((meeting) => ({
    id: meeting.id,
    timeLabel: formatter.format(new Date(meeting.start)),
    label: meeting.title,
    type: 'meeting',
    status: meeting.priority === 'flexible' ? 'adjustable' : 'locked',
    detail: `${meeting.durationMinutes} min • ${meeting.location}`
  }));

  const automationEvents = automations.map((automation) => ({
    id: `${automation.id}-timeline`,
    timeLabel: 'auto',
    label: automation.title,
    type: 'automation',
    status: automation.status,
    detail: automation.detail
  }));

  return [...events, ...automationEvents];
};

const parseLLMJson = (text) => {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const jsonCandidate = start !== -1 && end !== -1 ? text.slice(start, end + 1) : text;
  try {
    return JSON.parse(jsonCandidate);
  } catch (error) {
    console.error('LLM JSON parse error:', error);
    return null;
  }
};

const callLLMForRecommendations = async (context, stress, metrics) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model,
    temperature: 0.4,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'harmonia_plan',
        schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'title', 'description'],
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  impact: { type: 'string' },
                  category: { type: 'string' },
                  timeframe: { type: 'string' }
                }
              }
            },
            automations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'title', 'detail'],
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  detail: { type: 'string' },
                  status: { type: 'string' },
                  type: { type: 'string' }
                }
              }
            },
            notes: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['recommendations']
        }
      }
    },
    messages: [
      {
        role: 'system',
        content: 'You are Harmonia, an adaptive wellbeing and productivity copilot. You translate biometric and workload signals into actionable interventions, only suggesting items that are supportive, realistic, and explainable.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          context: {
            displayName: context.displayName,
            heartRate: context.heartRate,
            hrv: context.hrv,
            unreadEmails: context.unreadEmails,
            calendarLoad: context.calendarLoad,
            sleepQuality: context.sleepQuality,
            stepsToday: context.stepsToday,
            lastBreakMinutesAgo: context.lastBreakMinutesAgo,
            sentimentScore: context.sentimentScore,
            hydration: context.hydration,
            meetings: context.meetings?.slice(0, 4)
          },
          metrics: {
            cognitiveLoad: metrics.cognitiveLoad,
            fatigue: metrics.fatigue,
            focusReadiness: metrics.focusReadiness,
            bufferTime: metrics.bufferTime
          },
          stress
        })
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content;
  return parseLLMJson(message);
};

const buildAssistantState = async (inputContext = {}) => {
  const context = sanitizeContext(inputContext.context ?? inputContext);
  const metrics = buildMetrics(context);
  const stress = evaluateStress(context, metrics);

  let recommendations = [];
  let automations = [];
  let llmNotes = [];
  let usedLLM = false;

  if (process.env.OPENAI_API_KEY) {
    try {
      const llmResult = await callLLMForRecommendations(context, stress, metrics);
      if (llmResult) {
        if (Array.isArray(llmResult.recommendations)) {
          recommendations = llmResult.recommendations;
        }
        if (Array.isArray(llmResult.automations)) {
          automations = llmResult.automations;
        }
        if (Array.isArray(llmResult.notes)) {
          llmNotes = llmResult.notes;
        }
        usedLLM = true;
      }
    } catch (error) {
      console.error('LLM recommendation generation failed:', error.message || error);
    }
  }

  if (!recommendations.length) {
    recommendations = buildRecommendations(context, stress, metrics);
  }

  if (!automations.length) {
    automations = buildAutomations(context, stress, metrics);
  }

  const focusSchedule = buildFocusSchedule(context, metrics, stress);
  const timeline = buildTimeline(context, automations);

  return {
    timestamp: new Date().toISOString(),
    context,
    stress,
    metrics: {
      cognitiveLoad: metrics.cognitiveLoad,
      fatigue: metrics.fatigue,
      focusReadiness: metrics.focusReadiness,
      bufferTime: metrics.bufferTime
    },
    recommendations,
    automations,
    focusSchedule,
    timeline,
    llm: {
      enabled: Boolean(process.env.OPENAI_API_KEY),
      used: usedLLM,
      notes: llmNotes
    }
  };
};

module.exports = {
  DEFAULT_CONTEXT,
  buildAssistantState
};
