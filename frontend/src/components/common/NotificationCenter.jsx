/**
 * Notification Center Component
 * Caminho: frontend/src/components/common/NotificationCenter.jsx
 */

import React from 'react';
import { useNotifications } from '../../contexts/AppContext';

const NotificationCenter = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-center">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification notification--${notification.type}`}
        >
          <div className="notification-content">
            {notification.title && (
              <h4 className="notification-title">{notification.title}</h4>
            )}
            <p className="notification-message">{notification.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="notification-close"
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;