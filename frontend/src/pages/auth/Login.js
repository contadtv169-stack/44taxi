import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';

export default function Login() {
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
      toast.success('Login realizado');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #1a1a2e 100%)' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
            <span style={{ color: '#1a1a2e' }}>44</span>Taxi
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Mobilidade e Delivery</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Entrar</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input className="input" type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'} <FiArrowRight />
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button className="btn btn-outline" onClick={handleGoogleLogin} style={{ justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar com Google
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--gray-400)', fontSize: 14 }}>
            Nao tem conta? <Link to="/register" style={{ color: 'var(--black)', fontWeight: 600 }}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
