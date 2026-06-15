import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Earnings() {
  const { profile } = useAuth();
  const [earnings, setEarnings] = useState({ daily: 0, weekly: 0, monthly: 0, total: 0 });
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const data = await api.get('/earnings');
      setEarnings(data.earnings);
    } catch (err) {
      // Mostrar zeros se nao for motorista
    } finally {
      setLoading(false);
    }
  };

  const isDriver = ['taxista', 'entregador'].includes(profile?.role);

  if (!isDriver) {
    return (
      <div className="container text-center fade-in" style={{ paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
        <h2 className="font-bold">Seus Ganhos</h2>
        <p className="text-gray mt-8">Cadastre-se como motorista ou entregador para acompanhar seus ganhos</p>
      </div>
    );
  }

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="container fade-in">
      <h2 className="font-bold mb-16">Meus Ganhos</h2>

      <div className="card-yellow card mb-16 text-center" style={{ padding: 32 }}>
        <div className="text-sm font-semibold" style={{ opacity: 0.8 }}>Saldo Total</div>
        <div className="price-tag" style={{ fontSize: 40, margin: '8px 0' }}>R$ <span>{earnings.total.toFixed(2)}</span></div>
      </div>

      <div className="grid-3 mb-16">
        <div className="card text-center">
          <div className="text-xs text-gray">Hoje</div>
          <div className="font-bold text-lg">R$ {earnings.daily.toFixed(2)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray">Semana</div>
          <div className="font-bold text-lg">R$ {earnings.weekly.toFixed(2)}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-gray">Mes</div>
          <div className="font-bold text-lg">R$ {earnings.monthly.toFixed(2)}</div>
        </div>
      </div>

      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Historico</h3>
        <div className="flex gap-8 mb-12">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setPeriod(p)}>
              {p === 'daily' ? 'Hoje' : p === 'weekly' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>

        <div className="text-center text-gray py-16">
          <FiTrendingUp size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
          <p className="text-sm">Historico detalhado em breve</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-12">Saque via PIX</h3>
        <div className="input-group">
          <label>Chave PIX</label>
          <input className="input" placeholder="CPF, email ou telefone" />
        </div>
        <div className="input-group">
          <label>Valor</label>
          <input className="input" type="number" placeholder="50.00" />
        </div>
        <button className="btn btn-secondary">Solicitar Saque</button>
      </div>
    </div>
  );
}
