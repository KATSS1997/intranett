import React, { useState, useEffect, createContext, useContext } from 'react';

// ==================== IMPORTAR NOVAS PÁGINAS ====================
import Cardapio from './pages/Cardapio';
import AgendamentoSalas from './pages/AgendamentoSalas';
import Comunicacao from './pages/Comunicacao';
import Ramais from './pages/Ramais';
import VagasInternas from './pages/VagasInternas';

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/validate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUser(data.user);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('userData');
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.warn('API não respondeu, usando dados locais:', error);
          try {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
          } catch (parseError) {
            console.error('Erro ao recuperar dados do usuário:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cdUsuario: credentials.cdUsuario,
          password: credentials.password,
          cdMultiEmpresa: credentials.cdMultiEmpresa
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const userData = {
          cd_usuario: data.user?.cd_usuario || credentials.cdUsuario,
          nome_usuario: data.user?.nome_usuario || data.user?.nm_usuario || 'Usuário',
          nomeUsuario: data.user?.nome_usuario || data.user?.nm_usuario || 'Usuário',
          nm_usuario: data.user?.nome_usuario || data.user?.nm_usuario || 'Usuário',
          perfil: data.user?.perfil || data.user?.cd_papel || 'user',
          cd_multi_empresa: credentials.cdMultiEmpresa,
          token: data.token
        };
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        let errorMessage = 'Erro de autenticação';
        
        if (!response.ok) {
          switch (response.status) {
            case 401:
              errorMessage = 'Credenciais inválidas';
              break;
            case 403:
              errorMessage = 'Acesso negado';
              break;
            case 404:
              errorMessage = 'Serviço não encontrado';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor';
              break;
            default:
              errorMessage = `Erro ${response.status}: ${response.statusText}`;
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Erro de conexão com o servidor' };
      } else if (error.name === 'AbortError') {
        return { success: false, error: 'Tempo limite de conexão esgotado' };
      }
      
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('Erro ao fazer logout na API:', error);
        }
      }
    } catch (error) {
      console.warn('Erro durante logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

// ==================== ROUTER SIMPLES ====================
const SimpleRouter = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/login');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#/login');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  return (
    <div>
      {React.Children.map(children, child => 
        React.cloneElement(child, { currentPath, navigate })
      )}
    </div>
  );
};

// ==================== COMPONENTES ====================

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

const LoginPage = ({ navigate }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    cdUsuario: '',
    password: '',
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
      navigate('#/dashboard');
    } else {
      setError(result.error || 'Erro ao fazer login');
    }

    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: 0, color: '#333', fontSize: '28px' }}>🏢 Intranet</h1>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>Faça login para continuar</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            color: '#c33',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' }}>
              Usuário
            </label>
            <input
              type="text"
              value={formData.cdUsuario}
              onChange={(e) => setFormData({...formData, cdUsuario: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' }}>
              Senha
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500' }}>
              Empresa
            </label>
            <input
              type="number"
              value={formData.cdMultiEmpresa}
              onChange={(e) => setFormData({...formData, cdMultiEmpresa: parseInt(e.target.value)})}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#95a5a6' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

const PrivateLayout = ({ children, currentPath, navigate }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <aside style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>🏢 Intranet</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <a
            href="#/dashboard"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/dashboard' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            📊 Dashboard
          </a>

          <a
            href="#/users"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/users' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            👥 Usuários
          </a>

          <a
            href="#/cardapio"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/cardapio' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            🍽️ Cardápio
          </a>

          <a
            href="#/agendamento"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/agendamento' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            📅 Agendamento
          </a>

          <a
            href="#/comunicacao"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/comunicacao' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            💬 Comunicação
          </a>

          <a
            href="#/ramais"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/ramais' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            📞 Ramais
          </a>

          <a
            href="#/vagas"
            style={{
              display: 'block',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '6px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: currentPath === '#/vagas' ? '#34495e' : 'transparent',
              transition: 'background-color 0.3s'
            }}
          >
            💼 Vagas Internas
          </a>

          {user?.perfil === 'admin' && (
            <a
              href="#/admin"
              style={{
                display: 'block',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: 'white',
                backgroundColor: currentPath === '#/admin' ? '#34495e' : 'transparent',
                transition: 'background-color 0.3s'
              }}
            >
              ⚙️ Admin
            </a>
          )}
        </nav>

        <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#3498db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {user?.nomeUsuario?.[0] || user?.nome_usuario?.[0] || user?.nm_usuario?.[0] || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.nomeUsuario || user?.nome_usuario || user?.nm_usuario || 'Usuário'}
              </div>
              <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                {user?.perfil || 'user'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      <main style={{
        flex: 1,
        backgroundColor: '#ecf0f1',
        padding: '30px',
        overflowY: 'auto'
      }}>
        {children}
      </main>
    </div>
  );
};

const DashboardPage = () => {
  const [stats, setStats] = useState({
    usuarios: { total: 48, ativos: 42, inativos: 6 },
    empresas: { total: 3 },
    sistema: { uptime_dias: 15, status: 'online' }
  });

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>📊 Dashboard</h1>
        <p style={{ margin: 0, color: '#666' }}>Visão geral do sistema</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total de Usuários</p>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#2c3e50' }}>{stats.usuarios.total}</h2>
            </div>
            <div style={{ fontSize: '32px' }}>👥</div>
          </div>
          <div style={{ marginTop: '15px', fontSize: '13px', color: '#7f8c8d' }}>
            <span style={{ color: '#27ae60' }}>✓ {stats.usuarios.ativos} ativos</span> • 
            <span style={{ color: '#e74c3c' }}> {stats.usuarios.inativos} inativos</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Empresas</p>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#2c3e50' }}>{stats.empresas.total}</h2>
            </div>
            <div style={{ fontSize: '32px' }}>🏢</div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Sistema</p>
              <h2 style={{ margin: '10px 0 0 0', fontSize: '32px', color: '#27ae60' }}>Online</h2>
            </div>
            <div style={{ fontSize: '32px' }}>✅</div>
          </div>
          <div style={{ marginTop: '15px', fontSize: '13px', color: '#7f8c8d' }}>
            Uptime: {stats.sistema.uptime_dias} dias
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users] = useState([
    { id: 1, nome: 'João Silva', usuario: 'joao.silva', perfil: 'admin', status: 'Ativo' },
    { id: 2, nome: 'Maria Santos', usuario: 'maria.santos', perfil: 'user', status: 'Ativo' },
    { id: 3, nome: 'Pedro Costa', usuario: 'pedro.costa', perfil: 'user', status: 'Inativo' }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '10px' }}>👥 Usuários</h1>
          <p style={{ margin: 0, color: '#666' }}>Gerenciar usuários do sistema</p>
        </div>
        <button style={{
          padding: '12px 24px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          ➕ Novo Usuário
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>Nome</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>Usuário</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>Perfil</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#2c3e50' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderTop: '1px solid #ecf0f1' }}>
                <td style={{ padding: '15px' }}>{user.nome}</td>
                <td style={{ padding: '15px' }}>{user.usuario}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.perfil === 'admin' ? '#e8f4fd' : '#f0f0f0',
                    color: user.perfil === 'admin' ? '#3498db' : '#666'
                  }}>
                    {user.perfil}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: user.status === 'Ativo' ? '#d4edda' : '#f8d7da',
                    color: user.status === 'Ativo' ? '#27ae60' : '#e74c3c'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '8px'
                  }}>
                    ✏️ Editar
                  </button>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    🗑️ Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPage = () => {
  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, marginBottom: '10px' }}>⚙️ Administração</h1>
        <p style={{ margin: 0, color: '#666' }}>Configurações e controles do sistema</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
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
      </div>
    </div>
  );
};

// ==================== APP PRINCIPAL ====================
function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Carregando aplicação..." />;
  }

  return (
    <SimpleRouter>
      <AppContent isAuthenticated={isAuthenticated} />
    </SimpleRouter>
  );
}

const AppContent = ({ currentPath, navigate, isAuthenticated }) => {
  useEffect(() => {
    if (!currentPath || currentPath === '#/') {
      if (isAuthenticated) {
        navigate('#/dashboard');
      } else {
        navigate('#/login');
      }
    }
  }, [currentPath, navigate, isAuthenticated]);

  if (currentPath === '#/login') {
    if (isAuthenticated) {
      navigate('#/dashboard');
      return null;
    }
    return <LoginPage navigate={navigate} />;
  }

  if (!isAuthenticated) {
    return <LoginPage navigate={navigate} />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case '#/dashboard':
        return <DashboardPage navigate={navigate} />;
      case '#/users':
        return <UsersPage navigate={navigate} />;
      case '#/admin':
        return <AdminPage navigate={navigate} />;
      case '#/cardapio':
        return <Cardapio />;
      case '#/agendamento':
        return <AgendamentoSalas />;
      case '#/comunicacao':
        return <Comunicacao />;
      case '#/ramais':
        return <Ramais />;
      case '#/vagas':
        return <VagasInternas />;
      default:
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '50vh',
            fontFamily: 'Arial'
          }}>
            <h1>404 - Página não encontrada</h1>
            <button 
              onClick={() => navigate('#/dashboard')}
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
        );
    }
  };

  return (
    <PrivateLayout currentPath={currentPath} navigate={navigate}>
      {renderPage()}
    </PrivateLayout>
  );
};

export default function IntranetApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}