const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const kryptService = require('../services/kryptService');

router.post('/pix/create', authenticate, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor invalido' });
    }

    const payment = await kryptService.createPixPayment(
      amount,
      req.user.name,
      req.user.document_number || '00000000000',
      description || `Pagamento 44Taxi - ${req.user.name}`
    );

    res.json({ success: true, payment: payment.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pix/status', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.query;
    if (!transactionId) {
      return res.status(400).json({ error: 'ID da transacao obrigatorio' });
    }
    const status = await kryptService.checkPaymentStatus(transactionId);
    res.json({ success: true, payment: status.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/ride/pay', authenticate, async (req, res) => {
  try {
    const { rideId, method } = req.body;
    const { data: ride, error: findError } = await supabase
      .from('rides').select('*').eq('id', rideId).single();

    if (findError) return res.status(404).json({ error: 'Corrida nao encontrada' });

    if (method === 'pix' && ride.estimated_price > 0) {
      const payment = await kryptService.createPixPayment(
        ride.estimated_price,
        req.user.name,
        req.user.document_number || '00000000000',
        `Corrida #${rideId}`
      );

      await supabase.from('rides').update({
        payment_method: 'pix',
        payment_status: 'pending',
        krypt_transaction_id: payment.data.transactionId,
      }).eq('id', rideId);

      return res.json({ success: true, payment: payment.data, rideId });
    }

    await supabase.from('rides').update({
      payment_method: method,
      payment_status: method === 'cash' ? 'pending' : 'paid',
    }).eq('id', rideId);

    res.json({ success: true, message: `Pagamento via ${method} registrado` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/order/pay', authenticate, async (req, res) => {
  try {
    const { orderId, method } = req.body;
    const { data: order, error: findError } = await supabase
      .from('food_orders').select('*').eq('id', orderId).single();

    if (findError) return res.status(404).json({ error: 'Pedido nao encontrado' });

    if (method === 'pix' && order.total > 0) {
      const payment = await kryptService.createPixPayment(
        order.total,
        req.user.name,
        req.user.document_number || '00000000000',
        `Pedido #${orderId}`
      );

      await supabase.from('food_orders').update({
        payment_method: 'pix',
        payment_status: 'pending',
        krypt_transaction_id: payment.data.transactionId,
      }).eq('id', orderId);

      return res.json({ success: true, payment: payment.data, orderId });
    }

    await supabase.from('food_orders').update({
      payment_method: method,
      payment_status: method === 'cash' ? 'pending' : 'paid',
    }).eq('id', orderId);

    res.json({ success: true, message: `Pagamento via ${method} registrado` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const { transactionId, status, amount } = req.body;

    await supabase.from('rides')
      .update({ payment_status: status === 'paid' ? 'paid' : 'pending' })
      .eq('krypt_transaction_id', transactionId);

    await supabase.from('food_orders')
      .update({ payment_status: status === 'paid' ? 'paid' : 'pending' })
      .eq('krypt_transaction_id', transactionId);

    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await kryptService.getBalance();
    res.json({ success: true, balance: balance.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, pix_key, pix_type } = req.body;

    const withdrawal = await kryptService.requestWithdrawal(amount, pix_key, pix_type);

    await supabase.from('withdrawals').insert({
      user_id: req.user.id,
      amount,
      pix_key,
      pix_type: pix_type || 'cpf',
      krypt_transaction_id: withdrawal.data?.transactionId,
    });

    res.json({ success: true, withdrawal: withdrawal.data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, transactions: data });
});

module.exports = router;
