/**
 * Página 404 - Não Encontrado
 * Caminho: frontend/src/pages/NotFound.jsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Página não encontrada</h2>
        <p className="not-found-message">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <div className="not-found-actions">
          <button 
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="btn btn-primary"
          >
            🏠 Voltar ao Dashboard
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;