import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiMapPin, FiStar, FiPhone } from 'react-icons/fi';
import { TileLayer, Marker } from 'react-leaflet';
import SafeMap from '../components/SafeMap';
import api from '../services/api';
import toast from 'react-hot-toast';

const statusFlow = {
  pending: { label: 'Aguardando confirmacao', icon: '⏳', color: 'var(--warning)' },
  confirmed: { label: 'Pedido confirmado', icon: '✅', color: 'var(--info)' },
  preparing: { label: 'Preparando', icon: '👨‍🍳', color: 'var(--info)' },
  ready: { label: 'Pronto para entrega', icon: '📦', color: 'var(--success)' },
  out_for_delivery: { label: 'Saiu para entrega', icon: '🚚', color: 'var(--success)' },
  delivered: { label: 'Entregue', icon: '🎉', color: 'var(--success)' },
  cancelled: { label: 'Cancelado', icon: '❌', color: 'var(--danger)' },
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadOrder = async () => {
    try {
      const { order: data } = await api.get(`/food/orders/${id}`);
      setOrder(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
  const currentStep = statusSteps.indexOf(order?.status);
  const isActive = (idx) => idx <= currentStep;
  const isLast = (idx) => idx === statusSteps.length - 1;

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!order) return <div className="container text-center mt-16">Pedido nao encontrado</div>;

  const statusInfo = statusFlow[order.status] || {};

  return (
    <div className="container fade-in">
      {/* Status Header */}
      <div className={`card mb-16 text-center ${order.status !== 'delivered' && order.status !== 'cancelled' ? 'pulse' : ''}`} style={{ border: `2px solid ${statusInfo.color}`, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{statusInfo.icon}</div>
        <h2 className="font-bold">{statusInfo.label}</h2>
        <p className="text-sm text-gray mt-4">Pedido #{order.id?.slice(0, 8)}</p>
      </div>

      {/* Progress Steps */}
      {order.status !== 'cancelled' && (
        <div className="card mb-16">
          <div className="flex justify-between" style={{ position: 'relative' }}>
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex flex-col items-center" style={{ flex: 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: isActive(idx) ? 'var(--yellow)' : 'var(--gray-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: isActive(idx) ? 'var(--black)' : 'var(--gray-400)',
                  position: 'relative', zIndex: 2,
                }}>
                  {idx + 1}
                </div>
                <div className="text-xs text-center mt-4" style={{ color: isActive(idx) ? 'var(--black)' : 'var(--gray-300)', fontWeight: isActive(idx) ? 600 : 400, maxWidth: 60 }}>
                  {statusFlow[step].label.split(' ')[0]}
                </div>
              </div>
            ))}
            <div style={{
              position: 'absolute', top: 16, left: '8%', right: '8%', height: 2,
              background: `linear-gradient(to right, var(--yellow) ${currentStep / (statusSteps.length - 1) * 100}%, var(--gray-200) ${currentStep / (statusSteps.length - 1) * 100}%)`,
              zIndex: 1,
            }} />
          </div>
        </div>
      )}

      {/* Map */}
      {order.delivery_lat && (
        <div className="map-container mb-16" style={{ height: 180 }}>
          <SafeMap center={[order.delivery_lat, order.delivery_lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[order.delivery_lat, order.delivery_lng]} />
          </SafeMap>
        </div>
      )}

      {/* Order Info */}
      <div className="card mb-16">
        <div className="flex items-center gap-12 mb-12">
          <div className="avatar">{order.restaurant?.name?.[0] || 'R'}</div>
          <div>
            <div className="font-semibold">{order.restaurant?.name || 'Restaurante'}</div>
            <div className="text-xs text-gray">{order.restaurant?.phone}</div>
          </div>
        </div>

        <div className="divider" />

        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm mb-4">
            <span>{item.quantity}x {item.name}</span>
            <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}

        <div className="divider" />
        <div className="flex justify-between text-sm"><span className="text-gray-dark">Subtotal</span><span>R$ {order.subtotal}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-dark">Entrega</span><span>R$ {order.delivery_fee}</span></div>
        <div className="flex justify-between font-bold mt-4"><span>Total</span><span>R$ {order.total}</span></div>
      </div>

      <div className="card mb-16">
        <div className="flex items-center gap-8 mb-4">
          <FiMapPin color="var(--danger)" />
          <span className="text-sm">{order.delivery_address}</span>
        </div>
        <div className="flex items-center gap-8">
          <FiPhone color="var(--info)" />
          <span className="text-sm">{order.restaurant?.phone}</span>
        </div>
      </div>

      {/* Rating */}
      {order.status === 'delivered' && (
        <div className="card text-center">
          <h3 className="font-bold mb-8">Avalie o pedido</h3>
          <div className="flex gap-8 justify-center mb-8" style={{ fontSize: 32 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ cursor: 'pointer' }}
                onClick={async () => {
                  await api.post(`/food/orders/${id}/rate`, { rating_restaurant: s });
                  toast.success('Avaliado! Obrigado');
                }}
              >{s <= (order.rating_restaurant || 0) ? '⭐' : '☆'}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
