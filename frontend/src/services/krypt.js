import axios from 'axios';
import { createPixGoPayment } from './pixgo';

const KRYPT_CLIENT_ID = 'krypt_ci_0a11b24e6858ca92d4';
const KRYPT_CLIENT_SECRET = 'krypt_cs_a157ad3247476c1a06734db868ce2ec7';
const KRYPT_API = 'https://kryptgateway.netlify.app/api';

let cachedToken = null;

async function getToken() {
  if (cachedToken) return cachedToken;
  try {
    const { data } = await axios.post(`${KRYPT_API}/auth`, {
      client_id: KRYPT_CLIENT_ID,
      client_secret: KRYPT_CLIENT_SECRET,
    });
    cachedToken = data.access_token;
    return cachedToken;
  } catch { return null; }
}

// Cobrar taxa do motorista (R$ 7 por corrida)
export async function chargeDriverFee(rideId, driverId, amount = 7) {
  try {
    const token = await getToken();
    if (!token) throw new Error('Falha ao autenticar Krypt Pay');
    const { data } = await axios.post(`${KRYPT_API}/charge`, {
      amount,
      description: `Taxa 44Taxi - Corrida #${rideId}`,
      external_id: `ride_${rideId}_driver_${driverId}`,
      metadata: { type: 'driver_fee', ride_id: rideId, driver_id: driverId },
    }, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  } catch (err) {
    console.error('Erro taxa Krypt:', err);
    return null;
  }
}

// Pagamento do passageiro via PixGo ou PIX normal
export async function payRide(rideId, method) {
  if (method === 'pix') {
    return createPixGoPayment(rideId);
  }
  // Cartao / Dinheiro: registra localmente
  return {
    success: true,
    payment: {
      method,
      status: 'pending',
      message: method === 'cash' ? 'Pague em dinheiro ao motorista' : 'Pagamento registrado',
    },
  };
}

// Pagamento de pedido food
export async function payOrder(orderId, method) {
  if (method === 'pix') {
    return createPixGoPayment(orderId, null, 'Pedido Food');
  }
  return { success: true, payment: { method, status: 'pending' } };
}

export { getToken };
