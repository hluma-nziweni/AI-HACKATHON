import React, { useMemo, useState } from 'react';
import { Calendar, Clock, TrendingUp, MessageCircle, MoreHorizontal, ChevronDown, Zap, Brain, AlertCircle, Mail, FileText, MessageSquare, HeartPulse } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './Tasks.css';
import { useAssistantData } from '../../context/AssistantContext';
import { AssistantTasksPlan, AssistantInsightsPlan } from '../../types/assistant';

const SmartTaskList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');
  const { data, loading } = useAssistantData();

  const tasksPlan: AssistantTasksPlan | undefined = data?.plan?.tasks;
  const insightsPlan: AssistantInsightsPlan | undefined = data?.plan?.insights;

  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    focus: Zap,
    wellbeing: HeartPulse,
    automation: TrendingUp,
    email: Mail,
    meeting: Calendar,
    communication: MessageCircle,
    alert: AlertCircle,
    document: FileText,
    summary: MessageSquare,
    default: Brain
  };

  const defaultFlowData = useMemo(
    () => [
      { time: '07:00', focus: 20 },
      { time: '09:00', focus: 32 },
      { time: '11:00', focus: 28 },
      { time: '15:00', focus: 20 },
      { time: '21:00', focus: 18 }
    ],
    []
  );

  const defaultLoadData = useMemo(
    () => [
      { day: 'Mon', load: 20 },
      { day: 'Tue', load: 45 },
      { day: 'Wed', load: 30 },
      { day: 'Thu', load: 25 },
      { day: 'Fri', load: 22 },
      { day: 'Sat', load: 18 }
    ],
    []
  );

  const flowData = useMemo(() => {
    const history = insightsPlan?.flowHistory;
    if (!history || history.length === 0) {
      return defaultFlowData;
    }
    return history.map((point) => ({
      time: point.time,
      focus: Number(point.focus) || 0
    }));
  }, [insightsPlan?.flowHistory, defaultFlowData]);

  const loadData = useMemo(() => {
    const trend = insightsPlan?.loadTrend;
    if (!trend || trend.length === 0) {
      return defaultLoadData;
    }
    return trend.map((point) => ({
      day: point.day,
      load: Number(point.load) || 0
    }));
  }, [insightsPlan?.loadTrend, defaultLoadData]);

  const highlights = insightsPlan?.highlights ?? [];

  const tasksByTab = useMemo(() => {
    const mapBucket = (bucket: AssistantTasksPlan[keyof AssistantTasksPlan] | undefined) =>
      (bucket ?? []).map((task, index) => {
        const IconComponent = iconMap[task.type || 'default'] || iconMap.default;
        return {
          id: task.id || `${task.type || 'task'}-${index}`,
          IconComponent,
          text: task.title,
          detail: task.detail,
          suggestion: task.suggestion,
          actionText: task.action,
          urgency: task.urgency || 'medium'
        };
      });

    return {
      today: mapBucket(tasksPlan?.today),
      tomorrow: mapBucket(tasksPlan?.tomorrow),
      upcoming: mapBucket(tasksPlan?.upcoming)
    };
  }, [tasksPlan, iconMap]);

  const currentTasks = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return tasksByTab.today;
      case 'tomorrow':
        return tasksByTab.tomorrow;
      case 'upcoming':
        return tasksByTab.upcoming;
      default:
        return tasksByTab.today;
    }
  }, [activeTab, tasksByTab]);

  return (
    <div className="smart-task-list">
      <div className="dashboard-layout">

        {/* Left Box - Smart Task List */}
        <div className="task-box">
          <div className="box-header">
            <Zap size={24} className="header-icon" />
            <h1>Smart Task List</h1>
          </div>
          
          <div className="time-navigation">
            {['today','tomorrow','upcoming'].map(tab => (
              <button 
                key={tab}
                className={`time-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="divider"></div>
          
          <div className="task-content">
            {loading && !data && (
              <div className="task-loading">Preparing your adaptive task list…</div>
            )}
            {!loading && currentTasks.length === 0 && (
              <div className="task-empty">
                <Brain size={20} />
                <p>No tasks queued for this window. Harmonia will surface actions as signals change.</p>
              </div>
            )}
            {currentTasks.map((task) => {
              const Icon = task.IconComponent;
              return (
                <div key={task.id} className={`task-item urgency-${task.urgency}`}>
                  <div className="task-left">
                    <Icon size={18} className="task-icon" />
                    <div className="task-text">
                      <span>{task.text}</span>
                      {task.detail && <span className="task-detail">{task.detail}</span>}
                      {task.suggestion && <div className="ai-suggestion">{task.suggestion}</div>}
                    </div>
                  </div>
                  <div className="task-right">
                    {task.actionText && (
                      <button className="defer-button">
                        {task.actionText}
                        <ChevronDown size={16} />
                      </button>
                    )}
                    <MoreHorizontal size={16} className="more-icon" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Box - Productivity Insights */}
        <div className="insights-box">
          <div className="box-header">
            <Brain size={24} className="header-icon" />
            <h1>Productivity Insights</h1>
          </div>
          
          {/* Flow State History */}
          <div className="insight-section">
            <div className="section-title">
              <Clock size={20} />
              <span>Flow State History</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={flowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="divider"></div>
          
          {/* Cognitive Load Trends */}
          <div className="insight-section">
            <div className="section-title">
              <TrendingUp size={20} />
              <span>Cognitive Load Trends</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={loadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="load" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            {highlights.length > 0 && (
              <div className="insight-note">
                <MessageCircle size={16} />
                <span>{highlights[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartTaskList;
