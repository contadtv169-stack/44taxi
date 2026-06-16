import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiClock, FiDollarSign, FiCheckCircle, FiXCircle, FiArrowLeft } from 'react-icons/fi';
import supabase from '../config/supabase';

const STATUS_MAP = {
  completed: { label: 'Finalizada', color: '#059669', icon: FiCheckCircle },
  cancelled: { label: 'Cancelada', color: '#dc2626', icon: FiXCircle },
  accepted: { label: 'Aceita', color: '#2563eb' },
  in_progress: { label: 'Em andamento', color: '#8b5cf6' },
  pending: { label: 'Pendente', color: '#f59e0b' },
};

export default function History() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRides(); }, []);

  const loadRides = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data } = await supabase
      .from('rides')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setRides(data);
    setLoading(false);
  };

  return (
    <div className="container fade-in">
      <div className="flex items-center gap-12 mb-16">
        <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '8px' }} onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-lg" style={{ margin: 0 }}>Historico de Corridas</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="loading-spinner" /></div>
      ) : rides.length === 0 ? (
        <div className="text-center py-24">
          <FiMapPin size={48} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
          <p className="text-gray-dark font-medium">Nenhuma corrida ainda</p>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/rides')}>Solicitar Corrida</button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {rides.map(r => {
            const config = STATUS_MAP[r.status] || { label: r.status, color: '#6b7280' };
            const Icon = config.icon || FiClock;
            return (
              <div key={r.id} className="card" style={{ padding: 14, cursor: 'pointer', borderLeft: `3px solid ${config.color}` }}
                onClick={() => navigate(`/ride/${r.id}`)}>
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                    <Icon size={14} color={config.color} />
                    <span className="text-xs font-semibold" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <span className="text-xs text-gray">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-6 text-xs mb-4">
                  <FiMapPin size={12} color="#2563eb" />
                  <span className="text-gray-dark">{r.origin_address}</span>
                </div>
                <div className="flex items-center gap-6 text-xs mb-4">
                  <FiMapPin size={12} color="#ef4444" />
                  <span className="text-gray-dark">{r.destination_address}</span>
                </div>
                <div className="flex justify-between items-center mt-8 pt-8" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <span className="text-xs text-gray">{r.distance_km ? `${r.distance_km} km` : '-'}</span>
                  <span className="font-bold" style={{ color: 'var(--yellow)' }}>R$ {r.final_price || r.estimated_price || '0'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
