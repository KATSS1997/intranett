/**
 * Componente Loading Spinner
 * Caminho: frontend/src/components/common/LoadingSpinner.jsx
 */

import React from 'react';

/**
 * LoadingSpinner - Componente de carregamento
 * 
 * @param {Object} props
 * @param {string} props.size - Tamanho do spinner ('small', 'medium', 'large')
 * @param {string} props.color - Cor do spinner
 * @param {string} props.className - Classes CSS adicionais
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'spinner--small',
    medium: 'spinner--medium', 
    large: 'spinner--large'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} spinner--${color} ${className}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

/**
 * LoadingScreen - Tela de carregamento completa
 */
export const LoadingScreen = ({ message = 'Carregando...' }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <LoadingSpinner size="large" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;