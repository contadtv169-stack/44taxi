const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const rides = await supabase
      .from('rides')
      .select('final_price, estimated_price, status, created_at')
      .eq('driver_id', userId)
      .eq('status', 'completed');

    const deliveries = await supabase
      .from('food_orders')
      .select('total, status, created_at')
      .eq('delivery_person_id', userId)
      .eq('status', 'delivered');

    const allItems = [
      ...(rides.data || []).map(r => ({ amount: parseFloat(r.final_price || r.estimated_price || 0), created_at: r.created_at })),
      ...(deliveries.data || []).map(d => ({ amount: parseFloat(d.total || 0), created_at: d.created_at })),
    ];

    const earnings = {
      daily: allItems.filter(i => i.created_at >= dayStart).reduce((s, i) => s + i.amount, 0),
      weekly: allItems.filter(i => i.created_at >= weekStart).reduce((s, i) => s + i.amount, 0),
      monthly: allItems.filter(i => i.created_at >= monthStart).reduce((s, i) => s + i.amount, 0),
      total: allItems.reduce((s, i) => s + i.amount, 0),
    };

    res.json({ success: true, earnings });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const rides = await supabase
      .from('rides')
      .select('id, estimated_price, final_price, status, created_at, passenger_id, origin_address, destination_address')
      .eq('driver_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(100);

    const deliveries = await supabase
      .from('food_orders')
      .select('id, total, status, created_at, restaurant_id, delivery_address')
      .eq('delivery_person_id', userId)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(100);

    res.json({
      success: true,
      earnings: {
        rides: rides.data || [],
        deliveries: deliveries.data || [],
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
