import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, Scissors, X, Pencil, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';
import type { Usuario } from '../types';

export const PainelAdmin: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [barbeiros, setBarbeiros] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Campos do formulário (serve tanto pra cadastro quanto pra edição)
  const [nome, setNome] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregarBarbeiros() {
    try {
      setCarregando(true);
      setErro('');
      const dados = await apiFetch<Usuario[]>('/admin/barbeiros');
      setBarbeiros(dados);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar barbeiros.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  function limparFormulario() {
    setNome('');
    setNomeBarbearia('');
    setEmail('');
    setTelefone('');
    setCpf('');
    setSenha('');
    setMostrarSenha(false);
    setEditandoId(null);
  }

  function handleAbrirCadastro() {
    limparFormulario();
    setMostrarForm(true);
  }

  function handleIniciarEdicao(b: Usuario) {
    setEditandoId(b.id);
    setNome(b.nome);
    setNomeBarbearia(b.nomeBarbearia || '');
    setEmail(b.email);
    setTelefone(b.telefone || '');
    setCpf(b.cpf || '');
    setSenha('');
    setMostrarForm(true);
  }

  function handleFecharForm() {
    limparFormulario();
    setMostrarForm(false);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      if (editandoId) {
        // Edição: só manda a senha se o admin digitou uma nova
        const body: Record<string, string> = { nome, nomeBarbearia, email, telefone, cpf };
        if (senha) body.senha = senha;

        await apiFetch(`/admin/barbeiros/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/admin/barbeiros', {
          method: 'POST',
          body: JSON.stringify({
            nome,
            nomeBarbearia,
            email,
            telefone,
            cpf,
            senha,
          }),
        });
      }

      limparFormulario();
      setMostrarForm(false);
      await carregarBarbeiros();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar barbeiro.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id: string, nomeBarbeiro: string) {
    if (!window.confirm(`Deseja realmente remover o barbeiro ${nomeBarbeiro}?`)) return;

    try {
      await apiFetch(`/admin/barbeiros/${id}`, { method: 'DELETE' });
      setBarbeiros((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao remover barbeiro.');
    }
  }

  function handleSair() {
    logout();
    navigate('/');
  }

  return (
    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid #4A4D52',
        }}
      >
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <span style={{ fontSize: '11px', color: '#9A9DA3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Administração
          </span>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {usuario?.nome || 'Admin'}
          </h2>
        </div>
        <button
          onClick={handleSair}
          title="Sair"
          style={{
            backgroundColor: '#2B2D31',
            border: '1px solid #4A4D52',
            color: '#E4E4E6',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Botão Novo Barbeiro */}
      {!mostrarForm && (
        <button
          className="btn-primary"
          onClick={handleAbrirCadastro}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Cadastrar Barbeiro
        </button>
      )}

      {/* Formulário de Cadastro / Edição */}
      {mostrarForm && (
        <form
          onSubmit={handleSalvar}
          style={{
            backgroundColor: '#2B2D31',
            border: '1px solid #4A4D52',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
              {editandoId ? 'Editar Barbeiro' : 'Novo Barbeiro'}
            </h3>
            <button
              type="button"
              onClick={handleFecharForm}
              style={{ background: 'none', border: 'none', color: '#9A9DA3', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="input-label">Nome completo</label>
            <input
              type="text"
              className="input-field"
              placeholder="Digite aqui o nome do barbeiro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Nome da Barbearia</label>
            <input
              type="text"
              className="input-field"
              placeholder="Digite aqui o nome da barbearia"
              value={nomeBarbearia}
              onChange={(e) => setNomeBarbearia(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">E-mail de acesso</label>
            <input
              type="email"
              className="input-field"
              placeholder="Digite aqui o e-mail de acesso do barbeiro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">Telefone</label>
              <input
                type="tel"
                className="input-field"
                placeholder="Digite aqui o telefone do barbeiro"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="input-label">CPF (só números)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Digite aqui o CPF do barbeiro"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">
              {editandoId ? 'Nova senha (deixe em branco pra manter a atual)' : 'Senha inicial'}
            </label>
            <div className="input-password-wrapper">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                className="input-field"
                placeholder="Digite aqui a senha de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required={!editandoId}
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

          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : editandoId ? 'Salvar Alterações' : 'Salvar Barbeiro'}
          </button>
        </form>
      )}

      {erro && (
        <p style={{ color: '#EF4444', fontSize: '12px', textAlign: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '8px' }}>
          {erro}
        </p>
      )}

      {/* Lista de Barbeiros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '13px', color: '#9A9DA3', fontWeight: 600 }}>
          Barbeiros Cadastrados ({barbeiros.length})
        </h3>

        {carregando ? (
          <p style={{ fontSize: '13px', color: '#9A9DA3' }}>Carregando...</p>
        ) : barbeiros.length === 0 ? (
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
            Nenhum barbeiro cadastrado ainda.
          </div>
        ) : (
          barbeiros.map((b) => (
            <div
              key={b.id}
              style={{
                backgroundColor: '#2B2D31',
                border: '1px solid #4A4D52',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#0E0E0F', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
                  <Scissors size={18} color="#E4E4E6" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.nome}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#9A9DA3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.email}
                  </p>
                  {b.nomeBarbearia && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#9A9DA3',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.nomeBarbearia}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => handleIniciarEdicao(b)}
                  title="Editar barbeiro"
                  style={{
                    backgroundColor: 'rgba(228, 228, 230, 0.1)',
                    border: '1px solid #4A4D52',
                    color: '#E4E4E6',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleRemover(b.id, b.nome)}
                  title="Remover barbeiro"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};