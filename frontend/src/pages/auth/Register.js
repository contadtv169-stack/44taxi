import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight } from 'react-icons/fi';
import supabase from '../../config/supabase';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, phone } },
      });
      if (error) throw error;

      await api.post('/auth/register', {
        firebaseUid: data.user.id,
        email, phone, name,
      });

      toast.success('Conta criada! Verifique seu email.');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #1a1a2e 100%)' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>
            <span style={{ color: '#1a1a2e' }}>44</span>Taxi
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Criar Conta</h2>

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Nome completo</label>
              <input className="input" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Telefone (opcional)</label>
              <input className="input" type="tel" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Senha</label>
              <input className="input" type="password" placeholder="Minimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            <button className="btn btn-primary mt-8" type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta'} <FiArrowRight />
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--gray-400)', fontSize: 14 }}>
            Ja tem conta? <Link to="/login" style={{ color: 'var(--black)', fontWeight: 600 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
