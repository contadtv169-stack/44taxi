import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiMapPin, FiClock, FiUser, FiDollarSign, FiPackage } from 'react-icons/fi';
import supabase from '../config/supabase';
import voice from '../components/VoiceService';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [dp, setDp] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    init();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data: d } = await supabase.from('delivery_people').select('*').eq('firebase_uid', session.user.id).maybeSingle();
    if (d) {
      setDp(d);
      setOnline(d.available || false);
      const { data: orders } = await supabase
        .from('food_orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (orders) setPendingOrders(orders);
      const channel = supabase
        .channel('delivery_orders')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'food_orders',
          filter: 'status=eq.pending',
        }, (payload) => {
          setPendingOrders(prev => [payload.new, ...prev]);
          voice.orderReceived();
          toast('Novo pedido de entrega!', { icon: '🍕' });
        })
        .subscribe();
      channelRef.current = channel;
    }
    setLoading(false);
  };

  const toggleOnline = async () => {
    const newStatus = !online;
    setOnline(newStatus);
    if (dp) await supabase.from('delivery_people').update({ available: newStatus }).eq('id', dp.id);
  };

  const handleAccept = async (order) => {
    try {
      const { error } = await supabase
        .from('food_orders')
        .update({ delivery_person_id: dp.id, status: 'out_for_delivery' })
        .eq('id', order.id);
      if (error) throw error;
      setPendingOrders(prev => prev.filter(o => o.id !== order.id));
      setActiveOrder(order);
      toast.success('Pedido aceito!');
      voice.speak('Pedido aceito! Dirija-se ao restaurante.', { rate: 0.85 });
    } catch (err) { toast.error(err.message); }
  };

  const handleDeliver = async () => {
    await supabase.from('food_orders').update({ status: 'delivered' }).eq('id', activeOrder.id);
    toast.success('Entrega finalizada!');
    voice.arrivedDestination(activeOrder.delivery_address || 'destino');
    setActiveOrder(null);
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!dp) return (
    <div className="container text-center fade-in" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛵</div>
      <h2 className="font-bold">Modo Entregador</h2>
      <p className="text-gray mt-8">Cadastre-se como entregador para receber pedidos</p>
      <button className="btn btn-primary mt-16" onClick={() => navigate('/partner')}>Quero ser entregador</button>
    </div>
  );

  return (
    <div className="container fade-in">
      <div className="flex items-center justify-between mb-16">
        <div className="flex items-center gap-8">
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiUser size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">{dp.name || 'Entregador'}</p>
            <p className="text-xs text-gray">Online: {online ? 'Sim' : 'Nao'}</p>
          </div>
        </div>
        <button className={`btn btn-sm ${online ? 'btn-danger' : 'btn-primary'}`}
          style={{ width: 'auto', fontSize: 12 }} onClick={toggleOnline}>
          {online ? 'Ficar Offline' : 'Ficar Online'}
        </button>
      </div>

      {activeOrder && (
        <div className="card mb-16" style={{ border: '2px solid var(--yellow)' }}>
          <h3 className="font-bold mb-8">Pedido em andamento</h3>
          <div className="text-xs mb-4">
            <span className="font-semibold">Entrega em:</span> {activeOrder.delivery_address}
          </div>
          <div className="text-xs mb-8">
            <span className="font-semibold">Taxa:</span> R$ {activeOrder.delivery_fee}
          </div>
          <button className="btn btn-success" style={{ width: '100%' }} onClick={handleDeliver}>
            <FiCheck size={14} /> Confirmar Entrega
          </button>
        </div>
      )}

      <h3 className="font-semibold mb-12">
        Pedidos Disponiveis {online ? `(${pendingOrders.length})` : '(Offline)'}
      </h3>
      {!online ? (
        <div className="card text-center py-16">
          <p className="text-gray text-sm">Fique online para receber pedidos</p>
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray text-sm">Nenhum pedido disponivel</p>
          <p className="text-xs text-gray mt-4">Aguardando...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {pendingOrders.map(o => (
            <div key={o.id} className="card" style={{ padding: 14, borderLeft: '3px solid #8b5cf6' }}>
              <div className="flex items-center gap-6 text-xs mb-4">
                <FiPackage size={12} color="#8b5cf6" />
                <span className="font-medium">{o.items?.[0]?.name || 'Pedido'}{o.items?.length > 1 ? ` +${o.items.length-1}` : ''}</span>
              </div>
              <div className="flex items-center gap-6 text-xs mb-4">
                <FiMapPin size={12} color="#ef4444" />
                <span>{o.delivery_address}</span>
              </div>
              <div className="flex justify-between text-xs mb-12">
                <span className="text-gray">Taxa: R$ {o.delivery_fee}</span>
                <span className="font-bold">R$ {o.total}</span>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-success" style={{ flex: 1, fontSize: 13 }} onClick={() => handleAccept(o)}>
                  <FiCheck size={14} /> Aceitar
                </button>
                <button className="btn btn-outline" style={{ flex: 1, fontSize: 13, color: '#dc2626', borderColor: '#dc2626' }} onClick={() => setPendingOrders(prev => prev.filter(x => x.id !== o.id))}>
                  <FiX size={14} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
