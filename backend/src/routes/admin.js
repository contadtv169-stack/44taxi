const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/users', async (req, res) => {
  const { role, status, search } = req.query;
  let query = supabase.from('user_profiles').select('*');
  if (role) query = query.eq('role', role);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  query = query.order('created_at', { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, users: data });
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    const { blocked } = req.body;
    const { data, error } = await supabase
      .from('user_profiles').update({ blocked }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/drivers/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*, user:user_profiles(name, email, phone, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, drivers: data });
});

router.patch('/drivers/:id/approve', async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const { data, error } = await supabase
      .from('drivers').update({ status: status || 'approved' })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, driver: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/delivery/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('delivery_people')
    .select('*, user:user_profiles(name, email, phone, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, deliveries: data });
});

router.patch('/delivery/:id/approve', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('delivery_people').update({ status: status || 'approved' })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, delivery: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/restaurants/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*, owner:user_profiles(name, email, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, restaurants: data });
});

router.patch('/restaurants/:id/approve', async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('restaurants').update({ status: status || 'active' })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, restaurant: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reports/financial', async (req, res) => {
  try {
    const { period } = req.query;
    const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : 1;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [rides, orders, withdrawals] = await Promise.all([
      supabase.from('rides').select('final_price, estimated_price, status').gte('created_at', since),
      supabase.from('food_orders').select('total, status').gte('created_at', since),
      supabase.from('withdrawals').select('amount, status').gte('created_at', since),
    ]);

    const totalRides = (rides.data || []).filter(r => r.status === 'completed').reduce((s, r) => s + parseFloat(r.final_price || r.estimated_price || 0), 0);
    const totalFood = (orders.data || []).filter(o => o.status === 'delivered').reduce((s, o) => s + parseFloat(o.total || 0), 0);
    const totalWithdrawn = (withdrawals.data || []).filter(w => w.status === 'completed').reduce((s, w) => s + parseFloat(w.amount || 0), 0);

    res.json({
      success: true,
      report: {
        period: period || 'daily',
        totalRides,
        totalFood,
        totalRevenue: totalRides + totalFood,
        totalWithdrawn,
        netRevenue: totalRides + totalFood - totalWithdrawn,
        ridesCount: (rides.data || []).length,
        foodCount: (orders.data || []).length,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalDrivers },
      { count: totalRestaurants },
      { count: totalRides },
      { count: pendingDrivers },
      { count: pendingRestaurants },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }),
      supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      supabase.from('rides').select('*', { count: 'exact', head: true }),
      supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalDrivers, totalRestaurants, totalRides, pendingDrivers, pendingRestaurants },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/support', async (req, res) => {
  const { status } = req.query;
  let query = supabase.from('support_tickets').select('*, user:user_profiles(name, email, phone)');
  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, tickets: data });
});

router.patch('/support/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, ticket: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/support/respond', async (req, res) => {
  try {
    const { ticketId, message } = req.body;
    const { data, error } = await supabase
      .from('support_tickets').update({
        status: 'in_progress',
        assigned_to: req.user.id,
      }).eq('id', ticketId).select().single();
    if (error) throw error;
    res.json({ success: true, ticket: data, message: 'Resposta registrada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/fees', async (req, res) => {
  try {
    const { ride_fee, food_fee } = req.body;
    const { data, error } = await supabase
      .from('app_settings').upsert({
        key: 'fees',
        value: JSON.stringify({ ride_fee, food_fee }),
      }).select().single();
    if (error) throw error;
    res.json({ success: true, fees: { ride_fee, food_fee } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
