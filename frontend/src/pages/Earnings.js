import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiDownload, FiMapPin, FiCheckCircle, FiCopy, FiArrowLeft } from 'react-icons/fi';
import supabase from '../config/supabase';
import toast from 'react-hot-toast';

export default function Earnings() {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState({ total: 0, daily: 0, weekly: 0, monthly: 0, rides: [] });
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [pixCode, setPixCode] = useState(null);
  const [driverId, setDriverId] = useState(null);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    init();
    loadEarnings();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    // Check if user is a registered driver
    const { data: driver } = await supabase.from('drivers').select('*').eq('firebase_uid', session.user.id).maybeSingle();
    if (driver) { setDriverId(driver.id); setIsDriver(true); return; }
    // Check delivery
    const { data: delivery } = await supabase.from('delivery_people').select('*').eq('firebase_uid', session.user.id).maybeSingle();
    if (delivery) { setDriverId(delivery.id); setIsDriver(true); }
  };

  const loadEarnings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      // Get driver profile
      const { data: driver } = await supabase.from('drivers').select('id').eq('firebase_uid', session.user.id).maybeSingle();
      if (driver) {
        const { data: rides } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', driver.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false });
        if (rides) {
          const total = rides.reduce((s, r) => s + Number(r.final_price || r.estimated_price || 0), 0);
          const now = new Date();
          const today = rides.filter(r => new Date(r.completed_at).toDateString() === now.toDateString());
          const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
          const week = rides.filter(r => new Date(r.completed_at) >= weekStart);
          const month = rides.filter(r => new Date(r.completed_at).getMonth() === now.getMonth());
          const daily = today.reduce((s, r) => s + Number(r.final_price || r.estimated_price || 0), 0);
          const weekly = week.reduce((s, r) => s + Number(r.final_price || r.estimated_price || 0), 0);
          const monthly = month.reduce((s, r) => s + Number(r.final_price || r.estimated_price || 0), 0);
          setEarnings({ total, daily, weekly, monthly, rides });
        }
      } else {
        // Check delivery_people
        const { data: dp } = await supabase.from('delivery_people').select('id').eq('firebase_uid', session.user.id).maybeSingle();
        if (dp) {
          const { data: orders } = await supabase
            .from('food_orders')
            .select('*')
            .eq('delivery_person_id', dp.id)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false });
          if (orders) {
            const total = orders.reduce((s, o) => s + Number(o.delivery_fee || 0), 0);
            setEarnings({ total, daily: total, weekly: total, monthly: total, rides: orders });
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleWithdrawPix = async () => {
    setWithdrawing(true);
    try {
      // Try PixGo first, fallback to generated PIX
      let code = null;
      try {
        const PixGo = (await import('../services/pixgo')).default;
        const key = process.env.REACT_APP_PIXGO_KEY;
        if (key) {
          const res = await PixGo.createPix({ amount: earnings.total });
          if (res?.copyPaste) code = res.copyPaste;
        }
      } catch {}
      if (!code) {
        // Generate PIX BR Code
        const { generatePixCode } = await import('../services/krypt');
        code = generatePixCode(`44TAXI-${Date.now()}`, earnings.total, 'Saque de ganhos');
      }
      setPixCode(code);
      if (!code) toast.error('Erro ao gerar PIX');
    } catch (e) { toast.error('Erro ao gerar PIX'); }
    finally { setWithdrawing(false); }
  };

  const filterRides = () => {
    const { rides } = earnings;
    if (period === 'daily') return rides.filter(r => new Date(r.completed_at || r.created_at).toDateString() === new Date().toDateString());
    if (period === 'weekly') {
      const weekStart = new Date(); weekStart.setDate(new Date().getDate() - new Date().getDay());
      return rides.filter(r => new Date(r.completed_at || r.created_at) >= weekStart);
    }
    if (period === 'monthly') return rides.filter(r => new Date(r.completed_at || r.created_at).getMonth() === new Date().getMonth());
    return rides;
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  if (!isDriver) {
    return (
      <div className="container text-center fade-in" style={{ paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
        <h2 className="font-bold">Seus Ganhos</h2>
        <p className="text-gray mt-8">Cadastre-se como motorista ou entregador para acompanhar seus ganhos</p>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/partner')}>Quero ser parceiro</button>
      </div>
    );
  }

  const filtered = filterRides();

  return (
    <div className="container fade-in">
      <div className="flex items-center gap-12 mb-16">
        <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '8px' }} onClick={() => navigate(-1)}>
          <FiArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-lg" style={{ margin: 0 }}>Meus Ganhos</h3>
      </div>

      {/* Total */}
      <div className="card-yellow card mb-16 text-center" style={{ padding: 32 }}>
        <div className="text-sm font-semibold" style={{ opacity: 0.8 }}>Saldo Disponivel</div>
        <div className="price-tag" style={{ fontSize: 40, margin: '8px 0' }}>
          R$ <span>{(earnings?.total ?? 0).toFixed(2)}</span>
        </div>
        {earnings?.total > 0 && (
          <button className="btn btn-primary mt-12" style={{ width: '100%' }}
            onClick={handleWithdrawPix} disabled={withdrawing}>
            <FiDownload size={14} /> {withdrawing ? 'Gerando...' : 'Sacar via PIX'}
          </button>
        )}
        {pixCode && (
          <div className="mt-12" style={{
            background: '#fff', borderRadius: 12, padding: 12, wordBreak: 'break-all',
            fontSize: 11, color: '#333', textAlign: 'left',
          }}>
            <p className="font-semibold text-xs mb-4">Codigo PIX (copia e cola):</p>
            <p className="text-xs">{pixCode}</p>
            <button className="btn btn-sm btn-outline mt-8" style={{ width: 'auto', fontSize: 11 }}
              onClick={() => { navigator.clipboard.writeText(pixCode); toast.success('Codigo copiado!'); }}>
              <FiCopy size={12} /> Copiar
            </button>
          </div>
        )}
      </div>

      {/* Period stats */}
      <div className="grid-3 mb-16">
        <div className="card text-center" onClick={() => setPeriod('daily')} style={{ cursor: 'pointer', border: period === 'daily' ? '2px solid var(--yellow)' : 'none' }}>
          <div className="text-xs text-gray">Hoje</div>
          <div className="font-bold text-lg">R$ {(earnings?.daily ?? 0).toFixed(2)}</div>
        </div>
        <div className="card text-center" onClick={() => setPeriod('weekly')} style={{ cursor: 'pointer', border: period === 'weekly' ? '2px solid var(--yellow)' : 'none' }}>
          <div className="text-xs text-gray">Semana</div>
          <div className="font-bold text-lg">R$ {(earnings?.weekly ?? 0).toFixed(2)}</div>
        </div>
        <div className="card text-center" onClick={() => setPeriod('monthly')} style={{ cursor: 'pointer', border: period === 'monthly' ? '2px solid var(--yellow)' : 'none' }}>
          <div className="text-xs text-gray">Mes</div>
          <div className="font-bold text-lg">R$ {(earnings?.monthly ?? 0).toFixed(2)}</div>
        </div>
      </div>

      {/* Ride list */}
      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Corridas Realizadas</h3>
        {filtered.length === 0 ? (
          <p className="text-xs text-gray text-center py-12">Nenhuma corrida neste periodo</p>
        ) : (
          <div className="flex flex-col gap-8">
            {filtered.map(r => (
              <div key={r.id} className="flex justify-between items-center p-8" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div className="flex items-center gap-6 text-xs">
                    <FiMapPin size={10} color="#2563eb" />
                    <span>{r.origin_address || 'Entrega'}</span>
                  </div>
                  <div className="text-xs text-gray mt-4">
                    <FiCalendar size={10} style={{ marginRight: 4 }} />
                    {new Date(r.completed_at || r.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">R$ {r.final_price || r.estimated_price || r.delivery_fee || '0'}</div>
                  {r.status === 'completed' || r.status === 'delivered' ? (
                    <FiCheckCircle size={12} color="#059669" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
