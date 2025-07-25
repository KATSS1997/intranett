/**
 * Componente para Rotas Públicas (apenas para usuários não autenticados)
 * Caminho: frontend/src/router/PublicRoute.jsx
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthLoading } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import LoadingScreen from '../components/common/LoadingScreen';

/**
 * PublicRoute - Protege rotas que só devem ser acessadas por usuários não autenticados
 * Exemplo: página de login (usuário logado não deve ver login)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado
 * @param {string} props.redirectTo - Rota para redirecionamento se autenticado
 * @param {boolean} props.allowAuthenticated - Permite acesso mesmo se autenticado
 */
const PublicRoute = ({ 
  children, 
  redirectTo = ROUTES.DASHBOARD,
  allowAuthenticated = false 
}) => {
  const { isAuthenticated, user } = useAuth();
  const { isLoading, isAuthenticating } = useAuthLoading();
  const location = useLocation();

  // Loading durante verificação de autenticação
  if (isLoading || isAuthenticating) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  // Se permite usuários autenticados, sempre renderiza
  if (allowAuthenticated) {
    return children;
  }

  // Se está autenticado, redireciona
  if (isAuthenticated && user) {
    console.log(`🔄 Usuário autenticado redirecionado: ${location.pathname} -> ${redirectTo}`);
    
    // Verifica se há URL de destino salva (após login)
    const savedDestination = location.state?.from;
    const destination = savedDestination || redirectTo;
    
    return <Navigate to={destination} replace />;
  }

  // Usuário não autenticado - pode acessar rota pública
  console.log(`✅ Acesso público permitido: ${location.pathname}`);
  
  return children;
};

/**
 * HOC para criar rotas públicas facilmente
 * 
 * @param {React.Component} Component - Componente público
 * @param {Object} options - Opções da rota pública
 * @returns {React.Component} Componente com proteção pública
 */
export const withPublicRoute = (Component, options = {}) => {
  return function PublicComponent(props) {
    return (
      <PublicRoute {...options}>
        <Component {...props} />
      </PublicRoute>
    );
  };
};

/**
 * Hook para verificar se rota atual é pública
 * 
 * @returns {Object} Estado da rota pública
 */
export const usePublicRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isPublicRoute = React.useMemo(() => {
    const publicRoutes = [ROUTES.LOGIN, ROUTES.NOT_FOUND];
    return publicRoutes.includes(location.pathname);
  }, [location.pathname]);

  return {
    isPublicRoute,
    shouldRedirect: isAuthenticated && user,
    currentPath: location.pathname,
    user,
  };
};

/**
 * Componente específico para página de login
 * Redireciona usuários autenticados automaticamente
 */
export const LoginRoute = ({ children }) => {
  return (
    <PublicRoute redirectTo={ROUTES.DASHBOARD}>
      {children}
    </PublicRoute>
  );
};

/**
 * Componente para rotas de recuperação de senha, registro, etc.
 * Permite acesso tanto para autenticados quanto não autenticados
 */
export const SemiPublicRoute = ({ children }) => {
  return (
    <PublicRoute allowAuthenticated={true}>
      {children}
    </PublicRoute>
  );
};

export default PublicRoute;