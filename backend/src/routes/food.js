const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

router.get('/restaurants', async (req, res) => {
  const { category, search } = req.query;
  let query = supabase.from('restaurants').select('*').eq('status', 'active');
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query.order('rating', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, restaurants: data });
});

router.get('/restaurants/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants').select('*, menu_items(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Restaurante nao encontrado' });
  res.json({ success: true, restaurant: data });
});

router.get('/menu/:restaurantId', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('menu_items').select('*').eq('restaurant_id', req.params.restaurantId).eq('available', true);
  if (category) query = query.eq('category', category);
  const { data, error } = await query.order('category');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, items: data });
});

router.get('/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants').select('category').eq('status', 'active').not('category', 'is', null);
  if (error) return res.status(400).json({ error: error.message });
  const categories = [...new Set(data.map(r => r.category).filter(Boolean))];
  res.json({ success: true, categories });
});

router.post('/orders', authenticate, async (req, res) => {
  try {
    const { restaurant_id, items, subtotal, delivery_fee, discount, total, delivery_address, delivery_lat, delivery_lng, notes, payment_method } = req.body;

    const { data, error } = await supabase.from('food_orders').insert({
      customer_id: req.user.id,
      restaurant_id,
      items,
      subtotal,
      delivery_fee: delivery_fee || 0,
      discount: discount || 0,
      total,
      delivery_address,
      delivery_lat,
      delivery_lng,
      notes,
      payment_method: payment_method || 'pix',
      status: 'pending',
    }).select().single();

    if (error) throw error;

    const io = req.app.get('io');
    io.emit('new-order', { ...data, restaurantId: restaurant_id });

    res.status(201).json({ success: true, order: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/orders', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('food_orders')
    .select('*, restaurant:restaurants(name, logo_url)')
    .eq('customer_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, orders: data });
});

router.get('/orders/active', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('food_orders')
    .select('*, restaurant:restaurants(*), delivery:delivery_people(*)')
    .or(`customer_id.eq.${req.user.id},restaurant.owner_id.eq.${req.user.id}`)
    .not('status', 'in', '("delivered","cancelled")')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, orders: data || [] });
});

router.get('/orders/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('food_orders')
    .select('*, restaurant:restaurants(*), delivery:delivery_people(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Pedido nao encontrado' });
  res.json({ success: true, order: data });
});

router.patch('/orders/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalido' });
    }

    const { data, error } = await supabase
      .from('food_orders').update({ status }).eq('id', req.params.id).select().single();

    if (error) throw error;

    const io = req.app.get('io');
    io.to(`order-${data.id}`).emit('order-status', data);

    res.json({ success: true, order: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/orders/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating_restaurant, rating_delivery, review } = req.body;
    const updates = {};
    if (rating_restaurant) updates.rating_restaurant = rating_restaurant;
    if (rating_delivery) updates.rating_delivery = rating_delivery;
    if (review) updates.review = review;

    const { data, error } = await supabase
      .from('food_orders').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, order: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
