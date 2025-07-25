/**
 * Página Dashboard Principal
 * Caminho: frontend/src/pages/Dashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth, usePermissions, useSession } from '../hooks/useAuth';
import { useApp, useNotifications } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { AdminOnly, ManagerOnly } from '../guards/RoleGuard';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { isAdmin, isManager, userRole, userCompany } = usePermissions();
  const { timeRemainingFormatted, isNearExpiry } = useSession();
  const { setPageTitle, showSuccess, showInfo } = useNotifications();
  const { isApiOnline, connectionStatus } = useApp();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    systemUptime: '0 dias',
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define título da página
  useEffect(() => {
    setPageTitle('Dashboard');
  }, [setPageTitle]);

  // Carrega dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Simula carregamento de dados
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Dados mockados (em produção viriam da API)
        setStats({
          totalUsers: 156,
          activeUsers: 89,
          totalCompanies: 3,
          systemUptime: '45 dias',
        });

        setRecentActivities([
          {
            id: 1,
            type: 'login',
            user: user.nomeUsuario,
            description: 'Login realizado com sucesso',
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            type: 'system',
            user: 'Sistema',
            description: 'Backup automático executado',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 3,
            type: 'user',
            user: 'Admin',
            description: 'Novo usuário criado',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          },
        ]);

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Aviso de sessão próxima ao vencimento
  useEffect(() => {
    if (isNearExpiry && timeRemainingFormatted) {
      showInfo(`Sua sessão expira em ${timeRemainingFormatted}`, {
        persistent: true,
        title: 'Sessão próxima ao vencimento',
      });
    }
  }, [isNearExpiry, timeRemainingFormatted, showInfo]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      showSuccess('Logout realizado com sucesso');
      navigate(ROUTES.LOGIN);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login': return '🔐';
      case 'system': return '⚙️';
      case 'user': return '👤';
      default: return '📝';
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="dashboard-title">
            👋 Bem-vindo, {user.nomeUsuario}!
          </h1>
          <p className="dashboard-subtitle">
            {user.nomeEmpresa} • Perfil: {userRole} • Empresa: #{userCompany}
          </p>
        </div>

        <div className="header-actions">
          {/* Status da Conexão */}
          <div className={`connection-status ${isApiOnline ? 'online' : 'offline'}`}>
            <span className="status-indicator"></span>
            {isApiOnline ? 'Online' : 'Offline'}
          </div>

          {/* Tempo de Sessão */}
          {timeRemainingFormatted && (
            <div className={`session-time ${isNearExpiry ? 'warning' : ''}`}>
              ⏰ Sessão: {timeRemainingFormatted}
            </div>
          )}

          {/* Botão Logout */}
          <button onClick={handleLogout} className="logout-button">
            🚪 Sair
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalUsers}</h3>
            <p className="stat-label">Total de Usuários</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.activeUsers}</h3>
            <p className="stat-label">Usuários Ativos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalCompanies}</h3>
            <p className="stat-label">Empresas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.systemUptime}</h3>
            <p className="stat-label">Uptime do Sistema</p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="dashboard-content">
        
        {/* Ações Rápidas */}
        <div className="quick-actions">
          <h2 className="section-title">⚡ Ações Rápidas</h2>
          
          <div className="action-grid">
            {/* Perfil */}
            <button 
              onClick={() => navigate(ROUTES.PROFILE)}
              className="action-card"
            >
              <div className="action-icon">👤</div>
              <div className="action-content">
                <h3>Meu Perfil</h3>
                <p>Ver e editar informações pessoais</p>
              </div>
            </button>

            {/* Usuários (apenas managers+) */}
            <ManagerOnly>
              <button 
                onClick={() => navigate(ROUTES.USERS)}
                className="action-card"
              >
                <div className="action-icon">👥</div>
                <div className="action-content">
                  <h3>Gestão de Usuários</h3>
                  <p>Gerenciar usuários do sistema</p>
                </div>
              </button>
            </ManagerOnly>

            {/* Admin (apenas admins) */}
            <AdminOnly>
              <button 
                onClick={() => navigate(ROUTES.ADMIN)}
                className="action-card admin"
              >
                <div className="action-icon">⚙️</div>
                <div className="action-content">
                  <h3>Administração</h3>
                  <p>Configurações do sistema</p>
                </div>
              </button>
            </AdminOnly>

            {/* Relatórios */}
            <button 
              onClick={() => showInfo('Funcionalidade em desenvolvimento')}
              className="action-card"
            >
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3>Relatórios</h3>
                <p>Visualizar relatórios e métricas</p>
              </div>
            </button>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="recent-activities">
          <h2 className="section-title">📋 Atividades Recentes</h2>
          
          <div className="activities-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-content">
                  <p className="activity-description">
                    <strong>{activity.user}</strong> • {activity.description}
                  </p>
                  <span className="activity-time">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="view-all-button">
            Ver todas as atividades →
          </button>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="system-info-panel">
        <h3>📈 Status do Sistema</h3>
        <div className="system-metrics">
          <div className="metric">
            <span className="metric-label">Conexão API:</span>
            <span className={`metric-value ${isApiOnline ? 'success' : 'error'}`}>
              {isApiOnline ? '✅ Online' : '❌ Offline'}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Seu Perfil:</span>
            <span className="metric-value">{userRole}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Empresa:</span>
            <span className="metric-value">{user.nomeEmpresa}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Sessão:</span>
            <span className={`metric-value ${isNearExpiry ? 'warning' : 'success'}`}>
              {timeRemainingFormatted || 'Ativa'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;