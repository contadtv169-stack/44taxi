import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import supabase from '../../config/supabase';
import Logo from '../../components/Logo';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login realizado');
      navigate('/home');
    } catch (err) {
      if (err.message?.includes('Invalid login') || err.message?.includes('Credentials')) {
        toast.error('Usuário ou senha inválidos');
      } else if (err.message?.includes('Email not confirmed')) {
        toast.error('Email não confirmado. Verifique sua caixa de entrada');
      } else {
        toast.error(err.message || 'Erro ao fazer login');
      }
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/44taxi/#/home' },
      });
      if (error) throw error;
    } catch (err) {
      toast.error('Erro ao conectar com Google. Tente novamente.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: 24, background: '#fff',
    }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div className="text-center mb-12">
          <Logo size={60} color="#000" />
        </div>

        <div className="card" style={{ padding: 32, border: '1px solid var(--gray-100)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Entrar</h2>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="input-group" style={{ position: 'relative' }}>
              <label>Senha</label>
              <input className="input" type={showPwd ? 'text' : 'password'} placeholder="Sua senha"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={3} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 12, bottom: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-300)' }}>
                {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <div className="flex justify-between items-center mb-16">
              <label className="flex items-center gap-8" style={{ cursor: 'pointer', fontSize: 13, color: 'var(--gray-400)' }}>
                <input type="checkbox" defaultChecked /> Lembrar
              </label>
              <span style={{ fontSize: 13, color: 'var(--blue)', cursor: 'pointer', fontWeight: 500 }}>Esqueceu a senha?</span>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'} <FiArrowRight />
            </button>
          </form>

          <div className="divider" />

          <button className="btn btn-outline" onClick={handleGoogleLogin} disabled={loading}
            style={{ justifyContent: 'center', gap: 12 }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <p className="text-center mt-16" style={{ color: 'var(--gray-300)', fontSize: 14 }}>
            Não tem conta? <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
