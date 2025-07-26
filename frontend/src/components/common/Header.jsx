/**
 * Header Component
 * Caminho: frontend/src/components/common/Header.jsx
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLayout, useTheme } from '../../contexts/AppContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { toggleSidebar, toggleMobileMenu } = useLayout();
  const { toggleTheme, isDarkMode } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button onClick={toggleSidebar} className="sidebar-toggle">
          ☰
        </button>
        <h1 className="app-title">Intranet</h1>
      </div>

      <div className="header-right">
        <button onClick={toggleTheme} className="theme-toggle">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        <div className="user-menu">
          <span className="user-name">{user?.nomeUsuario}</span>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;