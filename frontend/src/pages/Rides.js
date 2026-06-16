import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCrosshair, FiClock, FiDollarSign, FiNavigation, FiSearch } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import supabase from '../config/supabase';
import { reverseGeocode, searchLocations } from '../services/geocode';
import toast from 'react-hot-toast';

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) { onLocationSelect(e.latlng); },
  });
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
  const [originAddr, setOriginAddr] = useState(null);
  const [destAddr, setDestAddr] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState('');
  const [showOriginSearch, setShowOriginSearch] = useState(false);
  const searchTimeout = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(c);
        setMapCenter(c);
        reverseGeocode(c[0], c[1]).then(addr => {
          setOriginAddr(addr);
          setOrigin(addr.short || addr.full);
        });
      }, () => setMapCenter([-23.5505, -46.6333]));
    }
  }, []);

  useEffect(() => {
    if (originCoords) {
      reverseGeocode(originCoords[0], originCoords[1]).then(addr => {
        setOriginAddr(addr);
        setOrigin(addr.short || addr.full);
      });
    }
  }, [originCoords]);

  useEffect(() => {
    if (destCoords) {
      reverseGeocode(destCoords[0], destCoords[1]).then(addr => {
        setDestAddr(addr);
        setDest(addr.short || addr.full);
      });
    }
  }, [destCoords]);

  const handleSearch = useCallback((query, type) => {
    setSearching(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchLocations(query);
      setSearchResults(results);
    }, 500);
  }, []);

  const selectSearchResult = (result, type) => {
    setSearchResults([]);
    setSearching('');
    if (type === 'origin') {
      setOriginCoords([result.lat, result.lng]);
      setOrigin(result.short || result.label);
      setMapCenter([result.lat, result.lng]);
    } else {
      setDestCoords([result.lat, result.lng]);
      setDest(result.short || result.label);
    }
  };

  const handleEstimate = async () => {
    if (!originCoords || !destCoords) {
      toast.error('Clique no mapa para marcar o destino');
      return;
    }
    setLoading(true);
    const dist = haversine(originCoords[0], originCoords[1], destCoords[0], destCoords[1]);
    const price = vehicleType === 'moto' ? dist * 1.5 + 5 : dist * 2.5 + 7;
    setTimeout(() => {
      setEstimate({ price: price.toFixed(2), distanceKm: dist.toFixed(1) });
      setLoading(false);
    }, 500);
  };

  const handleRequestRide = async () => {
    if (!estimate) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { toast.error('Faca login primeiro'); setLoading(false); return; }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('firebase_uid', session.user.id)
        .single();

      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: profile?.id,
          vehicle_type: vehicleType,
          origin_lat: originCoords[0],
          origin_lng: originCoords[1],
          origin_address: origin || 'Origem',
          destination_lat: destCoords[0],
          destination_lng: destCoords[1],
          destination_address: dest || 'Destino',
          distance_km: estimate.distanceKm,
          estimated_price: estimate.price,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Corrida solicitada!');
      navigate(`/ride/${ride.id}`);
    } catch (err) {
      toast.error(err.message || 'Erro ao solicitar corrida');
    }
    finally { setLoading(false); }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setOriginCoords(c);
        setMapCenter(c);
        reverseGeocode(c[0], c[1]).then(addr => setOrigin(addr.short || addr.full));
        toast.success('Localizacao atualizada');
      }, () => toast.error('Nao foi possivel obter localizacao'));
    }
  };

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={mapCenter || [-23.5505, -46.6333]} zoom={mapCenter ? 15 : 3}
          style={{ height: '100%', width: '100%' }} zoomControl={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CurrentLocation onLocated={(c) => { setOriginCoords(c); setMapCenter(c); }} />
          <LocationMarker onLocationSelect={(pos) => {
            setDestCoords([pos.lat, pos.lng]);
            setShowOriginSearch(false);
            toast('Destino marcado no mapa');
          }} />
          {originCoords && (
            <Marker position={originCoords}
              icon={L.divIcon({ className: '', html: '<div style="width:20px;height:20px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', iconSize: [20, 20] })}>
              {originAddr && <Popup>{originAddr.short}</Popup>}
            </Marker>
          )}
          {destCoords && (
            <Marker position={destCoords}
              icon={L.divIcon({ className: '', html: '<div style="width:24px;height:24px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px">🏁</div>', iconSize: [24, 24] })}>
              {destAddr && <Popup>{destAddr.short}</Popup>}
            </Marker>
          )}
        </MapContainer>

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

      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '16px 16px 20px', marginTop: -20, position: 'relative', zIndex: 10,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
      }}>
        <div className="flex items-center gap-8 mb-12" style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '8px 14px', position: 'relative' }} onClick={() => setShowOriginSearch(true)}>
          <FiMapPin color="#2563eb" size={18} />
          <input className="input" placeholder="Sua localizacao" value={origin}
            onChange={e => { setOrigin(e.target.value); if (showOriginSearch) handleSearch(e.target.value, 'origin'); }}
            onFocus={() => setShowOriginSearch(true)}
            style={{ border: 'none', padding: '8px 0', fontSize: 14, background: 'transparent', flex: 1 }} />
          {originAddr?.city && <span className="text-xs text-gray" style={{ whiteSpace: 'nowrap' }}>{originAddr.city}</span>}
        </div>
        {showOriginSearch && searchResults.length > 0 && (
          <div className="card mb-12" style={{ position: 'absolute', zIndex: 100, left: 16, right: 16, maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.map((r, i) => (
              <div key={i} className="flex items-center gap-8" style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                onClick={() => { selectSearchResult(r, 'origin'); setShowOriginSearch(false); }}>
                <FiSearch size={14} color="var(--gray-300)" />
                <span className="text-sm">{r.short}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-8 mb-12" style={{ background: 'var(--gray-100)', borderRadius: 12, padding: '8px 14px', position: 'relative' }}>
          <FiNavigation color="#ef4444" size={18} />
          <input ref={destRef} className="input" placeholder="Para onde vai? (clique no mapa ou pesquise)"
            value={dest} onChange={e => { setDest(e.target.value); handleSearch(e.target.value, 'dest'); }}
            style={{ border: 'none', padding: '8px 0', fontSize: 14, background: 'transparent', flex: 1 }} />
          {destAddr?.city && <span className="text-xs text-gray" style={{ whiteSpace: 'nowrap' }}>{destAddr.city}</span>}
        </div>
        {searchResults.length > 0 && dest && (
          <div className="card mb-12" style={{ position: 'absolute', zIndex: 100, left: 16, right: 16, maxHeight: 200, overflowY: 'auto' }}>
            {searchResults.map((r, i) => (
              <div key={i} className="flex items-center gap-8" style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                onClick={() => selectSearchResult(r, 'dest')}>
                <FiSearch size={14} color="var(--gray-300)" />
                <span className="text-sm">{r.short}</span>
              </div>
            ))}
          </div>
        )}

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

        {estimate && (
          <div className="flex items-center justify-between mb-12 p-12" style={{ background: '#f0f7ff', borderRadius: 12 }}>
            <div>
              <span className="text-sm text-gray-dark">{estimate.distanceKm} km</span>
              <span className="price-tag" style={{ fontSize: 22, marginLeft: 12 }}>R$ <span>{estimate.price}</span></span>
            </div>
            <span className="text-xs text-gray">~{Math.round(estimate.distanceKm * 3 + 5)} min</span>
          </div>
        )}

        <button className={`btn ${estimate ? 'btn-primary' : 'btn-secondary'}`}
          onClick={estimate ? handleRequestRide : handleEstimate} disabled={loading}>
          {loading ? 'Processando...' : estimate ? `Solicitar ${vehicleType === 'moto' ? 'Moto' : 'Carro'} ${estimate ? `- R$ ${estimate.price}` : ''}` : 'Calcular Preco'}
        </button>
      </div>
    </div>
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
