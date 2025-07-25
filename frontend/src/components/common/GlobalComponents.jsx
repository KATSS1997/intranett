/**
 * Componentes Globais da Aplicação
 * Caminho: frontend/src/components/common/GlobalComponents.jsx
 */

import React from 'react';
import LoadingOverlay from './LoadingOverlay';
import NotificationCenter from './NotificationCenter';
import ConnectionStatus from './ConnectionStatus';
import SessionWarning from './SessionWarning';

const GlobalComponents = () => {
  return (
    <>
      {/* Overlay de loading global */}
      <LoadingOverlay />
      
      {/* Centro de notificações */}
      <NotificationCenter />
      
      {/* Status de conexão */}
      <ConnectionStatus />
      
      {/* Aviso de sessão próxima ao vencimento */}
      <SessionWarning />
    </>
  );
};

export default GlobalComponents;