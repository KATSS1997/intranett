/**
 * Guard específico para Roles/Permissões
 * Caminho: frontend/src/guards/RoleGuard.jsx
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '../hooks/useAuth';
import { useNotifications } from '../contexts/AppContext';
import { ROUTES, USER_ROLES } from '../utils/constants';
import AccessDenied from '../components/common/AccessDenied';

/**
 * RoleGuard - Controla acesso baseado em perfis de usuário
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente a ser protegido
 * @param {string|string[]} props.requiredRoles - Role(s) necessário(s)
 * @param {boolean} props.requireAll - Se deve ter TODOS os roles (AND) ou qualquer um (OR)
 * @param {string} props.fallbackRoute - Rota de redirecionamento
 * @param {boolean} props.showAccessDenied - Mostra página de acesso negado
 * @param {string} props.deniedMessage - Mensagem personalizada
 * @param {Function} props.onAccessDenied - Callback quando acesso é negado
 */
const RoleGuard = ({
  children,
  requiredRoles = [],
  requireAll = false,
  fallbackRoute = ROUTES.DASHBOARD,
  showAccessDenied = true,
  deniedMessage = null,
  onAccessDenied = null,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { hasRole } = usePermissions();
  const { showWarning } = useNotifications();
  const location = useLocation();

  // Normaliza roles para array
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  // Verifica se está autenticado
  if (!isAuthenticated || !user) {
    console.log('🔒 RoleGuard: Usuário não autenticado');
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  // Se não há roles obrigatórios, permite acesso
  if (roles.length === 0) {
    return children;
  }

  // Verifica permissões
  const hasAccess = requireAll 
    ? roles.every(role => hasRole(role))  // Deve ter TODOS os roles
    : roles.some(role => hasRole(role));  // Deve ter PELO MENOS UM role

  if (!hasAccess) {
    const userRole = user.perfil || 'sem perfil';
    const rolesList = roles.join(', ');
    const defaultMessage = requireAll 
      ? `Você precisa ter todos os perfis: ${rolesList}`
      : `Você precisa ter pelo menos um dos perfis: ${rolesList}`;
    
    const message = deniedMessage || defaultMessage;

    console.log(`🚫 RoleGuard: Acesso negado - ${user.cdUsuario} (${userRole}) tentou acessar ${location.pathname}. Roles necessários: ${rolesList}`);

    // Callback personalizado
    if (onAccessDenied) {
      onAccessDenied({
        user,
        requiredRoles: roles,
        userRole,
        location: location.pathname,
      });
    }

    // Mostra notificação
    showWarning(message);

    // Mostra página de acesso negado ou redireciona
    if (showAccessDenied) {
      return (
        <AccessDenied 
          message={message}
          requiredRoles={roles}
          userRole={userRole}
          requireAll={requireAll}
        />
      );
    }

    return <Navigate to={fallbackRoute} replace />;
  }

  // Acesso permitido
  console.log(`✅ RoleGuard: Acesso autorizado - ${user.cdUsuario} (${user.perfil}) -> ${location.pathname}`);
  
  return children;
};

/**
 * Guard específico para Administradores
 */
export const AdminOnlyGuard = ({ children, ...props }) => {
  return (
    <RoleGuard
      requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.ADMINISTRADOR]}
      deniedMessage="Acesso restrito a administradores"
      {...props}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Guard para Managers e Admins
 */
export const ManagerGuard = ({ children, ...props }) => {
  return (
    <RoleGuard
      requiredRoles={[
        USER_ROLES.ADMIN, 
        USER_ROLES.ADMINISTRADOR,
        USER_ROLES.MANAGER,
        USER_ROLES.GERENTE
      ]}
      deniedMessage="Acesso restrito a gerentes e administradores"
      {...props}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Guard para múltiplos roles específicos
 */
export const MultiRoleGuard = ({ roles, requireAll = false, children, ...props }) => {
  return (
    <RoleGuard
      requiredRoles={roles}
      requireAll={requireAll}
      deniedMessage={`Acesso restrito. ${requireAll ? 'Todos os' : 'Pelo menos um dos'} perfis necessários: ${roles.join(', ')}`}
      {...props}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Guard condicional - só aplica proteção se condição for verdadeira
 */
export const ConditionalRoleGuard = ({ condition, children, ...guardProps }) => {
  if (!condition) {
    return children;
  }

  return (
    <RoleGuard {...guardProps}>
      {children}
    </RoleGuard>
  );
};

/**
 * HOC para proteção por role
 */
export const withRoleGuard = (Component, guardOptions = {}) => {
  return function RoleProtectedComponent(props) {
    return (
      <RoleGuard {...guardOptions}>
        <Component {...props} />
      </RoleGuard>
    );
  };
};

/**
 * Hook para verificar roles programaticamente
 */
export const useRoleCheck = () => {
  const { user } = useAuth();
  const { hasRole } = usePermissions();

  const checkRole = React.useCallback((roles, requireAll = false) => {
    if (!user) {
      return {
        hasAccess: false,
        reason: 'not_authenticated',
        userRole: null,
        requiredRoles: roles,
      };
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasAccess = requireAll
      ? roleArray.every(role => hasRole(role))
      : roleArray.some(role => hasRole(role));

    return {
      hasAccess,
      reason: hasAccess ? 'authorized' : 'insufficient_role',
      userRole: user.perfil,
      requiredRoles: roleArray,
      requireAll,
    };
  }, [user, hasRole]);

  const isAdmin = React.useCallback(() => {
    return checkRole([USER_ROLES.ADMIN, USER_ROLES.ADMINISTRADOR]).hasAccess;
  }, [checkRole]);

  const isManager = React.useCallback(() => {
    return checkRole([
      USER_ROLES.ADMIN, 
      USER_ROLES.ADMINISTRADOR,
      USER_ROLES.MANAGER,
      USER_ROLES.GERENTE
    ]).hasAccess;
  }, [checkRole]);

  const canAccess = React.useCallback((requiredRoles, requireAll = false) => {
    return checkRole(requiredRoles, requireAll).hasAccess;
  }, [checkRole]);

  return {
    checkRole,
    isAdmin: isAdmin(),
    isManager: isManager(),
    canAccess,
    userRole: user?.perfil || null,
  };
};

/**
 * Componente para renderização condicional baseada em role
 */
export const RoleBasedRender = ({ 
  roles, 
  requireAll = false, 
  children, 
  fallback = null,
  showFallbackMessage = false 
}) => {
  const { canAccess, userRole } = useRoleCheck();
  const hasAccess = canAccess(roles, requireAll);

  if (hasAccess) {
    return children;
  }

  if (showFallbackMessage) {
    const rolesList = Array.isArray(roles) ? roles.join(', ') : roles;
    const message = `Perfil necessário: ${rolesList}. Seu perfil: ${userRole || 'indefinido'}`;
    
    return (
      <div className="role-access-denied">
        <small className="text-muted">{message}</small>
      </div>
    );
  }

  return fallback;
};

/**
 * Componente para mostrar conteúdo apenas para admins
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleBasedRender 
      roles={[USER_ROLES.ADMIN, USER_ROLES.ADMINISTRADOR]}
      fallback={fallback}
    >
      {children}
    </RoleBasedRender>
  );
};

/**
 * Componente para mostrar conteúdo para managers+
 */
export const ManagerOnly = ({ children, fallback = null }) => {
  return (
    <RoleBasedRender 
      roles={[
        USER_ROLES.ADMIN, 
        USER_ROLES.ADMINISTRADOR,
        USER_ROLES.MANAGER,
        USER_ROLES.GERENTE
      ]}
      fallback={fallback}
    >
      {children}
    </RoleBasedRender>
  );
};

/**
 * Componente para mostrar diferentes conteúdos baseado no role
 */
export const RoleSwitch = ({ cases, defaultCase = null }) => {
  const { userRole } = useRoleCheck();
  
  // Procura case específico para o role do usuário
  const matchingCase = cases.find(caseItem => {
    const roles = Array.isArray(caseItem.roles) ? caseItem.roles : [caseItem.roles];
    return roles.some(role => role.toLowerCase() === (userRole || '').toLowerCase());
  });

  if (matchingCase) {
    return matchingCase.component;
  }

  return defaultCase;
};

export default RoleGuard;