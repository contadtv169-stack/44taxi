import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', category: '', phone: '',
    address_street: '', address_number: '', address_neighborhood: '',
    address_city: '', address_state: '', delivery_fee: 5, delivery_time_min: 30,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/restaurants/register', form);
      toast.success('Restaurante cadastrado para aprovacao!');
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

      <h2 className="font-bold mb-16">Cadastrar Restaurante</h2>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nome do Restaurante</label>
            <input className="input" name="name" placeholder="Nome do seu restaurante" value={form.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Descricao</label>
            <textarea className="input" name="description" rows={3} placeholder="Descreva seu restaurante..." value={form.description} onChange={handleChange} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label>Categoria</label>
              <select className="input" name="category" value={form.category} onChange={handleChange}>
                <option value="">Selecione</option>
                <option value="Brasileira">Brasileira</option>
                <option value="Pizza">Pizza</option>
                <option value="Hamburguer">Hamburguer</option>
                <option value="Japonesa">Japonesa</option>
                <option value="Italiana">Italiana</option>
                <option value="Mexicana">Mexicana</option>
                <option value="Acai">Acai</option>
                <option value="Saudavel">Saudavel</option>
              </select>
            </div>
            <div className="input-group">
              <label>Telefone</label>
              <input className="input" name="phone" placeholder="(11) 99999-9999" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <h4 className="font-semibold mt-16 mb-8">Endereco</h4>
          <div className="input-group">
            <label>Rua</label>
            <input className="input" name="address_street" placeholder="Rua" value={form.address_street} onChange={handleChange} required />
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label>Numero</label>
              <input className="input" name="address_number" placeholder="123" value={form.address_number} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Bairro</label>
              <input className="input" name="address_neighborhood" placeholder="Bairro" value={form.address_neighborhood} onChange={handleChange} />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label>Cidade</label>
              <input className="input" name="address_city" placeholder="Cidade" value={form.address_city} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Estado</label>
              <input className="input" name="address_state" placeholder="SP" value={form.address_state} onChange={handleChange} />
            </div>
          </div>

          <h4 className="font-semibold mt-16 mb-8">Entrega</h4>
          <div className="grid-2">
            <div className="input-group">
              <label>Taxa de Entrega (R$)</label>
              <input className="input" name="delivery_fee" type="number" step="0.50" value={form.delivery_fee} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Tempo Estimado (min)</label>
              <input className="input" name="delivery_time_min" type="number" value={form.delivery_time_min} onChange={handleChange} />
            </div>
          </div>

          <button className="btn btn-primary mt-16" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Cadastrar Restaurante'}
          </button>
        </form>
      </div>
    </div>
  );
}
