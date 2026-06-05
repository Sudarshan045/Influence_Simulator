import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Stoicism Surging',
    message: 'Stoicism & Mental Health shows 78% revival probability — likely to peak in 3 years.',
    type: 'alert',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    title: 'New High Scorer',
    message: 'AI-Powered Productivity reached a trend score of 9.5 — highest in the dataset.',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: 3,
    title: 'Revival Alert',
    message: 'Remote Work Culture is forecasted to revive with 88% probability over the next 5 years.',
    type: 'alert',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 4,
    title: 'System Ready',
    message: 'Influence Simulator is running — all forecast models are loaded and active.',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      { id: Date.now(), read: false, createdAt: new Date().toISOString(), ...notif },
      ...prev,
    ]);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, dismiss }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
