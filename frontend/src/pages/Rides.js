import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiSearch, FiClock, FiDollarSign } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function SetViewOnChange({ coords }) {
  const map = useMap();
  if (coords) map.setView(coords, 15);
  return null;
}

export default function Rides() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [vehicleType, setVehicleType] = useState('carro');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentRides, setRecentRides] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const { rides } = await api.get('/rides/history');
      setRecentRides(rides?.slice(0, 5) || []);
    } catch {}
  };

  const handleEstimate = async () => {
    if (!originCoords || !destCoords) {
      toast.error('Selecione origem e destino no mapa');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/rides/estimate', {
        originLat: originCoords.lat, originLng: originCoords.lng,
        destLat: destCoords.lat, destLng: destCoords.lng,
        vehicleType,
      });
      setEstimate(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async () => {
    if (!estimate) return;
    setLoading(true);
    try {
      const { ride } = await api.post('/rides', {
        originLat: originCoords.lat, originLng: originCoords.lng,
        originAddress: origin || 'Origem',
        destLat: destCoords.lat, destLng: destCoords.lng,
        destAddress: dest || 'Destino',
        vehicleType,
      });
      toast.success('Corrida solicitada!');
      navigate(`/ride/${ride.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">
      <div className="card mb-16">
        <div className="flex items-center gap-8 mb-12">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <input className="input" placeholder="Sua localizacao" value={origin} onChange={e => setOrigin(e.target.value)} style={{ border: 'none', padding: '8px 0', fontSize: 14 }} />
        </div>
        <div className="flex items-center gap-8">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
          <input className="input" placeholder="Para onde vai?" value={dest} onChange={e => setDest(e.target.value)} style={{ border: 'none', padding: '8px 0', fontSize: 14 }} />
        </div>
      </div>

      <div className="map-container mb-16">
        <MapContainer center={originCoords || [-23.5505, -46.6333]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker onLocationSelect={(pos) => { setDestCoords(pos); toast('Destino marcado no mapa'); }} />
          <SetViewOnChange coords={originCoords} />
          {originCoords && <Marker position={originCoords} icon={L.divIcon({ className: 'custom-marker', html: '📍', iconSize: [24, 24] })} />}
          {destCoords && <Marker position={destCoords} icon={L.divIcon({ className: 'custom-marker', html: '🏁', iconSize: [24, 24] })} />}
        </MapContainer>
      </div>

      <div className="flex gap-8 mb-16">
        {['moto', 'carro'].map(v => (
          <div key={v} className={`vehicle-option ${vehicleType === v ? 'selected' : ''}`} onClick={() => setVehicleType(v)} style={{ flex: 1 }}>
            <span style={{ fontSize: 24 }}>{v === 'moto' ? '🏍️' : '🚗'}</span>
            <div>
              <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v}</div>
              <div className="text-xs text-gray">A partir de R$ {v === 'moto' ? '7' : '10'}</div>
            </div>
          </div>
        ))}
      </div>

      {estimate && (
        <div className="card mb-16 fade-in" style={{ border: '2px solid var(--yellow)' }}>
          <div className="flex justify-between items-center mb-8">
            <span className="text-gray-dark">Distancia</span>
            <span className="font-bold">{estimate.distanceKm} km</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-dark">Valor estimado</span>
            <span className="price-tag">R$ <span>{estimate.price}</span></span>
          </div>
        </div>
      )}

      {!estimate ? (
        <button className="btn btn-primary" onClick={handleEstimate} disabled={loading}>
          {loading ? 'Calculando...' : 'Calcular Preco'}
        </button>
      ) : (
        <button className="btn btn-primary" onClick={handleRequestRide} disabled={loading}>
          {loading ? 'Solicitando...' : `Solicitar ${vehicleType === 'moto' ? 'Moto' : 'Carro'}`}
        </button>
      )}

      {recentRides.length > 0 && (
        <div className="card mt-16">
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Corridas Recentes</h3>
          {recentRides.map(ride => (
            <div key={ride.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer' }} onClick={() => navigate(`/ride/${ride.id}`)}>
              <div>
                <div className="text-sm font-semibold">{ride.origin_address?.split(',')[0]}</div>
                <div className="text-xs text-gray">{ride.destination_address?.split(',')[0]}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">R$ {ride.final_price || ride.estimated_price}</div>
                <span className={`badge ${ride.status === 'completed' ? 'badge-green' : 'badge-yellow'}`}>{ride.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
