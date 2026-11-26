import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, LogOut, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';

interface DiaAgenda {
  id?: string;
  data: string; // Formato esperado: "YYYY-MM-DD" ou ISO
  trabalha: boolean;
}

interface HorarioSlot {
  hora: string; // Ex: "09:00"
  dataHora?: string;
  status: 'LIVRE' | 'OCUPADO' | 'EM_ESPERA';
}

export const AgendaCliente: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });

  const [diasAgenda, setDiasAgenda] = useState<DiaAgenda[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<HorarioSlot[]>([]);
  const [carregandoDias, setCarregandoDias] = useState(false);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [erro, setErro] = useState('');

  // Formata YYYY-MM-DD local sem fuso horário atrapalhar
  function formatarDataISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Carrega os dias do mês da API
  useEffect(() => {
    async function buscarDias() {
      try {
        setCarregandoDias(true);
        setErro('');
        const ano = mesAtual.getFullYear();
        const mes = String(mesAtual.getMonth() + 1).padStart(2, '0');
        const dados = await apiFetch<DiaAgenda[]>(`/agenda/dias?mes=${ano}-${mes}`);
        setDiasAgenda(dados);
      } catch (err: any) {
        setErro('Aguardando rota /agenda/dias do backend...');
        setDiasAgenda([]);
      } finally {
        setCarregandoDias(false);
      }
    }
    buscarDias();
  }, [mesAtual]);

  // Busca os horários de um dia. silencioso=true é usado pela atualização
  // automática em segundo plano (não mexe no estado de "carregando" nem
  // substitui uma mensagem de erro já exibida).
  async function buscarHorarios(dataStr: string, silencioso = false) {
    try {
      if (!silencioso) setCarregandoHorarios(true);
      const lista = await apiFetch<HorarioSlot[]>(`/agenda/dias/${dataStr}/horarios`);
      setHorarios(lista);
    } catch (err: any) {
      if (!silencioso) {
        setErro(err.message || 'Erro ao carregar horários deste dia.');
        setHorarios([]);
      }
    } finally {
      if (!silencioso) setCarregandoHorarios(false);
    }
  }

  // Carrega horários quando um dia verde é selecionado
  async function selecionarDia(dataStr: string, trabalha: boolean) {
    if (!trabalha) return;
    setDiaSelecionado(dataStr);
    await buscarHorarios(dataStr);
  }

  // Atualiza os horários do dia selecionado sozinho em segundo plano, pra o
  // cliente ver um horário virar livre/ocupado assim que algum outro cliente
  // (ou o próprio barbeiro) confirmar, cancelar ou reservar um agendamento,
  // sem precisar atualizar a página na mão.
  useEffect(() => {
    if (!diaSelecionado) return;
    const intervalo = setInterval(() => {
      buscarHorarios(diaSelecionado, true);
    }, 5000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSelecionado]);

  // Um horário de hoje que já passou não pode ser agendado, mesmo que o
  // backend ainda o considere "LIVRE" (ele só sabe se está ocupado ou não,
  // não sabe que já é tarde demais pra esse horário específico).
  function horarioJaPassou(hora: string): boolean {
    if (diaSelecionado !== hojeStr) return false;
    const [h, m] = hora.split(':').map(Number);
    const agora = new Date();
    const horarioSlot = new Date();
    horarioSlot.setHours(h, m, 0, 0);
    return horarioSlot.getTime() <= agora.getTime();
  }

  function handleEscolherHorario(slot: HorarioSlot) {
    if (slot.status !== 'LIVRE' || !diaSelecionado || horarioJaPassou(slot.hora)) return;
    // Navega para a tela de seleção de serviço passando dia, hora e lista de horários livres
    navigate('/cliente/agendar', {
      state: {
        data: diaSelecionado,
        hora: slot.hora,
        horariosDoDia: horarios,
      },
    });
  }

  function mudarMes(delta: number) {
    setDiaSelecionado(null);
    setHorarios([]);
    setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  // Monta a grade do calendário
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Dom
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const hojeStr = formatarDataISO(new Date());

  // Mapa rápido YYYY-MM-DD -> trabalha
  const mapaDias = new Map<string, boolean>();
  diasAgenda.forEach((d) => {
    const chave = d.data.slice(0, 10);
    mapaDias.set(chave, d.trabalha);
  });

  function corStatusHorario(status: HorarioSlot['status']) {
    if (status === 'LIVRE') return { bg: 'rgba(34, 197, 94, 0.16)', border: '#22C55E', text: '#22C55E' };
    if (status === 'EM_ESPERA') return { bg: 'rgba(234, 179, 8, 0.16)', border: '#EAB308', text: '#EAB308' };
    return { bg: 'rgba(239, 68, 68, 0.14)', border: '#EF4444', text: '#EF4444' };
  }

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Topo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '11px', color: '#9A9DA3' }}>Olá,</span>
          <h2 style={{ fontSize: '17px', fontWeight: 700 }}>{usuario?.nome}</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate('/cliente/meus-agendamentos')}
            title="Meus Agendamentos e Notificações"
            style={{
              backgroundColor: '#2B2D31',
              border: '1px solid #4A4D52',
              color: '#E4E4E6',
              padding: '8px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <Bell size={18} />
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            title="Sair"
            style={{
              backgroundColor: '#2B2D31',
              border: '1px solid #4A4D52',
              color: '#E4E4E6',
              padding: '8px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          backgroundColor: '#2B2D31',
          padding: '8px 12px',
          borderRadius: '10px',
          fontSize: '11px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} />
          Livre / Aberto
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EAB308' }} />
          Em espera
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#EF4444' }} />
          Ocupado / Fechado
        </span>
      </div>

      {/* Calendário Mensal */}
      <div
        style={{
          backgroundColor: '#2B2D31',
          border: '1px solid #4A4D52',
          borderRadius: '14px',
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button
            onClick={() => mudarMes(-1)}
            style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
          >
            <ChevronLeft size={20} />
          </button>

          <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} />
            {nomeMes}
            {carregandoDias && (
              <span style={{ fontSize: '11px', fontWeight: 400, color: '#9A9DA3', textTransform: 'none' }}>
                (carregando...)
              </span>
            )}
          </span>

          <button
            onClick={() => mudarMes(1)}
            style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Cabeçalho dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', color: '#9A9DA3', marginBottom: '6px' }}>
          <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
        </div>

        {/* Dias do mês */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: totalDiasMes }).map((_, idx) => {
            const diaNum = idx + 1;
            const dataObj = new Date(ano, mes, diaNum);
            const dataStr = formatarDataISO(dataObj);
            const passado = dataStr < hojeStr;

            // Enquanto a API ainda não respondeu com o status real desse dia,
            // mostra um estado neutro (cinza) em vez de "adivinhar" pela regra
            // de terça a sábado — adivinhar pode mostrar vermelho num dia que
            // na verdade está aberto por exceção (como uma segunda liberada).
            const diaConhecido = mapaDias.has(dataStr);
            const trabalha = diaConhecido ? mapaDias.get(dataStr)! : false;

            const ativo = !passado && diaConhecido && trabalha;
            const selecionado = diaSelecionado === dataStr;

            return (
              <button
                key={dataStr}
                disabled={!ativo}
                onClick={() => selecionarDia(dataStr, ativo)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: ativo ? 'pointer' : 'not-allowed',
                  border: selecionado ? '2px solid #E4E4E6' : '1px solid transparent',
                  backgroundColor: passado
                    ? '#1c1d20'
                    : !diaConhecido
                    ? '#232428'
                    : ativo
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.18)',
                  color: passado
                    ? '#4A4D52'
                    : !diaConhecido
                    ? '#6b6e73'
                    : ativo
                    ? '#22C55E'
                    : '#EF4444',
                }}
              >
                {diaNum}
              </button>
            );
          })}
        </div>
      </div>

      {erro && (
        <p style={{ fontSize: '12px', color: '#EAB308', textAlign: 'center' }}>{erro}</p>
      )}

      {/* Grade de Horários do Dia Selecionado */}
      {diaSelecionado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            Horários em {diaSelecionado.split('-').reverse().join('/')}
          </h3>

          {carregandoHorarios ? (
            <p style={{ fontSize: '13px', color: '#9A9DA3' }}>Buscando horários...</p>
          ) : horarios.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#9A9DA3' }}>Nenhum horário disponível para esta data.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {horarios.map((slot) => {
                const passou = horarioJaPassou(slot.hora);
                const estilo = passou
                  ? { bg: 'rgba(74, 77, 82, 0.2)', border: '#4A4D52', text: '#6b6e73' }
                  : corStatusHorario(slot.status);
                const livre = slot.status === 'LIVRE' && !passou;
                return (
                  <button
                    key={slot.hora}
                    disabled={!livre}
                    onClick={() => handleEscolherHorario(slot)}
                    title={passou ? 'Esse horário já passou' : undefined}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      backgroundColor: estilo.bg,
                      border: `1px solid ${estilo.border}`,
                      color: estilo.text,
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: livre ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {slot.hora}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
