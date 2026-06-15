const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', authenticate, async (req, res) => {
  try {
    const { cnh_number, vehicle_type, vehicle_plate, vehicle_model, vehicle_year, vehicle_color } = req.body;

    const { data: existing } = await supabase
      .from('drivers').select('id').eq('user_id', req.user.id).single();

    if (existing) {
      return res.status(409).json({ error: 'Motorista ja cadastrado' });
    }

    await supabase.from('user_profiles').update({ role: 'taxista' }).eq('id', req.user.id);

    const { data, error } = await supabase.from('drivers').insert({
      user_id: req.user.id,
      cnh_number,
      vehicle_type: vehicle_type || 'carro',
      vehicle_plate,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, driver: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/delivery/register', authenticate, async (req, res) => {
  try {
    const { vehicle_type, vehicle_plate } = req.body;

    const { data: existing } = await supabase
      .from('delivery_people').select('id').eq('user_id', req.user.id).single();

    if (existing) {
      return res.status(409).json({ error: 'Entregador ja cadastrado' });
    }

    await supabase.from('user_profiles').update({ role: 'entregador' }).eq('id', req.user.id);

    const { data, error } = await supabase.from('delivery_people').insert({
      user_id: req.user.id,
      vehicle_type: vehicle_type || 'moto',
      vehicle_plate,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, delivery: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('drivers').select('*').eq('user_id', req.user.id).single();

  if (error) return res.status(404).json({ error: 'Perfil de motorista nao encontrado' });
  res.json({ success: true, driver: data });
});

router.get('/delivery/profile', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('delivery_people').select('*').eq('user_id', req.user.id).single();

  if (error) return res.status(404).json({ error: 'Perfil de entregador nao encontrado' });
  res.json({ success: true, delivery: data });
});

router.put('/location', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    await supabase.from('drivers')
      .update({ current_lat: lat, current_lng: lng })
      .eq('user_id', req.user.id);

    await supabase.from('delivery_people')
      .update({ current_lat: lat, current_lng: lng })
      .eq('user_id', req.user.id);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/available', authenticate, async (req, res) => {
  try {
    const { available } = req.body;

    await supabase.from('drivers')
      .update({ available })
      .eq('user_id', req.user.id);

    await supabase.from('delivery_people')
      .update({ available })
      .eq('user_id', req.user.id);

    res.json({ success: true, available });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/rides', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passenger:user_profiles(name, avatar_url, phone)')
    .eq('driver_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, rides: data || [] });
});

router.get('/deliveries', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('food_orders')
    .select('*, restaurant:restaurants(name, logo_url, address_street, address_number)')
    .eq('delivery_person_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, deliveries: data || [] });
});

router.post('/documents', authenticate, async (req, res) => {
  try {
    const { cnh_front_url, cnh_back_url, selfie_url, vehicle_doc_url } = req.body;

    const updates = {};
    if (cnh_front_url) updates.cnh_front_url = cnh_front_url;
    if (cnh_back_url) updates.cnh_back_url = cnh_back_url;
    if (selfie_url) updates.selfie_url = selfie_url;
    if (vehicle_doc_url) updates.vehicle_doc_url = vehicle_doc_url;

    const { data, error } = await supabase
      .from('drivers').update(updates).eq('user_id', req.user.id).select().single();

    if (error) throw error;
    res.json({ success: true, driver: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
