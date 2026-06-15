import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabase';
import api from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    // 1. Try backend API
    try {
      const { data } = await api.get('/auth/me');
      if (data?.user) { setProfile(data.user); return data.user; }
    } catch {}

    // 2. Try Supabase direct (fallback: no backend available)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setProfile(null); return null; }

      const { data: direct } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('firebase_uid', uid)
        .maybeSingle();

      if (direct) { setProfile(direct); return direct; }

      // 3. Auto-create profile directly in Supabase
      const email = session.user.email || '';
      const { data: newProfile, error: createErr } = await supabase
        .from('user_profiles')
        .insert({
          firebase_uid: uid,
          email,
          name: email.split('@')[0] || 'Usuario',
          role: 'cliente',
        })
        .select()
        .single();

      if (!createErr && newProfile) { setProfile(newProfile); return newProfile; }
    } catch {}

    setProfile(null);
    return null;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile();
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        await loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      await loadProfile();
    }
  };

  const register = async (email, password, name, phone) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone } },
    });
    if (error) throw error;
    if (data?.user) {
      setUser(data.user);
      try {
        await supabase.from('user_profiles').insert({
          firebase_uid: data.user.id,
          email, phone, name,
          role: 'cliente',
        });
      } catch {}
      await loadProfile();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
