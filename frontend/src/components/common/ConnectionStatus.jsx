/**
 * Connection Status Component
 * Caminho: frontend/src/components/common/ConnectionStatus.jsx
 */

import React from 'react';
import { useConnection } from '../../contexts/AppContext';

const ConnectionStatus = () => {
  const { isOnline, isApiOnline } = useConnection();

  // Só mostra se estiver offline
  if (isOnline && isApiOnline) return null;

  return (
    <div className="connection-status">
      {!isOnline && (
        <div className="connection-alert connection-alert--offline">
          🌐 Sem conexão com a internet
        </div>
      )}
      
      {isOnline && !isApiOnline && (
        <div className="connection-alert connection-alert--api-offline">
          ⚠️ API temporariamente indisponível
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;