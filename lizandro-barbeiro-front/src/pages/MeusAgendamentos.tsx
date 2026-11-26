import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, XCircle, Bell, Calendar } from 'lucide-react';
import { apiFetch } from '../services/api';

interface AgendamentoItem {
  id: string;
  tipoServico: string;
  nomeAtendido: string;
  dataHoraInicio: string;
  duracaoMinutos: number;
}

interface Agendamento {
  id: string;
  status: 'PENDENTE_CONFIRMACAO' | 'CONFIRMADO' | 'CANCELADO';
  tokenConfirmacao: string;
  itens: AgendamentoItem[];
}

interface Notificacao {
  id: string;
  usuarioId: string;
  agendamentoId?: string | null;
  tipo: 'AGENDAMENTO_CRIADO' | 'AGENDAMENTO_CONFIRMADO' | 'AGENDAMENTO_CANCELADO';
  mensagem: string;
  requerConfirmacao: boolean;
  confirmada: boolean;
  criadaEm: string;
}

interface ConfirmarResponse {
  status: string;
  linkWhatsapp: string | null;
}

export const MeusAgendamentos: React.FC = () => {
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  async function carregarDados(silencioso = false) {
    try {
      if (!silencioso) setCarregando(true);
      const [listaAg, listaNotif] = await Promise.all([
        apiFetch<Agendamento[]>('/agendamentos/meus').catch(() => []),
        apiFetch<Notificacao[]>('/notificacoes').catch(() => []),
      ]);
      setAgendamentos(listaAg);
      setNotificacoes(listaNotif);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // Atualiza a lista sozinha em segundo plano (sem mostrar "Carregando..."),
  // pra o cliente ver o próprio agendamento virar "Confirmado" assim que
  // alguém confirmar — pelo link do e-mail, por exemplo, em outra aba — sem
  // precisar atualizar a página na mão.
  useEffect(() => {
    const intervalo = setInterval(() => {
      carregarDados(true);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  async function handleConfirmar(agendamentoId: string, tokenConfirmacao?: string) {
    const token =
      tokenConfirmacao ||
      agendamentos.find((a) => a.id === agendamentoId)?.tokenConfirmacao;

    if (!token) {
      alert('Token de confirmação não encontrado.');
      return;
    }

    try {
      setProcessandoId(agendamentoId);
      await apiFetch<ConfirmarResponse>(`/agendamentos/${agendamentoId}/confirmar`, {
        method: 'POST',
        body: JSON.stringify({ token }),
      });

      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar agendamento.');
    } finally {
      setProcessandoId(null);
    }
  }

  async function handleCancelar(id: string) {
    if (!window.confirm('Deseja cancelar este agendamento?')) return;
    try {
      setProcessandoId(id);
      await apiFetch(`/agendamentos/${id}`, { method: 'DELETE' });
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar agendamento.');
    } finally {
      setProcessandoId(null);
    }
  }

  function badgeStatus(status: Agendamento['status']) {
    if (status === 'CONFIRMADO') {
      return { label: 'Confirmado', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.16)' };
    }
    if (status === 'PENDENTE_CONFIRMACAO') {
      return { label: 'Aguardando OK', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.16)' };
    }
    return { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' };
  }

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/cliente/agenda')}
          style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Meus Agendamentos</h2>
          <p style={{ fontSize: '12px', color: '#9A9DA3' }}>Notificações e confirmações</p>
        </div>
      </div>

      {/* Notificações */}
      {notificacoes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '12px', color: '#9A9DA3', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bell size={14} /> Notificações Recentes
          </h3>
          {notificacoes.slice(0, 4).map((n) => (
            <div
              key={n.id}
              style={{
                backgroundColor: '#2B2D31',
                border: '1px solid #4A4D52',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#E4E4E6',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span>{n.mensagem}</span>
              {n.requerConfirmacao && !n.confirmada && n.agendamentoId && (
                <button
                  onClick={() => handleConfirmar(n.agendamentoId!)}
                  disabled={processandoId === n.agendamentoId}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#22C55E',
                    color: '#0E0E0F',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Check size={14} /> OK, confirmar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista de Agendamentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '12px', color: '#9A9DA3', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} /> Seus Horários
        </h3>

        {carregando ? (
          <p style={{ fontSize: '13px', color: '#9A9DA3' }}>Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <div
            style={{
              backgroundColor: '#2B2D31',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#9A9DA3',
              fontSize: '13px',
            }}
          >
            Você ainda não possui agendamentos.
          </div>
        ) : (
          agendamentos.map((ag) => {
            const st = badgeStatus(ag.status);
            return (
              <div
                key={ag.id}
                style={{
                  backgroundColor: '#2B2D31',
                  border: '1px solid #4A4D52',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: st.bg,
                      color: st.color,
                    }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Itens do agendamento */}
                {ag.itens?.map((item) => {
                  // Exibe a hora local sem deslocar fuso caso termine com Z
                  const isoLimpo = item.dataHoraInicio.replace('Z', '');
                  const dt = new Date(isoLimpo);
                  const diaHora = dt.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div key={item.id} style={{ fontSize: '13px' }}>
                      <strong>{diaHora}</strong> — {item.tipoServico} ({item.nomeAtendido})
                    </div>
                  );
                })}

                {/* Ações */}
                {ag.status === 'PENDENTE_CONFIRMACAO' && (
                  <button
                    onClick={() => handleConfirmar(ag.id, ag.tokenConfirmacao)}
                    disabled={processandoId === ag.id}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#22C55E',
                      color: '#0E0E0F',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={16} />
                    OK, confirmar
                  </button>
                )}

                {ag.status !== 'CANCELADO' && (
                  <button
                    onClick={() => handleCancelar(ag.id)}
                    disabled={processandoId === ag.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <XCircle size={14} /> Cancelar horário
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
