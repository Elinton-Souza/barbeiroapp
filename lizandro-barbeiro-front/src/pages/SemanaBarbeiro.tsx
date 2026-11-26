import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  UserPlus,
  Lock,
  Unlock,
  Calendar,
  X,
  Settings,
  Check,
  Trash2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';
import { SeletorHorario } from '../components/SeletorHorario';

interface HorarioSlot {
  hora: string;
  status: 'LIVRE' | 'OCUPADO' | 'EM_ESPERA';
}

interface AgendamentoSemanaItem {
  id: string;
  hora: string;
  tipoServico: string;
  nomeAtendido: string;
  duracaoMinutos: number;
  status: 'PENDENTE_CONFIRMACAO' | 'CONFIRMADO';
  clienteNome: string;
  clienteTelefone?: string | null;
}

interface DiaAgendaBarbeiro {
  data: string;
  trabalha: boolean;
  agendamentos: AgendamentoSemanaItem[];
}

interface DiaDoMes {
  data: string;
  trabalha: boolean;
}

interface ConfigDiaSemana {
  diaSemana: number;
  trabalhaPadrao: boolean;
}

const NOMES_DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Monta o mesmo link wa.me que o backend usa, mas aqui do lado do barbeiro —
// quem avisa o cliente que o horário está confirmado é a barbearia, não o contrário.
function linkWhatsappCliente(ag: AgendamentoSemanaItem, dataStr: string): string {
  const numero = (ag.clienteTelefone || '').replace(/\D/g, '');
  const [y, m, d] = dataStr.slice(0, 10).split('-');
  const mensagem = `Olá, ${ag.clienteNome}! Seu agendamento (${ag.tipoServico} às ${d}/${m}/${y}, ${ag.hora}) na Lizandro Barbeiro está confirmado. ✂️`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

// Formata YYYY-MM-DD local sem fuso horário atrapalhar
function formatarDataISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const SemanaBarbeiro: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const hojeStr = formatarDataISO(new Date());

  // Calendário mensal completo — o barbeiro pode navegar para qualquer mês/dia,
  // não só os próximos 5 dias.
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [diasMes, setDiasMes] = useState<DiaDoMes[]>([]);

  // Dia selecionado no calendário — por padrão, hoje
  const [diaAtivo, setDiaAtivo] = useState<string>(hojeStr);
  const [agendaDoDia, setAgendaDoDia] = useState<DiaAgendaBarbeiro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Configuração Semanal Padrão
  const [mostrarConfigSemanal, setMostrarConfigSemanal] = useState(false);
  const [configSemanal, setConfigSemanal] = useState<ConfigDiaSemana[]>([
    { diaSemana: 0, trabalhaPadrao: false },
    { diaSemana: 1, trabalhaPadrao: false },
    { diaSemana: 2, trabalhaPadrao: true },
    { diaSemana: 3, trabalhaPadrao: true },
    { diaSemana: 4, trabalhaPadrao: true },
    { diaSemana: 5, trabalhaPadrao: true },
    { diaSemana: 6, trabalhaPadrao: true },
  ]);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // Modal de Cadastro Manual
  const [mostrarManual, setMostrarManual] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [horaManual, setHoraManual] = useState('');
  const [servicoManual, setServicoManual] = useState<'CABELO' | 'BARBA' | 'CABELO_BARBA' | 'CRIANCA'>('CABELO');
  const [salvandoManual, setSalvandoManual] = useState(false);
  const [horariosDoDiaManual, setHorariosDoDiaManual] = useState<HorarioSlot[]>([]);
  const [carregandoHorariosManual, setCarregandoHorariosManual] = useState(false);

  async function carregarDiasMes(mes: Date) {
    try {
      const ano = mes.getFullYear();
      const mesNum = String(mes.getMonth() + 1).padStart(2, '0');
      const dados = await apiFetch<DiaDoMes[]>(`/agenda/dias?mes=${ano}-${mesNum}`);
      setDiasMes(dados);
    } catch {
      setDiasMes([]);
    }
  }

  // Guarda sempre o diaAtivo mais recente, pra uma resposta de rede que chegue
  // atrasada (de um dia que o barbeiro já trocou) não sobrescrever o dia que
  // está sendo exibido agora.
  const diaAtivoRef = useRef(diaAtivo);
  useEffect(() => {
    diaAtivoRef.current = diaAtivo;
  }, [diaAtivo]);

  async function carregarAgendaDoDia(dataStr: string, silencioso = false) {
    if (!silencioso) {
      setCarregando(true);
      // Limpa a agenda exibida na hora (antes mesmo da resposta chegar), pra
      // nunca parecer que o clique num dia novo "não fez nada".
      setAgendaDoDia(null);
    }
    try {
      const dados = await apiFetch<DiaAgendaBarbeiro>(`/agenda/dias/${dataStr}/agendamentos`);
      if (dataStr !== diaAtivoRef.current) return; // não é mais o dia selecionado — descarta
      setAgendaDoDia(dados);
      if (!silencioso) setErro('');
    } catch (err: any) {
      if (dataStr !== diaAtivoRef.current) return;
      if (!silencioso) setErro(err.message || 'Erro ao carregar agenda do dia.');
    } finally {
      if (dataStr === diaAtivoRef.current && !silencioso) setCarregando(false);
    }
  }

  async function abrirConfiguracaoSemanal() {
    setMostrarConfigSemanal((prev) => !prev);
    try {
      const dados = await apiFetch<ConfigDiaSemana[]>('/agenda/configuracao-semanal');
      if (Array.isArray(dados) && dados.length === 7) {
        setConfigSemanal(dados.sort((a, b) => a.diaSemana - b.diaSemana));
      }
    } catch {
      // Mantém estado atual caso falhe
    }
  }

  function alternarDiaPadrao(diaSemana: number) {
    setConfigSemanal((prev) =>
      prev.map((item) =>
        item.diaSemana === diaSemana ? { ...item, trabalhaPadrao: !item.trabalhaPadrao } : item
      )
    );
  }

  async function salvarConfiguracaoSemanal() {
    try {
      setSalvandoConfig(true);
      await apiFetch('/agenda/configuracao-semanal', {
        method: 'PUT',
        body: JSON.stringify({ dias: configSemanal }),
      });
      setMostrarConfigSemanal(false);
      await carregarDiasMes(mesAtual);
      await carregarAgendaDoDia(diaAtivo);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar padrão semanal.');
    } finally {
      setSalvandoConfig(false);
    }
  }

  // Carrega os dias do mês (status aberto/fechado, pra colorir o calendário)
  // sempre que o mês exibido muda.
  useEffect(() => {
    carregarDiasMes(mesAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesAtual]);

  // Carrega a agenda completa do dia selecionado sempre que ele muda.
  useEffect(() => {
    carregarAgendaDoDia(diaAtivo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaAtivo]);

  // Atualiza a agenda do dia selecionado sozinha em segundo plano (sem mostrar
  // "Carregando..."), pra o barbeiro ver um agendamento virar confirmado
  // (verde) assim que o cliente aceitar — pelo botão no app ou pelo link do
  // e-mail — sem precisar lembrar de atualizar a página na mão.
  useEffect(() => {
    const intervalo = setInterval(() => {
      carregarAgendaDoDia(diaAtivo, true);
    }, 5000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaAtivo]);

  // Carrega os horários válidos (de meia em meia hora) do dia ativo sempre que o
  // formulário de cadastro manual é aberto, pra oferecer uma lista em vez do
  // barbeiro ter que digitar/adivinhar um horário.
  useEffect(() => {
    async function carregarHorariosManual() {
      if (!mostrarManual || !diaAtivo) return;
      try {
        setCarregandoHorariosManual(true);
        const lista = await apiFetch<HorarioSlot[]>(`/agenda/dias/${diaAtivo}/horarios`);
        setHorariosDoDiaManual(lista);
        const primeiraLivre = lista.find((s) => s.status === 'LIVRE');
        setHoraManual(primeiraLivre ? primeiraLivre.hora : '');
      } catch {
        setHorariosDoDiaManual([]);
        setHoraManual('');
      } finally {
        setCarregandoHorariosManual(false);
      }
    }
    carregarHorariosManual();
  }, [mostrarManual, diaAtivo]);

  async function alternarStatusDia(dataStr: string, trabalhaAtual: boolean) {
    try {
      await apiFetch(`/agenda/dias/${dataStr}`, {
        method: 'PUT',
        body: JSON.stringify({ trabalha: !trabalhaAtual }),
      });
      await carregarAgendaDoDia(diaAtivo);
      await carregarDiasMes(mesAtual);
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar disponibilidade do dia.');
    }
  }

  async function handleCadastrarManual(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoManual(true);
    try {
      await apiFetch('/agendamentos/manual', {
        method: 'POST',
        body: JSON.stringify({
          nome: nomeCliente,
          email: emailCliente,
          ...(telefoneCliente.trim() ? { telefone: telefoneCliente.trim() } : {}),
          tipoServico: servicoManual,
          dataHoraInicio: `${diaAtivo}T${horaManual}:00`,
        }),
      });

      setNomeCliente('');
      setEmailCliente('');
      setTelefoneCliente('');
      setMostrarManual(false);
      await carregarAgendaDoDia(diaAtivo);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar agendamento manual.');
    } finally {
      setSalvandoManual(false);
    }
  }

  async function handleCancelarAgendamento(id: string) {
    if (!window.confirm('Deseja cancelar este agendamento?')) return;
    try {
      await apiFetch(`/agendamentos/${id}`, { method: 'DELETE' });
      await carregarAgendaDoDia(diaAtivo);
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar agendamento.');
    }
  }

  function mudarMes(delta: number) {
    setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function formatarDiaCurto(dataStr: string) {
    const [y, m, d] = dataStr.slice(0, 10).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const semana = dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    return { diaMes: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`, semana };
  }

  // Monta a grade do calendário do mês exibido
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Dom
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Mapa rápido YYYY-MM-DD -> trabalha
  const mapaDiasMes = new Map<string, boolean>();
  diasMes.forEach((d) => mapaDiasMes.set(d.data.slice(0, 10), d.trabalha));

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', color: '#9A9DA3' }}>Painel do Barbeiro</span>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {usuario?.nomeBarbearia || usuario?.nome}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={abrirConfiguracaoSemanal}
            title="Configurar Padrão Semanal"
            style={{
              backgroundColor: mostrarConfigSemanal ? '#E4E4E6' : '#2B2D31',
              border: '1px solid #4A4D52',
              color: mostrarConfigSemanal ? '#0E0E0F' : '#E4E4E6',
              padding: '8px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <Settings size={18} />
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

      {/* Painel de Padrão Semanal (Dom a Sáb) */}
      {mostrarConfigSemanal && (
        <div
          style={{
            backgroundColor: '#2B2D31',
            border: '1px solid #4A4D52',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Padrão Semanal de Trabalho</span>
            <button
              onClick={() => setMostrarConfigSemanal(false)}
              style={{ background: 'none', border: 'none', color: '#9A9DA3', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {configSemanal.map((item) => (
              <button
                key={item.diaSemana}
                type="button"
                onClick={() => alternarDiaPadrao(item.diaSemana)}
                style={{
                  padding: '8px 2px',
                  borderRadius: '8px',
                  border: `1px solid ${item.trabalhaPadrao ? '#22C55E' : '#EF4444'}`,
                  backgroundColor: item.trabalhaPadrao
                    ? 'rgba(34, 197, 94, 0.16)'
                    : 'rgba(239, 68, 68, 0.14)',
                  color: item.trabalhaPadrao ? '#22C55E' : '#EF4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {NOMES_DIAS_SEMANA[item.diaSemana]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={salvandoConfig}
            onClick={salvarConfiguracaoSemanal}
            style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Check size={15} />
            {salvandoConfig ? 'Salvando...' : 'Salvar Padrão Semanal'}
          </button>
        </div>
      )}

      {/* Calendário Mensal completo — o barbeiro escolhe qualquer dia, não só os próximos 5 */}
      <div
        style={{
          backgroundColor: '#2B2D31',
          border: '1px solid #4A4D52',
          borderRadius: '14px',
          padding: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <button
            onClick={() => mudarMes(-1)}
            style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
          >
            <ChevronLeft size={20} />
          </button>

          <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} />
            {nomeMes}
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
            const ehHoje = dataStr === hojeStr;

            // Enquanto a API ainda não respondeu com o status real desse dia,
            // mostra um estado neutro (cinza) em vez de "adivinhar" pela regra
            // de terça a sábado — adivinhar pode mostrar vermelho num dia que
            // na verdade está aberto por exceção (como uma segunda liberada).
            // Mesmo critério usado em AgendaCliente.tsx, pro calendário do
            // barbeiro não ter o mesmo bug de "cor errada por um instante".
            const diaConhecido = mapaDiasMes.has(dataStr);
            const trabalha = diaConhecido ? mapaDiasMes.get(dataStr)! : false;

            const selecionado = diaAtivo === dataStr;

            return (
              <button
                key={dataStr}
                onClick={() => setDiaAtivo(dataStr)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selecionado
                    ? '2px solid #E4E4E6'
                    : ehHoje
                    ? '1px solid #9A9DA3'
                    : '1px solid transparent',
                  backgroundColor: passado
                    ? '#1c1d20'
                    : !diaConhecido
                    ? '#232428'
                    : trabalha
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.18)',
                  color: passado
                    ? '#6b6e73'
                    : !diaConhecido
                    ? '#6b6e73'
                    : trabalha
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

      {erro && <p style={{ fontSize: '12px', color: '#EF4444', textAlign: 'center' }}>{erro}</p>}

      {/* Enquanto a agenda do novo dia clicado ainda não chegou, mostra um
          aviso de carregamento em vez de sumir com a seção inteira */}
      {!agendaDoDia && carregando && (
        <p style={{ fontSize: '13px', color: '#9A9DA3', textAlign: 'center' }}>Carregando agenda...</p>
      )}

      {/* Ações e Agenda do Dia Selecionado — mesma visão de sempre, agora alimentada
          pelo dia escolhido no calendário (ou hoje, por padrão) */}
      {agendaDoDia && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} />
                Agenda de {formatarDiaCurto(agendaDoDia.data).diaMes}
                {diaAtivo === hojeStr ? ' (Hoje)' : ''}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: agendaDoDia.trabalha ? '#22C55E' : '#EF4444',
                }}
              >
                {agendaDoDia.trabalha ? 'Aberto' : 'Fechado'} • {agendaDoDia.agendamentos?.length || 0} agendamento(s)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => alternarStatusDia(agendaDoDia.data.slice(0, 10), agendaDoDia.trabalha)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #4A4D52',
                  backgroundColor: '#2B2D31',
                  color: agendaDoDia.trabalha ? '#EF4444' : '#22C55E',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {agendaDoDia.trabalha ? <Lock size={13} /> : <Unlock size={13} />}
                {agendaDoDia.trabalha ? 'Fechar dia' : 'Reabrir dia'}
              </button>

              {agendaDoDia.trabalha && (
                <button
                  onClick={() => setMostrarManual(true)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#E4E4E6',
                    color: '#0E0E0F',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <UserPlus size={13} /> Manual
                </button>
              )}
            </div>
          </div>

          {/* Formulário Cadastro Manual */}
          {mostrarManual && (
            <form
              onSubmit={handleCadastrarManual}
              style={{
                backgroundColor: '#2B2D31',
                border: '1px solid #4A4D52',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px' }}>Agendamento Manual</strong>
                <button
                  type="button"
                  onClick={() => setMostrarManual(false)}
                  style={{ background: 'none', border: 'none', color: '#9A9DA3', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                className="input-field"
                placeholder="Digite aqui o nome do cliente"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                required
              />

              <input
                type="email"
                className="input-field"
                placeholder="Digite aqui o e-mail do cliente"
                value={emailCliente}
                onChange={(e) => setEmailCliente(e.target.value)}
                required
              />

              <input
                type="tel"
                className="input-field"
                placeholder="Digite aqui o telefone do cliente (opcional)"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
              />

              <div>
                <label className="input-label">Escolha o horário</label>
                <SeletorHorario
                  horarios={horariosDoDiaManual}
                  value={horaManual}
                  onChange={setHoraManual}
                  carregando={carregandoHorariosManual}
                />
              </div>

              <div>
                <label className="input-label">Serviço</label>
                <select
                  className="input-field"
                  value={servicoManual}
                  onChange={(e) => setServicoManual(e.target.value as any)}
                >
                  <option value="CABELO">Cabelo (30m)</option>
                  <option value="BARBA">Barba (30m)</option>
                  <option value="CABELO_BARBA">Cabelo+Barba (1h)</option>
                  <option value="CRIANCA">Criança (30m)</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={salvandoManual || !horaManual}>
                {salvandoManual ? 'Salvando...' : 'Agendar Cliente'}
              </button>
            </form>
          )}

          {/* Lista de Agendamentos do Dia */}
          {carregando ? (
            <p style={{ fontSize: '13px', color: '#9A9DA3' }}>Carregando agenda...</p>
          ) : !agendaDoDia.agendamentos || agendaDoDia.agendamentos.length === 0 ? (
            <div
              style={{
                backgroundColor: '#2B2D31',
                padding: '18px',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#9A9DA3',
                fontSize: '12px',
              }}
            >
              Nenhum cliente agendado para este dia.
            </div>
          ) : (
            agendaDoDia.agendamentos.map((ag) => (
              <div
                key={ag.id}
                style={{
                  backgroundColor: '#2B2D31',
                  borderLeft: `4px solid ${
                    ag.status === 'CONFIRMADO' ? '#22C55E' : '#EAB308'
                  }`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <strong>{ag.hora}</strong> • {ag.nomeAtendido} ({ag.tipoServico})
                      {ag.status !== 'CONFIRMADO' && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#EAB308',
                            backgroundColor: 'rgba(234, 179, 8, 0.16)',
                            padding: '2px 6px',
                            borderRadius: '5px',
                          }}
                        >
                          Aguardando confirmação
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#9A9DA3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Cliente: {ag.clienteNome}
                      {ag.clienteTelefone ? ` • ${ag.clienteTelefone}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCancelarAgendamento(ag.id)}
                    title="Cancelar agendamento"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#EF4444',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Quem avisa o cliente pelo WhatsApp é o barbeiro — não faz sentido
                    o cliente mandar mensagem pra si mesmo confirmando o próprio horário */}
                {ag.status === 'CONFIRMADO' && ag.clienteTelefone && (
                  <a
                    href={linkWhatsappCliente(ag, agendaDoDia.data)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #22C55E',
                      backgroundColor: 'rgba(34, 197, 94, 0.14)',
                      color: '#22C55E',
                      fontWeight: 700,
                      fontSize: '12px',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={14} />
                    Avisar cliente no WhatsApp
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
