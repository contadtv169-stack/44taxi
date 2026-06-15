import React, { useState, useEffect } from 'react';
import { FiBell, FiX } from 'react-icons/fi';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('44taxi_notif_prompt');
    if (!dismissed && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => setShow(true), 3000);
    }
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('44Taxi', {
          body: 'Notificações ativadas! Você receberá alertas de corridas e entregas.',
          icon: '/44taxi/favicon.ico',
        });
      }
    } catch {}
    setShow(false);
    localStorage.setItem('44taxi_notif_prompt', '1');
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('44taxi_notif_prompt', '1');
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 1000,
      background: '#1a1a2e', borderRadius: 16, padding: '16px 20px',
      color: '#fff', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'slideUp 0.4s ease',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FiBell size={22} color="#3b82f6" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Ativar notificações?</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Saiba quando sua corrida chegar</div>
      </div>
      <button onClick={handleAllow} style={{
        background: '#3b82f6', border: 'none', borderRadius: 20, padding: '8px 16px',
        color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>Ativar</button>
      <button onClick={handleDismiss} style={{
        background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', padding: 4,
      }}><FiX size={18} /></button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
