/**
 * Componente para Acesso Negado
 * Caminho: frontend/src/components/common/AccessDenied.jsx
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

/**
 * AccessDenied - Componente para mostrar quando acesso é negado
 * 
 * @param {Object} props
 * @param {string} props.message - Mensagem de erro personalizada
 * @param {string[]} props.requiredRoles - Roles necessários
 * @param {string} props.userRole - Role atual do usuário
 * @param {number[]} props.allowedCompanies - Empresas permitidas
 * @param {number} props.userCompany - Empresa do usuário
 * @param {boolean} props.requireAll - Se requer todos os roles
 * @param {boolean} props.showUserInfo - Mostra informações do usuário
 * @param {boolean} props.showActions - Mostra botões de ação
 * @param {string} props.size - Tamanho do componente ('small', 'medium', 'large')
 */
const AccessDenied = ({
  message = "Você não tem permissão para acessar esta área",
  requiredRoles = [],
  userRole = null,
  allowedCompanies = [],
  userCompany = null,
  requireAll = false,
  showUserInfo = true,
  showActions = true,
  size = 'medium',
  customCheck = false,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleGoHome = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const sizeClasses = {
    small: 'access-denied--small',
    medium: 'access-denied--medium',
    large: 'access-denied--large',
  };

  return (
    <div className={`access-denied ${sizeClasses[size] || sizeClasses.medium}`}>
      <div className="access-denied__container">
        {/* Ícone */}
        <div className="access-denied__icon">
          🚫
        </div>

        {/* Título */}
        <h2 className="access-denied__title">
          Acesso Negado
        </h2>

        {/* Mensagem principal */}
        <p className="access-denied__message">
          {message}
        </p>

        {/* Informações detalhadas */}
        {showUserInfo && (
          <div className="access-denied__details">
            {/* Informações do usuário */}
            {user && (
              <div className="access-denied__user-info">
                <h4>Suas informações:</h4>
                <ul>
                  <li><strong>Usuário:</strong> {user.nomeUsuario} ({user.cdUsuario})</li>
                  <li><strong>Perfil:</strong> {userRole || user.perfil || 'Não definido'}</li>
                  <li><strong>Empresa:</strong> {user.nomeEmpresa} (#{userCompany || user.cdMultiEmpresa})</li>
                </ul>
              </div>
            )}

            {/* Requisitos de roles */}
            {requiredRoles.length > 0 && (
              <div className="access-denied__requirements">
                <h4>Perfis necessários:</h4>
                <div className="access-denied__roles">
                  {requireAll ? (
                    <p>Você precisa ter <strong>todos</strong> os perfis abaixo:</p>
                  ) : (
                    <p>Você precisa ter <strong>pelo menos um</strong> dos perfis abaixo:</p>
                  )}
                  <ul>
                    {requiredRoles.map(role => (
                      <li key={role} className="access-denied__role">
                        {role}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Requisitos de empresa */}
            {allowedCompanies.length > 0 && (
              <div className="access-denied__requirements">
                <h4>Empresas permitidas:</h4>
                <ul>
                  {allowedCompanies.map(company => (
                    <li key={company} className="access-denied__company">
                      Empresa #{company}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verificação customizada */}
            {customCheck && (
              <div className="access-denied__custom">
                <p>Esta área possui restrições específicas que não foram atendidas.</p>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div className="access-denied__actions">
            <button 
              onClick={handleGoBack}
              className="btn btn-secondary"
            >
              ← Voltar
            </button>
            
            <button 
              onClick={handleGoHome}
              className="btn btn-primary"
            >
              🏠 Ir para Home
            </button>
            
            <button 
              onClick={handleLogout}
              className="btn btn-outline"
            >
              🚪 Fazer Logout
            </button>
          </div>
        )}

        {/* Informações de contato/suporte */}
        <div className="access-denied__support">
          <p className="text-small text-muted">
            Se você acredita que deveria ter acesso a esta área, 
            entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Versão compacta do AccessDenied
 */
export const AccessDeniedCompact = ({ message, onClose }) => {
  return (
    <div className="access-denied-compact">
      <div className="access-denied-compact__content">
        <span className="access-denied-compact__icon">🚫</span>
        <span className="access-denied-compact__message">{message}</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="access-denied-compact__close"
            aria-label="Fechar"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * AccessDenied para uso inline
 */
export const AccessDeniedInline = ({ message, showIcon = true }) => {
  return (
    <div className="access-denied-inline">
      {showIcon && <span className="access-denied-inline__icon">🚫</span>}
      <span className="access-denied-inline__message">{message}</span>
    </div>
  );
};

/**
 * Hook para gerar mensagens de acesso negado personalizadas
 */
export const useAccessDeniedMessages = () => {
  const generateMessage = React.useCallback(({ 
    type, 
    requiredRoles = [], 
    userRole = '', 
    allowedCompanies = [], 
    userCompany = null 
  }) => {
    switch (type) {
      case 'role':
        return `Acesso restrito aos perfis: ${requiredRoles.join(', ')}. Seu perfil atual: ${userRole}`;
      
      case 'company':
        return `Acesso restrito às empresas: ${allowedCompanies.join(', ')}. Sua empresa: ${userCompany}`;
      
      case 'admin_only':
        return 'Esta área é restrita apenas a administradores do sistema.';
      
      case 'manager_only':
        return 'Esta área é restrita a gerentes e administradores.';
      
      case 'maintenance':
        return 'Esta funcionalidade está temporariamente indisponível para manutenção.';
      
      case 'feature_disabled':
        return 'Esta funcionalidade foi desabilitada pelo administrador.';
      
      default:
        return 'Você não tem permissão para acessar esta área.';
    }
  }, []);

  return { generateMessage };
};

export default AccessDenied;