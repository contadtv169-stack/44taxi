import api from './api';

export const createPixPayment = async (amount, description) => {
  return api.post('/payments/pix/create', { amount, description });
};

export const checkPixStatus = async (transactionId) => {
  return api.get(`/payments/pix/status?transactionId=${transactionId}`);
};

export const payRide = async (rideId, method) => {
  return api.post('/payments/ride/pay', { rideId, method });
};

export const payOrder = async (orderId, method) => {
  return api.post('/payments/order/pay', { orderId, method });
};
