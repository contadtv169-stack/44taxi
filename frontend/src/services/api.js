import axios from 'axios';
import supabase from '../config/supabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Silencia erros de conexao para nao mostrar toasts
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.resolve({ success: false, error: 'offline' });
    }
    const message = error.response?.data?.error || 'Erro desconhecido';
    return Promise.reject(new Error(message));
  }
);

export default api;
