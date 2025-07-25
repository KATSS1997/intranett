/**
 * Context de Autenticação
 * Caminho: frontend/src/contexts/AuthContext.jsx
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { REQUEST_STATUS, ERROR_CODES } from '../utils/constants';
import { storageMonitor } from '../utils/storage';

// Estados possíveis da autenticação
const AUTH_ACTIONS = {
  LOADING: 'LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  VERIFY_ERROR: 'VERIFY_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIAL_STATE: 'SET_INITIAL_STATE',
};

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  status: REQUEST_STATUS.IDLE,
  error: null,
  lastLoginTime: null,
  sessionExpiry: null,
};

// Reducer para gerenciar estados de autenticação
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOADING:
      return {
        ...state,
        isLoading: true,
        status: REQUEST_STATUS.LOADING,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        status: REQUEST_STATUS.SUCCESS,
        error: null,
        lastLoginTime: new Date().toISOString(),
        sessionExpiry: action.payload.sessionExpiry,
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        status: REQUEST_STATUS.ERROR,
        error: action.payload.error,
        lastLoginTime: null,
        sessionExpiry: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
        status: REQUEST_STATUS.IDLE,
      };

    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        status: REQUEST_STATUS.SUCCESS,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        status: REQUEST_STATUS.ERROR,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        status: state.isAuthenticated ? REQUEST_STATUS.SUCCESS : REQUEST_STATUS.IDLE,
      };

    case AUTH_ACTIONS.SET_INITIAL_STATE:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.isAuthenticated,
        isLoading: false,
      };

    default:
      return state;
  }
};

// Criação do contexto
const AuthContext = createContext(undefined);

// Provider do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Inicialização - verifica se já está logado
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.LOADING });

        // Verifica se há dados salvos
        const savedUser = authService.getUser();
        const savedToken = authService.getToken();

        if (savedUser && savedToken) {
          console.log('🔍 Verificando token salvo...');

          // Verifica se token ainda é válido
          const verificationResult = await authService.verifyToken();

          if (verificationResult.valid) {
            // Calcula expiração da sessão (24h por padrão)
            const sessionExpiry = new Date();
            sessionExpiry.setHours(sessionExpiry.getHours() + 24);

            dispatch({
              type: AUTH_ACTIONS.VERIFY_SUCCESS,
              payload: {
                user: verificationResult.user,
                sessionExpiry: sessionExpiry.toISOString(),
              },
            });

            console.log('✅ Usuário autenticado:', verificationResult.user.nomeUsuario);
          } else {
            // Token inválido - limpa dados
            dispatch({
              type: AUTH_ACTIONS.VERIFY_ERROR,
              payload: { error: 'Sessão expirada' },
            });
          }
        } else {
          // Não há dados salvos
          dispatch({
            type: AUTH_ACTIONS.SET_INITIAL_STATE,
            payload: {
              user: null,
              token: null,
              isAuthenticated: false,
            },
          });
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        dispatch({
          type: AUTH_ACTIONS.VERIFY_ERROR,
          payload: { error: 'Erro ao verificar autenticação' },
        });
      }
    };

    initializeAuth();
  }, []);

  // Monitor de mudanças no localStorage (sync entre abas)
  useEffect(() => {
    const handleTokenChange = ({ key, newValue }) => {
      if (key === 'auth_token') {
        if (!newValue) {
          // Token removido em outra aba - faz logout
          console.log('🔄 Token removido em outra aba - fazendo logout');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    };

    storageMonitor.watch('auth_token', handleTokenChange);

    return () => {
      storageMonitor.unwatch('auth_token', handleTokenChange);
    };
  }, []);

  // Função de login
  const login = useCallback(async (cdUsuario, password, cdMultiEmpresa) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING });

      console.log('🔐 Iniciando login...');

      const result = await authService.login(cdUsuario, password, cdMultiEmpresa);

      if (result.success) {
        // Calcula expiração da sessão
        const sessionExpiry = new Date();
        sessionExpiry.setHours(sessionExpiry.getHours() + 24);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.user,
            token: result.token,
            sessionExpiry: sessionExpiry.toISOString(),
          },
        });

        console.log('✅ Login realizado com sucesso');

        return { success: true, user: result.user };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_ERROR,
          payload: { error: result.error },
        });

        return {
          success: false,
          error: result.error,
          code: result.code,
        };
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: { error: 'Erro inesperado no login' },
      });

      return {
        success: false,
        error: 'Erro inesperado no login',
      };
    }
  }, []);

  // Função de logout
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Fazendo logout...');

      await authService.logout();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      console.log('✅ Logout realizado com sucesso');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);

      // Mesmo com erro, faz logout local
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return { success: true };
    }
  }, []);

  // Função para atualizar dados do usuário
  const updateUser = useCallback((userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user: userData },
    });
  }, []);

  // Função para limpar erros
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Função para verificar permissões
  const hasRole = useCallback((roles) => {
    if (!state.user) return false;
    return authService.hasRole(roles);
  }, [state.user]);

  // Função para verificar se é admin
  const isAdmin = useCallback(() => {
    return authService.isAdmin();
  }, []);

  // Função para verificar se é manager
  const isManager = useCallback(() => {
    return authService.isManager();
  }, []);

  // Função para obter tempo restante da sessão
  const getSessionTimeRemaining = useCallback(() => {
    if (!state.sessionExpiry) return null;

    const now = new Date();
    const expiry = new Date(state.sessionExpiry);
    const remaining = expiry.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
  }, [state.sessionExpiry]);

  // Função para verificar se sessão está próxima do vencimento
  const isSessionNearExpiry = useCallback((minutes = 10) => {
    if (!state.sessionExpiry) return false;

    const timeRemaining = getSessionTimeRemaining();
    const warningTime = minutes * 60 * 1000; // Converte para ms

    return timeRemaining > 0 && timeRemaining <= warningTime;
  }, [getSessionTimeRemaining]);

  // Auto logout quando sessão expira
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiry) return;

    const checkSessionExpiry = () => {
      const timeRemaining = getSessionTimeRemaining();

      if (timeRemaining <= 0) {
        console.log('⏰ Sessão expirada - fazendo logout automático');
        logout();
      }
    };

    // Verifica a cada minuto
    const interval = setInterval(checkSessionExpiry, 60000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.sessionExpiry, getSessionTimeRemaining, logout]);

  // Valor do contexto
  const contextValue = {
    // Estado
    ...state,

    // Ações
    login,
    logout,
    updateUser,
    clearError,

    // Helpers
    hasRole,
    isAdmin,
    isManager,
    getSessionTimeRemaining,
    isSessionNearExpiry,

    // Dados computados
    userName: state.user?.nomeUsuario || null,
    userCode: state.user?.cdUsuario || null,
    userCompany: state.user?.cdMultiEmpresa || null,
    userRole: state.user?.perfil || null,
    companyName: state.user?.nomeEmpresa || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

// Hook para verificar se está autenticado (boolean simples)
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

// Hook para obter dados do usuário (null se não autenticado)
export const useUser = () => {
  const { user, isAuthenticated } = useAuth();
  return isAuthenticated ? user : null;
};

// Hook para verificar permissões
export const usePermissions = () => {
  const { hasRole, isAdmin, isManager } = useAuth();

  return {
    hasRole,
    isAdmin: isAdmin(),
    isManager: isManager(),
  };
};

export default AuthContext;