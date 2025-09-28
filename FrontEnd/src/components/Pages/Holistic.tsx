import React, { useEffect, useMemo, useState } from 'react';
import { Brain, Heart, Zap, Clock, Calendar, Mail, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import './Holistic.css';
import { useAssistantData } from '../../context/AssistantContext';
import { AssistantTasksPlan, Recommendation } from '../../types/assistant';

const HolisticAssistant: React.FC = () => {
  const [heartRate, setHeartRate] = useState(72);
  const [isAnimating, setIsAnimating] = useState(true);
  const { data, loading } = useAssistantData();

  const tasksPlan: AssistantTasksPlan | undefined = data?.plan?.tasks;
  const recommendations: Recommendation[] = data?.recommendations ?? [];

  useEffect(() => {
    if (data?.context?.heartRate) {
      setHeartRate(Math.round(data.context.heartRate));
    }
  }, [data?.context?.heartRate]);

  // Simulate heart rate monitor
  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setHeartRate(prev => {
        const variation = Math.random() * 10 - 5; // -5 to +5 variation
        return Math.max(60, Math.min(100, Math.round(prev + variation)));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  const priorities = useMemo(() => {
    const today = tasksPlan?.today ?? [];
    const iconMap: Record<string, any> = {
      meeting: Calendar,
      focus: Zap,
      wellbeing: Heart,
      email: Mail,
      automation: AlertCircle,
      document: FileText,
      default: Brain
    };

    if (today.length === 0) {
      return [
        { icon: Calendar, text: 'No priority conflicts detected', badge: 'All clear' }
      ];
    }

    return today.slice(0, 5).map((task, index) => {
      const IconComponent = iconMap[task.type || 'default'] || iconMap.default;
      return {
        icon: IconComponent,
        text: task.title,
        badge: task.action || task.urgency?.toUpperCase(),
        suggestion: task.suggestion || task.detail
      };
    });
  }, [tasksPlan?.today]);

  const suggestions = useMemo(() => {
    if (!recommendations.length) {
      return [
        {
          icon: CheckCircle,
          text: 'Stay in flow',
          detail: 'Assistant will surface new interventions when signals change.'
        }
      ];
    }

    return recommendations.slice(0, 5).map((rec) => ({
      icon: CheckCircle,
      text: rec.title,
      detail: rec.description
    }));
  }, [recommendations]);

  return (
    <div className="holistic-assistant">
      <div className="cyberpunk-grid"></div>
      
      <header className="assistant-header">
        <div className="header-content">
          <Brain className="header-icon" size={32} />
          <h1>Holistic Assistant</h1>
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>{data?.stress?.label ?? 'Calibrating'}</span>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* Priorities Column */}
        <div className="cyber-card priorities-column">
          <div className="card-header">
            <Zap className="card-icon" size={24} />
            <h2>Upcoming Priorities</h2>
            <div className="cyber-border"></div>
          </div>
          
          <div className="card-content">
            {loading && (
              <div className="panel-loading">Syncing your priority stack…</div>
            )}
            <ul className="priorities-list">
              {priorities.map((item, index) => (
                <li key={index} className="priority-item">
                  <div className="priority-content">
                    <item.icon className="priority-icon" size={18} />
                    <span className="priority-text">{item.text}</span>
                  </div>
                  {item.badge && <span className="cyber-badge">{item.badge}</span>}
                  {item.suggestion && <div className="ai-suggestion">{item.suggestion}</div>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card-footer">
            <span className="footer-text">5 tasks pending</span>
          </div>
        </div>

        {/* Heart Rate Monitor Column */}
        <div className="cyber-card health-column">
          <div className="card-header">
            <Heart className="card-icon" size={24} />
            <h2>Vital Signs</h2>
            <div className="cyber-border"></div>
          </div>
          
          <div className="card-content">
            <div className="heart-rate-monitor">
              <div className="monitor-header">
                <span className="monitor-title">Cardiac Rhythm</span>
                <button 
                  className={`monitor-toggle ${isAnimating ? 'active' : ''}`}
                  onClick={() => setIsAnimating(!isAnimating)}
                >
                  {isAnimating ? 'Pause' : 'Resume'}
                </button>
              </div>
              
              <div className="ecg-container">
                <div className="ecg-line">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                      key={i}
                      className="ecg-segment"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="vital-stats">
                <div className="stat">
                  <span className="stat-label">Heart Rate</span>
                  <span className="stat-value">{heartRate} BPM</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Status</span>
                  <span className={`stat-status ${data?.stress?.level || 'normal'}`}>
                    {data?.stress?.label ?? 'Steady'}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Variability</span>
                  <span className="stat-value">{Math.round((data?.context?.hrv ?? 42))} ms</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-footer">
            <span className="footer-text">Last updated: Just now</span>
          </div>
        </div>

        {/* Suggestions Column */}
        <div className="cyber-card suggestions-column">
          <div className="card-header">
            <Brain className="card-icon" size={24} />
            <h2>Proactive Suggestions</h2>
            <div className="cyber-border"></div>
          </div>
          
          <div className="card-content">
            <ul className="suggestions-list">
              {suggestions.map((item, index) => (
                <li key={index} className="suggestion-item">
                  <div className="suggestion-content">
                    <item.icon className="suggestion-icon" size={18} />
                    <div className="suggestion-text">
                      <span className="suggestion-main">{item.text}</span>
                      {item.detail && <span className="suggestion-detail">{item.detail}</span>}
                    </div>
                  </div>
                  <button className="action-button">→</button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card-footer">
            <span className="footer-text">AI Analysis: {data?.stress?.headline ?? 'Calibrating performance cadence'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolisticAssistant;
