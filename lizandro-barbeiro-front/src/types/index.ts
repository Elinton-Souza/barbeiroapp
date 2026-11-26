export type Role = 'CLIENTE' | 'BARBEIRO' | 'ADMIN';

export interface Usuario {
  id: string;
  nome: string;
  nomeBarbearia?: string | null;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  role: Role;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}