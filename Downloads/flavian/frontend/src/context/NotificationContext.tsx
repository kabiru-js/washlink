'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useSnackbar } from './SnackbarContext';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  requestId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
});

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useSnackbar();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const storageKey = user?.id ? `laundrybolt_notifications_${user.id}` : '';

  const readFromStorage = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') {
      return [] as AppNotification[];
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as AppNotification[]) : [];
    } catch (error) {
      console.error('Failed to read notifications from storage', error);
      return [] as AppNotification[];
    }
  }, [storageKey]);

  const writeToStorage = useCallback(
    (items: AppNotification[]) => {
      if (!storageKey || typeof window === 'undefined') {
        return;
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to save notifications to storage', error);
      }
    },
    [storageKey],
  );

  const hydrate = useCallback(() => {
    const items = readFromStorage();
    setNotifications(items);
    setUnreadCount(items.filter(item => !item.readAt).length);
  }, [readFromStorage]);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      hydrate();
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, [hydrate, user]);

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setNotifications(prev => {
      const next = prev.map(item =>
        item.id === id && !item.readAt ? { ...item, readAt: now } : item,
      );
      writeToStorage(next);
      setUnreadCount(next.filter(item => !item.readAt).length);
      return next;
    });
  }, [writeToStorage]);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications(prev => {
      const next = prev.map(item => ({ ...item, readAt: item.readAt || now }));
      writeToStorage(next);
      setUnreadCount(0);
      return next;
    });
  }, [writeToStorage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    hydrate();
  }, [hydrate, user]);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (incoming: AppNotification) => {
      const notification = {
        ...incoming,
        id: incoming.id || `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: incoming.createdAt || new Date().toISOString(),
      };

      setNotifications(prev => {
        const next = [notification, ...prev].slice(0, 100);
        writeToStorage(next);
        setUnreadCount(next.filter(item => !item.readAt).length);
        return next;
      });
      showToast(`${incoming.title}: ${incoming.message}`, 'info');
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [socket, showToast, writeToStorage]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
