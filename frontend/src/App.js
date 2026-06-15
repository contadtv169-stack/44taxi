import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Rides from './pages/Rides';
import RideTracking from './pages/RideTracking';
import Food from './pages/Food';
import FoodCheckout from './pages/FoodCheckout';
import OrderTracking from './pages/OrderTracking';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';
import DriverRegister from './pages/DriverRegister';
import RestaurantRegister from './pages/RestaurantRegister';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return React.createElement('div', {
        style: { padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }
      },
        React.createElement('h1', { style: { color: '#ef4444' } }, 'Erro no aplicativo'),
        React.createElement('p', { style: { color: '#666' } }, this.state.error?.message || 'Erro desconhecido'),
        React.createElement('pre', {
          style: { background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 12, marginTop: 16, textAlign: 'left', maxWidth: 600, margin: '16px auto', overflow: 'auto' }
        }, this.state.error?.stack || '')
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/admin/login" />;
  if (profile?.role !== 'admin') return <Navigate to="/home" />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (user) return <Navigate to="/home" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/ride/:id" element={<RideTracking />} />
        <Route path="/food" element={<Food />} />
        <Route path="/food/checkout" element={<FoodCheckout />} />
        <Route path="/food/order/:id" element={<OrderTracking />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/driver/register" element={<DriverRegister />} />
        <Route path="/restaurant/register" element={<RestaurantRegister />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-center" toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
            }} />
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
