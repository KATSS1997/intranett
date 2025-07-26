import React, { useState } from 'react';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const loginData = {
      cdUsuario: formData.get('usuario'),
      password: formData.get('senha'),
      cdMultiEmpresa: parseInt(formData.get('empresa'))
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        setCurrentPage('dashboard');
      } else {
        setError(data.message || 'Erro no login');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  if (currentPage === 'login') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
        <h1>🔐 Login - Intranet</h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Usuário:</label>
            <input 
              name="usuario" 
              type="text" 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              placeholder="Digite seu usuário"
              required 
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Senha:</label>
            <input 
              name="senha" 
              type="password" 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              placeholder="Digite sua senha"
              required 
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label>Empresa:</label>
            <input 
              name="empresa" 
              type="number" 
              defaultValue="1"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              required 
            />
          </div>
          
          {error && (
            <div style={{ color: 'red', marginBottom: '15px' }}>
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>💡 Sistema sem Oracle - Teste com qualquer usuário/senha</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <header style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1>🏠 Dashboard - Intranet</h1>
        <p>Bem-vindo, {user?.nomeUsuario || 'Usuário'}!</p>
        <button onClick={handleLogout} style={{ padding: '5px 10px' }}>
          🚪 Sair
        </button>
      </header>
      
      <div>
        <h2>✅ Sistema funcionando!</h2>
        <ul>
          <li>Frontend React ✅</li>
          <li>Backend Flask ✅</li>
          <li>Comunicação API ✅</li>
          <li>Login simulado ✅</li>
        </ul>
      </div>
    </div>
  );
}

export default App;