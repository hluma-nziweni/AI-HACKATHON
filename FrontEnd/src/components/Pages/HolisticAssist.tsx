import React, { useState, useEffect } from 'react';
import { Brain, Heart, Zap, Clock, Calendar, Mail, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import './HolisticAssist.css';

const HolisticAssistant: React.FC = () => {
  const [heartRate, setHeartRate] = useState(72);
  const [isAnimating, setIsAnimating] = useState(true);

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

  const priorities = [
    { icon: Calendar, text: "Meeting with John", badge: "high urgency - Q3 report" },
    { icon: Mail, text: "Draft marketing email", suggestion: "AI suggests doing this while focused" },
    { icon: FileText, text: "Review Project X Proposal" },
    { icon: CheckCircle, text: "Submit weekly report", badge: "due today" },
    { icon: AlertCircle, text: "Team sync call", badge: "10:30 AM" }
  ];

  const suggestions = [
    { icon: Clock, text: "Take a 15-min walk", detail: "Scheduled for 2 PM" },
    { icon: Mail, text: "Respond to Sarah", detail: "AI has drafted response" },
    { icon: CheckCircle, text: "Confirm meeting room", detail: "For 3 PM conference" },
    { icon: FileText, text: "Review draft proposal", detail: "Send feedback by EOD" },
    { icon: Zap, text: "Optimize workflow", detail: "AI recommendations ready" }
  ];

  return (
    <div className="holistic-assistant">
      <div className="cyberpunk-grid"></div>
      
      <header className="assistant-header">
        <div className="header-content">
          <Brain className="header-icon" size={32} />
          <h1>Holistic Assistant</h1>
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>System Online</span>
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
                  <span className="stat-status normal">Normal</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Variability</span>
                  <span className="stat-value">12 ms</span>
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
            <span className="footer-text">AI Analysis: Optimal Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolisticAssistant;