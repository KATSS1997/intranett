/**
 * Página de Login
 * Caminho: frontend/src/pages/Login.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin, useIsAuthenticated } from '../hooks/useAuth';
import { useNotifications, useApp } from '../contexts/AppContext';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const { login, isSubmitting, error, clearError } = useLogin();
  const { showSuccess, showError } = useNotifications();
  const { setPageTitle } = useApp();

  // Estados do formulário
  const [formData, setFormData] = useState({
    cdUsuario: '',
    password: '',
    cdMultiEmpresa: 1,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Define título da página
  useEffect(() => {
    setPageTitle('Login');
  }, [setPageTitle]);

  // Redirect se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const destination = location.state?.from || ROUTES.DASHBOARD;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Limpa erros quando form muda
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError, error]);

  // Carrega dados salvos se "lembrar" estava ativo
  useEffect(() => {
    const savedData = localStorage.getItem('loginFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
        setRememberMe(true);
      } catch (e) {
        // Ignora erro de parse
      }
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cdMultiEmpresa' ? parseInt(value) || 1 : value,
    }));
  };

  const handleRememberChange = (e) => {
    setRememberMe(e.target.checked);
    
    if (!e.target.checked) {
      localStorage.removeItem('loginFormData');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.cdUsuario.trim()) {
      showError('Código do usuário é obrigatório');
      return;
    }
    
    if (!formData.password.trim()) {
      showError('Senha é obrigatória');
      return;
    }
    
    if (!formData.cdMultiEmpresa || formData.cdMultiEmpresa < 1) {
      showError('Código da empresa deve ser maior que zero');
      return;
    }

    try {
      // Salva dados se "lembrar" estiver ativo
      if (rememberMe) {
        localStorage.setItem('loginFormData', JSON.stringify({
          cdUsuario: formData.cdUsuario,
          cdMultiEmpresa: formData.cdMultiEmpresa,
        }));
      }

      // Tenta fazer login
      const result = await login(
        formData.cdUsuario,
        formData.password,
        formData.cdMultiEmpresa
      );

      if (result.success) {
        showSuccess(`Bem-vindo, ${result.user.nomeUsuario}!`);
        
        // Navega para destino
        const destination = location.state?.from || ROUTES.DASHBOARD;
        navigate(destination, { replace: true });
      } else {
        showError(result.error || 'Erro no login');
      }
    } catch (err) {
      showError('Erro inesperado. Tente novamente.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <h1>🏢</h1>
            </div>
            <h2 className="login-title">Intranet Fullstack</h2>
            <p className="login-subtitle">
              Faça login para acessar o sistema
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Campo Usuário */}
            <div className="form-group">
              <label htmlFor="cdUsuario" className="form-label">
                Código do Usuário
              </label>
              <input
                type="text"
                id="cdUsuario"
                name="cdUsuario"
                value={formData.cdUsuario}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Digite seu código de usuário"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Campo Senha */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-toggle"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Campo Empresa */}
            <div className="form-group">
              <label htmlFor="cdMultiEmpresa" className="form-label">
                Código da Empresa
              </label>
              <input
                type="number"
                id="cdMultiEmpresa"
                name="cdMultiEmpresa"
                value={formData.cdMultiEmpresa}
                onChange={handleInputChange}
                className="form-input"
                placeholder="1"
                min="1"
                required
              />
            </div>

            {/* Checkbox Lembrar */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberChange}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  Lembrar código do usuário e empresa
                </span>
              </label>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`login-button ${isSubmitting ? 'loading' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  Entrando...
                </>
              ) : (
                <>
                  🔐 Entrar
                </>
              )}
            </button>

            {/* Link de Destino */}
            {location.state?.from && (
              <div className="redirect-info">
                <small>
                  Você será redirecionado para: <strong>{location.state.from}</strong>
                </small>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="version-info">
              Sistema Intranet v1.0.0
            </p>
            <p className="help-text">
              Problemas para acessar? Entre em contato com o suporte.
            </p>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="system-info">
          <h3>Recursos do Sistema</h3>
          <ul>
            <li>✅ Autenticação integrada com Oracle</li>
            <li>✅ Controle de permissões por perfil</li>
            <li>✅ Gestão multi-empresa</li>
            <li>✅ Interface responsiva</li>
            <li>✅ Logs de acesso e auditoria</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;