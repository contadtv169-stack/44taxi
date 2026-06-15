import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiMinus, FiMapPin } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';
import { payOrder } from '../services/krypt';
import toast from 'react-hot-toast';

export default function FoodCheckout() {
  const navigate = useNavigate();
  const { items, restaurant, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(null);

  const deliveryFee = restaurant?.delivery_fee || 5;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!address) { toast.error('Informe o endereco de entrega'); return; }
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }

    setLoading(true);
    try {
      const { order } = await api.post('/food/orders', {
        restaurant_id: restaurant.id,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal,
        delivery_fee: deliveryFee,
        total,
        delivery_address: address,
        notes,
        payment_method: paymentMethod,
      });

      if (paymentMethod === 'pix') {
        const data = await payOrder(order.id, 'pix');
        if (data.payment?.qrCodeBase64) {
          setShowQR({ ...data.payment, orderId: order.id });
        }
      }

      clearCart();
      toast.success('Pedido realizado!');
      setTimeout(() => navigate(`/food/order/${order.id}`), 1000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !showQR) {
    return (
      <div className="container text-center fade-in" style={{ paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 className="font-bold">Carrinho vazio</h2>
        <p className="text-gray mt-8">Adicione itens do cardapio</p>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/food')}>Ver Restaurantes</button>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <h2 className="font-bold mb-16">Finalizar Pedido</h2>

      {restaurant && (
        <div className="card mb-16 flex items-center gap-12">
          <div className="avatar">{restaurant.name[0]}</div>
          <div>
            <div className="font-semibold">{restaurant.name}</div>
            <div className="text-xs text-gray">{items.length} itens</div>
          </div>
        </div>
      )}

      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Itens</h3>
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between mb-8" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ flex: 1 }}>
              <div className="font-semibold text-sm">{item.name}</div>
              <div className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-8">
              <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => updateQuantity(item.id, item.quantity - 1)}><FiMinus size={14} /></button>
              <span className="font-bold">{item.quantity}</span>
              <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '4px 8px' }} onClick={() => updateQuantity(item.id, item.quantity + 1)}><FiPlus size={14} /></button>
              <button className="btn btn-sm btn-outline" style={{ width: 'auto', padding: '4px 8px', color: 'var(--danger)' }} onClick={() => removeItem(item.id)}><FiTrash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-16">
        <div className="input-group">
          <label><FiMapPin /> Endereco de entrega</label>
          <input className="input" placeholder="Rua, numero, bairro" value={address} onChange={e => setAddress(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Observacoes</label>
          <input className="input" placeholder="Ex: sem cebola, portao azul" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Pagamento</h3>
        <div className="flex gap-8">
          {['pix', 'card', 'cash'].map(m => (
            <button key={m} className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setPaymentMethod(m)}>
              {m === 'pix' ? 'PIX' : m === 'card' ? 'Cartao' : 'Dinheiro'}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-16">
        <div className="flex justify-between mb-8"><span className="text-gray-dark">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between mb-8"><span className="text-gray-dark">Entrega</span><span>R$ {deliveryFee.toFixed(2)}</span></div>
        <div className="divider" />
        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
      </div>

      <button className="btn btn-primary" onClick={handleCheckout} disabled={loading}>
        {loading ? 'Processando...' : `Confirmar Pedido - R$ ${total.toFixed(2)}`}
      </button>

      {showQR && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div className="qr-container">
            <h3 className="font-bold">Pague com PIX</h3>
            <img src={showQR.qrCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${showQR.copyPaste || '44taxi'}`} alt="QR Code PIX" style={{ width: 200, height: 200, borderRadius: 8 }} />
            {showQR.copyPaste && (
              <div className="card" style={{ padding: '8px 12px', fontSize: 12, wordBreak: 'break-all', background: 'var(--gray-50)', cursor: 'pointer' }}
                onClick={() => { navigator.clipboard.writeText(showQR.copyPaste); toast.success('Codigo copiado!'); }}>
                {showQR.copyPaste}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => navigate(`/food/order/${showQR.orderId}`)}>Acompanhar Pedido</button>
          </div>
        </div>
      )}
    </div>
  );
}
