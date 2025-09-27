import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import './Calendar.css';

interface CalendarProps {
  projects?: Project[];
}

interface Project {
  _id: number;
  title: string;
  description: string;
  research_area: string;
  start_date: string;
  end_date: string;
  institution: string | null;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'start' | 'end';
  project: Project;
}

const Calendar: React.FC<CalendarProps> = ({ projects = [] }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Compute calendar events from projects
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    projects.forEach(project => {
      events.push({
        id: project._id * 1000 + 1,
        title: project.title,
        date: new Date(project.start_date),
        type: 'start',
        project
      });
      events.push({
        id: project._id * 1000 + 2,
        title: project.title,
        date: new Date(project.end_date),
        type: 'end',
        project
      });
    });
    return events;
  }, [projects]);

  // Helper functions
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const formatDateString = (date: Date) => date.toISOString().split('T')[0];

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDate = (date: Date) => {
    const dateString = formatDateString(date);
    return calendarEvents.filter(event => formatDateString(event.date) === dateString);
  };

  // Render calendar grid
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days: React.ReactNode[] = [];


    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateString(date);
      const events = getEventsForDate(date);
      const isToday = formatDateString(new Date()) === dateString;

      days.push(
        <div
          key={`day-${day}`}
          className={`calendar-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-events' : ''}`}
        >
          <div className="date-number">{day}</div>
          {events.length > 0 && (
            <div className="event-indicators">
              {events.map(event => (
                <div
                  key={event.id}
                  className={`event-indicator ${event.type === 'start' ? 'event-start' : 'event-end'}`}
                  title={`${event.title} (${event.type === 'start' ? 'Start' : 'End'} Date)`}
                >
                  <span className="event-title">{event.title.substring(0, 20)}{event.title.length > 20 ? '...' : ''}</span>
                  <Badge
                    bg={event.type === 'start' ? 'primary' : 'success'}
                    className="event-badge"
                  >
                    {event.type === 'start' ? 'Start' : 'End'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

return (
  <>
    {/* Page Title */}
    <h2 className="calendar-page-title">Calendar</h2>

    <Card className="calendar-card">
      <Card.Body>
        <div className="calendar-header">
          <div className="calendar-title">
            <h4>
              <FiCalendar className="me-2" />
              {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
            </h4>
          </div>
          <div className="calendar-actions">
            <Button variant="outline-secondary" size="sm" onClick={goToToday} className="me-2">Today</Button>
            <Button variant="outline-primary" size="sm" onClick={goToPreviousMonth} className="me-1"><FiChevronLeft /></Button>
            <Button variant="outline-primary" size="sm" onClick={goToNextMonth}><FiChevronRight /></Button>
          </div>
        </div>

        <div className="calendar-grid">
          <div className="calendar-weekdays">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>
          <div className="calendar-days">{renderCalendar()}</div>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color start"></div><div>Project Start</div>
          </div>
          <div className="legend-item">
            <div className="legend-color end"></div><div>Project End</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  </>
);

};

export default Calendar;
