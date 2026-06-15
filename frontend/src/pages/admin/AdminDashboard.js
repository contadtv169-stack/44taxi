import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiMap, FiCoffee, FiDollarSign, FiSettings, FiShield, FiBarChart2, FiLogOut, FiTruck } from 'react-icons/fi';
import api from '../../services/api';
import supabase from '../../config/supabase';
import toast from 'react-hot-toast';

function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/users', icon: FiUsers, label: 'Usuarios' },
    { path: '/admin/drivers', icon: FiMap, label: 'Taxistas' },
    { path: '/admin/delivery', icon: FiTruck, label: 'Entregadores' },
    { path: '/admin/restaurants', icon: FiCoffee, label: 'Restaurantes' },
    { path: '/admin/financial', icon: FiDollarSign, label: 'Financeiro' },
    { path: '/admin/support', icon: FiShield, label: 'Suporte' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Relatorios' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 24, fontWeight: 900, padding: '16px 12px', marginBottom: 16 }}>
        <span style={{ color: '#FFD700' }}>44</span>Admin
      </div>
      {items.map(item => (
        <a key={item.path} href="#"
          className={location.pathname === item.path ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate(item.path); }}>
          <item.icon size={18} /> {item.label}
        </a>
      ))}
      <div style={{ flex: 1 }} />
      <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
        <FiLogOut size={18} /> Sair
      </a>
    </div>
  );
}

function AdminHome() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.get('/admin/stats');
      setStats(data.stats);
    } catch {}
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h2>
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { label: 'Usuarios', value: stats.totalUsers, color: 'var(--info)' },
          { label: 'Taxistas', value: stats.totalDrivers, color: 'var(--success)' },
          { label: 'Restaurantes', value: stats.totalRestaurants, color: 'var(--warning)' },
          { label: 'Corridas', value: stats.totalRides, color: 'var(--danger)' },
          { label: 'Pendentes Taxistas', value: stats.pendingDrivers, color: 'var(--yellow)' },
          { label: 'Pendentes Rest.', value: stats.pendingRestaurants, color: 'var(--yellow)' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div className="text-sm text-gray">{item.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{item.value ?? '-'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get(`/admin/users?search=${search}`);
      setUsers(data.users || []);
    } catch {}
  };

  const toggleBlock = async (user) => {
    try {
      await api.patch(`/admin/users/${user.id}/block`, { blocked: !user.blocked });
      toast.success(`Usuario ${user.blocked ? 'desbloqueado' : 'bloqueado'}`);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Usuarios</h2>
      <input className="input mb-16" placeholder="Buscar usuarios..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadUsers()} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gray-200)' }}>
              <th style={{ padding: 8 }}>Nome</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Tipo</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <td style={{ padding: 8 }}>{u.name}</td>
                <td style={{ padding: 8, fontSize: 13 }}>{u.email || '-'}</td>
                <td style={{ padding: 8 }}><span className="badge badge-blue">{u.role}</span></td>
                <td style={{ padding: 8 }}><span className={`badge ${u.verified ? 'badge-green' : 'badge-red'}`}>{u.verified ? 'Verificado' : 'Pendente'}</span></td>
                <td style={{ padding: 8 }}>
                  <button className={`btn btn-sm ${u.blocked ? 'btn-secondary' : 'btn-danger'}`} style={{ width: 'auto' }} onClick={() => toggleBlock(u)}>
                    {u.blocked ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    try {
      const data = await api.get('/admin/drivers/pending');
      setDrivers(data.drivers || []);
    } catch {}
  };

  const approve = async (id, status) => {
    try {
      await api.patch(`/admin/drivers/${id}/approve`, { status });
      toast.success(`Motorista ${status}`);
      loadDrivers();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Taxistas Pendentes</h2>
      {drivers.map(d => (
        <div key={d.id} className="card mb-8 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="avatar">{d.user?.name?.[0]}</div>
            <div>
              <div className="font-semibold">{d.user?.name}</div>
              <div className="text-xs text-gray">{d.vehicle_model} - {d.vehicle_plate}</div>
            </div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-primary" style={{ width: 'auto' }} onClick={() => approve(d.id, 'approved')}>Aprovar</button>
            <button className="btn btn-sm btn-danger" style={{ width: 'auto' }} onClick={() => approve(d.id, 'rejected')}>Rejeitar</button>
          </div>
        </div>
      ))}
      {drivers.length === 0 && <p className="text-gray text-center py-16">Nenhum taxista pendente</p>}
    </div>
  );
}

function AdminDelivery() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => { loadDeliveries(); }, []);

  const loadDeliveries = async () => {
    try {
      const data = await api.get('/admin/delivery/pending');
      setDeliveries(data.deliveries || []);
    } catch {}
  };

  const approve = async (id, status) => {
    try {
      await api.patch(`/admin/delivery/${id}/approve`, { status });
      toast.success(`Entregador ${status}`);
      loadDeliveries();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Entregadores Pendentes</h2>
      {deliveries.map(d => (
        <div key={d.id} className="card mb-8 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="avatar">{d.user?.name?.[0]}</div>
            <div>
              <div className="font-semibold">{d.user?.name}</div>
              <div className="text-xs text-gray">{d.vehicle_type}</div>
            </div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-primary" style={{ width: 'auto' }} onClick={() => approve(d.id, 'approved')}>Aprovar</button>
            <button className="btn btn-sm btn-danger" style={{ width: 'auto' }} onClick={() => approve(d.id, 'rejected')}>Rejeitar</button>
          </div>
        </div>
      ))}
      {deliveries.length === 0 && <p className="text-gray text-center py-16">Nenhum entregador pendente</p>}
    </div>
  );
}

function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => { loadRestaurants(); }, []);

  const loadRestaurants = async () => {
    try {
      const data = await api.get('/admin/restaurants/pending');
      setRestaurants(data.restaurants || []);
    } catch {}
  };

  const approve = async (id, status) => {
    try {
      await api.patch(`/admin/restaurants/${id}/approve`, { status });
      toast.success(`Restaurante ${status}`);
      loadRestaurants();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Restaurantes Pendentes</h2>
      {restaurants.map(r => (
        <div key={r.id} className="card mb-8 flex items-center justify-between">
          <div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs text-gray">{r.category} - {r.address_city}/{r.address_state}</div>
            <div className="text-xs text-gray">Proprietario: {r.owner?.name}</div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-sm btn-primary" style={{ width: 'auto' }} onClick={() => approve(r.id, 'active')}>Ativar</button>
            <button className="btn btn-sm btn-danger" style={{ width: 'auto' }} onClick={() => approve(r.id, 'rejected')}>Rejeitar</button>
          </div>
        </div>
      ))}
      {restaurants.length === 0 && <p className="text-gray text-center py-16">Nenhum restaurante pendente</p>}
    </div>
  );
}

function AdminFinancial() {
  const [report, setReport] = useState(null);

  useEffect(() => { loadReport(); }, []);

  const loadReport = async (period = 'daily') => {
    try {
      const data = await api.get(`/admin/reports/financial?period=${period}`);
      setReport(data.report);
    } catch {}
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Financeiro</h2>
      <div className="flex gap-8 mb-16">
        {['daily', 'weekly', 'monthly'].map(p => (
          <button key={p} className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => loadReport(p)}>
            {p === 'daily' ? 'Hoje' : p === 'weekly' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>
      {report && (
        <div className="grid-3">
          {[
            { label: 'Corridas', value: `R$ ${report.totalRides}` },
            { label: 'Food', value: `R$ ${report.totalFood}` },
            { label: 'Receita Total', value: `R$ ${report.totalRevenue}`, highlight: true },
            { label: 'Saques', value: `R$ ${report.totalWithdrawn}` },
            { label: 'Receita Liquida', value: `R$ ${report.netRevenue}`, highlight: true },
            { label: 'Periodo', value: report.period },
          ].map((item, i) => (
            <div key={i} className="card" style={item.highlight ? { border: '2px solid var(--yellow)' } : {}}>
              <div className="text-sm text-gray">{item.label}</div>
              <div className="font-bold text-lg">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSupport() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    try {
      const data = await api.get('/admin/support');
      setTickets(data.tickets || []);
    } catch {}
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Suporte</h2>
      {tickets.map(t => (
        <div key={t.id} className="card mb-8">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">{t.subject}</span>
            <span className={`badge ${t.status === 'open' ? 'badge-red' : t.status === 'in_progress' ? 'badge-yellow' : 'badge-green'}`}>{t.status}</span>
          </div>
          <p className="text-sm text-gray-dark">{t.message}</p>
          <div className="text-xs text-gray mt-4">De: {t.user?.name} - {t.user?.email}</div>
        </div>
      ))}
      {tickets.length === 0 && <p className="text-gray text-center py-16">Nenhum ticket</p>}
    </div>
  );
}

function AdminReports() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/admin/stats');
        setStats(data.stats);
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Relatorios</h2>
      <div className="card">
        <div className="grid-2">
          {[
            { label: 'Total de Usuarios', value: stats.totalUsers },
            { label: 'Total de Taxistas', value: stats.totalDrivers },
            { label: 'Total de Restaurantes', value: stats.totalRestaurants },
            { label: 'Total de Corridas', value: stats.totalRides },
          ].map((item, i) => (
            <div key={i} className="text-center p-16">
              <div className="text-2xl font-bold">{item.value ?? '-'}</div>
              <div className="text-xs text-gray">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: 24, maxWidth: 'calc(100vw - 240px)', overflowY: 'auto' }}>
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="delivery" element={<AdminDelivery />} />
          <Route path="restaurants" element={<AdminRestaurants />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="reports" element={<AdminReports />} />
        </Routes>
      </div>
    </div>
  );
}
