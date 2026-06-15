import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone, FiMessageCircle, FiXCircle, FiMapPin, FiUser, FiNavigation } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { payRide } from '../services/krypt';
import voice from '../components/VoiceService';
import toast from 'react-hot-toast';

function UserLocation({ onLocated }) {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { onLocated([pos.coords.latitude, pos.coords.longitude]); },
        () => {}
      );
    }
  }, [map, onLocated]);
  return null;
}

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const prevStatusRef = useRef();

  useEffect(() => {
    loadRide();
    const interval = setInterval(loadRide, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadRide = async () => {
    try {
      const { ride: data } = await api.get(`/rides/${id}`);
      const prevStatus = prevStatusRef.current;
      prevStatusRef.current = data.status;

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
    } catch {
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
        toast.success('Codigo PIX copiado!');
      } else {
        toast.success('Pagamento registrado!');
      }
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!ride) return (
    <div className="container text-center" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <h2 className="font-bold">Usuario nao encontrado</h2>
      <p className="text-gray text-sm mt-8">Esta corrida nao existe ou foi removida</p>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/rides')}>Nova Corrida</button>
    </div>
  );

  const isMoto = ride.vehicle_type === 'moto';
  const vehicleIcon = isMoto ? '🏍️' : '🚗';

  const statusConfig = {
    pending: { label: 'Procurando motorista...', color: 'var(--blue)', pulse: true, icon: '🔍' },
    accepted: { label: 'Motorista a caminho', color: 'var(--blue)', pulse: true, icon: vehicleIcon },
    arrived: { label: 'Motorista chegou', color: 'var(--success)', pulse: true, icon: '✅' },
    in_progress: { label: 'Em viagem', color: 'var(--blue)', pulse: false, icon: '🚀' },
    completed: { label: 'Viagem finalizada', color: 'var(--success)', pulse: false, icon: '🎉' },
    cancelled: { label: 'Cancelada', color: 'var(--danger)', pulse: false, icon: '❌' },
  };

  const config = statusConfig[ride.status] || {};
  const origin = [ride.origin_lat, ride.origin_lng];
  const destination = [ride.destination_lat, ride.destination_lng];
  const hasRoute = origin && destination;

  return (
    <div className="container fade-in">
      <div className="card mb-12 text-center" style={{
        border: `2px solid ${config.color}`,
        padding: 20,
        animation: config.pulse ? 'pulse 2s infinite' : 'none',
      }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{config.icon}</div>
        <h3 className="font-bold">{config.label}</h3>
      </div>

      <div className="map-container mb-12" style={{ height: 300, borderRadius: 16, overflow: 'hidden' }}>
        <MapContainer center={origin} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <UserLocation onLocated={setUserCoords} />
          <Marker position={origin}
            icon={L.divIcon({ className: '', html: '<div style="width:24px;height:24px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px">📍</div>', iconSize: [24, 24] })} />
          <Marker position={destination}
            icon={L.divIcon({ className: '', html: '<div style="width:28px;height:28px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;color:white;font-weight:bold">🏁</div>', iconSize: [28, 28] })} />
          {hasRoute && (
            <Polyline positions={[origin, destination]} pathOptions={{
              color: '#2563eb', weight: 4, opacity: 0.7, dashArray: '10, 8',
            }} />
          )}
          {userCoords && (
            <Marker position={userCoords}
              icon={L.divIcon({ className: '', html: '<div style="width:16px;height:16px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', iconSize: [16, 16] })} />
          )}
        </MapContainer>
      </div>

      {ride.driver && (
        <div className="card mb-12">
          <div className="flex items-center gap-12">
            <div className="avatar" style={{ background: 'var(--blue)', fontSize: 28 }}>
              {isMoto ? '🏍️' : '🚗'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-bold">{ride.driver?.user?.name || 'Motorista'}</div>
              <div className="text-xs text-gray">
                {vehicleIcon} {ride.vehicle_model || ''} • {ride.vehicle_plate || ''}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span style={{ color: '#f59e0b' }}>★</span>
                <span className="text-sm font-semibold">{ride.driver.rating || '5.0'}</span>
                <span className="text-xs text-gray ml-4">{isMoto ? 'Moto' : 'Carro'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-12">
        <div className="flex items-center gap-8 mb-8">
          <FiMapPin color="#2563eb" size={16} />
          <span className="text-sm">{ride.origin_address}</span>
        </div>
        <div className="flex items-center gap-8">
          <FiNavigation color="#ef4444" size={16} />
          <span className="text-sm">{ride.destination_address}</span>
        </div>
        <div className="divider" />
        <div className="flex justify-between items-center">
          <span className="text-gray-dark text-sm">Valor</span>
          <span className="font-bold text-lg">R$ {ride.final_price || ride.estimated_price}</span>
        </div>
        {ride.distance_km && (
          <div className="flex justify-between mt-4">
            <span className="text-gray-dark text-xs">Distancia</span>
            <span className="text-xs font-semibold">{ride.distance_km} km</span>
          </div>
        )}
      </div>

      {ride.status === 'accepted' && (
        <div className="flex gap-8 mb-12">
          <button className="btn btn-outline" style={{ flex: 1 }}><FiMessageCircle /> Chat</button>
          <button className="btn btn-outline" style={{ flex: 1 }}><FiPhone /> Ligar</button>
        </div>
      )}

      {['pending', 'accepted'].includes(ride.status) && (
        <button className="btn btn-danger" onClick={handleCancel}><FiXCircle /> Cancelar Corrida</button>
      )}

      {ride.status === 'completed' && !ride.payment_status === 'paid' && !showPayment && (
        <div className="card mb-12">
          <h3 className="font-bold mb-12">Forma de Pagamento</h3>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => handlePay('pix')}>
              <span style={{ fontSize: 18 }}>💳</span> PIX
            </button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('card')}>
              💳 Cartao
            </button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('cash')}>
              💵 Dinheiro
            </button>
          </div>
        </div>
      )}

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
              onClick={() => { navigator.clipboard.writeText(showPayment.copyPaste); toast.success('Codigo copiado!'); }}>
              📋 {showPayment.copyPaste}
            </div>
          )}
          <p className="text-xs text-gray mt-8">Escaneie o QR Code ou copie o codigo para pagar</p>
        </div>
      )}

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
