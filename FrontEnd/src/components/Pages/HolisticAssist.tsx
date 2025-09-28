import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Activity,
  AlertCircle,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Heart,
  Mail,
  PauseCircle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './HolisticAssist.css';

import { useAssistantData } from '../../context/AssistantContext';
import { AssistantState } from '../../types/assistant';

type ContextForm = {
  heartRate: number;
  hrv: number;
  calendarLoad: number;
  unreadEmails: number;
  sleepQuality: number;
  stepsToday: number;
  lastBreakMinutesAgo: number;
  sentimentScore: number;
  hydration: number;
};

const defaultForm: ContextForm = {
  heartRate: 80,
  hrv: 50,
  calendarLoad: 0.75,
  unreadEmails: 30,
  sleepQuality: 0.7,
  stepsToday: 2500,
  lastBreakMinutesAgo: 60,
  sentimentScore: -0.1,
  hydration: 0.6
};

type Toast = {
  message: string;
  type: 'success' | 'error' | 'info';
};

const HolisticAssistant: React.FC = () => {
  const {
    data: assistantState,
    loading: summaryLoading,
    error: summaryError,
    refresh,
    analyze,
    scenarios,
    runScenario
  } = useAssistantData();
  const [form, setForm] = useState<ContextForm>(defaultForm);
  const [analyzing, setAnalyzing] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formInitialised, setFormInitialised] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showToast, setShowToast] = useState(false);
  const pendingToastRef = useRef<{ type: Toast['type']; message: string } | null>(null);
  const prevStateRef = useRef<AssistantState | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const toPercent = (value: number | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 0;
    return Math.round(value * 100);
  };

  const formatTime = (value: number | string | undefined) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  useEffect(() => {
    const stateToast = (location.state as { toast?: Toast })?.toast;
    if (stateToast) {
      setToast(stateToast);
      setShowToast(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (summaryError) {
      setToast({ type: 'error', message: summaryError });
      setShowToast(true);
      setError(summaryError);
    }
  }, [summaryError]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    if (assistantState && !formInitialised) {
      const context = assistantState.context;
      setForm({
        heartRate: Math.round(context.heartRate ?? defaultForm.heartRate),
        hrv: Math.round(context.hrv ?? defaultForm.hrv),
        calendarLoad: context.calendarLoad ?? defaultForm.calendarLoad,
        unreadEmails: context.unreadEmails ?? defaultForm.unreadEmails,
        sleepQuality: context.sleepQuality ?? defaultForm.sleepQuality,
        stepsToday: context.stepsToday ?? defaultForm.stepsToday,
        lastBreakMinutesAgo: context.lastBreakMinutesAgo ?? defaultForm.lastBreakMinutesAgo,
        sentimentScore: context.sentimentScore ?? defaultForm.sentimentScore,
        hydration: context.hydration ?? defaultForm.hydration
      });
      setFormInitialised(true);
    }
  }, [assistantState, formInitialised]);

  useEffect(() => {
    if (!assistantState) {
      return;
    }

    const prev = prevStateRef.current;
    prevStateRef.current = assistantState;

    if (!prev) {
      return;
    }

    const diffMessages: string[] = [];

    if (assistantState.stress.level !== prev.stress.level) {
      diffMessages.push(
        `Stress level now ${assistantState.stress.label} (${Math.round((assistantState.stress.score || 0) * 100)}/100)`
      );
    }

    type MetricKey = 'cognitiveLoad' | 'fatigue' | 'focusReadiness' | 'bufferTime';
    const metricLabels: Record<MetricKey, string> = {
      cognitiveLoad: 'Cognitive load',
      fatigue: 'Fatigue',
      focusReadiness: 'Focus readiness',
      bufferTime: 'Buffer time'
    };

    const metricDiffs = (Object.keys(metricLabels) as MetricKey[])
      .map((key) => {
        const current = assistantState.metrics?.[key];
        const previous = prev.metrics?.[key];
        if (current === undefined || previous === undefined) {
          return null;
        }
        const delta = current - previous;
        return {
          key,
          label: metricLabels[key],
          value: current,
          delta
        };
      })
      .filter((item): item is { key: MetricKey; label: string; value: number; delta: number } => Boolean(item))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const significantDiffs = metricDiffs.filter((item) => Math.abs(item.delta) >= 0.07);

    if (significantDiffs.length > 0) {
      const topMetric = significantDiffs[0];
      const direction = topMetric.delta > 0 ? 'up' : 'down';
      diffMessages.push(
        `${topMetric.label} ${direction} to ${Math.round(topMetric.value * 100)}%`
      );
    }

    const newAutomation = assistantState.automations.find(
      (automation) => !prev.automations.some((prevAutomation) => prevAutomation.id === automation.id)
    );

    if (newAutomation) {
      diffMessages.push(`Automation triggered: ${newAutomation.title}`);
    }

    const pending = pendingToastRef.current;
    pendingToastRef.current = null;

    let message = pending?.message ?? '';
    let toastType: Toast['type'] = pending?.type ?? 'info';

    if (diffMessages.length > 0) {
      const summary = diffMessages.slice(0, 2).join(' • ');
      message = message ? `${message} • ${summary}` : summary;
    }

    if (!message) {
      return;
    }

    setToast({ type: toastType, message });
    setShowToast(true);
  }, [assistantState]);

  const handleRangeChange = (key: keyof ContextForm, transform?: (value: number) => number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number(event.target.value);
    const nextValue = transform ? transform(rawValue) : rawValue;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

const handleAnalyze = async () => {
  setAnalyzing(true);
  try {
    await analyze({ context: form });
    setFormInitialised(false);
    setError(null);
    pendingToastRef.current = { type: 'success', message: 'Adaptive plan refreshed.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    setToast({ type: 'error', message: message || 'Unable to generate recommendations' });
    setShowToast(true);
  } finally {
    setAnalyzing(false);
  }
};

const handleScenarioRun = async (key: string) => {
  const scenarioMeta = scenarios.find((scenario) => scenario.id === key);
  setScenarioLoading(key);
  try {
    await runScenario(key);
    setFormInitialised(false);
    setError(null);
    pendingToastRef.current = {
      type: 'success',
      message: scenarioMeta ? `Scenario “${scenarioMeta.label}” loaded.` : 'Scenario loaded.'
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load scenario';
    setError(message);
    setToast({ type: 'error', message });
    setShowToast(true);
  } finally {
    setScenarioLoading(null);
  }
};

const handleResync = async () => {
  pendingToastRef.current = { type: 'info', message: 'Live signals resynced.' };
  try {
    await refresh();
    setFormInitialised(false);
    setError(null);
  } catch (err) {
    pendingToastRef.current = null;
  }
};

  const stressScore = assistantState?.stress?.score ?? 0;
  const stressPercent = useMemo(() => toPercent(stressScore), [stressScore]);
  const levelTag = assistantState?.stress?.level ?? 'steady';

  const metrics = assistantState?.metrics;
  const recommendations = assistantState?.recommendations ?? [];
  const automations = assistantState?.automations ?? [];
  const timeline = assistantState?.timeline ?? [];
  const focusSchedule = assistantState?.focusSchedule;
  const stressSignals = assistantState?.stress?.signals;
  const stressRationale = assistantState?.stress?.rationale ?? [];
  const llmInfo = assistantState?.llm;
  const hasRecommendations = recommendations.length > 0;
  const hasTimeline = timeline.length > 0;

  return (
    <div className="holistic-assistant">
      <div className="cyberpunk-grid" />

      {toast && showToast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-pulse" />
          <span>{toast.message}</span>
        </div>
      )}

      <header className="assistant-header">
        <div className="header-content">
          <Brain className="header-icon" size={32} />
          <div>
            <h1>Harmonia Holistic Assistant</h1>
            <p className="header-subtitle">
              {assistantState?.stress?.headline ?? 'Calibrating your day around wellbeing and output'}
            </p>
          </div>
          <div className={`status-indicator ${levelTag}`}>
            <div className="pulse-dot" />
            <span>{assistantState?.stress?.label ?? 'Calibrating'}</span>
          </div>
          {llmInfo?.enabled && (
            <div className={`llm-badge ${llmInfo.used ? 'active' : 'fallback'}`}>
              <Sparkles size={14} />
              <span>{llmInfo.used ? 'LLM enriched plan' : 'Heuristic fallback'}</span>
            </div>
          )}
        </div>
      </header>

      <section className="assistant-controls">
        <div className="control-card">
          <div className="control-card-header">
            <Sparkles size={20} />
            <h2>Live Context Tuning</h2>
          </div>
          <p className="control-description">
            Adjust the inputs below to simulate your current load. Harmonia recomputes stress, cognitive load, and interventions instantly.
          </p>
          {scenarios.length > 0 && (
            <div className="demo-scenarios">
              <span className="demo-label">Demo scenarios:</span>
              <div className="demo-chips">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    className={`demo-chip ${scenarioLoading === scenario.id ? 'loading' : ''}`}
                    onClick={() => handleScenarioRun(scenario.id)}
                    disabled={summaryLoading || analyzing || scenarioLoading === scenario.id}
                    title={scenario.description}
                  >
                    {scenarioLoading === scenario.id ? 'Loading…' : scenario.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="control-grid">
            <div className="control-field">
              <label>Heart Rate</label>
              <span className="control-value">{form.heartRate} bpm</span>
              <input
                type="range"
                min={55}
                max={110}
                value={form.heartRate}
                onChange={handleRangeChange('heartRate')}
              />
            </div>
            <div className="control-field">
              <label>HRV</label>
              <span className="control-value">{form.hrv} ms</span>
              <input
                type="range"
                min={20}
                max={110}
                value={form.hrv}
                onChange={handleRangeChange('hrv')}
              />
            </div>
            <div className="control-field">
              <label>Calendar Load</label>
              <span className="control-value">{toPercent(form.calendarLoad)}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(form.calendarLoad * 100)}
                onChange={handleRangeChange('calendarLoad', (value) => value / 100)}
              />
            </div>
            <div className="control-field">
              <label>Unread Messages</label>
              <span className="control-value">{form.unreadEmails}</span>
              <input
                type="range"
                min={0}
                max={120}
                value={form.unreadEmails}
                onChange={handleRangeChange('unreadEmails')}
              />
            </div>
            <div className="control-field">
              <label>Sleep Quality</label>
              <span className="control-value">{toPercent(form.sleepQuality)}%</span>
              <input
                type="range"
                min={40}
                max={100}
                value={Math.round(form.sleepQuality * 100)}
                onChange={handleRangeChange('sleepQuality', (value) => value / 100)}
              />
            </div>
            <div className="control-field">
              <label>Steps Today</label>
              <span className="control-value">{form.stepsToday}</span>
              <input
                type="range"
                min={0}
                max={8000}
                step={100}
                value={form.stepsToday}
                onChange={handleRangeChange('stepsToday')}
              />
            </div>
            <div className="control-field">
              <label>Minutes Since Break</label>
              <span className="control-value">{form.lastBreakMinutesAgo}</span>
              <input
                type="range"
                min={0}
                max={150}
                value={form.lastBreakMinutesAgo}
                onChange={handleRangeChange('lastBreakMinutesAgo')}
              />
            </div>
            <div className="control-field">
              <label>Mood Signal</label>
              <span className="control-value">{Math.round(form.sentimentScore * 100) / 100}</span>
              <input
                type="range"
                min={-100}
                max={100}
                value={Math.round(form.sentimentScore * 100)}
                onChange={handleRangeChange('sentimentScore', (value) => value / 100)}
              />
            </div>
            <div className="control-field">
              <label>Hydration</label>
              <span className="control-value">{toPercent(form.hydration)}%</span>
              <input
                type="range"
                min={30}
                max={100}
                value={Math.round(form.hydration * 100)}
                onChange={handleRangeChange('hydration', (value) => value / 100)}
              />
            </div>
          </div>
          <div className="control-actions">
            <button className="cyber-button" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'Synthesising plan…' : 'Run Adaptive Plan'}
            </button>
            <button
              className="cyber-button ghost"
              onClick={handleResync}
              disabled={summaryLoading}
            >
              Reset to live feed
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="status-card">
          <div className="status-header">
            <Heart size={22} />
            <h3>Stress Synthesis</h3>
          </div>
            <div className={`stress-indicator ${levelTag}`}>
              <div className="stress-score">
                <span className="score-value">{stressPercent}</span>
                <span className="score-unit">/100</span>
              </div>
              <div className="stress-bar">
                <div className="stress-bar-fill" style={{ width: `${stressPercent}%` }} />
              </div>
              <span className="stress-label">{assistantState?.stress?.label ?? 'Calibrating'}</span>
            </div>
            <ul className="status-signals">
              <li>
                <Activity size={16} /> Heart rate {stressSignals?.heartRate ?? form.heartRate} bpm
              </li>
              <li>
                <AlertCircle size={16} /> Break overdue by {stressSignals?.lastBreakMinutesAgo ?? form.lastBreakMinutesAgo} min
              </li>
              <li>
                <Mail size={16} /> {stressSignals?.unreadEmails ?? form.unreadEmails} messages waiting
              </li>
            </ul>
          <div className="status-rationale">
            {stressRationale.map((item) => (
              <span key={item}>{item}</span>
            ))}
            {!stressRationale.length && (
              <span>We are monitoring your signals — all systems look centred.</span>
            )}
          </div>
          {llmInfo?.notes?.length ? (
            <div className="llm-notes">
              {llmInfo.notes.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {summaryLoading ? (
        <div className="loading-state">
          <PauseCircle size={24} />
          <span>Syncing with calendar, inbox, and wearable streams…</span>
        </div>
      ) : (
        <div className="dashboard-grid">
          <div className="cyber-card priorities-column">
            <div className="card-header">
              <Zap className="card-icon" size={24} />
              <h2>Adaptive Schedule</h2>
              <div className="cyber-border" />
            </div>
            <div className="card-content">
              <ul className="priorities-list">
                {focusSchedule?.nextFocusBlock && (
                  <li className="priority-item">
                    <div className="priority-content">
                      <CalendarIcon className="priority-icon" size={18} />
                      <div>
                        <span className="priority-text">{focusSchedule.nextFocusBlock.title}</span>
                        <div className="priority-meta">
                          {formatTime(focusSchedule.nextFocusBlock.start)} • readiness {toPercent(focusSchedule.nextFocusBlock.readiness)}%
                        </div>
                      </div>
                    </div>
                    <span className="cyber-badge">Focus protected</span>
                  </li>
                )}
                {automations.map((automation) => (
                  <li key={automation.id} className="priority-item">
                    <div className="priority-content">
                      <Sparkles className="priority-icon" size={18} />
                      <span className="priority-text">{automation.title}</span>
                    </div>
                    <div className="ai-suggestion">{automation.detail}</div>
                  </li>
                ))}
                {!focusSchedule?.nextFocusBlock && !automations.length && (
                  <li className="priority-item empty-state">
                    <div className="priority-content">
                      <Sparkles className="priority-icon" size={18} />
                      <div>
                        <span className="priority-text">Nothing needs adjusting right now</span>
                        <div className="priority-meta">We will surface automations the moment your workload shifts.</div>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div className="card-footer">
              <span className="footer-text">{automations.length} automations active</span>
            </div>
          </div>

          <div className="cyber-card health-column">
            <div className="card-header">
              <Heart className="card-icon" size={24} />
              <h2>State of Body & Mind</h2>
              <div className="cyber-border" />
            </div>
            <div className="card-content">
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-label">Cognitive Load</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${toPercent(metrics?.cognitiveLoad)}%` }} />
                  </div>
                  <span className="metric-value">{toPercent(metrics?.cognitiveLoad)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Fatigue</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${toPercent(metrics?.fatigue)}%` }} />
                  </div>
                  <span className="metric-value">{toPercent(metrics?.fatigue)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Focus Readiness</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${toPercent(metrics?.focusReadiness)}%` }} />
                  </div>
                  <span className="metric-value">{toPercent(metrics?.focusReadiness)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Buffer Time</span>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${toPercent(metrics?.bufferTime)}%` }} />
                  </div>
                  <span className="metric-value">{toPercent(metrics?.bufferTime)}%</span>
                </div>
              </div>
              <div className="recovery-block">
                <Clock size={18} />
                <div>
                  <span className="recovery-title">Next recovery block</span>
                  <span className="recovery-detail">
                    {formatTime(focusSchedule?.nextRecoveryBlock.start)} • {focusSchedule?.nextRecoveryBlock.durationMinutes} min reset
                  </span>
                </div>
              </div>
              <div className="suppressed-info">
                <Mail size={16} /> Notifications muted until {formatTime(focusSchedule?.suppressedNotifications.until)} ({focusSchedule?.suppressedNotifications.count} held)
              </div>
            </div>
            <div className="card-footer">
              <span className="footer-text">Synced {new Date(assistantState?.timestamp ?? Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="cyber-card suggestions-column">
            <div className="card-header">
              <Brain className="card-icon" size={24} />
              <h2>Recommended Interventions</h2>
              <div className="cyber-border" />
            </div>
            <div className="card-content">
              {hasRecommendations ? (
                <ul className="suggestions-list">
                  {recommendations.map((rec) => (
                    <li key={rec.id} className="suggestion-item">
                      <div className="suggestion-content">
                        <CheckCircle className="suggestion-icon" size={18} />
                        <div className="suggestion-text">
                          <span className="suggestion-main">{rec.title}</span>
                          <span className="suggestion-detail">{rec.description}</span>
                        </div>
                      </div>
                      <div className="suggestion-meta">
                        <span>{rec.impact} impact</span>
                        <span>{rec.timeframe}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-panel">
                  <CheckCircle size={18} />
                  <p>All caught up. Keep listening to your energy and Harmonia will nudge you if anything changes.</p>
                </div>
              )}
            </div>
            <div className="card-footer">
              <span className="footer-text">Assistant keeps adapting as signals change</span>
            </div>
          </div>
        </div>
      )}

      {!summaryLoading && (
        <section className="timeline-section">
          <div className="timeline-header">
            <CalendarIcon size={20} />
            <h3>What Harmonia is orchestrating today</h3>
          </div>
          {hasTimeline ? (
            <ul className="timeline-list">
              {timeline.map((item) => (
                <li key={item.id} className={`timeline-item ${item.type}`}>
                  <span className="timeline-time">{item.timeLabel}</span>
                  <div className="timeline-content">
                    <span className="timeline-label">{item.label}</span>
                    <span className="timeline-detail">{item.detail}</span>
                  </div>
                  <span className={`timeline-status ${item.status}`}>{item.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-panel muted">
              <CalendarIcon size={20} />
              <p>Your day is wide open. Drop in a focus session or request a wellbeing break when you need it.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default HolisticAssistant;
