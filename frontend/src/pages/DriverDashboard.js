import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiMapPin, FiNavigation, FiClock, FiUser, FiDollarSign } from 'react-icons/fi';
import supabase from '../config/supabase';
import voice from '../components/VoiceService';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: d } = await supabase.from('drivers').select('*').eq('firebase_uid', session.user.id).maybeSingle();
    if (d) {
      setDriver(d);
      setOnline(d.available || false);
      // Load pending rides
      const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .eq('vehicle_type', d.vehicle_type || 'carro')
        .order('created_at', { ascending: false })
        .limit(10);
      if (rides) setPendingRides(rides);
      // Listen for new rides
      const channel = supabase
        .channel('driver_rides')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: `status=eq.pending`,
        }, (payload) => {
          if (payload.new.vehicle_type === (d.vehicle_type || 'carro')) {
            setPendingRides(prev => [payload.new, ...prev]);
            voice.speak('Nova corrida solicitada! Verifique os detalhes.', { rate: 0.85 });
            toast('Nova corrida disponivel!', { icon: '🚗' });
          }
        })
        .subscribe();
      channelRef.current = channel;
    }
    setLoading(false);
  };

  const toggleOnline = async () => {
    const newStatus = !online;
    setOnline(newStatus);
    if (driver) {
      await supabase.from('drivers').update({ available: newStatus }).eq('id', driver.id);
    }
  };

  const handleAccept = async (ride) => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({ driver_id: driver.id, status: 'accepted' })
        .eq('id', ride.id);
      if (error) throw error;
      setPendingRides(prev => prev.filter(r => r.id !== ride.id));
      setActiveRide(ride);
      voice.speak('Corrida aceita! Dirija-se ao local de origem.', { rate: 0.85 });
      toast.success('Corrida aceita!');
    } catch (err) { toast.error(err.message); }
  };

  const handleReject = (rideId) => {
    setPendingRides(prev => prev.filter(r => r.id !== rideId));
  };

  const handleStartRide = async () => {
    await supabase.from('rides').update({ status: 'in_progress' }).eq('id', activeRide.id);
    setActiveRide(prev => ({ ...prev, status: 'in_progress' }));
    voice.speak('Viagem iniciada. Siga para o destino.', { rate: 0.85 });
  };

  const handleCompleteRide = async () => {
    await supabase.from('rides').update({
      status: 'completed',
      final_price: activeRide.estimated_price,
      completed_at: new Date(),
    }).eq('id', activeRide.id);
    voice.arrivedDestination(activeRide.destination_address || 'destino');
    toast.success('Corrida finalizada!');
    setActiveRide(null);
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!driver) return (
    <div className="container text-center fade-in" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🚗</div>
      <h2 className="font-bold">Modo Motorista</h2>
      <p className="text-gray mt-8">Cadastre-se como taxista para receber corridas</p>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/partner')}>Quero ser taxista</button>
    </div>
  );

  return (
    <div className="container fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-8">
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">{driver.name || 'Motorista'}</p>
            <p className="text-xs text-gray">Online: {online ? 'Sim' : 'Nao'}</p>
          </div>
        </div>
        <button className={`btn btn-sm ${online ? 'btn-danger' : 'btn-primary'}`}
          style={{ width: 'auto', fontSize: 12 }} onClick={toggleOnline}>
          {online ? 'Ficar Offline' : 'Ficar Online'}
        </button>
      </div>

      {/* Active Ride */}
      {activeRide && (
        <div className="card mb-16" style={{ border: '2px solid var(--yellow)' }}>
          <h3 className="font-bold mb-8">
            {activeRide.status === 'accepted' ? 'A caminho da origem' : 'Em viagem'}
          </h3>
          <div className="flex items-center gap-6 text-xs mb-4">
            <FiMapPin size={12} color="#2563eb" />
            <span>{activeRide.origin_address}</span>
          </div>
          <div className="flex items-center gap-6 text-xs mb-4">
            <FiMapPin size={12} color="#ef4444" />
            <span>{activeRide.destination_address}</span>
          </div>
          <div className="flex justify-between items-center mt-8 pt-8" style={{ borderTop: '1px solid #f3f4f6' }}>
            <span className="text-xs text-gray">{activeRide.distance_km ? `${activeRide.distance_km} km` : ''}</span>
            <span className="font-bold" style={{ color: 'var(--yellow)' }}>R$ {activeRide.estimated_price}</span>
          </div>
          <div className="flex gap-8 mt-12">
            {activeRide.status === 'accepted' && (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStartRide}>
                <FiNavigation size={14} /> Iniciar Viagem
              </button>
            )}
            {activeRide.status === 'in_progress' && (
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleCompleteRide}>
                <FiCheck size={14} /> Finalizar Corrida
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Rides */}
      <h3 className="font-semibold mb-12">
        Corridas Disponiveis {online ? `(${pendingRides.length})` : '(Offline)'}
      </h3>
      {!online ? (
        <div className="card text-center py-16">
          <p className="text-gray text-sm">Fique online para receber corridas</p>
        </div>
      ) : pendingRides.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray text-sm">Nenhuma corrida disponivel no momento</p>
          <p className="text-xs text-gray mt-4">Aguardando novas solicitacoes...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {pendingRides.map(r => (
            <div key={r.id} className="card" style={{
              padding: 14,
              animation: 'fadeIn 0.3s ease',
              borderLeft: '3px solid var(--yellow)',
            }}>
              <div className="flex items-center gap-6 text-xs mb-4">
                <FiMapPin size={12} color="#2563eb" />
                <span className="text-gray-dark font-medium">{r.origin_address}</span>
              </div>
              <div className="flex items-center gap-6 text-xs mb-4">
                <FiNavigation size={12} color="#ef4444" />
                <span className="text-gray-dark">{r.destination_address}</span>
              </div>
              <div className="flex justify-between text-xs mb-12">
                <span className="text-gray"><FiClock size={10} /> {new Date(r.created_at).toLocaleTimeString('pt-BR')}</span>
                <span className="font-bold" style={{ color: 'var(--yellow)' }}>R$ {r.estimated_price}</span>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-success" style={{ flex: 1, fontSize: 13 }} onClick={() => handleAccept(r)}>
                  <FiCheck size={14} /> Aceitar
                </button>
                <button className="btn btn-outline" style={{ flex: 1, fontSize: 13, color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleReject(r.id)}>
                  <FiX size={14} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
