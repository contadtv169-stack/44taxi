const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const mapsService = require('../services/mapsService');

router.post('/estimate', authenticate, async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng, vehicleType } = req.body;
    const distance = await mapsService.calculateDistance(originLat, originLng, destLat, destLng);
    const price = await mapsService.calculatePrice(distance, vehicleType);
    res.json({ success: true, distanceKm: parseFloat(distance.toFixed(2)), price: parseFloat(price.toFixed(2)) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { originLat, originLng, originAddress, destLat, destLng, destAddress, vehicleType } = req.body;
    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: 'Coordenadas de origem e destino obrigatorias' });
    }

    const distance = await mapsService.calculateDistance(originLat, originLng, destLat, destLng);
    const price = await mapsService.calculatePrice(distance, vehicleType);

    const { data, error } = await supabase.from('rides').insert({
      passenger_id: req.user.id,
      vehicle_type: vehicleType || 'carro',
      origin_lat: originLat,
      origin_lng: originLng,
      origin_address: originAddress,
      destination_lat: destLat,
      destination_lng: destLng,
      destination_address: destAddress,
      distance_km: parseFloat(distance.toFixed(2)),
      estimated_price: parseFloat(price.toFixed(2)),
      status: 'pending',
    }).select().single();

    if (error) throw error;

    const io = req.app.get('io');
    io.emit('new-ride', data);

    res.status(201).json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/available', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passenger:user_profiles(name, avatar_url, phone)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, rides: data });
});

router.get('/history', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .or(`passenger_id.eq.${req.user.id},driver_id.eq.${req.user.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, rides: data });
});

router.get('/active', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:drivers(*)')
    .or(`passenger_id.eq.${req.user.id},driver_id.eq.${req.user.id}`)
    .in('status', ['pending', 'accepted', 'arrived', 'in_progress'])
    .single();

  if (error && error.code !== 'PGRST116') return res.status(400).json({ error: error.message });
  res.json({ success: true, ride: data || null });
});

router.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*, passenger:user_profiles(*), driver:drivers(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Corrida nao encontrada' });
  res.json({ success: true, ride: data });
});

router.patch('/:id/accept', authenticate, async (req, res) => {
  try {
    const { data: ride, error: findError } = await supabase
      .from('rides').select('*').eq('id', req.params.id).single();
    if (findError || ride.status !== 'pending') {
      return res.status(400).json({ error: 'Corrida indisponivel' });
    }

    const { data, error } = await supabase
      .from('rides').update({ driver_id: req.user.id, status: 'accepted' })
      .eq('id', req.params.id).select().single();

    if (error) throw error;

    const io = req.app.get('io');
    io.to(`ride-${data.id}`).emit('ride-accepted', data);

    res.json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['arrived', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status invalido' });
    }

    const updates = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'in_progress') updates.started_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('rides').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;

    const io = req.app.get('io');
    io.to(`ride-${data.id}`).emit('ride-status', data);

    res.json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/rate', authenticate, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const { data, error } = await supabase
      .from('rides').update({ rating, review }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, ride: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/emergency', authenticate, async (req, res) => {
  try {
    const ride = await supabase.from('rides').select('*').eq('id', req.params.id).single();
    const io = req.app.get('io');
    io.emit('emergency-alert', { rideId: req.params.id, userId: req.user.id, ...ride.data });
    res.json({ success: true, message: 'Alerta de emergencia enviado' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
