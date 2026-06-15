import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiGift, FiCopy, FiCheck, FiClock, FiPercent, FiStar } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const coupons = [
  {
    id: 1,
    title: '2 Corrida Gratis',
    desc: 'Sua segunda corrida e por nossa conta!',
    code: 'SEGUNDA44',
    discount: '100%',
    maxDiscount: 'Ate R$ 25',
    validUntil: '30/06/2026',
    minRides: 1,
    color: '#2563eb',
    icon: '🎉',
    featured: true,
  },
  {
    id: 2,
    title: 'Bem-Vindo 44Taxi',
    desc: 'Desconto na primeira corrida',
    code: 'BEMVINDO44',
    discount: '50%',
    maxDiscount: 'Ate R$ 15',
    validUntil: '30/06/2026',
    minRides: 0,
    color: '#059669',
    icon: '🚗',
    featured: true,
  },
  {
    id: 3,
    title: 'Off Food',
    desc: 'Desconto em pedidos de restaurante',
    code: 'FOOD44',
    discount: 'R$ 10',
    maxDiscount: 'Pedidos acima de R$ 30',
    validUntil: '15/07/2026',
    minRides: 0,
    color: '#d97706',
    icon: '🍔',
    featured: false,
  },
  {
    id: 4,
    title: 'Rota Amiga',
    desc: 'Indique um amigo e ganhe',
    code: 'AMIGO44',
    discount: 'R$ 20',
    maxDiscount: 'Para voce e seu amigo',
    validUntil: '31/12/2026',
    minRides: 0,
    color: '#7c3aed',
    icon: '👥',
    featured: false,
  },
];

export default function Coupons() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [copied, setCopied] = useState(null);
  const [userCoupons, setUserCoupons] = useState([]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Codigo ${code} copiado!`);
    setTimeout(() => setCopied(null), 3000);
  };

  const handleActivate = (coupon) => {
    if (!userCoupons.includes(coupon.id)) {
      setUserCoupons([...userCoupons, coupon.id]);
      toast.success(`Cupom ${coupon.title} ativado!`);
    } else {
      toast('Cupom ja ativado');
    }
  };

  const totalSavings = userCoupons.length * 25;
  const completedRides = profile?.total_rides || 0;

  return (
    <div className="container fade-in" style={{ paddingBottom: 40 }}>
      <div className="flex items-center gap-12 mb-16">
        <button className="btn btn-sm btn-ghost" style={{ width: 'auto', padding: '8px 0' }} onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-xl">Cupons</h2>
      </div>

      {completedRides >= 1 && (
        <div className="card mb-16" style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          borderRadius: 16, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.15 }}>🎉</div>
          <div className="flex items-center gap-12 mb-4">
            <FiStar size={28} />
            <div>
              <div className="font-bold text-lg">Parabens!</div>
              <div className="text-sm" style={{ opacity: 0.9 }}>
                Voce ja fez {completedRides} corrida{completedRides > 1 ? 's' : ''}!
              </div>
            </div>
          </div>
          <div className="mt-8 p-12" style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
            <div className="font-bold">Sua 2 Corrida e Gratis! 🎯</div>
            <div className="text-xs mt-4" style={{ opacity: 0.85 }}>
              Use o codigo <strong>SEGUNDA44</strong> na proxima corrida
            </div>
          </div>
        </div>
      )}

      {userCoupons.length > 0 && (
        <div className="card mb-16" style={{ background: '#f0f7ff' }}>
          <div className="flex items-center gap-8 mb-4">
            <FiGift color="var(--blue)" />
            <span className="font-semibold">Cupons Ativos</span>
          </div>
          <div className="flex gap-8 flex-wrap">
            {userCoupons.map(id => {
              const c = coupons.find(cp => cp.id === id);
              return c ? (
                <span key={id} className="badge badge-blue">{c.title}</span>
              ) : null;
            })}
          </div>
          <div className="text-xs text-gray mt-8">
            Economia total: <strong>R$ {totalSavings.toFixed(2)}</strong>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-12">
        {coupons.map(coupon => {
          const isActive = userCoupons.includes(coupon.id);
          const isNew = coupon.featured && !isActive;
          return (
            <div key={coupon.id} className="card" style={{
              padding: 16, position: 'relative', overflow: 'hidden',
              border: isNew ? `2px solid ${coupon.color}` : '1px solid var(--gray-100)',
            }}>
              {isNew && (
                <div style={{
                  position: 'absolute', top: 12, right: -28,
                  background: coupon.color, color: '#fff', fontSize: 10,
                  padding: '3px 30px', fontWeight: 700, letterSpacing: 1,
                  transform: 'rotate(45deg)',
                }}>NOVO</div>
              )}
              <div className="flex items-start gap-12">
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `${coupon.color}15`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
                }}>
                  {coupon.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-bold">{coupon.title}</div>
                  <div className="text-sm text-gray-dark">{coupon.desc}</div>
                  <div className="flex items-center gap-8 mt-8">
                    <span className="badge" style={{
                      background: `${coupon.color}20`, color: coupon.color,
                      fontWeight: 700, fontSize: 13,
                    }}>
                      {coupon.discount}
                    </span>
                    <span className="text-xs text-gray">
                      <FiClock size={12} style={{ marginRight: 4, display: 'inline' }} />
                      Ate {coupon.validUntil}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-8 mt-12">
                <div className="flex items-center gap-4" style={{
                  flex: 1, background: 'var(--gray-100)', borderRadius: 8,
                  padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700,
                  fontSize: 14, letterSpacing: 1,
                }}>
                  <FiPercent size={14} />
                  {coupon.code}
                </div>
                <button className="btn btn-sm" style={{
                  width: 'auto', background: copied === coupon.code ? 'var(--success)' : 'var(--black)',
                  color: '#fff', border: 'none',
                }} onClick={() => handleCopy(coupon.code)}>
                  {copied === coupon.code ? <FiCheck /> : <FiCopy />}
                </button>
                <button className="btn btn-sm" style={{
                  width: 'auto', background: isActive ? 'var(--gray-100)' : coupon.color,
                  color: isActive ? 'var(--gray-300)' : '#fff', border: 'none',
                }} onClick={() => handleActivate(coupon)} disabled={isActive}>
                  {isActive ? 'Ativo' : 'Ativar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-16 text-center" style={{ padding: 20 }}>
        <FiGift size={28} color="var(--blue)" style={{ marginBottom: 8 }} />
        <h3 className="font-bold">Indique e Ganhe</h3>
        <p className="text-sm text-gray-dark mt-4">
          Indique o 44Taxi para um amigo e ganhe R$ 20 de desconto!
        </p>
        <button className="btn btn-primary mt-12" style={{ width: 'auto' }}
          onClick={() => {
            const text = 'Vem usar o 44Taxi! Mobilidade e delivery com descontos.';
            navigator.clipboard.writeText(text);
            toast.success('Link de indicacao copiado!');
          }}>
          Compartilhar
        </button>
      </div>
    </div>
  );
}
