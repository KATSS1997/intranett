/**
 * Sidebar Component
 * Caminho: frontend/src/components/common/Sidebar.jsx
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLayout } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

const Sidebar = () => {
  const { sidebarCollapsed } = useLayout();
  const { isAdmin, isManager } = usePermissions();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to={ROUTES.DASHBOARD} className="nav-link">
              <span className="nav-icon">🏠</span>
              {!sidebarCollapsed && <span className="nav-text">Dashboard</span>}
            </NavLink>
          </li>

          <li className="nav-item">
            <NavLink to={ROUTES.PROFILE} className="nav-link">
              <span className="nav-icon">👤</span>
              {!sidebarCollapsed && <span className="nav-text">Meu Perfil</span>}
            </NavLink>
          </li>

          {isManager && (
            <li className="nav-item">
              <NavLink to={ROUTES.USERS} className="nav-link">
                <span className="nav-icon">👥</span>
                {!sidebarCollapsed && <span className="nav-text">Usuários</span>}
              </NavLink>
            </li>
          )}

          {isAdmin && (
            <li className="nav-item">
              <NavLink to={ROUTES.ADMIN} className="nav-link">
                <span className="nav-icon">⚙️</span>
                {!sidebarCollapsed && <span className="nav-text">Admin</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;