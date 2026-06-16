import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import supabase from '../../config/supabase';
import Logo from '../../components/Logo';
import { isBiometricSupported, authenticateBiometric, hasBiometricRegistered } from '../../services/webauthn';
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) {
        toast.success('Login realizado!');
        navigate('/home');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login') || msg.includes('Credentials') || msg.includes('invalid')) {
        toast.error('Email ou senha incorretos');
      } else if (msg.includes('Email not confirmed')) {
        toast.error('Email nao confirmado. Verifique sua caixa de entrada');
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: '#fff' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div className="text-center mb-12">
          <Logo size={60} color="#000" />
          <p className="text-gray text-sm mt-4">Mobilidade e Delivery</p>
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

            <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'} <FiArrowRight />
            </button>
          </form>

          <div className="divider" />
          {isBiometricSupported() && hasBiometricRegistered() && (
            <button className="btn btn-outline mt-8" style={{ width: '100%', justifyContent: 'center' }}
              onClick={async () => {
                try {
                  await authenticateBiometric();
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    toast.success('Login biometrico realizado!');
                    navigate('/home');
                  } else {
                    toast.error('Sessao expirada, faca login normal');
                  }
                } catch (e) {
                  if (e.name !== 'NotAllowedError') toast.error('Falha na biometria');
                }
              }}>
              <span style={{ fontSize: 18 }}>😀</span> Entrar com Face ID
            </button>
          )}
          <p className="text-center" style={{ color: 'var(--gray-300)', fontSize: 14 }}>
            Nao tem conta?{' '}
            <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
