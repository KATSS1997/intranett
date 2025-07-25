/**
 * Layout para páginas públicas (não autenticadas)
 * Caminho: frontend/src/components/layouts/PublicLayout.jsx
 */

import React from 'react';
import { useTheme } from '../../contexts/AppContext';

const PublicLayout = ({ children }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`public-layout ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header público simples */}
      <header className="public-header">
        <div className="header-container">
          <div className="logo">
            <h1>🏢 Intranet</h1>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="public-main">
        {children}
      </main>

      {/* Footer público */}
      <footer className="public-footer">
        <div className="footer-container">
          <p>&copy; 2025 Intranet Fullstack. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;