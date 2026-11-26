import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Scissors } from 'lucide-react';

export const Splash: React.FC = () => {
  const [mostrarEscolha, setMostrarEscolha] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => !mostrarEscolha && setMostrarEscolha(true)}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '48px 24px',
        cursor: mostrarEscolha ? 'default' : 'pointer',
        backgroundColor: '#0E0E0F',
        textAlign: 'center',
      }}
    >
      <div style={{ height: 20 }} />

      {/* Logo Centralizado */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'transform 0.3s ease',
          transform: mostrarEscolha ? 'translateY(-12px) scale(0.92)' : 'scale(1)',
        }}
      >
        <div
          style={{
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #4A4D52',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#161618',
          }}
        >
          <img
            src="/logo_2.jpeg"
            alt="Barbearia Lizandro"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1.18) translate(-3.5%, 2%)',
            }}
          />
        </div>
      </div>

      {/* Área Inferior: Toque para continuar OU Escolha de Perfil */}
      <div style={{ width: '100%', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {!mostrarEscolha ? (
          <p
            className="pulse-hint"
            style={{
              color: '#E4E4E6',
              fontSize: '15px',
              letterSpacing: '0.5px',
              fontWeight: 500,
              paddingBottom: '16px',
            }}
          >
            Toque na tela para continuar
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <p style={{ color: '#9A9DA3', fontSize: '13px', marginBottom: '4px' }}>
              Como deseja acessar?
            </p>

            <button
              className="btn-primary"
              onClick={() => navigate('/login/cliente')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <User size={18} />
              Sou Cliente
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate('/login/barbeiro')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Scissors size={18} />
              Sou Barbeiro
            </button>
          </div>
        )}
      </div>
    </div>
  );
};