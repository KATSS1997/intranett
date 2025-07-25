/**
 * Custom Hook para Autenticação
 * Caminho: frontend/src/hooks/useAuth.js
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../contexts/AuthContext';
import { REQUEST_STATUS } from '../utils/constants';

/**
 * Hook principal de autenticação
 * Exposição completa do contexto de auth
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

/**
 * Hook simplificado para verificar autenticação
 * @returns {boolean} True se autenticado
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

/**
 * Hook para obter dados do usuário
 * @returns {Object|null} Dados do usuário ou null
 */
export const useUser = () => {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
};

/**
 * Hook para gerenciar login com estado local
 * @returns {Object} Estado e função de login
 */
export const useLogin = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [loginState, setLoginState] = useState({
    isSubmitting: false,
    error: null,
    success: false,
  });

  const handleLogin = useCallback(async (cdUsuario, password, cdMultiEmpresa) => {
    setLoginState({
      isSubmitting: true,
      error: null,
      success: false,
    });

    try {
      const result = await login(cdUsuario, password, cdMultiEmpresa);

      if (result.success) {
        setLoginState({
          isSubmitting: false,
          error: null,
          success: true,
        });
        return result;
      } else {
        setLoginState({
          isSubmitting: false,
          error: result.error,
          success: false,
        });
        return result;
      }
    } catch (error) {
      setLoginState({
        isSubmitting: false,
        error: 'Erro inesperado no login',
        success: false,
      });
      return { success: false, error: 'Erro inesperado no login' };
    }
  }, [login]);

  const clearLoginError = useCallback(() => {
    setLoginState(prev => ({ ...prev, error: null }));
    clearError();
  }, [clearError]);

  return {
    login: handleLogin,
    isSubmitting: loginState.isSubmitting || isLoading,
    error: loginState.error || error,
    success: loginState.success,
    clearError: clearLoginError,
  };
};

/**
 * Hook para verificar permissões
 * @returns {Object} Funções de verificação de permissão
 */
export const usePermissions = () => {
  const { hasRole, isAdmin, isManager, user } = useAuth();

  const checkRole = useCallback((roles) => {
    return hasRole(roles);
  }, [hasRole]);

  const checkAdmin = useCallback(() => {
    return isAdmin();
  }, [isAdmin]);

  const checkManager = useCallback(() => {
    return isManager();
  }, [isManager]);

  const checkCompany = useCallback((companyCodes) => {
    if (!user) return false;
    const userCompany = user.cdMultiEmpresa;
    const codes = Array.isArray(companyCodes) ? companyCodes : [companyCodes];
    return codes.includes(userCompany);
  }, [user]);

  return {
    hasRole: checkRole,
    isAdmin: checkAdmin(),
    isManager: checkManager(),
    checkCompany,
    userRole: user?.perfil || null,
    userCompany: user?.cdMultiEmpresa || null,
  };
};

/**
 * Hook para monitorar sessão
 * @returns {Object} Informações da sessão
 */
export const useSession = () => {
  const {
    isAuthenticated,
    sessionExpiry,
    getSessionTimeRemaining,
    isSessionNearExpiry,
    logout,
  } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isNearExpiry, setIsNearExpiry] = useState(false);

  // Atualiza tempo restante a cada segundo
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) {
      setTimeRemaining(null);
      setIsNearExpiry(false);
      return;
    }

    const updateTime = () => {
      const remaining = getSessionTimeRemaining();
      const nearExpiry = isSessionNearExpiry(10); // 10 minutos

      setTimeRemaining(remaining);
      setIsNearExpiry(nearExpiry);

      // Auto logout se expirou
      if (remaining <= 0) {
        logout();
      }
    };

    // Atualiza imediatamente
    updateTime();

    // Atualiza a cada segundo
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionExpiry, getSessionTimeRemaining, isSessionNearExpiry, logout]);

  // Formatar tempo restante
  const formatTimeRemaining = useCallback(() => {
    if (!timeRemaining || timeRemaining <= 0) return null;

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [timeRemaining]);

  return {
    isAuthenticated,
    timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(),
    isNearExpiry,
    sessionExpiry,
    extendSession: () => {
      // Implementar extensão de sessão se necessário
      console.log('🔄 Extensão de sessão não implementada');
    },
  };
};

/**
 * Hook para auto-logout em inatividade
 * @param {number} timeoutMinutes - Tempo em minutos para auto-logout
 */
export const useAutoLogout = (timeoutMinutes = 30) => {
  const { isAuthenticated, logout } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Reseta timer de atividade
  const resetActivityTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Eventos de atividade do usuário
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const resetTimer = () => resetActivityTimer();

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, resetActivityTimer]);

  // Verifica inatividade
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const now = Date.now();
      const timeoutMs = timeoutMinutes * 60 * 1000;

      if (now - lastActivity > timeoutMs) {
        console.log('⏰ Auto-logout por inatividade');
        logout();
      }
    };

    // Verifica a cada minuto
    const interval = setInterval(checkInactivity, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, timeoutMinutes, logout]);

  return {
    lastActivity: new Date(lastActivity),
    resetActivityTimer,
  };
};

/**
 * Hook para status de loading da auth
 * @returns {Object} Estados de loading
 */
export const useAuthLoading = () => {
  const { isLoading, status } = useAuth();

  return {
    isLoading,
    isInitializing: isLoading && status === REQUEST_STATUS.IDLE,
    isAuthenticating: isLoading && status === REQUEST_STATUS.LOADING,
    isReady: !isLoading,
  };
};

/**
 * Hook para erros de autenticação
 * @returns {Object} Estado de erro e funções
 */
export const useAuthError = () => {
  const { error, clearError } = useAuth();

  const hasError = !!error;

  const getErrorMessage = useCallback(() => {
    if (!error) return null;

    // Mapear códigos de erro para mensagens amigáveis
    const errorMessages = {
      INVALID_CREDENTIALS: 'Usuário, senha ou empresa incorretos',
      MISSING_TOKEN: 'Sessão expirada, faça login novamente',
      SERVER_ERROR: 'Erro no servidor, tente novamente',
      NETWORK_ERROR: 'Erro de conexão, verifique sua internet',
    };

    return errorMessages[error.code] || error.message || error;
  }, [error]);

  return {
    error,
    hasError,
    errorMessage: getErrorMessage(),
    clearError,
  };
};

// Export default do hook principal
export default useAuth;