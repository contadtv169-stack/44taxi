import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheckCircle, FiTruck, FiDollarSign, FiUserCheck, FiClock, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';

const TYPE_ICONS = {
  ride: FiTruck,
  payment: FiDollarSign,
  partner: FiUserCheck,
  promo: FiBell,
  info: FiBell,
};

const TYPE_COLORS = {
  ride: '#2563eb',
  payment: '#059669',
  partner: '#FFD700',
  promo: '#8b5cf6',
  info: '#6b7280',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="container fade-in">
      <div className="flex items-center justify-between mb-16">
        <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '8px' }} onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-lg" style={{ margin: 0 }}>Notificacoes</h3>
        {unreadCount > 0 && (
          <button className="btn btn-sm btn-primary" style={{ width: 'auto', fontSize: 12 }} onClick={markAllAsRead}>
            <FiCheck size={14} /> Marcar todas
          </button>
        )}
        {unreadCount === 0 && <div style={{ width: 80 }} />}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="loading-spinner" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24">
          <FiBell size={48} style={{ color: '#d1d5db', margin: '0 auto 12px', display: 'block' }} />
          <p className="text-gray-dark" style={{ fontWeight: 500 }}>Nenhuma notificacao</p>
          <p className="text-xs text-gray" style={{ marginTop: 4 }}>Voce recebera notificacoes aqui</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {notifications.map(n => {
            const Icon = TYPE_ICONS[n.type] || FiBell;
            const color = TYPE_COLORS[n.type] || '#6b7280';
            return (
              <div key={n.id} className="card flex gap-12 items-start"
                style={{
                  padding: 14,
                  opacity: n.read ? 0.6 : 1,
                  borderLeft: `3px solid ${n.read ? '#e5e7eb' : color}`,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onClick={() => { if (!n.read) markAsRead(n.id); }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: n.read ? '#f3f4f6' : `${color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={16} color={n.read ? '#9ca3af' : color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="font-bold" style={{ fontSize: 13, marginBottom: 2 }}>{n.title}</p>
                  <p className="text-xs text-gray-dark" style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{n.body}</p>
                  <p className="text-xs text-gray" style={{ marginTop: 4 }}>
                    <FiClock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {timeAgo(n.created_at)}
                  </p>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#2563eb',
                    flexShrink: 0, marginTop: 4,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
