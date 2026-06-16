import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiShield, FiStar, FiSettings, FiHelpCircle, FiInfo, FiCheck, FiCamera, FiBell, FiMapPin, FiMoon, FiGlobe, FiMail, FiPhone, FiLock, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../config/supabase';
import toast from 'react-hot-toast';

const SECTIONS = [
  { id: 'identity', icon: FiShield, label: 'Verificacao de Identidade' },
  { id: 'age', icon: FiAlertTriangle, label: 'Verificacao de Idade' },
  { id: 'reviews', icon: FiStar, label: 'Avaliacoes' },
  { id: 'preferences', icon: FiSettings, label: 'Preferencias' },
  { id: 'help', icon: FiHelpCircle, label: 'Ajuda e Suporte' },
  { id: 'about', icon: FiInfo, label: 'Sobre o App' },
];

function IdentitySection() {
  const { user, profile, loadProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [docType, setDocType] = useState(profile?.document_type || 'cpf');
  const [docNum, setDocNum] = useState(profile?.document_number || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('user_profiles').update({
        document_type: docType, document_number: docNum,
      }).eq('firebase_uid', user?.id);
      await loadProfile();
      toast.success('Documento salvo!');
      setEditing(false);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <h3 className="font-bold text-lg mb-8">Verificacao de Identidade</h3>
      <div className="card mb-12">
        <div className="flex items-center gap-8 mb-12">
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 24, background: profile?.face_verified ? 'var(--success)' : 'var(--gray-200)' }}>
            {profile?.face_verified ? <FiCheck color="#fff" /> : '?'}
          </div>
          <div>
            <div className="font-semibold">Biometria Facial</div>
            <div className={`text-xs ${profile?.face_verified ? 'text-green' : 'text-gray'}`}>
              {profile?.face_verified ? 'Verificada' : 'Nao verificada'}
            </div>
          </div>
        </div>

        {!editing ? (
          <div>
            <div className="flex justify-between mb-4">
              <span className="text-xs text-gray">Tipo Documento</span>
              <span className="text-xs font-semibold">{profile?.document_type?.toUpperCase() || 'Nao informado'}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-xs text-gray">Numero</span>
              <span className="text-xs font-semibold">{profile?.document_number || 'Nao informado'}</span>
            </div>
            <button className="btn btn-sm btn-outline mt-8" style={{ width: 'auto' }} onClick={() => setEditing(true)}>Editar Documento</button>
          </div>
        ) : (
          <div>
            <div className="flex gap-8 mb-8">
              {['cpf', 'cnpj'].map(t => (
                <button key={t} className={`btn btn-sm ${docType === t ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, textTransform: 'uppercase' }} onClick={() => setDocType(t)}>{t}</button>
              ))}
            </div>
            <div className="input-group">
              <label>Numero do {docType.toUpperCase()}</label>
              <input className="input" value={docNum} onChange={e => setDocNum(e.target.value)} placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0001-00'} />
            </div>
            <div className="flex gap-8 mt-8">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ background: '#f0f7ff' }}>
        <FiShield size={20} color="var(--blue)" />
        <p className="text-xs text-gray-dark mt-4">Seus dados sao protegidos e usados apenas para verificacao.</p>
      </div>
    </div>
  );
}

function AgeSection() {
  const [birthDate, setBirthDate] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleVerify = () => {
    if (!birthDate) { toast.error('Informe sua data de nascimento'); return; }
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    const finalAge = m < 0 || (m === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
    setShowResult(true);
    if (finalAge >= 18) {
      toast.success('Idade verificada! Voce e maior de 18 anos.');
    } else {
      toast.error('Menor de idade. Alguns recursos podem ser limitados.');
    }
  };

  return (
    <div className="fade-in">
      <h3 className="font-bold text-lg mb-8">Verificacao de Idade</h3>
      <div className="card mb-12 text-center" style={{ padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
        <p className="text-sm text-gray-dark mb-16">Informe sua data de nascimento para verificar sua idade</p>
        <div className="input-group">
          <label>Data de Nascimento</label>
          <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>
        <button className="btn btn-primary mt-8" onClick={handleVerify}>Verificar Idade</button>
        {showResult && (
          <div className="mt-16 p-12" style={{ background: '#f0f7ff', borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>✅</div>
            <div className="font-semibold">Maior de idade</div>
            <div className="text-xs text-gray mt-4">Acesso liberado para todos os recursos</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsSection() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);

  React.useEffect(() => {
    const load = async () => {
      const { data: profile } = await supabase.from('user_profiles').select('id').eq('firebase_uid', user?.id).single();
      if (profile) {
        const { data } = await supabase.from('rides').select('*').eq('passenger_id', profile.id).not('rating', 'is', null).order('created_at', { ascending: false }).limit(10);
        setRides(data || []);
      }
    };
    load();
  }, [user?.id]);

  return (
    <div className="fade-in">
      <h3 className="font-bold text-lg mb-8">Avaliacoes</h3>
      {rides.length === 0 && <p className="text-gray text-sm text-center py-16">Nenhuma avaliacao ainda</p>}
      {rides.map(r => (
        <div key={r.id} className="card mb-8 flex items-center gap-12">
          <div style={{ fontSize: 24 }}>{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          <div style={{ flex: 1 }}>
            <div className="text-xs text-gray">{r.destination_address?.split(',').slice(0, 2).join(',')}</div>
            <div className="text-xs text-gray">{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
          </div>
          <span className="text-sm font-bold">R$ {r.final_price || r.estimated_price}</span>
        </div>
      ))}
    </div>
  );
}

function PreferencesSection() {
  const [notif, setNotif] = useState(true);
  const [sound, setSound] = useState(true);
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState('pt-BR');

  return (
    <div className="fade-in">
      <h3 className="font-bold text-lg mb-8">Preferencias</h3>
      <div className="card">
        {[
          { icon: FiBell, label: 'Notificacoes', value: notif, set: setNotif },
          { icon: FiMoon, label: 'Modo Escuro', value: dark, set: setDark },
          { icon: FiMapPin, label: 'Som de navegacao', value: sound, set: setSound },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--gray-100)' : 'none' }}>
            <div className="flex items-center gap-8">
              <item.icon size={18} color="var(--gray-300)" />
              <span className="text-sm">{item.label}</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        ))}
        <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
          <div className="flex items-center gap-8">
            <FiGlobe size={18} color="var(--gray-300)" />
            <span className="text-sm">Idioma</span>
          </div>
          <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={lang} onChange={e => setLang(e.target.value)}>
            <option value="pt-BR">Portugues (BR)</option>
            <option value="en">English</option>
            <option value="es">Espanol</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function HelpSection() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const faqs = [
    { q: 'Como solicitar uma corrida?', a: 'Abra o app, clique em "Corridas" no menu inferior, marque seu destino no mapa e solicite.' },
    { q: 'Como ser um parceiro?', a: 'Va em Perfil > "Vem ser parceiro" e preencha o cadastro.' },
    { q: 'Como funciona o pagamento?', a: 'PIX, cartao ou dinheiro. O PIX gera um QR Code para pagamento.' },
    { q: 'Como cancelar uma corrida?', a: 'Na tela de acompanhamento, clique em "Cancelar Corrida".' },
  ];

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Escreva uma mensagem'); return; }
    setSending(true);
    try {
      await supabase.from('support_tickets').insert({
        user_id: user?.id,
        subject: subject || 'Suporte 44Taxi',
        message,
        status: 'open',
      });
      toast.success('Ticket enviado! Responderemos em ate 24h.');
      setSubject('');
      setMessage('');
    } catch (err) { toast.error(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="fade-in">
      <h3 className="font-bold text-lg mb-8">Ajuda e Suporte</h3>
      <div className="card mb-12">
        <h4 className="font-semibold mb-8">Perguntas Frequentes</h4>
        {faqs.map((f, i) => (
          <details key={i} style={{ marginBottom: 8, borderBottom: i < faqs.length - 1 ? '1px solid var(--gray-100)' : 'none', paddingBottom: 8 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>{f.q}</summary>
            <p className="text-sm text-gray-dark mt-4">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="card">
        <h4 className="font-semibold mb-8">Fale Conosco</h4>
        <div className="input-group">
          <label>Assunto</label>
          <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Problema com corrida" />
        </div>
        <div className="input-group">
          <label>Mensagem</label>
          <textarea className="input" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva seu problema..." style={{ resize: 'vertical' }} />
        </div>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar Mensagem'}
        </button>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="fade-in text-center">
      <h3 className="font-bold text-lg mb-8">Sobre o 44Taxi</h3>
      <div className="card mb-12" style={{ padding: 32 }}>
        <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 12 }}>
          <span style={{ color: '#FFD700' }}>44</span>Taxi
        </div>
        <p className="text-sm text-gray-dark">Mobilidade e Delivery</p>
        <div className="divider my-16" />
        <div className="text-left">
          <div className="flex justify-between mb-4"><span className="text-xs text-gray">Versao</span><span className="text-xs font-semibold">1.0.0</span></div>
          <div className="flex justify-between mb-4"><span className="text-xs text-gray">Plataforma</span><span className="text-xs font-semibold">Web / PWA</span></div>
          <div className="flex justify-between mb-4"><span className="text-xs text-gray">Pagamentos</span><span className="text-xs font-semibold">PIX / Cartao / Dinheiro</span></div>
          <div className="flex justify-between mb-4"><span className="text-xs text-gray">Cobertura</span><span className="text-xs font-semibold">Nacional</span></div>
        </div>
      </div>
      <div className="card" style={{ background: '#f0f7ff' }}>
        <FiInfo size={20} color="var(--blue)" />
        <p className="text-xs text-gray-dark mt-4">44Taxi - Sua mobilidade com tecnologia e seguranca.</p>
        <p className="text-xs text-gray mt-4">© 2026 44Taxi. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');

  const renderSection = () => {
    switch (section) {
      case 'identity': return <IdentitySection />;
      case 'age': return <AgeSection />;
      case 'reviews': return <ReviewsSection />;
      case 'preferences': return <PreferencesSection />;
      case 'help': return <HelpSection />;
      case 'about': return <AboutSection />;
      default:
        return (
          <div className="fade-in">
            <h3 className="font-bold text-lg mb-8">Configuracoes</h3>
            <div className="card">
              {SECTIONS.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between" style={{ padding: '12px 0', cursor: 'pointer', borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--gray-100)' : 'none' }}
                  onClick={() => navigate(`/settings?section=${s.id}`)}>
                  <div className="flex items-center gap-8">
                    <s.icon size={18} color="var(--gray-300)" />
                    <span className="text-sm">{s.label}</span>
                  </div>
                  <FiChevronRight color="var(--gray-300)" />
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container fade-in" style={{ paddingBottom: 40 }}>
      <div className="flex items-center gap-12 mb-16">
        {section && (
          <button className="btn btn-sm btn-ghost" style={{ width: 'auto', padding: '8px 0' }} onClick={() => navigate('/settings')}>
            <FiArrowLeft size={20} />
          </button>
        )}
        <h2 className="font-bold text-xl">Configuracoes</h2>
      </div>
      {renderSection()}
    </div>
  );
}
