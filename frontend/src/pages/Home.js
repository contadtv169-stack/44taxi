import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMap, FiCoffee, FiBell, FiArrowRight, FiChevronRight } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { useAuth } from '../contexts/AuthContext';
import Banner from '../components/Banner';
import Logo from '../components/Logo';
import NotificationPrompt from '../components/NotificationPrompt';

function MapController() {
  const map = useMap();
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => map.setView([pos.coords.latitude, pos.coords.longitude], 14),
        () => map.setView([-23.5505, -46.6333], 4)
      );
    }
  }, [map]);
  return null;
}

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      }, () => setUserLocation([-23.5505, -46.6333]));
    }
  }, []);

  return (
    <div className="container fade-in">
      <NotificationPrompt />

      {/* Welcome Card */}
      <div className="card-black card mb-12" style={{ padding: 24, borderRadius: 20 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm" style={{ opacity: 0.7 }}>Olá,</div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>{profile?.name?.split(' ')[0] || 'Usuario'}</h2>
          </div>
          <Logo size={35} variant="icon" />
        </div>
        <div className="flex gap-8 mt-12">
          <button className="btn btn-sm btn-outline" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            onClick={() => navigate('/rides')}>
            🚗 Corrida
          </button>
          <button className="btn btn-sm btn-outline" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
            onClick={() => navigate('/food')}>
            🍕 Delivery
          </button>
        </div>
      </div>

      {/* Banner */}
      <Banner type="promo" onClick={() => navigate('/rides')} style={{ marginBottom: 12 }} />
      <Banner type="moto" onClick={() => navigate('/rides')} style={{ marginBottom: 16 }} />

      {/* Quick Actions */}
      <div className="grid-2 mb-16">
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 20, border: '1px solid var(--gray-100)' }}
          onClick={() => navigate('/rides')}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <FiMap size={24} color="#2563eb" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>Corrida</h3>
          <p className="text-xs text-gray" style={{ marginTop: 2 }}>Moto • Carro</p>
        </div>
        <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 20, border: '1px solid var(--gray-100)' }}
          onClick={() => navigate('/food')}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <FiCoffee size={24} color="#ef4444" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 15 }}>Food</h3>
          <p className="text-xs text-gray" style={{ marginTop: 2 }}>Restaurantes</p>
        </div>
      </div>

      {/* Mini Map */}
      <div className="card mb-16" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ height: 180 }}>
          <MapContainer center={userLocation || [-23.5505, -46.6333]} zoom={userLocation ? 15 : 3}
            style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController />
            {userLocation && <Marker position={userLocation} />}
          </MapContainer>
        </div>
        <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="text-sm text-gray-dark">📍 {userLocation ? 'Sua localização' : 'Buscando localização...'}</span>
          <button className="btn btn-sm btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/rides')}>
            Solicitar <FiArrowRight size={14} />
          </button>
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
            <div key={i} className="flex items-center justify-between"
              style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }}
              onClick={() => navigate(item.path)}>
              <div className="flex items-center gap-12">
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
              </div>
              <FiChevronRight color="var(--gray-300)" />
            </div>
          ))}
        </div>
      </div>

      {/* Become Partner */}
      {profile?.role === 'cliente' && (
        <Banner type="driver" onClick={() => navigate('/partner')} style={{ marginBottom: 8 }} />
      )}
    </div>
  );
}
