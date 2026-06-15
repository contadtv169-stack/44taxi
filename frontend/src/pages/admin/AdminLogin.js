import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('firebase_uid', uid)
        .maybeSingle();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        toast.error('Acesso nao autorizado');
        return;
      }
      toast.success('Bem-vindo, admin!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#FFD700' }}>
            <span style={{ color: '#fff' }}>44</span>Taxi
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 8 }}>Painel Administrativo</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Login Admin</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
