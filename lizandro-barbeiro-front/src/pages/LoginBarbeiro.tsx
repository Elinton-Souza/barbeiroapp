import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scissors, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginBarbeiro: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { loginTradicional } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const usuario = await loginTradicional(email, senha, 'BARBEIRO');
      if (usuario.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/barbeiro/semana');
      }
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Acesso Profissional</h2>
          <p style={{ fontSize: '12px', color: '#9A9DA3' }}>Gestão da Barbearia</p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#2B2D31',
          border: '1px solid #4A4D52',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div style={{ backgroundColor: '#0E0E0F', padding: '12px', borderRadius: '12px' }}>
          <Scissors size={24} color="#E4E4E6" />
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Lizandro Barbeiro</h3>
          <p style={{ fontSize: '12px', color: '#9A9DA3' }}>
            Entre com suas credenciais de barbeiro ou administrador.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="input-label">E-mail profissional</label>
          <input
            type="email"
            className="input-field"
            placeholder="Digite aqui seu e-mail profissional"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="input-label">Senha</label>
          <div className="input-password-wrapper">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              className="input-field"
              placeholder="Digite aqui sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-password-toggle"
              onClick={() => setMostrarSenha((v) => !v)}
              title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {erro && (
          <p style={{ color: '#EF4444', fontSize: '12px', textAlign: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '6px' }}>
            {erro}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={carregando} style={{ marginTop: '8px' }}>
          {carregando ? 'Verificando...' : 'Acessar Painel'}
        </button>
      </form>
    </div>
  );
};