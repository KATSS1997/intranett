/**
 * Guard de Autenticação e Autorização
 * Caminho: frontend/src/guards/AuthGuard.jsx
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import { useNotifications } from '../contexts/AppContext';
import { ROUTES } from '../utils/constants';
import AccessDenied from '../components/common/AccessDenied';

/**
 * AuthGuard - Guard avançado para controle de acesso
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a ser protegido
 * @param {string[]} props.requiredRoles - Roles necessários
 * @param {number[]} props.allowedCompanies - Empresas permitidas
 * @param {Function} props.customCheck - Função customizada de verificação
 * @param {string} props.fallbackRoute - Rota de fallback
 * @param {boolean} props.showAccessDenied - Mostra tela de acesso negado
 * @param {string} props.deniedMessage - Mensagem personalizada de acesso negado
 */
const AuthGuard = ({
  children,
  requiredRoles = [],
  allowedCompanies = [],
  customCheck = null,
  fallbackRoute = ROUTES.DASHBOARD,
  showAccessDenied = true,
  deniedMessage = null,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { hasRole, checkCompany } = usePermissions();
  const { showWarning } = useNotifications();
  const location = useLocation();

  // Verifica se está autenticado
  if (!isAuthenticated || !user) {
    console.log('🔒 AuthGuard: Usuário não autenticado');
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // Verifica roles se especificados
  if (requiredRoles.length > 0) {
    const hasRequiredRole = hasRole(requiredRoles);
    
    if (!hasRequiredRole) {
      const message = deniedMessage || `Acesso restrito. Perfis permitidos: ${requiredRoles.join(', ')}`;
      
      console.log(`🚫 AuthGuard: Acesso negado por role - ${user.cdUsuario} (${user.perfil}) tentou acessar ${location.pathname}`);
      
      showWarning(message);
      
      if (showAccessDenied) {
        return (
          <AccessDenied 
            message={message}
            requiredRoles={requiredRoles}
            userRole={user.perfil}
          />
        );
      }
      
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // Verifica empresas se especificadas
  if (allowedCompanies.length > 0) {
    const hasCompanyAccess = checkCompany(allowedCompanies);
    
    if (!hasCompanyAccess) {
      const message = deniedMessage || `Acesso restrito à sua empresa (${user.cdMultiEmpresa})`;
      
      console.log(`🚫 AuthGuard: Acesso negado por empresa - ${user.cdUsuario} (empresa ${user.cdMultiEmpresa}) tentou acessar ${location.pathname}`);
      
      showWarning(message);
      
      if (showAccessDenied) {
        return (
          <AccessDenied 
            message={message}
            allowedCompanies={allowedCompanies}
            userCompany={user.cdMultiEmpresa}
          />
        );
      }
      
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // Verificação customizada
  if (customCheck && typeof customCheck === 'function') {
    const customResult = customCheck(user);
    
    if (!customResult.allowed) {
      const message = customResult.message || deniedMessage || 'Acesso negado';
      
      console.log(`🚫 AuthGuard: Acesso negado por verificação customizada - ${user.cdUsuario}`);
      
      showWarning(message);
      
      if (showAccessDenied) {
        return (
          <AccessDenied 
            message={message}
            customCheck={true}
          />
        );
      }
      
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // Todas as verificações passaram - renderiza componente
  console.log(`✅ AuthGuard: Acesso autorizado - ${user.cdUsuario} -> ${location.pathname}`);
  
  return children;
};

/**
 * Guard específico para roles
 */
export const RoleGuard = ({ 
  children, 
  roles, 
  fallback = ROUTES.DASHBOARD,
  showDenied = true 
}) => {
  return (
    <AuthGuard
      requiredRoles={Array.isArray(roles) ? roles : [roles]}
      fallbackRoute={fallback}
      showAccessDenied={showDenied}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * Guard específico para empresas
 */
export const CompanyGuard = ({ 
  children, 
  companies, 
  fallback = ROUTES.DASHBOARD,
  showDenied = true 
}) => {
  return (
    <AuthGuard
      allowedCompanies={Array.isArray(companies) ? companies : [companies]}
      fallbackRoute={fallback}
      showAccessDenied={showDenied}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * Guard para admins apenas
 */
export const AdminGuard = ({ children, fallback = ROUTES.DASHBOARD }) => {
  return (
    <RoleGuard roles={['admin', 'administrador']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Guard para managers e admins
 */
export const ManagerGuard = ({ children, fallback = ROUTES.DASHBOARD }) => {
  return (
    <RoleGuard 
      roles={['admin', 'administrador', 'manager', 'gerente']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Guard combinado - roles E empresas
 */
export const CombinedGuard = ({ 
  children, 
  roles = [], 
  companies = [],
  fallback = ROUTES.DASHBOARD 
}) => {
  return (
    <AuthGuard
      requiredRoles={roles}
      allowedCompanies={companies}
      fallbackRoute={fallback}
    >
      {children}
    </AuthGuard>
  );
};

/**
 * HOC para criar guards facilmente
 */
export const withAuthGuard = (Component, guardOptions = {}) => {
  return function GuardedComponent(props) {
    return (
      <AuthGuard {...guardOptions}>
        <Component {...props} />
      </AuthGuard>
    );
  };
};

/**
 * Hook para verificar acesso programaticamente
 */
export const useAccessCheck = () => {
  const { isAuthenticated, user } = useAuth();
  const { hasRole, checkCompany } = usePermissions();

  const checkAccess = React.useCallback((requirements = {}) => {
    const { roles = [], companies = [], customCheck = null } = requirements;

    // Verifica autenticação
    if (!isAuthenticated || !user) {
      return { allowed: false, reason: 'not_authenticated' };
    }

    // Verifica roles
    if (roles.length > 0 && !hasRole(roles)) {
      return { allowed: false, reason: 'insufficient_role', userRole: user.perfil, requiredRoles: roles };
    }

    // Verifica empresas
    if (companies.length > 0 && !checkCompany(companies)) {
      return { allowed: false, reason: 'company_not_allowed', userCompany: user.cdMultiEmpresa, allowedCompanies: companies };
    }

    // Verifica função customizada
    if (customCheck && typeof customCheck === 'function') {
      const customResult = customCheck(user);
      if (!customResult.allowed) {
        return { allowed: false, reason: 'custom_check_failed', message: customResult.message };
      }
    }

    return { allowed: true, user };
  }, [isAuthenticated, user, hasRole, checkCompany]);

  return checkAccess;
};

export default AuthGuard;