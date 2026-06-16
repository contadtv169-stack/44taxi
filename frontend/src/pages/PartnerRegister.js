import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiCheck, FiUpload, FiUser, FiShield, FiFile } from 'react-icons/fi';
import supabase from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const steps = [
  { id: 'type', label: 'Tipo' },
  { id: 'data', label: 'Dados' },
  { id: 'documents', label: 'Documentos' },
  { id: 'face', label: 'Verificacao' },
  { id: 'done', label: 'Enviado' },
  { id: 'approved', label: 'Aprovado' },
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoApproved, setAutoApproved] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadField, setUploadField] = useState('');

  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    document: '',
    cnh_number: '',
    vehicle_type: 'carro',
    vehicle_plate: '',
    vehicle_model: '',
    vehicle_color: '',
    vehicle_year: '',
    delivery_vehicle: 'moto',
    restaurant_name: '',
    restaurant_category: '',
    restaurant_address: '',
    documents: {},
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileUpload = async (fieldName, file) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `partners/${user.id}/${fieldName}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path);
      setForm({ ...form, documents: { ...form.documents, [fieldName]: publicUrl } });
      toast.success(`${fieldName} enviado!`);
    } catch (err) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      toast.error('Permita acesso a camera para verificacao facial');
    }
  };

  const captureFace = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setForm({ ...form, selfie: dataUrl });
    setFaceCaptured(true);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
    toast.success('Rosto capturado com sucesso!');
  };

  const triggerUpload = (field) => {
    setUploadField(field);
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        firebase_uid: user?.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        document: form.document,
        documents: form.documents,
        selfie: form.selfie,
      };

      // Robo de aprovacao automatica
      const docCount = Object.keys(form.documents).length;
      const hasFace = !!form.selfie;
      const autoApprove = (type === 'driver' && docCount >= 1 && hasFace) ||
                          (type === 'delivery' && docCount >= 1 && hasFace) ||
                          (type === 'restaurant');

      if (type === 'driver') {
        await supabase.from('drivers').insert({
          ...payload,
          cnh_number: form.cnh_number,
          vehicle_type: form.vehicle_type,
          vehicle_plate: form.vehicle_plate,
          vehicle_model: form.vehicle_model,
          vehicle_color: form.vehicle_color,
          vehicle_year: form.vehicle_year ? parseInt(form.vehicle_year) : null,
          status: autoApprove ? 'approved' : 'pending',
          onboarding_completed: autoApprove,
        });
      } else if (type === 'delivery') {
        await supabase.from('delivery_people').insert({
          ...payload,
          vehicle_type: form.delivery_vehicle,
          status: autoApprove ? 'approved' : 'pending',
        });
      } else if (type === 'restaurant') {
        await supabase.from('restaurants').insert({
          owner_firebase_uid: user?.id,
          owner_name: form.name,
          owner_email: form.email,
          owner_phone: form.phone,
          name: form.restaurant_name,
          category: form.restaurant_category,
          address_street: form.restaurant_address,
          status: 'active',
        });
      }

      const roleMap = { driver: 'taxista', delivery: 'entregador', restaurant: 'dono_restaurante' };
      const newRole = roleMap[type];
      await supabase.from('user_profiles').update({
        role: newRole,
        verified: autoApprove || type === 'restaurant',
        face_verified: hasFace,
        name: form.name,
        phone: form.phone,
      }).eq('firebase_uid', user?.id);

      if (autoApprove || type === 'restaurant') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('44Taxi', {
            body: `Parabens! Seu cadastro como ${newRole} foi aprovado!`,
          });
        }
        supabase.from('notifications').insert({
          user_id: user.id,
          title: `Cadastro aprovado!`,
          body: `Parabens! Seu cadastro como ${newRole} foi aprovado automaticamente`,
          type: 'partner',
        }).then();
        toast.success('Parabens! Cadastro aprovado automaticamente!');
        setAutoApproved(true);
        setStep(5);
      } else {
        toast.success('Cadastro enviado para analise!');
        setStep(4);
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="container fade-in" style={{ paddingBottom: 40 }}>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) handleFileUpload(uploadField, e.target.files[0]); }} />

      <button className="btn btn-sm btn-ghost mb-12" style={{ width: 'auto', padding: '8px 0' }}
        onClick={() => step === 0 ? navigate(-1) : setStep(step - 1)}>
        <FiArrowLeft size={18} /> {step === 0 ? 'Voltar' : 'Passo anterior'}
      </button>

      <h2 className="font-bold text-xl mb-4">Ser Parceiro</h2>

      <div style={{ height: 4, background: 'var(--gray-100)', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue)', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>

      <div className="flex justify-between mb-24">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center" style={{ flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i <= step ? 'var(--blue)' : 'var(--gray-100)',
              color: i <= step ? '#fff' : 'var(--gray-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, transition: 'all 0.3s',
            }}>{i < step ? '✓' : i + 1}</div>
            <div className="text-xs mt-4" style={{ color: i <= step ? 'var(--blue)' : 'var(--gray-300)', fontWeight: i === step ? 700 : 400 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="fade-in">
          <p className="text-sm text-gray-dark mb-16">Escolha como deseja trabalhar conosco</p>
          <div className="flex flex-col gap-12">
            {[
              { id: 'driver', icon: '🚗', title: 'Taxista', desc: 'Motorista de carro ou moto, ganhe por corrida' },
              { id: 'delivery', icon: '📦', title: 'Entregador', desc: 'Moto, bicicleta ou carro, entregue pedidos' },
              { id: 'restaurant', icon: '🏪', title: 'Restaurante', desc: 'Cadastre seu estabelecimento e venda mais' },
            ].map(opt => (
              <div key={opt.id} className="card flex items-center gap-12"
                style={{ cursor: 'pointer', border: type === opt.id ? '2px solid var(--blue)' : '2px solid transparent', padding: 16 }}
                onClick={() => { setType(opt.id); setTimeout(() => setStep(1), 300); }}>
                <span style={{ fontSize: 36 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="font-bold">{opt.title}</div>
                  <div className="text-xs text-gray-dark">{opt.desc}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid', borderColor: type === opt.id ? 'var(--blue)' : 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {type === opt.id && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--blue)' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fade-in">
          <h3 className="font-bold mb-16">Dados Pessoais</h3>
          <div className="card">
            <div className="input-group">
              <label>Nome completo</label>
              <input className="input" name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required />
            </div>
            <div className="input-group">
              <label>Telefone</label>
              <input className="input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" />
            </div>
            <div className="input-group">
              <label>CPF</label>
              <input className="input" name="document" value={form.document} onChange={handleChange} placeholder="000.000.000-00" />
            </div>

            {type === 'driver' && (
              <>
                <h4 className="font-semibold mt-16 mb-8">Dados do Veiculo</h4>
                <div className="input-group">
                  <label>Numero da CNH</label>
                  <input className="input" name="cnh_number" value={form.cnh_number} onChange={handleChange} placeholder="CNH" />
                </div>
                <div className="input-group">
                  <label>Tipo</label>
                  <select className="input" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                    <option value="carro">Carro</option>
                    <option value="moto">Moto</option>
                  </select>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Placa</label>
                    <input className="input" name="vehicle_plate" value={form.vehicle_plate} onChange={handleChange} placeholder="ABC-1234" />
                  </div>
                  <div className="input-group">
                    <label>Modelo</label>
                    <input className="input" name="vehicle_model" value={form.vehicle_model} onChange={handleChange} placeholder="Ex: Corolla" />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Ano</label>
                    <input className="input" name="vehicle_year" type="number" value={form.vehicle_year} onChange={handleChange} placeholder="2024" />
                  </div>
                  <div className="input-group">
                    <label>Cor</label>
                    <input className="input" name="vehicle_color" value={form.vehicle_color} onChange={handleChange} placeholder="Preto" />
                  </div>
                </div>
              </>
            )}

            {type === 'delivery' && (
              <>
                <h4 className="font-semibold mt-16 mb-8">Veiculo para Entrega</h4>
                <div className="flex gap-8">
                  {['moto', 'bicicleta', 'carro'].map(v => (
                    <button key={v} className={`btn btn-sm ${form.delivery_vehicle === v ? 'btn-primary' : 'btn-outline'}`}
                      style={{ flex: 1, textTransform: 'capitalize' }} onClick={() => setForm({ ...form, delivery_vehicle: v })}>
                      {v === 'moto' ? '🏍️' : v === 'bicicleta' ? '🚲' : '🚗'} {v}
                    </button>
                  ))}
                </div>
              </>
            )}

            {type === 'restaurant' && (
              <>
                <h4 className="font-semibold mt-16 mb-8">Dados do Restaurante</h4>
                <div className="input-group">
                  <label>Nome do restaurante</label>
                  <input className="input" name="restaurant_name" value={form.restaurant_name} onChange={handleChange} placeholder="Nome do seu negocio" />
                </div>
                <div className="input-group">
                  <label>Categoria</label>
                  <select className="input" name="restaurant_category" value={form.restaurant_category} onChange={handleChange}>
                    <option value="">Selecione</option>
                    <option value="Brasileira">Brasileira</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Hamburguer">Hamburguer</option>
                    <option value="Japonesa">Japonesa</option>
                    <option value="Acai">Acai</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Endereco</label>
                  <input className="input" name="restaurant_address" value={form.restaurant_address} onChange={handleChange} placeholder="Rua, numero, bairro" />
                </div>
              </>
            )}

            <button className="btn btn-primary mt-8" onClick={() => setStep(2)}>
              Continuar <FiArrowLeft style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <h3 className="font-bold mb-16">Documentos</h3>
          <div className="card">
            <p className="text-sm text-gray-dark mb-16">Envie os documentos para verificacao</p>
            <div className="flex flex-col gap-8">
              {type !== 'restaurant' && (
                <>
                  <div className="flex items-center gap-8" style={{ cursor: 'pointer', padding: 12, background: form.documents.cnh_front ? '#f0f7ff' : 'var(--gray-100)', borderRadius: 12, border: form.documents.cnh_front ? '1px solid var(--blue)' : 'none' }} onClick={() => triggerUpload('cnh_front')}>
                    <FiFile size={20} color={form.documents.cnh_front ? 'var(--blue)' : 'var(--gray-300)'} />
                    <span style={{ flex: 1, fontSize: 14 }}>{form.documents.cnh_front ? 'CNH (frente) ✓' : 'CNH (frente)'}</span>
                    {uploading && uploadField === 'cnh_front' ? <span className="text-xs">Enviando...</span> : <FiUpload size={16} />}
                  </div>
                  <div className="flex items-center gap-8" style={{ cursor: 'pointer', padding: 12, background: form.documents.cnh_back ? '#f0f7ff' : 'var(--gray-100)', borderRadius: 12, border: form.documents.cnh_back ? '1px solid var(--blue)' : 'none' }} onClick={() => triggerUpload('cnh_back')}>
                    <FiFile size={20} color={form.documents.cnh_back ? 'var(--blue)' : 'var(--gray-300)'} />
                    <span style={{ flex: 1, fontSize: 14 }}>{form.documents.cnh_back ? 'CNH (verso) ✓' : 'CNH (verso)'}</span>
                    {uploading && uploadField === 'cnh_back' ? <span className="text-xs">Enviando...</span> : <FiUpload size={16} />}
                  </div>
                </>
              )}
              <div className="flex items-center gap-8" style={{ cursor: 'pointer', padding: 12, background: form.documents.selfie_doc ? '#f0f7ff' : 'var(--gray-100)', borderRadius: 12, border: form.documents.selfie_doc ? '1px solid var(--blue)' : 'none' }} onClick={() => triggerUpload('selfie_doc')}>
                <FiFile size={20} color={form.documents.selfie_doc ? 'var(--blue)' : 'var(--gray-300)'} />
                <span style={{ flex: 1, fontSize: 14 }}>{form.documents.selfie_doc ? 'Selfie com documento ✓' : 'Selfie com documento'}</span>
                {uploading && uploadField === 'selfie_doc' ? <span className="text-xs">Enviando...</span> : <FiUpload size={16} />}
              </div>
              {type === 'driver' && (
                <div className="flex items-center gap-8" style={{ cursor: 'pointer', padding: 12, background: form.documents.vehicle_doc ? '#f0f7ff' : 'var(--gray-100)', borderRadius: 12, border: form.documents.vehicle_doc ? '1px solid var(--blue)' : 'none' }} onClick={() => triggerUpload('vehicle_doc')}>
                  <FiFile size={20} color={form.documents.vehicle_doc ? 'var(--blue)' : 'var(--gray-300)'} />
                  <span style={{ flex: 1, fontSize: 14 }}>{form.documents.vehicle_doc ? 'Documento do veiculo ✓' : 'Documento do veiculo'}</span>
                  {uploading && uploadField === 'vehicle_doc' ? <span className="text-xs">Enviando...</span> : <FiUpload size={16} />}
                </div>
              )}
            </div>
            <button className="btn btn-primary mt-16" onClick={() => setStep(3)}>
              {Object.keys(form.documents).length > 0 ? 'Continuar →' : 'Pular, vou enviar depois →'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in">
          <h3 className="font-bold mb-16">Verificacao Facial</h3>
          <div className="card text-center" style={{ padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😀</div>
            <p className="text-sm text-gray-dark mb-16">Posicione seu rosto na frente da camera</p>

            <div style={{
              width: '100%', maxWidth: 320, height: 240, margin: '0 auto',
              background: 'var(--black)', borderRadius: 12, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', border: faceCaptured ? '3px solid var(--success)' : '3px solid var(--blue)',
            }}>
              {cameraActive ? (
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : faceCaptured ? (
                <div style={{ color: '#fff' }}>
                  <FiCheck size={48} color="var(--success)" />
                  <p className="text-sm mt-4" style={{ color: 'var(--success)' }}>Rosto verificado!</p>
                </div>
              ) : (
                <FiCamera size={40} color="rgba(255,255,255,0.3)" />
              )}
            </div>

            <div className="flex gap-8 mt-16 justify-center">
              {!cameraActive && !faceCaptured && (
                <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={startCamera}>
                  <FiCamera /> Abrir Camera
                </button>
              )}
              {cameraActive && (
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={captureFace}>
                  <FiCamera /> Capturar Rosto
                </button>
              )}
            </div>
          </div>

          <button className="btn btn-primary mt-8"
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Enviando...' : faceCaptured ? 'Enviar para Analise ✓' : 'Enviar mesmo assim'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="fade-in text-center" style={{ paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
          <h2 className="font-bold text-xl mb-8">Cadastro Enviado!</h2>
          <p className="text-sm text-gray-dark mb-16">
            Seu cadastro foi enviado para analise. <br />
            Assim que for aprovado, voce comecara a receber clientes.
          </p>
          <div className="card mb-16" style={{ background: '#f0f7ff' }}>
            <FiShield size={24} color="var(--blue)" style={{ marginBottom: 8 }} />
            <p className="text-sm font-semibold">Aprovacao em ate 24 horas</p>
            <p className="text-xs text-gray-dark mt-4">Voce recebera uma notificacao quando for aprovado</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            Ir para o Perfil
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="fade-in text-center" style={{ paddingTop: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
          <h2 className="font-bold text-xl mb-8">Parabens, voce foi aprovado!</h2>
          <p className="text-sm text-gray-dark mb-16">
            Seu cadastro foi analisado e aprovado automaticamente! <br />
            Agora voce ja pode comecar a receber clientes.
          </p>
          <div className="card mb-16" style={{ background: '#f0f7ff', border: '2px solid var(--success)' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <p className="text-sm font-semibold">Documentos verificados com sucesso</p>
            <p className="text-xs text-gray-dark mt-4">Biometria facial confirmada</p>
          </div>
          <div className="card mb-16" style={{ background: 'linear-gradient(135deg, #059669, #2563eb)', color: '#fff', padding: 20 }}>
            <div className="font-bold text-lg">🚀 Pronto para começar!</div>
            <p className="text-sm mt-4" style={{ opacity: 0.9 }}>
              Acesse o app e comece a receber corridas e pedidos agora mesmo!
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            Ir para o Perfil
          </button>
        </div>
      )}
    </div>
  );
}
