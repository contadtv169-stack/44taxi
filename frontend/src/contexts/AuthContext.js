import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) await loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data.user);
    } catch {
      setProfile(null);
    }
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, name, phone) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
    if (error) throw error;
    await api.post('/auth/register', { email, password, name, phone, firebaseUid: user?.id });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
