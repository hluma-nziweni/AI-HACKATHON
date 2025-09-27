import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, MessageCircle, MoreHorizontal, ChevronDown, Zap, Brain, AlertCircle, Mail, FileText, MessageSquare } from 'lucide-react';
import './Tasks.css';

const SmartTaskList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');

  const todayTasks = [
    { 
      icon: AlertCircle,
      text: "Meeting prep for John (high urgency - Q3 report)",
      hasAction: true,
      actionText: "Defer"
    },
    { 
      icon: Mail,
      text: "Draft marketing email",
      hasSuggestion: true,
      suggestion: "AI suggests doing this while focused"
    },
    { 
      icon: MessageSquare,
      text: "Follow up Q3 report with John"
    },
    { 
      icon: Brain,
      text: "AI created from chat"
    },
    { 
      icon: FileText,
      text: "Review Project X Proposal"
    }
  ];

  const tomorrowTasks = [
    { 
      icon: Calendar,
      text: "Team weekly meeting",
      hasAction: true,
      actionText: "Reschedule"
    },
    { 
      icon: FileText,
      text: "Submit monthly report"
    }
  ];

  const upcomingTasks = [
    { 
      icon: Zap,
      text: "Quarterly planning session",
      hasAction: true,
      actionText: "Prepare"
    },
    { 
      icon: Calendar,
      text: "Client presentation"
    }
  ];

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'today': return todayTasks;
      case 'tomorrow': return tomorrowTasks;
      case 'upcoming': return upcomingTasks;
      default: return todayTasks;
    }
  };

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
            <button 
              className={`time-tab ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
            >
              Today
            </button>
            <button 
              className={`time-tab ${activeTab === 'tomorrow' ? 'active' : ''}`}
              onClick={() => setActiveTab('tomorrow')}
            >
              Tomorrow
            </button>
            <button 
              className={`time-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
          </div>
          
          <div className="divider"></div>
          
          <div className="task-content">
            {getCurrentTasks().map((task, index) => (
              <div key={index} className="task-item">
                <div className="task-left">
                  <task.icon size={18} className="task-icon" />
                  <div className="task-text">
                    {task.text}
                    {task.hasSuggestion && (
                      <div className="ai-suggestion">
                        {task.suggestion}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="task-right">
                  {task.hasAction && (
                    <button className="defer-button">
                      {task.actionText}
                      <ChevronDown size={16} />
                    </button>
                  )}
                  <MoreHorizontal size={16} className="more-icon" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Box - Productivity Insights */}
        <div className="insights-box">
          <div className="box-header">
            <Brain size={24} className="header-icon" />
            <h1>Productivity Insights</h1>
          </div>
          
          {/* Flow State History Section */}
          <div className="insight-section">
            <div className="section-title">
              <Clock size={20} />
              <span>Flow State History</span>
            </div>
            
            <div className="flow-states">
              <div className="flow-item highlighted">
                <span className="flow-time">9 AM</span>
                <div className="flow-details">
                  <span className="flow-label">Peak focus</span>
                  <span className="flow-schedule">Scheduled for 11 PM</span>
                </div>
              </div>
              
              {['9 AM', '8 AM', '11 AM', '7 AM', '8 AM', '8 PM'].map((time, index) => (
                <div key={index} className="flow-item">
                  <span className="flow-time">{time}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="divider"></div>
          
          {/* Cognitive Load Trends Section */}
          <div className="insight-section">
            <div className="section-title">
              <TrendingUp size={20} />
              <span>Cognitive Load Trends</span>
            </div>
            
            <div className="cognitive-graph">
              <div className="graph-bars">
                {[
                  { day: 'Mon', height: '40%', color: '#3b82f6' },
                  { day: 'Tue', height: '75%', color: '#ef4444', highlight: true },
                  { day: 'Wed', height: '50%', color: '#3b82f6' },
                  { day: 'Thu', height: '45%', color: '#3b82f6' },
                  { day: 'Fri', height: '35%', color: '#3b82f6' },
                  { day: 'Sat', height: '25%', color: '#3b82f6' }
                ].map((bar, index) => (
                  <div key={index} className="bar-container">
                    <div 
                      className={`bar ${bar.highlight ? 'highlighted' : ''}`}
                      style={{ 
                        height: bar.height, 
                        backgroundColor: bar.color 
                      }}
                    ></div>
                    <span className="bar-label">{bar.day}</span>
                    {bar.highlight && (
                      <div className="bar-annotation">
                        Your busiest communication periods are typically Tuesday afternoons.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="insight-note">
              <MessageCircle size={16} />
              <span>Your busiest communication periods are typically Tuesday afternoons.</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="footer-nav">
        <span className="nav-item">Dashboard</span>
        <span className="nav-item">Tasks</span>
        <span className="nav-item">Insights</span>
        <span className="nav-item">Integrations</span>
      </div>
    </div>
  );
};

export default SmartTaskList;