import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ==================== COMPONENTES ====================

// Loading Component
const LoadingScreen = ({ message = 'Carregando...' }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    fontFamily: 'Arial'
  }}>
    <div style={{ marginBottom: '20px', fontSize: '24px' }}>⏳</div>
    <p>{message}</p>
  </div>
);

// Login Page
const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    cdUsuario: 'DBAMV',
    password: 'cmdmvfbg190918',
    cdMultiEmpresa: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);

    if (result.success) {
      const destination = location.state?.from || '/dashboard';
      navigate(destination, { replace: true });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🏢 Login - Intranet
        </h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Usuário:</label>
            <input 
              type="text" 
              value={formData.cdUsuario}
              onChange={(e) => setFormData(prev => ({ ...prev, cdUsuario: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required 
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Senha:</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required 
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Empresa:</label>
            <input 
              type="number" 
              value={formData.cdMultiEmpresa}
              onChange={(e) => setFormData(prev => ({ ...prev, cdMultiEmpresa: parseInt(e.target.value) }))}
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              required 
            />
          </div>
          
          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#fee',
              borderRadius: '4px'
            }}>
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: loading ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Entrando...' : '🔐 Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Layout Privado
const PrivateLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { label: 'Perfil', path: '/profile', icon: '👤' },
    { label: 'Usuários', path: '/users', icon: '👥' },
    { label: 'Admin', path: '/admin', icon: '⚙️' },
  ];

  const isAdmin = user?.perfil === 'admin' || user?.perfil === 'administrador';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: sidebarOpen ? '250px' : '60px',
        backgroundColor: '#2c3e50',
        color: 'white',
        transition: 'width 0.3s',
        position: 'relative'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
          <h2 style={{ margin: 0, fontSize: sidebarOpen ? '18px' : '14px' }}>
            {sidebarOpen ? '🏢 Intranet' : '🏢'}
          </h2>
        </div>
        
        <nav style={{ padding: '20px 0' }}>
          {menuItems.map(item => {
            // Filtro de permissão
            if (item.path === '/admin' && !isAdmin) return null;
            
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: isActive ? '#3498db' : 'transparent',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left'
                }}
              >
                <span style={{ marginRight: sidebarOpen ? '10px' : '0' }}>
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white',
          borderBottom: '1px solid #ddd',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >
              ☰
            </button>
            <h1 style={{ margin: 0, fontSize: '20px' }}>Sistema Intranet</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Olá, {user?.nomeUsuario}!</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 15px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🚪 Sair
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '20px', backgroundColor: '#f8f9fa' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { title: 'Total Usuários', value: '156', icon: '👥', color: '#3498db' },
    { title: 'Usuários Ativos', value: '89', icon: '✅', color: '#2ecc71' },
    { title: 'Empresas', value: '3', icon: '🏢', color: '#9b59b6' },
    { title: 'Sistema Online', value: '45 dias', icon: '⏱️', color: '#f39c12' },
  ];

  const quickActions = [
    { title: 'Meu Perfil', desc: 'Ver e editar informações', icon: '👤', path: '/profile' },
    { title: 'Usuários', desc: 'Gerenciar usuários do sistema', icon: '👥', path: '/users' },
    { title: 'Relatórios', desc: 'Visualizar dados e relatórios', icon: '📊', path: '/reports' },
    { title: 'Admin', desc: 'Configurações do sistema', icon: '⚙️', path: '/admin' },
  ];

  const recentActivities = [
    { id: 1, type: 'login', user: user.nomeUsuario, desc: 'Login realizado com sucesso', time: 'agora', icon: '🔐' },
    { id: 2, type: 'system', user: 'Sistema', desc: 'Backup automático executado', time: '2h atrás', icon: '💾' },
    { id: 3, type: 'user', user: 'Admin', desc: 'Novo usuário F05800 criado', time: '4h atrás', icon: '👤' },
    { id: 4, type: 'update', user: 'Sistema', desc: 'Atualização do sistema instalada', time: '1d atrás', icon: '🔄' },
  ];

  const isAdmin = user?.perfil === 'admin' || user?.perfil === 'administrador';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px', fontSize: '28px' }}>
          Bem-vindo, {user?.nomeUsuario}! 👋
        </h1>
        <p style={{ margin: 0, color: '#666', fontSize: '16px' }}>
          Painel de controle da intranet
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              fontSize: '30px',
              marginRight: '15px',
              padding: '15px',
              backgroundColor: stat.color + '20',
              borderRadius: '50%'
            }}>
              {stat.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '24px', color: stat.color }}>
                {stat.value}
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>⚡ Ações Rápidas</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {quickActions.map((action, index) => {
              // Filtro de permissão para admin
              if (action.path === '/admin' && !isAdmin) return null;
              
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                    {action.icon}
                  </div>
                  <h3 style={{ margin: 0, marginBottom: '5px', fontSize: '16px' }}>
                    {action.title}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {action.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>📋 Atividades Recentes</h2>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} style={{
                padding: '15px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '20px', marginRight: '15px' }}>
                  {activity.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', marginBottom: '5px' }}>
                    {activity.desc}
                  </p>
                  <small style={{ color: '#666' }}>
                    por {activity.user} • {activity.time}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>🖥️ Status do Sistema</h2>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: '#2ecc71', 
                borderRadius: '50%',
                marginRight: '10px'
              }}></div>
              <span>API Backend: Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: '#2ecc71', 
                borderRadius: '50%',
                marginRight: '10px'
              }}></div>
              <span>Oracle Database: Conectado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: '#f39c12', 
                borderRadius: '50%',
                marginRight: '10px'
              }}></div>
              <span>Último Backup: 2h atrás</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Page
const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users] = useState([
    { id: 1, cd_usuario: 'F05393', nm_usuario: 'MARCO AURELIO DA SILVA', perfil: 'user', ativo: 'S' },
    { id: 2, cd_usuario: 'F05587', nm_usuario: 'EDILA DE LOURDES LOPES', perfil: 'user', ativo: 'S' },
    { id: 3, cd_usuario: 'F04821', nm_usuario: 'ANGELICA DINIZ XAVIER', perfil: 'gerente', ativo: 'S' },
    { id: 4, cd_usuario: 'DBAMV', nm_usuario: 'DBAMV', perfil: 'admin', ativo: 'S' },
    { id: 5, cd_usuario: 'F04938', nm_usuario: 'MARIA DAS GRACAS DE CASTRO', perfil: 'user', ativo: 'S' },
  ]);

  const filteredUsers = users.filter(user => 
    user.cd_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nm_usuario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>👥 Gestão de Usuários</h1>
        <p style={{ margin: 0, color: '#666' }}>Gerencie os usuários do sistema</p>
      </div>

      {/* Search and Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar usuário..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            minWidth: '300px'
          }}
        />
        
        <button style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          ➕ Novo Usuário
        </button>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Código
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Nome
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Perfil
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Status
              </th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '15px' }}>
                  <code style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {user.cd_usuario}
                  </code>
                </td>
                <td style={{ padding: '15px' }}>{user.nm_usuario}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: user.perfil === 'admin' ? '#e74c3c20' : 
                                   user.perfil === 'gerente' ? '#f39c1220' : '#3498db20',
                    color: user.perfil === 'admin' ? '#e74c3c' : 
                           user.perfil === 'gerente' ? '#f39c12' : '#3498db'
                  }}>
                    {user.perfil}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: user.ativo === 'S' ? '#2ecc7120' : '#e74c3c20',
                    color: user.ativo === 'S' ? '#2ecc71' : '#e74c3c'
                  }}>
                    {user.ativo === 'S' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{
                      padding: '5px 10px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      ✏️ Editar
                    </button>
                    <button style={{
                      padding: '5px 10px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}>
                      🗑️ Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            Nenhum usuário encontrado
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nm_usuario: user?.nomeUsuario || '',
    email: 'usuario@empresa.com',
    telefone: '(31) 99999-9999',
    setor: 'Tecnologia da Informação'
  });

  const handleSave = () => {
    // Aqui você faria a chamada para a API
    alert('Perfil atualizado com sucesso!');
    setEditing(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>👤 Meu Perfil</h1>
        <p style={{ margin: 0, color: '#666' }}>Gerencie suas informações pessoais</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#3498db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
              margin: '0 auto 15px'
            }}>
              {user?.nomeUsuario?.charAt(0) || 'U'}
            </div>
            <h2 style={{ margin: 0, marginBottom: '5px' }}>{user?.nomeUsuario}</h2>
            <p style={{ margin: 0, color: '#666' }}>
              {user?.cdUsuario} • Empresa {user?.cdMultiEmpresa}
            </p>
          </div>

          {/* Form */}
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nome Completo:
              </label>
              <input
                type="text"
                value={profileData.nm_usuario}
                onChange={(e) => setProfileData(prev => ({ ...prev, nm_usuario: e.target.value }))}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: editing ? '1px solid #ddd' : '1px solid #f0f0f0',
                  borderRadius: '4px',
                  backgroundColor: editing ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email:
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: editing ? '1px solid #ddd' : '1px solid #f0f0f0',
                  borderRadius: '4px',
                  backgroundColor: editing ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Telefone:
              </label>
              <input
                type="tel"
                value={profileData.telefone}
                onChange={(e) => setProfileData(prev => ({ ...prev, telefone: e.target.value }))}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: editing ? '1px solid #ddd' : '1px solid #f0f0f0',
                  borderRadius: '4px',
                  backgroundColor: editing ? 'white' : '#f8f9fa'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Setor:
              </label>
              <input
                type="text"
                value={profileData.setor}
                onChange={(e) => setProfileData(prev => ({ ...prev, setor: e.target.value }))}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: editing ? '1px solid #ddd' : '1px solid #f0f0f0',
                  borderRadius: '4px',
                  backgroundColor: editing ? 'white' : '#f8f9fa'
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            marginTop: '30px', 
            display: 'flex', 
            gap: '15px',
            justifyContent: 'flex-end'
          }}>
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  💾 Salvar
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✏️ Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Page
const AdminPage = () => {
  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>⚙️ Administração</h1>
        <p style={{ margin: 0, color: '#666' }}>Configurações e controles do sistema</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* System Config */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0' }}>🖥️ Configurações do Sistema</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <button style={{
              padding: '12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              📊 Logs do Sistema
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              💾 Fazer Backup
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              🔄 Reiniciar Serviços
            </button>
          </div>
        </div>

        {/* Database */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0' }}>🗄️ Banco de Dados</h3>
          <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Conexões Ativas:</span>
              <strong>5/10</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tamanho DB:</span>
              <strong>2.4 GB</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Último Backup:</span>
              <strong>2h atrás</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status:</span>
              <strong style={{ color: '#2ecc71' }}>✅ Online</strong>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0' }}>🔒 Segurança</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <button style={{
              padding: '12px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              🚫 Sessões Ativas
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: '#9b59b6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              🔐 Políticas de Senha
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              📋 Auditoria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Guard para rotas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

// ==================== ROUTER PRINCIPAL ====================

const AppRouter = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Carregando aplicação..." />;
  }

  return (
    <Routes>
      {/* Login */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />

      {/* Dashboard */}
      <Route 
        path="/dashboard" 
        element={
          <PrivateRoute>
            <PrivateLayout>
              <DashboardPage />
            </PrivateLayout>
          </PrivateRoute>
        } 
      />

      {/* Profile */}
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <PrivateLayout>
              <ProfilePage />
            </PrivateLayout>
          </PrivateRoute>
        } 
      />

      {/* Users */}
      <Route 
        path="/users" 
        element={
          <PrivateRoute>
            <PrivateLayout>
              <UsersPage />
            </PrivateLayout>
          </PrivateRoute>
        } 
      />

      {/* Admin */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute>
            <PrivateLayout>
              <AdminPage />
            </PrivateLayout>
          </PrivateRoute>
        } 
      />

      {/* Redirect root */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />

      {/* 404 */}
      <Route 
        path="*" 
        element={
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            fontFamily: 'Arial'
          }}>
            <h1>404 - Página não encontrada</h1>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🏠 Voltar ao Dashboard
            </button>
          </div>
        } 
      />
    </Routes>
  );
};

// ==================== APP PRINCIPAL ====================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppRouter />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;