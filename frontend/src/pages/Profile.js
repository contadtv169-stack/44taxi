import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiShield, FiLogOut, FiChevronRight, FiCamera, FiStar, FiSettings, FiHelpCircle, FiInfo, FiAward, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../config/supabase';
import Banner from '../components/Banner';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, profile, logout, loadProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name })
        .eq('firebase_uid', user?.id);
      if (error) throw error;
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

  const isCliente = !profile || profile?.role === 'cliente';
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuario';
  const displayEmail = profile?.email || user?.email || '';
  const displayPhone = profile?.phone || '';
  const displayRole = profile?.role === 'dono_delivery' ? 'Dono de Delivery' : (profile?.role || 'Cliente');

  return (
    <div className="container fade-in">
      <div className="card text-center mb-16" style={{ padding: 24, border: '1px solid var(--gray-100)' }}>
        <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, margin: '0 auto 12px', background: 'var(--black)', color: '#fff' }}>
          {displayName[0]?.toUpperCase() || '?'}
        </div>
        {!editing ? (
          <>
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-sm text-gray">{displayEmail}</p>
            {displayPhone && <p className="text-xs text-gray mt-4">{displayPhone}</p>}
            <span className="badge badge-black mt-8" style={{ textTransform: 'capitalize' }}>
              {displayRole}
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

      {/* Vem ser parceiro - Destaque */}
      {isCliente && (
        <>
          <div className="card mb-16" style={{
            background: 'linear-gradient(135deg, #1a1a2e, #2563eb)',
            color: '#fff', padding: 24, textAlign: 'center', cursor: 'pointer',
            border: '2px solid #FFD700',
          }} onClick={() => navigate('/partner')}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
            <h3 className="font-bold text-lg">Vem ser parceiro 44Taxi!</h3>
            <p className="text-sm mt-4" style={{ opacity: 0.9 }}>
              Seja motorista, entregador ou cadastre seu restaurante.
            </p>
            <div className="flex gap-8 justify-center mt-12">
              <span style={{ fontSize: 32 }}>🚗</span>
              <span style={{ fontSize: 32 }}>🏍️</span>
              <span style={{ fontSize: 32 }}>🏪</span>
            </div>
            <div style={{
              background: '#FFD700', color: '#1a1a2e', fontWeight: 700,
              borderRadius: 20, padding: '8px 20px', display: 'inline-block',
              marginTop: 12, fontSize: 14,
            }}>
              Quero ser parceiro →
            </div>
          </div>
          <Banner type="driver" onClick={() => navigate('/partner')} style={{ marginBottom: 8 }} />
          <Banner type="partner" onClick={() => navigate('/partner')} style={{ marginBottom: 16 }} />
        </>
      )}

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

      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Acesso Rapido</h3>
        {[
          { icon: '🚗', label: 'Historico de Corridas', path: '/rides' },
          { icon: '🍔', label: 'Meus Pedidos', path: '/food' },
          { icon: '💰', label: 'Meus Ganhos', path: '/earnings' },
          { icon: '🎁', label: 'Cupons', path: '/coupons' },
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

      <div className="card mb-16">
        <h3 className="font-semibold mb-12">Configurações</h3>
        {[
          { icon: FiShield, label: 'Verificacao de Identidade', section: 'identity' },
          { icon: FiAlertTriangle, label: 'Verificacao de Idade', section: 'age' },
          { icon: FiStar, label: 'Avaliacoes', section: 'reviews' },
          { icon: FiSettings, label: 'Preferencias', section: 'preferences' },
          { icon: FiHelpCircle, label: 'Ajuda e Suporte', section: 'help' },
          { icon: FiInfo, label: 'Sobre o 44Taxi', section: 'about' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between" style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < 5 ? '1px solid var(--gray-100)' : 'none' }}
            onClick={() => navigate(`/settings?section=${item.section}`)}>
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
