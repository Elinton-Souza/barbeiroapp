import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface HorarioSlotSeletor {
  hora: string;
  status: 'LIVRE' | 'OCUPADO' | 'EM_ESPERA';
}

interface Props {
  horarios: HorarioSlotSeletor[];
  value: string;
  onChange: (hora: string) => void;
  carregando?: boolean;
}

const ALTURA_ITEM = 40;
const LINHAS_VISIVEIS = 3;
const ALTURA_CAIXA = ALTURA_ITEM * LINHAS_VISIVEIS;

function corStatus(status: HorarioSlotSeletor['status']) {
  if (status === 'LIVRE') return { bg: 'rgba(34, 197, 94, 0.18)', text: '#22C55E' };
  if (status === 'EM_ESPERA') return { bg: 'rgba(234, 179, 8, 0.18)', text: '#EAB308' };
  return { bg: 'rgba(239, 68, 68, 0.16)', text: '#EF4444' };
}

// Seletor "de roletinha" — igual aos seletores de ano de nascimento: rola com o
// mouse/touch ou clica nas setas pra cima/baixo até o horário desejado ficar
// na moldura central. Verde = livre, vermelho = ocupado, amarelo = em espera
// (só os verdes podem ser escolhidos).
export const SeletorHorario: React.FC<Props> = ({ horarios, value, onChange, carregando }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [indiceCentral, setIndiceCentral] = useState(0);
  const jaCentralizouInicial = useRef(false);

  // Centraliza no valor atual (ou no primeiro horário livre) quando a lista chega
  useEffect(() => {
    if (!containerRef.current || horarios.length === 0) return;
    const idxValor = horarios.findIndex((h) => h.hora === value);
    const idxPrimeiroLivre = horarios.findIndex((h) => h.status === 'LIVRE');
    const idx = idxValor >= 0 ? idxValor : idxPrimeiroLivre >= 0 ? idxPrimeiroLivre : 0;

    containerRef.current.scrollTo({ top: idx * ALTURA_ITEM, behavior: 'auto' });
    setIndiceCentral(idx);

    if (!jaCentralizouInicial.current && idxPrimeiroLivre >= 0 && !value) {
      jaCentralizouInicial.current = true;
      onChange(horarios[idxPrimeiroLivre].hora);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horarios]);

  function confirmarIndice(idx: number) {
    const slot = horarios[idx];
    if (slot && slot.status === 'LIVRE') {
      onChange(slot.hora);
    }
  }

  function aoRolar() {
    if (!containerRef.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!containerRef.current) return;
      const idx = Math.round(containerRef.current.scrollTop / ALTURA_ITEM);
      const seguro = Math.min(Math.max(idx, 0), horarios.length - 1);
      setIndiceCentral(seguro);
      confirmarIndice(seguro);
    }, 120);
  }

  function irParaIndice(idx: number) {
    const seguro = Math.min(Math.max(idx, 0), horarios.length - 1);
    containerRef.current?.scrollTo({ top: seguro * ALTURA_ITEM, behavior: 'smooth' });
    setIndiceCentral(seguro);
    confirmarIndice(seguro);
  }

  const slotCentral = horarios[indiceCentral];
  const ocupado = !!slotCentral && slotCentral.status !== 'LIVRE';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => irParaIndice(indiceCentral - 1)}
          title="Horário anterior"
          style={{
            background: '#2B2D31',
            border: '1px solid #4A4D52',
            borderRadius: '8px',
            color: '#E4E4E6',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          <ChevronUp size={16} />
        </button>

        <div style={{ position: 'relative', width: '130px', height: `${ALTURA_CAIXA}px` }}>
          <div
            ref={containerRef}
            onScroll={aoRolar}
            style={{
              height: '100%',
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              borderRadius: '10px',
              backgroundColor: '#0E0E0F',
              border: '1px solid #4A4D52',
              scrollbarWidth: 'none',
            }}
          >
            {/* Espaçador de cima — deixa o 1º horário chegar até o centro */}
            <div style={{ height: `${ALTURA_ITEM}px` }} />

            {carregando ? (
              <div
                style={{
                  height: `${ALTURA_ITEM}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#9A9DA3',
                }}
              >
                Carregando...
              </div>
            ) : (
              horarios.map((slot, idx) => {
                const cor = corStatus(slot.status);
                const selecionavel = slot.status === 'LIVRE';
                const central = idx === indiceCentral;
                return (
                  <div
                    key={slot.hora}
                    onClick={() => selecionavel && irParaIndice(idx)}
                    style={{
                      height: `${ALTURA_ITEM}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      scrollSnapAlign: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                      color: cor.text,
                      opacity: central ? 1 : 0.45,
                      cursor: selecionavel ? 'pointer' : 'not-allowed',
                      userSelect: 'none',
                    }}
                  >
                    {slot.hora}
                  </div>
                );
              })
            )}

            {/* Espaçador de baixo — deixa o último horário chegar até o centro */}
            <div style={{ height: `${ALTURA_ITEM}px` }} />
          </div>

          {/* Moldura fixa no centro, por cima do item selecionado no momento */}
          <div
            style={{
              position: 'absolute',
              top: `${ALTURA_ITEM}px`,
              left: 0,
              right: 0,
              height: `${ALTURA_ITEM}px`,
              border: '2px solid #E4E4E6',
              borderRadius: '8px',
              backgroundColor: slotCentral ? corStatus(slotCentral.status).bg : 'transparent',
              pointerEvents: 'none',
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => irParaIndice(indiceCentral + 1)}
          title="Próximo horário"
          style={{
            background: '#2B2D31',
            border: '1px solid #4A4D52',
            borderRadius: '8px',
            color: '#E4E4E6',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      <p
        style={{
          fontSize: '11px',
          marginTop: '6px',
          color: ocupado ? '#EF4444' : '#9A9DA3',
        }}
      >
        {!slotCentral
          ? 'Escolha o horário'
          : ocupado
          ? `${slotCentral.hora} já está ${slotCentral.status === 'OCUPADO' ? 'ocupado' : 'em espera'} — role até um horário verde.`
          : `Horário selecionado: ${value || slotCentral.hora}`}
      </p>
    </div>
  );
};
