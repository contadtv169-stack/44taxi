import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiStar, FiClock, FiPhone } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restData, catData] = await Promise.all([
        api.get('/food/restaurants'),
        api.get('/food/categories'),
      ]);
      setRestaurants(restData.restaurants || []);
      setCategories(catData.categories || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMenu = async (restaurant) => {
    try {
      const { items } = await api.get(`/food/menu/${restaurant.id}`);
      setMenuItems(items || []);
      setSelectedRestaurant(restaurant);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;

  return (
    <div className="container fade-in">
      {/* Search */}
      <div className="card mb-16 flex items-center gap-8" style={{ padding: '8px 16px' }}>
        <FiSearch color="var(--gray-400)" />
        <input className="input" placeholder="Buscar restaurantes..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', padding: '8px 0', fontSize: 14 }} />
      </div>

      {/* Categories */}
      <div className="flex gap-8 mb-16" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <button className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`} style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setSelectedCategory(null)}>Todos</button>
        {categories.map(cat => (
          <button key={cat} className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`} style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={() => setSelectedCategory(cat)}>{cat}</button>
        ))}
      </div>

      {/* Restaurant List */}
      {!selectedRestaurant ? (
        <div className="grid-2">
          {filteredRestaurants.map(r => (
            <div key={r.id} className="card" style={{ cursor: 'pointer', overflow: 'hidden' }} onClick={() => loadMenu(r)}>
              <div style={{ height: 120, background: 'linear-gradient(135deg, var(--yellow), #FFA500)', borderRadius: 'var(--radius-sm)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                {r.logo_url ? <img src={r.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
              </div>
              <h4 style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</h4>
              <div className="flex items-center gap-8 text-xs text-gray mt-4">
                <span className="flex items-center gap-4"><FiStar size={12} /> {r.rating}</span>
                <span className="flex items-center gap-4"><FiClock size={12} /> {r.delivery_time_min}min</span>
              </div>
              <div className="text-xs text-gray mt-4">R$ {r.delivery_fee} entrega</div>
            </div>
          ))}
          {filteredRestaurants.length === 0 && (
            <p className="text-gray" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>Nenhum restaurante encontrado</p>
          )}
        </div>
      ) : (
        /* Menu View */
        <div>
          <button className="btn btn-sm btn-outline mb-16" style={{ width: 'auto' }} onClick={() => setSelectedRestaurant(null)}>← Voltar</button>

          <div className="card mb-16">
            <div style={{ height: 160, background: 'linear-gradient(135deg, var(--yellow), #FFA500)', borderRadius: 'var(--radius-sm)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>
              {selectedRestaurant.logo_url ? <img src={selectedRestaurant.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍽️'}
            </div>
            <h2 style={{ fontWeight: 700 }}>{selectedRestaurant.name}</h2>
            <p className="text-sm text-gray mt-4">{selectedRestaurant.description}</p>
            <div className="flex items-center gap-12 mt-8 text-sm">
              <span className="flex items-center gap-4"><FiStar /> {selectedRestaurant.rating}</span>
              <span className="flex items-center gap-4"><FiClock /> {selectedRestaurant.delivery_time_min}min</span>
              <span className="flex items-center gap-4"><FiPhone /> {selectedRestaurant.phone}</span>
            </div>
          </div>

          <h3 className="font-bold mb-12">Cardapio</h3>
          {menuItems.map(item => (
            <div key={item.id} className="card mb-8 flex gap-12" style={{ cursor: 'pointer' }}
              onClick={() => {
                cart.setRestaurant(selectedRestaurant);
                cart.addItem(item);
                toast.success(`${item.name} adicionado`);
              }}>
              {item.image_url && <img src={item.image_url} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <div className="font-semibold">{item.name}</div>
                <p className="text-xs text-gray mt-4">{item.description}</p>
                <div className="font-bold mt-8" style={{ color: 'var(--black)' }}>
                  {item.promotional_price ? (
                    <><span style={{ textDecoration: 'line-through', color: 'var(--gray-300)', marginRight: 8 }}>R$ {item.price}</span>R$ {item.promotional_price}</>
                  ) : `R$ ${item.price}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart FAB */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 100 }}>
          <button className="btn btn-primary" onClick={() => navigate('/food/checkout')}>
            Ver Sacola ({totalItems}) - R$ {cart.subtotal.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
