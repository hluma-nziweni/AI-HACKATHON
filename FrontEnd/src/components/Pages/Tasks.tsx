import React, { useState } from 'react';
import { Calendar, Clock, TrendingUp, MessageCircle, MoreHorizontal, ChevronDown, Zap, Brain, AlertCircle, Mail, FileText, MessageSquare } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './Tasks.css';

const SmartTaskList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'upcoming'>('today');

  // Dummy data for Flow State History (line chart)
  const flowData = [
    { time: '7 AM', focus: 20 },
    { time: '9 AM', focus: 32 }, // peak
    { time: '11 AM', focus: 28 },
    { time: '3 PM', focus: 20 },
    { time: '9 PM', focus: 18 },
  ];

  // Dummy data for Cognitive Load Trends (bar chart)
  const loadData = [
    { day: 'Mon', load: 20 },
    { day: 'Tue', load: 45 }, // busiest
    { day: 'Wed', load: 30 },
    { day: 'Thu', load: 25 },
    { day: 'Fri', load: 22 },
    { day: 'Sat', load: 18 },
  ];

  const todayTasks = [
    { icon: AlertCircle, text: "Meeting prep for John (high urgency - Q3 report)", hasAction: true, actionText: "Defer" },
    { icon: Mail, text: "Draft marketing email", hasSuggestion: true, suggestion: "AI suggests doing this while focused" },
    { icon: MessageSquare, text: "Follow up Q3 report with John" },
    { icon: Brain, text: "AI created from chat" },
    { icon: FileText, text: "Review Project X Proposal" }
  ];

  const tomorrowTasks = [
    { icon: Calendar, text: "Team weekly meeting", hasAction: true, actionText: "Reschedule" },
    { icon: FileText, text: "Submit monthly report" }
  ];

  const upcomingTasks = [
    { icon: Zap, text: "Quarterly planning session", hasAction: true, actionText: "Prepare" },
    { icon: Calendar, text: "Client presentation" }
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
            {getCurrentTasks().map((task, index) => (
              <div key={index} className="task-item">
                <div className="task-left">
                  <task.icon size={18} className="task-icon" />
                  <div className="task-text">
                    {task.text}
                    {task.hasSuggestion && <div className="ai-suggestion">{task.suggestion}</div>}
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
            <div className="insight-note">
              <MessageCircle size={16} />
              <span>Your busiest communication periods are typically Tuesday afternoons.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartTaskList;
