import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';

type TipoServico = 'CABELO' | 'BARBA' | 'CABELO_BARBA' | 'CRIANCA';

interface HorarioSlot {
  hora: string;
  status: 'LIVRE' | 'OCUPADO' | 'EM_ESPERA';
}

const SERVICOS: { id: TipoServico; label: string; duracao: number }[] = [
  { id: 'CABELO', label: 'Cabelo', duracao: 30 },
  { id: 'BARBA', label: 'Barba', duracao: 30 },
  { id: 'CABELO_BARBA', label: 'Cabelo + Barba', duracao: 60 },
  { id: 'CRIANCA', label: 'Criança', duracao: 30 },
];

function somarMinutos(horaStr: string, minutos: number): string {
  const [h, m] = horaStr.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const nh = String(Math.floor(total / 60)).padStart(2, '0');
  const nm = String(total % 60).padStart(2, '0');
  return `${nh}:${nm}`;
}

export const SelecaoServico: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, hora, horariosDoDia = [] } = (location.state as {
    data?: string;
    hora?: string;
    horariosDoDia?: HorarioSlot[];
  }) || {};

  const [servico1, setServico1] = useState<TipoServico>('CABELO');
  const [nome1, setNome1] = useState(usuario?.nome || '');

  const [temSegundo, setTemSegundo] = useState(false);
  const [servico2, setServico2] = useState<TipoServico>('CRIANCA');
  const [nome2, setNome2] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (!data || !hora) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#9A9DA3', marginBottom: '16px' }}>Nenhum horário selecionado.</p>
        <button className="btn-primary" onClick={() => navigate('/cliente/agenda')}>
          Voltar para Agenda
        </button>
      </div>
    );
  }

  const duracao1 = SERVICOS.find((s) => s.id === servico1)?.duracao || 30;
  const horaSegundoSlot = somarMinutos(hora, duracao1);

  function slotEstaLivre(h: string): boolean {
    if (horariosDoDia.length === 0) return true;
    const encontrado = horariosDoDia.find((item) => item.hora === h);
    return encontrado ? encontrado.status === 'LIVRE' : false;
  }

  const podeCabeloBarba1 = slotEstaLivre(somarMinutos(hora, 30));
  const podeAdicionarSegundo = slotEstaLivre(horaSegundoSlot);

  async function handleConfirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const itens = [
        {
          tipoServico: servico1,
          nomeAtendido: nome1.trim() || usuario?.nome || 'Cliente',
          dataHoraInicio: `${data}T${hora}:00`,
        },
      ];

      if (temSegundo) {
        itens.push({
          tipoServico: servico2,
          nomeAtendido: nome2.trim() || 'Dependente',
          dataHoraInicio: `${data}T${horaSegundoSlot}:00`,
        });
      }

      await apiFetch('/agendamentos', {
        method: 'POST',
        body: JSON.stringify({ itens }),
      });

      navigate('/cliente/meus-agendamentos', {
        state: { recemCriado: true },
      });
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar agendamento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/cliente/agenda')}
          style={{ background: 'none', border: 'none', color: '#E4E4E6', cursor: 'pointer', padding: '4px' }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Escolher Serviço</h2>
          <p style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>
            {data.split('-').reverse().join('/')} às {hora}
          </p>
        </div>
      </div>

      <form onSubmit={handleConfirmar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1º Atendimento */}
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
            <span style={{ fontSize: '13px', fontWeight: 700 }}>1º Atendimento ({hora})</span>
            <span style={{ fontSize: '11px', color: '#9A9DA3', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {duracao1} min
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {SERVICOS.map((s) => {
              const bloqueado = s.id === 'CABELO_BARBA' && !podeCabeloBarba1;
              const ativo = servico1 === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => setServico1(s.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: ativo ? '2px solid #E4E4E6' : '1px solid #4A4D52',
                    backgroundColor: ativo ? '#0E0E0F' : 'transparent',
                    color: bloqueado ? '#4A4D52' : '#E4E4E6',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: bloqueado ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>{s.label}</div>
                  <div style={{ fontSize: '10px', color: '#9A9DA3', marginTop: '2px' }}>
                    {bloqueado ? 'Sem horário livre em seguida' : `${s.duracao} min`}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="input-label">Nome de quem será atendido</label>
            <input
              type="text"
              className="input-field"
              value={nome1}
              onChange={(e) => setNome1(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Botão ou Card do 2º Atendimento Sequencial */}
        {!temSegundo ? (
          <button
            type="button"
            className="btn-secondary"
            disabled={!podeAdicionarSegundo}
            onClick={() => setTemSegundo(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: podeAdicionarSegundo ? 1 : 0.5,
            }}
          >
            <Plus size={16} />
            {podeAdicionarSegundo
              ? `Agendar mais um horário (${horaSegundoSlot})`
              : 'Horário seguinte indisponível'}
          </button>
        ) : (
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
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                2º Atendimento ({horaSegundoSlot})
              </span>
              <button
                type="button"
                onClick={() => setTemSegundo(false)}
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SERVICOS.map((s) => {
                const bloqueado =
                  s.id === 'CABELO_BARBA' && !slotEstaLivre(somarMinutos(horaSegundoSlot, 30));
                const ativo = servico2 === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={bloqueado}
                    onClick={() => setServico2(s.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: ativo ? '2px solid #E4E4E6' : '1px solid #4A4D52',
                      backgroundColor: ativo ? '#0E0E0F' : 'transparent',
                      color: bloqueado ? '#4A4D52' : '#E4E4E6',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: bloqueado ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div>{s.label}</div>
                    <div style={{ fontSize: '10px', color: '#9A9DA3', marginTop: '2px' }}>
                      {bloqueado ? 'Sem horário livre em seguida' : `${s.duracao} min`}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="input-label">Nome do acompanhante (ex: Filho - João)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Digite aqui o nome de quem vai ser atendido"
                value={nome2}
                onChange={(e) => setNome2(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {erro && (
          <p style={{ color: '#EF4444', fontSize: '12px', textAlign: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={enviando}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <CheckCircle2 size={18} />
          {enviando ? 'Reservando...' : 'Confirmar Seleção'}
        </button>
      </form>
    </div>
  );
};