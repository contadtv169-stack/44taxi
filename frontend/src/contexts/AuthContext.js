import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../config/supabase';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data.user);
      return data.user;
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('nao encontrado')) {
        const session = await supabase.auth.getSession();
        if (session?.data?.session?.user) {
          try {
            const { data: newProfile } = await api.post('/auth/register', {
              firebaseUid: session.data.session.user.id,
              email: session.data.session.user.email,
              name: session.data.session.user.email?.split('@')[0] || 'Usuario',
            });
            setProfile(newProfile?.user || { email: session.data.session.user.email, name: 'Usuario', role: 'cliente' });
            return newProfile?.user;
          } catch {}
        }
      }
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setTimeout(() => loadProfile(), 100);
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setTimeout(() => loadProfile(), 200);
      } else {
        setProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, [loadProfile]);

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
        await api.post('/auth/register', {
          firebaseUid: data.user.id,
          email, phone, name,
        });
      } catch {}
      await loadProfile();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success('Saiu da conta');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
