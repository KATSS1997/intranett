/**
 * Página de Administração
 * Caminho: frontend/src/pages/Admin.jsx
 */

import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { usePermissions } from '../hooks/useAuth';

const Admin = () => {
  const { setPageTitle, showInfo } = useApp();
  const { isAdmin } = usePermissions();

  useEffect(() => {
    setPageTitle('Administração');
  }, [setPageTitle]);

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar a área administrativa.</p>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Configurações do Sistema',
      icon: '⚙️',
      description: 'Configurar parâmetros gerais do sistema',
      action: () => showInfo('Configurações em desenvolvimento'),
    },
    {
      title: 'Logs do Sistema',
      icon: '📋',
      description: 'Visualizar logs de acesso e erros',
      action: () => showInfo('Logs em desenvolvimento'),
    },
    {
      title: 'Backup & Restore',
      icon: '💾',
      description: 'Gerenciar backups do sistema',
      action: () => showInfo('Backup em desenvolvimento'),
    },
    {
      title: 'Monitoramento',
      icon: '📊',
      description: 'Monitorar performance do sistema',
      action: () => showInfo('Monitoramento em desenvolvimento'),
    },
    {
      title: 'Usuários & Permissões',
      icon: '👥',
      description: 'Gerenciar usuários e permissões',
      action: () => showInfo('Gestão de permissões em desenvolvimento'),
    },
    {
      title: 'Integrações',
      icon: '🔗',
      description: 'Configurar integrações externas',
      action: () => showInfo('Integrações em desenvolvimento'),
    },
  ];

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>⚙️ Administração do Sistema</h1>
        <p>Área restrita aos administradores</p>
      </div>

      <div className="admin-grid">
        {adminSections.map((section, index) => (
          <div key={index} className="admin-card">
            <div className="admin-card-header">
              <span className="admin-card-icon">{section.icon}</span>
              <h3 className="admin-card-title">{section.title}</h3>
            </div>
            <p className="admin-card-description">{section.description}</p>
            <button 
              onClick={section.action}
              className="admin-card-button"
            >
              Acessar →
            </button>
          </div>
        ))}
      </div>

      <div className="admin-stats">
        <h2>📈 Estatísticas do Sistema</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">156</span>
            <span className="stat-label">Total de Usuários</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">89</span>
            <span className="stat-label">Usuários Ativos</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">3</span>
            <span className="stat-label">Empresas</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">45</span>
            <span className="stat-label">Dias de Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;