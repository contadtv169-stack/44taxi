const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, phone, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha obrigatorios' });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, phone,
    });

    if (authError) throw authError;

    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        firebase_uid: authData.user.id,
        email,
        phone,
        name: name || email.split('@')[0],
        role: 'cliente',
      })
      .select()
      .single();

    if (userError) throw userError;
    res.status(201).json({ success: true, user, session: authData.session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    res.json({ success: true, session: data.session, user: data.user });
  } catch (err) {
    res.status(401).json({ error: 'Credenciais invalidas' });
  }
});

router.post('/phone', async (req, res) => {
  try {
    const { phone } = req.body;
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    res.json({ success: true, message: 'Codigo enviado para o telefone' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/phone/verify', async (req, res) => {
  try {
    const { phone, token } = req.body;
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) throw error;

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('firebase_uid', data.user.id)
      .single();

    if (!existing) {
      await supabase.from('user_profiles').insert({
        firebase_uid: data.user.id,
        phone,
        name: 'Usuario',
        role: 'cliente',
      });
    }

    res.json({ success: true, session: data.session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google', token: accessToken,
    });
    if (error) throw error;
    res.json({ success: true, session: data.session });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowed = ['name', 'avatar_url', 'phone', 'document_type', 'document_number'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/face-verify', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ face_verified: true })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Verificacao facial concluida', user: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
