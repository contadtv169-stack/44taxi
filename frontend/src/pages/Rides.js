import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCrosshair, FiClock, FiDollarSign, FiNavigation } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import toast from 'react-hot-toast';

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) { onLocationSelect(e.latlng); },
  });
  return null;
}

function SetView({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.setView(coords, 15); }, [coords, map]);
  return null;
}

function CurrentLocation({ onLocated }) {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { const latlng = [pos.coords.latitude, pos.coords.longitude]; map.setView(latlng, 15); onLocated(latlng); },
        () => { map.setView([-23.5505, -46.6333], 4); }
      );
    }
  }, [map, onLocated]);
  return null;
}

export default function Rides() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [vehicleType, setVehicleType] = useState('carro');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const destRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(c);
        setMapCenter(c);
      }, () => setMapCenter([-23.5505, -46.6333]));
    }
  }, []);

  const handleEstimate = async () => {
    if (!originCoords || !destCoords) {
      toast.error('Clique no mapa para marcar o destino');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/rides/estimate', {
        originLat: originCoords[0], originLng: originCoords[1],
        destLat: destCoords[0], destLng: destCoords[1],
        vehicleType,
      });
      setEstimate(data);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleRequestRide = async () => {
    if (!estimate) return;
    setLoading(true);
    try {
      const { ride } = await api.post('/rides', {
        originLat: originCoords[0], originLng: originCoords[1],
        originAddress: origin || 'Origem selecionada',
        destLat: destCoords[0], destLng: destCoords[1],
        destAddress: dest || 'Destino selecionado',
        vehicleType,
      });
      toast.success('Corrida solicitada!');
      navigate(`/ride/${ride.id}`);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(c);
        setMapCenter(c);
        toast.success('Localização atualizada');
      }, () => toast.error('Não foi possível obter localização'));
    }
  };

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Map - Full height */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={mapCenter || [-23.5505, -46.6333]} zoom={mapCenter ? 15 : 3}
          style={{ height: '100%', width: '100%' }} zoomControl={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CurrentLocation onLocated={(c) => { setOriginCoords(c); setMapCenter(c); }} />
          <LocationMarker onLocationSelect={(pos) => { setDestCoords([pos.lat, pos.lng]); setDest(`Destino: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`); toast('Destino marcado no mapa'); }} />
          {originCoords && <Marker position={originCoords} icon={L.divIcon({ className: '', html: '<div style="width:20px;height:20px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', iconSize: [20, 20] })} />}
          {destCoords && <Marker position={destCoords} icon={L.divIcon({ className: '', html: '<div style="width:24px;height:24px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px">🏁</div>', iconSize: [24, 24] })} />}
        </MapContainer>

        {/* Current Location Button */}
        <button onClick={handleLocateMe} style={{
          position: 'absolute', top: 16, right: 16, zIndex: 1000,
          width: 44, height: 44, borderRadius: '50%', background: '#fff',
          border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <FiCrosshair size={20} color="#2563eb" />
        </button>
      </div>

      {/* Bottom Sheet */}
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '16px 16px 20px', marginTop: -20, position: 'relative', zIndex: 10,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Destination Input */}
        <div className="flex items-center gap-8 mb-12" style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '8px 14px' }}>
          <FiMapPin color="#2563eb" size={18} />
          <input className="input" placeholder="Sua localização" value={origin}
            onChange={e => setOrigin(e.target.value)}
            style={{ border: 'none', padding: '8px 0', fontSize: 14, background: 'transparent', flex: 1 }} readOnly />
        </div>
        <div className="flex items-center gap-8 mb-12" style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '8px 14px' }}>
          <FiNavigation color="#ef4444" size={18} />
          <input ref={destRef} className="input" placeholder="Para onde vai? (clique no mapa)"
            value={dest} onChange={e => setDest(e.target.value)}
            style={{ border: 'none', padding: '8px 0', fontSize: 14, background: 'transparent', flex: 1 }} />
        </div>

        {/* Vehicle Selector */}
        <div className="flex gap-8 mb-12">
          {[
            { type: 'moto', label: 'Moto', icon: '🏍️', price: 'R$ 7+' },
            { type: 'carro', label: 'Carro', icon: '🚗', price: 'R$ 10+' },
          ].map(v => (
            <div key={v.type} className={`vehicle-option ${vehicleType === v.type ? 'selected' : ''}`}
              onClick={() => setVehicleType(v.type)} style={{ flex: 1, padding: '12px 14px' }}>
              <span style={{ fontSize: 22 }}>{v.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{v.label}</div>
                <div className="text-xs text-gray">a partir</div>
                <div className="text-xs font-bold">{v.price}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Estimate / Request */}
        {estimate && (
          <div className="flex items-center justify-between mb-12 p-12" style={{ background: '#f0f7ff', borderRadius: 12 }}>
            <div>
              <span className="text-sm text-gray-dark">{estimate.distanceKm} km</span>
              <span className="price-tag" style={{ fontSize: 22, marginLeft: 12 }}>R$ <span>{estimate.price}</span></span>
            </div>
            <span className="text-xs text-gray">~15 min</span>
          </div>
        )}

        <button className={`btn ${estimate ? 'btn-primary' : 'btn-secondary'}`}
          onClick={estimate ? handleRequestRide : handleEstimate} disabled={loading}>
          {loading ? 'Processando...' : estimate ? `Solicitar ${vehicleType === 'moto' ? 'Moto' : 'Carro'} ${estimate ? `- R$ ${estimate.price}` : ''}` : 'Calcular Preço'}
        </button>
      </div>
    </div>
  );
}
