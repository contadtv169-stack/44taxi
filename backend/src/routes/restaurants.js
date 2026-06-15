const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', authenticate, async (req, res) => {
  try {
    const restaurantData = req.body;

    await supabase.from('user_profiles').update({ role: 'dono_delivery' }).eq('id', req.user.id);

    const { data, error } = await supabase.from('restaurants').insert({
      ...restaurantData,
      owner_id: req.user.id,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, restaurant: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/my', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'Restaurante nao encontrado' });
  res.json({ success: true, restaurant: data });
});

router.put('/my', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('restaurants').update(req.body).eq('owner_id', req.user.id).select().single();
    if (error) throw error;
    res.json({ success: true, restaurant: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/my/toggle', authenticate, async (req, res) => {
  try {
    const { data: current } = await supabase
      .from('restaurants').select('open').eq('owner_id', req.user.id).single();
    const { data, error } = await supabase
      .from('restaurants').update({ open: !current.open }).eq('owner_id', req.user.id).select().single();
    if (error) throw error;
    res.json({ success: true, open: data.open });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/menu', authenticate, async (req, res) => {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants').select('id').eq('owner_id', req.user.id).single();
    if (!restaurant) return res.status(404).json({ error: 'Restaurante nao encontrado' });

    const { data, error } = await supabase.from('menu_items').insert({
      ...req.body,
      restaurant_id: restaurant.id,
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, item: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/menu/:id', authenticate, async (req, res) => {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants').select('id').eq('owner_id', req.user.id).single();
    if (!restaurant) return res.status(404).json({ error: 'Restaurante nao encontrado' });

    const { data, error } = await supabase
      .from('menu_items').update(req.body)
      .eq('id', req.params.id).eq('restaurant_id', restaurant.id).select().single();

    if (error) throw error;
    res.json({ success: true, item: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/menu/:id', authenticate, async (req, res) => {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants').select('id').eq('owner_id', req.user.id).single();
    if (!restaurant) return res.status(404).json({ error: 'Restaurante nao encontrado' });

    const { error } = await supabase
      .from('menu_items').delete().eq('id', req.params.id).eq('restaurant_id', restaurant.id);
    if (error) throw error;
    res.json({ success: true, message: 'Item removido' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/orders', authenticate, async (req, res) => {
  const { data: restaurant } = await supabase
    .from('restaurants').select('id').eq('owner_id', req.user.id).single();
  if (!restaurant) return res.status(404).json({ error: 'Restaurante nao encontrado' });

  const { data, error } = await supabase
    .from('food_orders')
    .select('*, customer:user_profiles(name, phone)')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, orders: data });
});

router.get('/sales-report', authenticate, async (req, res) => {
  try {
    const { data: restaurant } = await supabase
      .from('restaurants').select('id').eq('owner_id', req.user.id).single();
    if (!restaurant) return res.status(404).json({ error: 'Restaurante nao encontrado' });

    const { period } = req.query;
    let dateFilter;
    if (period === 'weekly') dateFilter = `created_at.gte.${new Date(Date.now() - 7*86400000).toISOString()}`;
    else if (period === 'monthly') dateFilter = `created_at.gte.${new Date(Date.now() - 30*86400000).toISOString()}`;
    else dateFilter = `created_at.gte.${new Date(Date.now() - 86400000).toISOString()}`;

    const { data, error } = await supabase
      .from('food_orders')
      .select('total, status, created_at')
      .eq('restaurant_id', restaurant.id)
      .filter('created_at', 'gte', new Date(Date.now() - (period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1) * 86400000).toISOString());

    if (error) throw error;

    const totalSales = data.reduce((sum, o) => sum + (o.status === 'delivered' ? parseFloat(o.total) : 0), 0);
    const totalOrders = data.filter(o => o.status === 'delivered').length;

    res.json({ success: true, report: { totalSales, totalOrders, period: period || 'daily', orders: data } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
