import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../config/supabase';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  const loadNotifications = useCallback(async (uid) => {
    if (!uid) return;
    userIdRef.current = uid;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadNotifications(session.user.id);
        userIdRef.current = session.user.id;
      } else {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadNotifications(session.user.id);
        userIdRef.current = session.user.id;
      } else {
        setNotifications([]);
        setUnreadCount(0);
        userIdRef.current = null;
      }
    });

    return () => subscription?.unsubscribe();
  }, [loadNotifications]);

  // Subscribe to realtime inserts
  useEffect(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    const channel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${uid}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userIdRef.current]);

  const markAsRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const addNotification = useCallback(async (title, body, type = 'info', data = {}) => {
    const uid = userIdRef.current;
    if (!uid) return;
    await supabase.from('notifications').insert({
      user_id: uid, title, body, type, data,
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      markAsRead, markAllAsRead, addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
