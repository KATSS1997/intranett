/**
 * Componente para Rotas Privadas (requer autenticação)
 * Caminho: frontend/src/router/PrivateRoute.jsx
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthLoading } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import LoadingScreen from '../components/common/LoadingScreen';

/**
 * PrivateRoute - Protege rotas que precisam de autenticação
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente filho a ser renderizado
 * @param {string} props.fallback - Rota para redirecionamento (padrão: login)
 * @param {boolean} props.requireVerification - Se deve verificar token no servidor
 */
const PrivateRoute = ({ 
  children, 
  fallback = ROUTES.LOGIN,
  requireVerification = false 
}) => {
  const { isAuthenticated, user, verifyToken } = useAuth();
  const { isLoading, isAuthenticating } = useAuthLoading();
  const location = useLocation();

  // Loading durante autenticação
  if (isLoading || isAuthenticating) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  // Não autenticado - redireciona para login
  if (!isAuthenticated || !user) {
    console.log('🔒 Acesso negado - Usuário não autenticado');
    
    // Salva a URL atual para redirecionamento após login
    const redirectTo = location.pathname + location.search;
    
    return (
      <Navigate 
        to={fallback} 
        state={{ from: redirectTo }} 
        replace 
      />
    );
  }

  // Verificação adicional do token no servidor (opcional)
  if (requireVerification) {
    return (
      <TokenVerificationWrapper>
        {children}
      </TokenVerificationWrapper>
    );
  }

  // Usuário autenticado - renderiza componente
  console.log(`✅ Acesso autorizado: ${user.nomeUsuario} -> ${location.pathname}`);
  
  return children;
};

/**
 * Wrapper para verificação de token no servidor
 */
const TokenVerificationWrapper = ({ children }) => {
  const { verifyToken } = useAuth();
  const [isVerifying, setIsVerifying] = React.useState(true);
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await verifyToken();
        setIsValid(result.valid);
      } catch (error) {
        console.error('❌ Erro na verificação do token:', error);
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [verifyToken]);

  if (isVerifying) {
    return <LoadingScreen message="Verificando sessão..." />;
  }

  if (!isValid) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
};

/**
 * HOC para criar rotas privadas facilmente
 * 
 * @param {React.Component} Component - Componente a ser protegido
 * @param {Object} options - Opções de proteção
 * @returns {React.Component} Componente protegido
 */
export const withPrivateRoute = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <PrivateRoute {...options}>
        <Component {...props} />
      </PrivateRoute>
    );
  };
};

/**
 * Hook para verificar se rota atual é privada
 * 
 * @returns {Object} Estado da rota privada
 */
export const usePrivateRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isPrivateRoute = React.useMemo(() => {
    const publicRoutes = [ROUTES.LOGIN, ROUTES.NOT_FOUND];
    return !publicRoutes.includes(location.pathname);
  }, [location.pathname]);

  return {
    isPrivateRoute,
    canAccess: isAuthenticated && user,
    currentPath: location.pathname,
    user,
  };
};

/**
 * Componente para mostrar fallback quando acesso é negado
 */
export const AccessDenied = ({ 
  message = "Você não tem permissão para acessar esta página",
  showLogin = true,
  children 
}) => {
  const navigate = useNavigate();

  return (
    <div className="access-denied">
      <div className="access-denied__content">
        <h2>🚫 Acesso Negado</h2>
        <p>{message}</p>
        
        {children}
        
        {showLogin && (
          <div className="access-denied__actions">
            <button 
              onClick={() => navigate(ROUTES.LOGIN)}
              className="btn btn-primary"
            >
              Fazer Login
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRoute;