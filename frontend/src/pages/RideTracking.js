import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPhone, FiMessageCircle, FiXCircle } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../services/api';
import { payRide } from '../services/krypt';
import toast from 'react-hot-toast';

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRide();
    const interval = setInterval(loadRide, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadRide = async () => {
    try {
      const { ride: data } = await api.get(`/rides/${id}`);
      setRide(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/rides/${id}/status`, { status: 'cancelled' });
      toast.success('Corrida cancelada');
      navigate('/rides');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handlePay = async (method) => {
    try {
      const data = await payRide(id, method);
      if (data.payment?.qrCodeBase64) {
        setShowPayment(true);
        toast.success('QR Code gerado!');
      } else {
        toast.success('Pagamento registrado!');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!ride) return <div className="container text-center mt-16">Corrida nao encontrada</div>;

  const statusConfig = {
    pending: { label: 'Procurando motorista...', color: 'var(--warning)', pulse: true },
    accepted: { label: 'Motorista a caminho', color: 'var(--info)', pulse: true },
    arrived: { label: 'Motorista chegou', color: 'var(--success)', pulse: true },
    in_progress: { label: 'Em viagem', color: 'var(--info)', pulse: false },
    completed: { label: 'Viagem finalizada', color: 'var(--success)', pulse: false },
    cancelled: { label: 'Cancelada', color: 'var(--danger)', pulse: false },
  };

  const config = statusConfig[ride.status] || {};

  return (
    <div className="container fade-in">
      <div className={`card mb-16 ${config.pulse ? 'pulse' : ''}`} style={{ border: `2px solid ${config.color}` }}>
        <div className="flex items-center gap-8 mb-12">
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: config.color }} />
          <span className="font-bold" style={{ color: config.color }}>{config.label}</span>
        </div>

        <div className="map-container mb-16" style={{ height: 200 }}>
          <MapContainer center={[ride.origin_lat, ride.origin_lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[ride.origin_lat, ride.origin_lng]} />
            {ride.destination_lat && <Marker position={[ride.destination_lat, ride.destination_lng]} />}
          </MapContainer>
        </div>

        <div className="flex items-center gap-12 mb-12">
          <div className="avatar">{ride.driver?.user?.name?.[0] || '?'}</div>
          <div>
            <div className="font-bold">{ride.driver?.user?.name || 'Aguardando motorista'}</div>
            <div className="text-xs text-gray">{ride.vehicle_model || ''} - {ride.vehicle_plate || ''}</div>
          </div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="flex items-center gap-12 mb-8">
          <FiMapPin color="var(--success)" />
          <span className="text-sm">{ride.origin_address}</span>
        </div>
        <div className="flex items-center gap-12">
          <FiMapPin color="var(--danger)" />
          <span className="text-sm">{ride.destination_address}</span>
        </div>
        <div className="divider" />
        <div className="flex justify-between">
          <span className="text-gray-dark">Valor</span>
          <span className="font-bold">R$ {ride.final_price || ride.estimated_price}</span>
        </div>
      </div>

      {ride.status === 'accepted' && (
        <div className="flex gap-8 mb-16">
          <button className="btn btn-outline" style={{ flex: 1 }}><FiMessageCircle /> Chat</button>
          <button className="btn btn-outline" style={{ flex: 1 }}><FiPhone /> Ligar</button>
        </div>
      )}

      {['pending', 'accepted'].includes(ride.status) && (
        <button className="btn btn-danger" onClick={handleCancel}><FiXCircle /> Cancelar Corrida</button>
      )}

      {ride.status === 'completed' && !ride.payment_status === 'paid' && (
        <div className="card mb-16">
          <h3 className="font-bold mb-12">Pagamento</h3>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('pix')}>PIX</button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('card')}>Cartao</button>
            <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => handlePay('cash')}>Dinheiro</button>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="card mb-16 fade-in">
          <h3 className="font-bold text-center mb-12">Pague com PIX</h3>
          <div className="qr-container">
            <img src={ride.qrCodeBase64 || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=44taxi'} alt="QR Code" style={{ width: 200, height: 200 }} />
            <p className="text-xs text-gray text-center">Escaneie o QR Code com seu banco</p>
          </div>
        </div>
      )}

      {ride.status === 'completed' && (
        <div className="card">
          <h3 className="font-bold mb-12">Avaliar Viagem</h3>
          <div className="flex gap-8 justify-center mb-12" style={{ fontSize: 28 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ cursor: 'pointer' }}
                onClick={async () => {
                  await api.post(`/rides/${id}/rate`, { rating: s });
                  toast.success('Avaliado!');
                }}
              >{s <= (ride.rating || 0) ? '⭐' : '☆'}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
