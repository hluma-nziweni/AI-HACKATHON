import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

interface NotificationsWidgetProps {
  data: {
    notifications: {
      id: string;
      message: string;
      type: 'info' | 'success' | 'warning';
      date: string;
    }[];
  };
}

const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({ data }) => {
  const { notifications } = data;
  
  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-bell text-muted display-4"></i>
        <p className="mt-3">No notifications yet</p>
      </div>
    );
  }
  
  return (
    <div className="notification-widget">
      <div className="notification-list">
        {notifications.slice(0, 5).map(notification => (
          <div key={notification.id} className="notification-item">
            <div className={`notification-indicator bg-${getNotificationVariant(notification.type)}`}></div>
            <div className="notification-content">
              <p className="mb-1">{notification.message}</p>
              <small className="text-muted">{notification.date}</small>
            </div>
          </div>
        ))}
      </div>
      
      {notifications.length > 5 && (
        <div className="text-center mt-3">
          <Link to="/notifications">
            <Button variant="link" size="sm">View All Notifications ({notifications.length})</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsWidget;