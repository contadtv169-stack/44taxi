import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone, FiMessageCircle, FiXCircle, FiMapPin, FiUser } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../services/api';
import { payRide } from '../services/krypt';
import voice from '../components/VoiceService';
import toast from 'react-hot-toast';

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRide();
    const interval = setInterval(loadRide, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadRide = async () => {
    try {
      const { ride: data } = await api.get(`/rides/${id}`);
      const prevStatus = ride?.status;

      if (data.status === 'accepted' && prevStatus !== 'accepted') {
        voice.welcomePassenger(
          data.passenger?.name || 'Passageiro',
          data.driver?.user?.name || 'Motorista',
          data.vehicle_model || 'veículo'
        );
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('44Taxi', { body: `${data.driver?.user?.name} aceitou sua corrida!` });
        }
      }

      if (data.status === 'completed' && prevStatus !== 'completed') {
        voice.arrivedDestination(data.destination_address || 'destino');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('44Taxi', { body: 'Você chegou ao seu destino!' });
        }
      }

      setRide(data);
    } catch (err) {
      if (err.message?.includes('nao encontrada') || err.message?.includes('404')) {
        toast.error('Usuário não encontrado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/rides/${id}/status`, { status: 'cancelled' });
      toast.success('Corrida cancelada');
      navigate('/rides');
    } catch (err) { toast.error(err.message); }
  };

  const handlePay = async (method) => {
    try {
      const data = await payRide(id, method);
      if (data.payment?.qrCodeBase64) {
        setShowPayment(data.payment);
        toast.success('QR Code PIX gerado!');
      } else if (data.payment?.copyPaste) {
        setShowPayment(data.payment);
        toast.success('Código PIX copiado!');
      } else {
        toast.success('Pagamento registrado!');
      }
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!ride) return (
    <div className="container text-center" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <h2 className="font-bold">Usuário não encontrado</h2>
      <p className="text-gray text-sm mt-8">Esta corrida não existe ou foi removida</p>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/rides')}>Nova Corrida</button>
    </div>
  );

  const statusConfig = {
    pending: { label: 'Procurando motorista...', color: 'var(--blue)', pulse: true, icon: '🔍' },
    accepted: { label: 'Motorista a caminho', color: 'var(--blue)', pulse: true, icon: '🚗' },
    arrived: { label: 'Motorista chegou', color: 'var(--success)', pulse: true, icon: '✅' },
    in_progress: { label: 'Em viagem', color: 'var(--blue)', pulse: false, icon: '🚀' },
    completed: { label: 'Viagem finalizada', color: 'var(--success)', pulse: false, icon: '🎉' },
    cancelled: { label: 'Cancelada', color: 'var(--danger)', pulse: false, icon: '❌' },
  };

  const config = statusConfig[ride.status] || {};

  return (
    <div className="container fade-in">
      {/* Status Header */}
      <div className="card mb-12 text-center" style={{
        border: `2px solid ${config.color}`,
        padding: 20,
        animation: config.pulse ? 'pulse 2s infinite' : 'none',
      }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{config.icon}</div>
        <h3 className="font-bold">{config.label}</h3>
      </div>

      {/* Map */}
      <div className="map-container mb-12" style={{ height: 280 }}>
        <MapContainer center={[ride.origin_lat, ride.origin_lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.origin_lat, ride.origin_lng]} />
          {ride.destination_lat && <Marker position={[ride.destination_lat, ride.destination_lng]} />}
        </MapContainer>
      </div>

      {/* Driver Info */}
      {ride.driver && (
        <div className="card mb-12">
          <div className="flex items-center gap-12">
            <div className="avatar" style={{ background: 'var(--blue)' }}>
              <FiUser color="#fff" size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-bold">{ride.driver?.user?.name || 'Motorista'}</div>
              <div className="text-xs text-gray">{ride.vehicle_model || ''} • {ride.vehicle_plate || ''}</div>
              <div className="flex items-center gap-4 mt-4">
                <span style={{ color: '#f59e0b' }}>★</span>
                <span className="text-sm font-semibold">{ride.driver.rating || '5.0'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Info */}
      <div className="card mb-12">
        <div className="flex items-center gap-8 mb-8">
          <FiMapPin color="#2563eb" size={16} />
          <span className="text-sm">{ride.origin_address}</span>
        </div>
        <div className="flex items-center gap-8">
          <FiMapPin color="#ef4444" size={16} />
          <span className="text-sm">{ride.destination_address}</span>
        </div>
        <div className="divider" />
        <div className="flex justify-between items-center">
          <span className="text-gray-dark text-sm">Valor</span>
          <span className="font-bold text-lg">R$ {ride.final_price || ride.estimated_price}</span>
        </div>
        {ride.distance_km && (
          <div className="flex justify-between mt-4">
            <span className="text-gray-dark text-xs">Distância</span>
            <span className="text-xs font-semibold">{ride.distance_km} km</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {ride.status === 'accepted' && (
        <div className="flex gap-8 mb-12">
          <button className="btn btn-outline" style={{ flex: 1 }}><FiMessageCircle /> Chat</button>
          <button className="btn btn-outline" style={{ flex: 1 }}><FiPhone /> Ligar</button>
        </div>
      )}

      {['pending', 'accepted'].includes(ride.status) && (
        <button className="btn btn-danger" onClick={handleCancel}><FiXCircle /> Cancelar Corrida</button>
      )}

      {/* Payment */}
      {ride.status === 'completed' && !ride.payment_status === 'paid' && !showPayment && (
        <div className="card mb-12">
          <h3 className="font-bold mb-12">Forma de Pagamento</h3>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => handlePay('pix')}>
              <span style={{ fontSize: 18 }}>💳</span> PIX
            </button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('card')}>
              💳 Cartão
            </button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('cash')}>
              💵 Dinheiro
            </button>
          </div>
        </div>
      )}

      {/* QR Code PIX */}
      {showPayment && (
        <div className="card mb-12 fade-in" style={{ textAlign: 'center' }}>
          <h3 className="font-bold mb-8">Pague com PIX</h3>
          <div style={{
            background: '#fff', padding: 16, borderRadius: 16,
            display: 'inline-block', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}>
            <img src={showPayment.qrCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${showPayment.copyPaste || '44taxi'}`}
              alt="QR Code PIX" style={{ width: 200, height: 200, borderRadius: 8 }} />
          </div>
          {showPayment.copyPaste && (
            <div style={{
              background: '#f0f7ff', padding: '8px 12px', borderRadius: 8, fontSize: 11,
              wordBreak: 'break-all', marginTop: 12, cursor: 'pointer', fontFamily: 'monospace'
            }}
              onClick={() => { navigator.clipboard.writeText(showPayment.copyPaste); toast.success('Código copiado!'); }}>
              📋 {showPayment.copyPaste}
            </div>
          )}
          <p className="text-xs text-gray mt-8">Escaneie o QR Code ou copie o código para pagar</p>
        </div>
      )}

      {/* Rating */}
      {ride.status === 'completed' && (
        <div className="card text-center">
          <h3 className="font-bold mb-8">Avalie sua viagem</h3>
          <div className="flex gap-8 justify-center mb-8" style={{ fontSize: 32 }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                onClick={async () => {
                  await api.post(`/rides/${id}/rate`, { rating: s });
                  toast.success('Avaliado! Obrigado');
                }}
              >{s <= (ride.rating || 0) ? '⭐' : '☆'}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
