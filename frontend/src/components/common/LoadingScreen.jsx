/**
 * Loading Screen Component
 * Caminho: frontend/src/components/common/LoadingScreen.jsx
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingScreen = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <LoadingSpinner size="large" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;