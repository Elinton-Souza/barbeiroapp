import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/api';

interface ConfirmarResponse {
  status: string;
  linkWhatsapp: string | null;
}

export const ConfirmarAgendamento: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const id = searchParams.get('id');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'CARREGANDO' | 'SUCESSO' | 'ERRO'>('CARREGANDO');
  const [mensagem, setMensagem] = useState('Confirmando seu horário...');

  useEffect(() => {
    async function confirmarViaLink() {
      if (!id || !token) {
        setStatus('ERRO');
        setMensagem('Link de confirmação inválido ou incompleto.');
        return;
      }

      try {
        await apiFetch<ConfirmarResponse>(`/agendamentos/${id}/confirmar`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('SUCESSO');
        setMensagem('Agendamento confirmado com sucesso! Te esperamos na Barbearia Lizandro.');
      } catch (err: any) {
        setStatus('ERRO');
        setMensagem(err.message || 'Não foi possível confirmar. O prazo de 15 minutos pode ter expirado.');
      }
    }

    confirmarViaLink();
  }, [id, token]);

  return (
    <div
      style={{
        flex: 1,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
      }}
    >
      {status === 'CARREGANDO' && <Loader2 size={48} color="#EAB308" />}
      {status === 'SUCESSO' && <CheckCircle2 size={54} color="#22C55E" />}
      {status === 'ERRO' && <XCircle size={54} color="#EF4444" />}

      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          {status === 'CARREGANDO'
            ? 'Processando...'
            : status === 'SUCESSO'
            ? 'Horário Confirmado!'
            : 'Falha na Confirmação'}
        </h2>
        <p style={{ fontSize: '14px', color: '#9A9DA3', lineHeight: '1.5' }}>{mensagem}</p>
      </div>

      <button className="btn-primary" onClick={() => navigate('/')}>
        Ir para o Início
      </button>
    </div>
  );
};