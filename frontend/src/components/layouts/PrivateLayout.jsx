/**
 * Layout para páginas privadas (autenticadas)
 * Caminho: frontend/src/components/layouts/PrivateLayout.jsx
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLayout, useTheme } from '../../contexts/AppContext';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import Footer from '../common/Footer';

const PrivateLayout = ({ children }) => {
  const { user } = useAuth();
  const { sidebarCollapsed, isMobile, mobileMenuOpen } = useLayout();
  const { isDarkMode } = useTheme();

  return (
    <div className={`private-layout ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <Header />

      <div className="layout-body">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isMobile && mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <div className="content-wrapper">
            {children}
          </div>
        </main>

        {/* Overlay para mobile */}
        {isMobile && mobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => toggleMobileMenu()} />
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivateLayout;