import axios from 'axios';

const PIXGO_API = 'https://pixgo.org/api/v1';
const PIXGO_KEY = process.env.REACT_APP_PIXGO_KEY || '';

// PIX key padrao (chave aleatoria do sistema 44Taxi)
const DEFAULT_PIX_KEY = '11999999999';
const DEFAULT_PIX_NAME = '44Taxi Pagamentos';

export async function createPixGoPayment(rideId, amount = null, passengerName = 'Passageiro', passengerCpf = '') {
  // Tenta PixGo primeiro se tiver API key
  if (PIXGO_KEY) {
    try {
      const { data } = await axios.post(`${PIXGO_API}/payment/create`, {
        amount: amount || 15.00,
        description: `44Taxi - Corrida #${rideId}`,
        receiver_name: passengerName,
        receiver_cpf: passengerCpf || '00000000000',
        external_id: `ride_${rideId}`,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': PIXGO_KEY,
        },
      });
      if (data?.success && data?.data) {
        return {
          success: true,
          payment: {
            id: data.data.payment_id,
            qrCodeBase64: null,
            qrImageUrl: data.data.qr_image_url,
            copyPaste: data.data.qr_code,
            amount: data.data.amount,
            status: data.data.status,
            expiresAt: data.data.expires_at,
            provider: 'pixgo',
          },
        };
      }
    } catch {
      // Fallback para PIX normal
    }
  }

  // Fallback: PIX normal estatico
  return generatePixFallback(rideId, amount);
}

function generatePixFallback(rideId, amount) {
  const value = amount || 15.00;
  const pixCode = generatePixCopyPaste(value, rideId);

  return {
    success: true,
    payment: {
      id: `pix_${rideId}_${Date.now()}`,
      copyPaste: pixCode,
      qrCodeBase64: null,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`,
      amount: value,
      status: 'pending',
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      provider: 'pix_fallback',
    },
  };
}

function generatePixCopyPaste(amount, rideId) {
  const now = new Date();
  const txId = `44TAXI${String(rideId).padStart(10, '0')}`;
  const valueStr = amount.toFixed(2);

  // Formato PIX BR Code simplificado
  return [
    '000201',
    '26580014BR.GOV.BCB.PIX',
    '0136',
    `04${DEFAULT_PIX_KEY.length.toString().padStart(2, '0')}${DEFAULT_PIX_KEY}`,
    '52040000',
    '5303986',
    `540${valueStr.length.toString().padStart(2, '0')}${valueStr}`,
    '5802BR',
    `59${DEFAULT_PIX_NAME.length.toString().padStart(2, '0')}${DEFAULT_PIX_NAME}`,
    `62${txId.length.toString().padStart(2, '0')}${txId}`,
    '6304',
  ].join('');
}

export async function checkPixGoStatus(paymentId) {
  if (PIXGO_KEY && paymentId?.startsWith('dep_')) {
    try {
      const { data } = await axios.get(`${PIXGO_API}/payment/${paymentId}/status`, {
        headers: { 'X-API-Key': PIXGO_KEY },
      });
      if (data?.success) return data.data.status;
    } catch {}
  }
  return 'pending';
}
