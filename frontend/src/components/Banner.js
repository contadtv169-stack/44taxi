import React from 'react';

const banners = {
  promo: {
    title: 'Corrida com desconto',
    subtitle: 'Até 30% off na primeira viagem',
    emoji: '🏷️',
    gradient: 'linear-gradient(135deg, #1a1a2e, #2563eb)',
  },
  food: {
    title: 'Peça já sua comida',
    subtitle: 'Entrega grátis em pedidos acima de R$ 30',
    emoji: '🍕',
    gradient: 'linear-gradient(135deg, #dc2626, #2563eb)',
  },
  driver: {
    title: 'Vem ser parceiro!',
    subtitle: 'Motorista 44Taxi - Ganhe até R$ 3.500/semana',
    emoji: '🚗',
    gradient: 'linear-gradient(135deg, #059669, #2563eb)',
  },
  partner: {
    title: 'Vem ser parceiro!',
    subtitle: 'Cadastre seu restaurante e venda mais',
    emoji: '🏪',
    gradient: 'linear-gradient(135deg, #d97706, #2563eb)',
  },
  moto: {
    title: 'Moto Taxi 44',
    subtitle: 'Mais rápido, mais barato',
    emoji: '🏍️',
    gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)',
  },
};

export default function Banner({ type = 'promo', onClick, style }) {
  const data = banners[type] || banners.promo;

  return (
    <div
      onClick={onClick}
      style={{
        background: data.gradient,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: onClick ? 'pointer' : 'default',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', right: -20, bottom: -20, fontSize: 80, opacity: 0.1,
      }}>{data.emoji}</div>
      <span style={{ fontSize: 36 }}>{data.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{data.title}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{data.subtitle}</div>
      </div>
      {onClick && (
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px',
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
        }}>Ver →</div>
      )}
    </div>
  );
}
