import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function DriverRegister() {
  const navigate = useNavigate();
  const [type, setType] = useState('driver');
  const [form, setForm] = useState({
    cnh_number: '', vehicle_type: 'carro', vehicle_plate: '',
    vehicle_model: '', vehicle_year: '', vehicle_color: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'driver') {
        await api.post('/drivers/register', form);
      } else {
        await api.post('/drivers/delivery/register', {
          vehicle_type: form.vehicle_type,
          vehicle_plate: form.vehicle_plate,
        });
      }
      toast.success('Cadastro enviado para aprovacao!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in">
      <button className="btn btn-sm btn-outline mb-16" style={{ width: 'auto' }} onClick={() => navigate(-1)}>
        <FiArrowLeft /> Voltar
      </button>

      <h2 className="font-bold mb-16">Quero Trabalhar</h2>

      <div className="flex gap-8 mb-16">
        <button className={`btn btn-sm ${type === 'driver' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setType('driver')}>🚗 Taxista</button>
        <button className={`btn btn-sm ${type === 'delivery' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setType('delivery')}>📦 Entregador</button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-16">{type === 'driver' ? 'Cadastro de Motorista' : 'Cadastro de Entregador'}</h3>

        <form onSubmit={handleSubmit}>
          {type === 'driver' && (
            <>
              <div className="input-group">
                <label>Numero da CNH</label>
                <input className="input" name="cnh_number" placeholder="12345678900" value={form.cnh_number} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Tipo de Veiculo</label>
                <select className="input" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                  <option value="carro">Carro</option>
                  <option value="moto">Moto</option>
                </select>
              </div>
              <div className="input-group">
                <label>Placa</label>
                <input className="input" name="vehicle_plate" placeholder="ABC-1234" value={form.vehicle_plate} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Modelo</label>
                <input className="input" name="vehicle_model" placeholder="Toyota Corolla" value={form.vehicle_model} onChange={handleChange} />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Ano</label>
                  <input className="input" name="vehicle_year" type="number" placeholder="2024" value={form.vehicle_year} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Cor</label>
                  <input className="input" name="vehicle_color" placeholder="Preto" value={form.vehicle_color} onChange={handleChange} />
                </div>
              </div>
            </>
          )}

          {type === 'delivery' && (
            <>
              <div className="input-group">
                <label>Tipo de Veiculo</label>
                <select className="input" name="vehicle_type" value={form.vehicle_type} onChange={handleChange}>
                  <option value="moto">Moto</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="carro">Carro</option>
                </select>
              </div>
              <div className="input-group">
                <label>Placa (opcional)</label>
                <input className="input" name="vehicle_plate" placeholder="ABC-1234" value={form.vehicle_plate} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="card mb-16" style={{ background: 'var(--yellow-light)' }}>
            <p className="text-sm">Ao enviar, voce concorda com os termos de uso e passara por verificacao de documentos.</p>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar para Aprovacao'}
          </button>
        </form>
      </div>
    </div>
  );
}
