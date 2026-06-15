import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMap, FiCoffee, FiClock, FiStar, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container fade-in">
      {/* Welcome */}
      <div className="card-yellow card mb-16" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Ola, {profile?.name || 'Usuario'}!</h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>O que voce precisa hoje?</p>
      </div>

      {/* Main Actions */}
      <div className="grid-2 mb-16">
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 24 }} onClick={() => navigate('/rides')}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚗</div>
          <h3 style={{ fontWeight: 700 }}>Corrida</h3>
          <p className="text-sm text-gray" style={{ marginTop: 4 }}>Moto ou Carro</p>
        </div>
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 24 }} onClick={() => navigate('/food')}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍕</div>
          <h3 style={{ fontWeight: 700 }}>Food</h3>
          <p className="text-sm text-gray" style={{ marginTop: 4 }}>Peça comida</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card mb-16">
        <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Acesso Rapido</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { icon: '📋', label: 'Historico de Corridas', path: '/rides' },
            { icon: '🍔', label: 'Ultimos Pedidos', path: '/food' },
            { icon: '👤', label: 'Meu Perfil', path: '/profile' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between" style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }} onClick={() => navigate(item.path)}>
              <div className="flex items-center gap-12">
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
              </div>
              <FiChevronRight color="var(--gray-300)" />
            </div>
          ))}
        </div>
      </div>

      {/* Driver / Restaurant quick registration */}
      {profile?.role === 'cliente' && (
        <div className="card" style={{ background: 'var(--gray-50)' }}>
          <p className="text-sm text-gray-dark mb-8">Quer trabalhar conosco?</p>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => navigate('/driver/register')}>Ser Motorista</button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => navigate('/restaurant/register')}>Ser Restaurante</button>
          </div>
        </div>
      )}
    </div>
  );
}
