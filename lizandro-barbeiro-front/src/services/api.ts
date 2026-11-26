const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // sessionStorage de propósito: ver comentário em AuthContext.tsx — cada
  // aba/janela guarda seu próprio login, pra dar pra abrir admin, barbeiro
  // e cliente ao mesmo tempo sem um login atropelar o outro.
  const token = sessionStorage.getItem('@lizandro:token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    // Garante que o navegador nunca sirva uma resposta antiga do cache —
    // importante pras telas que ficam atualizando sozinhas (polling), pra
    // sempre pegar o status mais recente (ex: confirmado via link do e-mail).
    cache: 'no-store',
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const rawError = data.erro || data.error || data.message || data;
    const errorMessage =
      typeof rawError === 'string'
        ? rawError
        : JSON.stringify(rawError);

    throw new Error(errorMessage || 'Erro na comunicação com o servidor');
  }

  return data as T;
}