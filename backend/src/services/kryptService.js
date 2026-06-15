const axios = require('axios');
const kryptConfig = require('../config/krypt');

const api = axios.create({
  baseURL: kryptConfig.baseUrl,
  headers: {
    'Content-Type': 'application/json',
    'ci': kryptConfig.ci,
    'cs': kryptConfig.cs,
  },
});

class KryptService {
  async createPixPayment(amount, payerName, payerDocument, description) {
    try {
      const response = await api.post('/api/gateway/pix-create', {
        amount,
        payerName,
        payerDocument,
        description,
      });
      return response.data;
    } catch (err) {
      const error = err.response?.data || { success: false, error: err.message };
      throw new Error(error.error || 'Erro ao criar PIX');
    }
  }

  async checkPaymentStatus(transactionId) {
    try {
      const response = await api.get(`/api/gateway/pix-status?transactionId=${transactionId}`);
      return response.data;
    } catch (err) {
      throw new Error('Erro ao verificar status do pagamento');
    }
  }

  async getBalance() {
    try {
      const response = await api.get('/api/gateway/balance');
      return response.data;
    } catch (err) {
      throw new Error('Erro ao consultar saldo');
    }
  }

  async requestWithdrawal(amount, pixKey, pixType) {
    try {
      const response = await api.post('/api/gateway/withdraw', {
        amount,
        pixKey,
        pixType,
      });
      return response.data;
    } catch (err) {
      throw new Error('Erro ao solicitar saque');
    }
  }
}

module.exports = new KryptService();
