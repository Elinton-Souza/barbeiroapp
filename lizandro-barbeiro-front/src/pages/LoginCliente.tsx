import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginCliente: React.FC = () => {
  const [modo, setModo] = useState<'LOGIN' | 'CADASTRO'>('LOGIN');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { loginTradicional, cadastrarCliente, loginGoogle } = useAuth();
  const navigate = useNavigate();

  // Inicializa o botão oficial do Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google && googleBtnRef.current && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            setCarregando(true);
            setErro('');
            await loginGoogle(response.credential);
            navigate('/cliente/agenda');
          } catch (err: any) {
            setErro(err.message || 'Falha ao autenticar com o Google.');
          } finally {
            setCarregando(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 340,
        text: 'continue_with',
        shape: 'rectangular',
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (modo === 'LOGIN') {
        await loginTradicional(email, senha, 'CLIENTE');
      } else {
        await cadastrarCliente({ nome, email, senha, telefone });
      }
      navigate('/cliente/agenda');
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Área do Cliente</h2>
          <p style={{ fontSize: '12px', color: '#9A9DA3' }}>Agende seu horário com rapidez</p>
        </div>
      </div>

      {/* Abas Entrar / Cadastrar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#2B2D31',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}
      >
        <button
          type="button"
          onClick={() => { setModo('LOGIN'); setErro(''); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: modo === 'LOGIN' ? '#0E0E0F' : 'transparent',
            color: modo === 'LOGIN' ? '#E4E4E6' : '#9A9DA3',
          }}
        >
          Já tenho conta
        </button>
        <button
          type="button"
          onClick={() => { setModo('CADASTRO'); setErro(''); }}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: modo === 'CADASTRO' ? '#0E0E0F' : 'transparent',
            color: modo === 'CADASTRO' ? '#E4E4E6' : '#9A9DA3',
          }}
        >
          Criar conta
        </button>
      </div>

      {/* Botão Google OAuth */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div ref={googleBtnRef} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#4A4D52' }} />
        <span style={{ fontSize: '11px', color: '#9A9DA3', textTransform: 'uppercase' }}>ou com e-mail</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#4A4D52' }} />
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {modo === 'CADASTRO' && (
          <>
            <div>
              <label className="input-label">Nome completo</label>
              <input
                type="text"
                className="input-field"
                placeholder="Digite aqui seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="input-label">Telefone / WhatsApp</label>
              <input
                type="tel"
                className="input-field"
                placeholder="Digite aqui seu telefone / WhatsApp"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="input-label">E-mail</label>
          <input
            type="email"
            className="input-field"
            placeholder="Digite aqui seu e-mail"
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

        <button type="submit" className="btn-primary" disabled={carregando} style={{ marginTop: '6px' }}>
          {carregando ? 'Aguarde...' : modo === 'LOGIN' ? 'Entrar' : 'Cadastrar e Continuar'}
        </button>
      </form>
    </div>
  );
};