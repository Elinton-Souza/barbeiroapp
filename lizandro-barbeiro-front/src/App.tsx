import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PhoneLayout } from './components/PhoneLayout';
import { Splash } from './pages/Splash';
import { LoginCliente } from './pages/LoginCliente';
import { LoginBarbeiro } from './pages/LoginBarbeiro';
import { PainelAdmin } from './pages/PainelAdmin';
import { AgendaCliente } from './pages/AgendaCliente';
import { SelecaoServico } from './pages/SelecaoServico';
import { MeusAgendamentos } from './pages/MeusAgendamentos';
import { SemanaBarbeiro } from './pages/SemanaBarbeiro';
import { ConfirmarAgendamento } from './pages/ConfirmarAgendamento';
import type { Role } from './types';

const RotaProtegida: React.FC<{ rolesPermitidos: Role[]; children: React.ReactElement }> = ({
  rolesPermitidos,
  children,
}) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (!rolesPermitidos.includes(usuario.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export function App() {
  return (
    <AuthProvider>
      <PhoneLayout>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Splash />} />
            <Route path="/login/cliente" element={<LoginCliente />} />
            <Route path="/login/barbeiro" element={<LoginBarbeiro />} />
            <Route path="/confirmar" element={<ConfirmarAgendamento />} />

            {/* Fluxo Admin */}
            <Route
              path="/admin"
              element={
                <RotaProtegida rolesPermitidos={['ADMIN']}>
                  <PainelAdmin />
                </RotaProtegida>
              }
            />

            {/* Fluxo Cliente */}
            <Route
              path="/cliente/agenda"
              element={
                <RotaProtegida rolesPermitidos={['CLIENTE']}>
                  <AgendaCliente />
                </RotaProtegida>
              }
            />
            <Route
              path="/cliente/agendar"
              element={
                <RotaProtegida rolesPermitidos={['CLIENTE']}>
                  <SelecaoServico />
                </RotaProtegida>
              }
            />
            <Route
              path="/cliente/meus-agendamentos"
              element={
                <RotaProtegida rolesPermitidos={['CLIENTE']}>
                  <MeusAgendamentos />
                </RotaProtegida>
              }
            />

            {/* Fluxo Barbeiro */}
            <Route
              path="/barbeiro/semana"
              element={
                <RotaProtegida rolesPermitidos={['BARBEIRO']}>
                  <SemanaBarbeiro />
                </RotaProtegida>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PhoneLayout>
    </AuthProvider>
  );
}

export default App;
