import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiStar, FiClock, FiPhone, FiArrowLeft } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import Banner from '../components/Banner';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Food() {
  const navigate = useNavigate();
  const cart = useCart();
  const { totalItems } = cart;
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [restData, catData] = await Promise.all([
        api.get('/food/restaurants'),
        api.get('/food/categories'),
      ]);
      setRestaurants(restData.restaurants || []);
      setCategories(catData.categories || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const loadMenu = async (restaurant) => {
    try {
      const { items } = await api.get(`/food/menu/${restaurant.id}`);
      setMenuItems(items || []);
      setSelectedRestaurant(restaurant);
    } catch (err) { toast.error(err.message); }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="container fade-in">
      {/* Delivery Banner */}
      <Banner type="food" style={{ marginBottom: 12 }} />

      {/* Search */}
      <div className="card mb-12 flex items-center gap-8" style={{ padding: '8px 16px', borderRadius: 12 }}>
        <FiSearch color="var(--gray-300)" />
        <input className="input" placeholder="Buscar restaurantes ou comidas..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', padding: '8px 0', fontSize: 14, flex: 1 }} />
      </div>

      {/* Categories */}
      <div className="flex gap-8 mb-12" style={{ overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        <button className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setSelectedCategory(null)}>Todos</button>
        {categories.map(cat => (
          <button key={cat} className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setSelectedCategory(cat)}>{cat}</button>
        ))}
      </div>

      {!selectedRestaurant ? (
        <>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-16">
              <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
              <p className="text-gray">Nenhum restaurante encontrado</p>
              <button className="btn btn-sm btn-primary mt-8" style={{ width: 'auto' }} onClick={() => setSelectedCategory(null)}>Ver todos</button>
            </div>
          ) : (
            <div className="grid-2">
              {filteredRestaurants.map(r => (
                <div key={r.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }} onClick={() => loadMenu(r)}>
                  <div style={{
                    height: 120, background: 'linear-gradient(135deg, #1a1a2e, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                  }}>
                    {r.logo_url ? <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h4 style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</h4>
                    <div className="flex items-center gap-8 text-xs text-gray mt-4">
                      <span className="flex items-center gap-4"><FiStar size={12} color="#f59e0b" /> {r.rating}</span>
                      <span className="flex items-center gap-4"><FiClock size={12} /> {r.delivery_time_min}min</span>
                    </div>
                    <div className="text-xs font-semibold mt-4">
                      {r.delivery_fee > 0 ? `R$ ${r.delivery_fee} entrega` : 'Entrega grátis'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Menu View */
        <div>
          <button className="btn btn-sm btn-outline mb-12" style={{ width: 'auto' }} onClick={() => setSelectedRestaurant(null)}>
            ← Voltar
          </button>

          <div className="card mb-12" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{
              height: 160, background: 'linear-gradient(135deg, #1a1a2e, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60,
            }}>
              {selectedRestaurant.logo_url ? <img src={selectedRestaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <div style={{ padding: 16 }}>
              <h2 style={{ fontWeight: 700 }}>{selectedRestaurant.name}</h2>
              <p className="text-sm text-gray mt-4">{selectedRestaurant.description}</p>
              <div className="flex items-center gap-16 mt-8 text-sm">
                <span className="flex items-center gap-4"><FiStar color="#f59e0b" /> {selectedRestaurant.rating}</span>
                <span className="flex items-center gap-4"><FiClock /> {selectedRestaurant.delivery_time_min}min</span>
                <span className="flex items-center gap-4"><FiPhone /> {selectedRestaurant.phone}</span>
              </div>
            </div>
          </div>

          <h3 className="font-bold mb-12">Cardapio</h3>
          {menuItems.map(item => (
            <div key={item.id} className="card mb-8 flex gap-12" style={{ cursor: 'pointer' }}
              onClick={() => {
                cart.setRestaurant(selectedRestaurant);
                cart.addItem(item);
                toast.success(`${item.name} adicionado ao carrinho`);
              }}>
              <div style={{ flex: 1 }}>
                <div className="font-semibold">{item.name}</div>
                <p className="text-xs text-gray mt-4">{item.description}</p>
                <div className="font-bold mt-8" style={{ color: 'var(--black)' }}>
                  {item.promotional_price ? (
                    <><span style={{ textDecoration: 'line-through', color: 'var(--gray-300)', marginRight: 8 }}>R$ {item.price}</span>R$ {item.promotional_price}</>
                  ) : `R$ ${item.price}`}
                </div>
              </div>
              {item.image_url && (
                <img src={item.image_url} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cart FAB */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 100 }}>
          <button className="btn btn-primary" onClick={() => navigate('/food/checkout')} style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            🛒 Ver Sacola ({totalItems}) • R$ {cart.subtotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
