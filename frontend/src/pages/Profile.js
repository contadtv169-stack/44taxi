import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiShield, FiLogOut, FiChevronRight, FiCamera, FiStar, FiSettings, FiHelpCircle, FiInfo, FiAward } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Banner from '../components/Banner';
import toast from 'react-hot-toast';

export default function Profile() {
  const { profile, logout, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name });
      await loadProfile();
      toast.success('Perfil atualizado');
      setEditing(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isCliente = profile?.role === 'cliente';

  return (
    <div className="container fade-in">
      {/* Profile Card */}
      <div className="card text-center mb-16" style={{ padding: 24, border: '1px solid var(--gray-100)' }}>
        <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, margin: '0 auto 12px', background: 'var(--black)', color: '#fff' }}>
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        {!editing ? (
          <>
            <h2 className="font-bold text-xl">{profile?.name}</h2>
            <p className="text-sm text-gray">{profile?.email}</p>
            {profile?.phone && <p className="text-xs text-gray mt-4">{profile?.phone}</p>}
            <span className="badge badge-black mt-8" style={{ textTransform: 'capitalize' }}>
              {profile?.role === 'dono_delivery' ? 'Dono de Delivery' : profile?.role || 'Cliente'}
            </span>
            <div className="flex gap-8 mt-12 justify-center">
              <button className="btn btn-sm btn-outline" style={{ width: 'auto' }} onClick={() => setEditing(true)}>Editar Perfil</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <div className="input-group">
              <label>Nome</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex gap-8">
              <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              <button className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Seja Parceiro - para clientes */}
      {isCliente && (
        <>
          <Banner type="driver" onClick={() => navigate('/driver/register')} style={{ marginBottom: 8 }} />
          <Banner type="partner" onClick={() => navigate('/restaurant/register')} style={{ marginBottom: 16 }} />
        </>
      )}

      {/* Driver / Restaurant Stats */}
      {!isCliente && (
        <div className="card mb-16">
          <h3 className="font-semibold mb-12">Seu Negócio</h3>
          <div className="flex items-center gap-12">
            <FiAward size={24} color="var(--blue)" />
            <div>
              <div className="font-semibold">{profile?.role === 'taxista' ? 'Taxista' : profile?.role === 'entregador' ? 'Entregador' : 'Restaurante'}</div>
              <div className="text-xs text-gray">Verifique seus ganhos e pedidos</div>
            </div>
            <button className="btn btn-sm btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} onClick={() => navigate('/earnings')}>Ver</button>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Acesso Rapido</h3>
        {[
          { icon: '🚗', label: 'Historico de Corridas', path: '/rides' },
          { icon: '🍔', label: 'Meus Pedidos', path: '/food' },
          { icon: '💰', label: 'Meus Ganhos', path: '/earnings' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between" style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }} onClick={() => navigate(item.path)}>
            <div className="flex items-center gap-12">
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
            <FiChevronRight color="var(--gray-300)" />
          </div>
        ))}
      </div>

      {/* Config */}
      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Configurações</h3>
        {[
          { icon: FiShield, label: 'Verificação de Identidade' },
          { icon: FiStar, label: 'Avaliações' },
          { icon: FiSettings, label: 'Preferências' },
          { icon: FiHelpCircle, label: 'Ajuda e Suporte' },
          { icon: FiInfo, label: 'Sobre o 44Taxi v1.0' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between" style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none' }}>
            <div className="flex items-center gap-12">
              <item.icon size={18} color="var(--gray-300)" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            <FiChevronRight color="var(--gray-300)" />
          </div>
        ))}
      </div>

      <button className="btn btn-danger mb-16" onClick={handleLogout}>
        <FiLogOut /> Sair da Conta
      </button>

      <p className="text-xs text-gray text-center mb-16">44Taxi v1.0.0 • Mobilidade e Delivery</p>
    </div>
  );
}
