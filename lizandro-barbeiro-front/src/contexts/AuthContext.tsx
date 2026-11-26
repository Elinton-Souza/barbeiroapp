import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthResponse, Usuario } from '../types';
import { apiFetch } from '../services/api';

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  loginTradicional: (email: string, senha: string, tipo: 'CLIENTE' | 'BARBEIRO') => Promise<Usuario>;
  cadastrarCliente: (dados: { nome: string; email: string; senha: string; telefone: string }) => Promise<Usuario>;
  loginGoogle: (credential: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // sessionStorage (não localStorage) de propósito: cada aba/janela do
    // navegador guarda seu próprio login, independente das outras. Isso
    // permite abrir admin, barbeiro e cliente ao mesmo tempo em
    // janelas/abas separadas (ex: na apresentação) sem um login substituir
    // o outro — o que aconteceria com localStorage, que é compartilhado
    // entre todas as abas do mesmo navegador.
    const savedToken = sessionStorage.getItem('@lizandro:token');
    const savedUser = sessionStorage.getItem('@lizandro:usuario');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsuario(JSON.parse(savedUser));
    }
  }, []);

  function salvarSessao(data: AuthResponse) {
    sessionStorage.setItem('@lizandro:token', data.token);
    sessionStorage.setItem('@lizandro:usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }

  async function loginTradicional(email: string, senha: string, tipo: 'CLIENTE' | 'BARBEIRO') {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha, tipo }),
    });
    return salvarSessao(data);
  }

  async function cadastrarCliente(dados: { nome: string; email: string; senha: string; telefone: string }) {
    const data = await apiFetch<AuthResponse>('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
    return salvarSessao(data);
  }

  async function loginGoogle(credential: string) {
    const data = await apiFetch<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: credential }),
    });
    return salvarSessao(data);
  }

  function logout() {
    sessionStorage.removeItem('@lizandro:token');
    sessionStorage.removeItem('@lizandro:usuario');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, loginTradicional, cadastrarCliente, loginGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);