import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

interface DeadlinesWidgetProps {
  data: {
    deadlines: any[];
  };
}

const DeadlinesWidget: React.FC<DeadlinesWidgetProps> = ({ data }) => {
  const { deadlines } = data;
  
  const formatDeadlineDate = (dateString: string): {day: string, month: string} => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
    };
  };
  
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-calendar text-muted display-4"></i>
        <p className="mt-3">No upcoming deadlines</p>
        <Link to="/calendar">
          <Button variant="primary" size="sm">View Calendar</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="deadlines-widget">
      {deadlines.map((project, index) => {
        const date = formatDeadlineDate(project.end_date);
        const isPastDeadline = new Date(project.end_date) < new Date();
        
        return (
          <div className="deadline-item" key={index}>
            <div className={`deadline-date ${isPastDeadline ? 'text-muted' : ''}`}>
              <span className="day">{date.day}</span>
              <span className="month">{date.month}</span>
            </div>
            <div className="deadline-info">
              <h6>{project.title}</h6>
              <p className="mb-0 text-muted small">
                {isPastDeadline ? 'Completed' : project.institution || project.research_area}
              </p>
            </div>
          </div>
        );
      })}
      
      <div className="text-center mt-3">
        <Link to="/calendar">
          <Button variant="link" size="sm">View Calendar</Button>
        </Link>
      </div>
    </div>
  );
};

export default DeadlinesWidget;