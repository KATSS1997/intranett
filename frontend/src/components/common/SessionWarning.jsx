/**
 * Session Warning Component
 * Caminho: frontend/src/components/common/SessionWarning.jsx
 */

import React from 'react';
import { useSession, useAuth } from '../../hooks/useAuth';

const SessionWarning = () => {
  const { isNearExpiry, timeRemainingFormatted } = useSession();
  const { isAuthenticated, logout } = useAuth();

  // Só mostra se autenticado e perto do vencimento
  if (!isAuthenticated || !isNearExpiry) return null;

  const handleExtendSession = () => {
    // Implementar extensão de sessão se necessário
    console.log('Extensão de sessão não implementada');
  };

  return (
    <div className="session-warning">
      <div className="session-warning-content">
        <span className="session-warning-icon">⏰</span>
        <div className="session-warning-text">
          <strong>Sua sessão expira em {timeRemainingFormatted}</strong>
          <p>Clique em "Continuar" para manter sua sessão ativa.</p>
        </div>
        <div className="session-warning-actions">
          <button onClick={handleExtendSession} className="btn btn-primary">
            Continuar
          </button>
          <button onClick={logout} className="btn btn-secondary">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;