/**
 * Context de Autenticação - VERSÃO COM BACKEND REAL
 * Caminho: frontend/src/contexts/AuthContext.jsx
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/authService';

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
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
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
        error: action.payload.error,
        lastLoginTime: null,
        sessionExpiry: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
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

  // ✅ Inicialização - verifica se já está logado usando o backend real
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.LOADING });

        // Verifica se há dados salvos no localStorage
        const savedToken = authService.getToken();
        const savedUser = authService.getUser();

        if (savedToken && savedUser) {
          console.log('🔍 Dados salvos encontrados, verificando no backend...');

          // ✅ Verifica token no backend real
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

            console.log('✅ Usuário autenticado:', verificationResult.user.nome_usuario || verificationResult.user.cd_usuario);
          } else {
            console.warn('⚠️ Token inválido, fazendo logout...');
            authService.clearAuth();
            
            dispatch({
              type: AUTH_ACTIONS.VERIFY_ERROR,
              payload: { error: verificationResult.error || 'Sessão inválida' },
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
          
          console.log('ℹ️ Nenhum usuário autenticado');
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        authService.clearAuth();
        
        dispatch({
          type: AUTH_ACTIONS.VERIFY_ERROR,
          payload: { error: 'Erro ao verificar autenticação' },
        });
      }
    };

    initializeAuth();
  }, []);

  // ✅ Função de login usando backend real
  const login = useCallback(async (loginData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOADING });

      console.log('🔐 Iniciando login...');

      let cdUsuario, password, cdMultiEmpresa;

      // Aceita tanto objeto quanto parâmetros separados
      if (typeof loginData === 'object') {
        cdUsuario = loginData.cdUsuario;
        password = loginData.password;
        cdMultiEmpresa = loginData.cdMultiEmpresa;
      } else {
        cdUsuario = arguments[0];
        password = arguments[1];
        cdMultiEmpresa = arguments[2];
      }

      // Validação básica
      if (!cdUsuario?.trim()) {
        throw new Error('Código do usuário é obrigatório');
      }
      if (!password?.trim()) {
        throw new Error('Senha é obrigatória');
      }
      if (!cdMultiEmpresa) {
        throw new Error('Código da empresa é obrigatório');
      }

      console.log('🔐 Dados do login:', { cdUsuario, cdMultiEmpresa });

      // ✅ Chama o backend real via authService
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
        const errorMessage = result.error || 'Credenciais inválidas';
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_ERROR,
          payload: { error: errorMessage },
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);

      const errorMessage = error.message || 'Erro inesperado durante o login';

      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  // ✅ Função de logout usando backend real
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Fazendo logout...');

      // ✅ Chama o backend real via authService
      await authService.logout();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      console.log('✅ Logout realizado com sucesso');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);

      // Mesmo com erro, força o logout local
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return { success: false, error: 'Erro durante logout' };
    }
  }, []);

  // Função para atualizar dados do usuário
  const updateUser = useCallback((userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: { user: userData },
    });

    // Atualiza também via authService
    const currentUser = authService.getUser();
    const updatedUser = { ...currentUser, ...userData };
    authService.setUser(updatedUser);
  }, []);

  // Função para limpar erros
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Helpers de verificação de perfil
  const hasRole = useCallback((role) => {
    if (!state.user) return false;
    return state.user.perfil === role;
  }, [state.user]);

  const isAdmin = useCallback(() => {
    return hasRole('admin') || hasRole('administrador');
  }, [hasRole]);

  const isManager = useCallback(() => {
    return hasRole('gerente') || hasRole('manager');
  }, [hasRole]);

  // Função para calcular tempo restante da sessão
  const getSessionTimeRemaining = useCallback(() => {
    if (!state.sessionExpiry) return 0;

    const expiry = new Date(state.sessionExpiry);
    const now = new Date();
    const remaining = expiry.getTime() - now.getTime();

    return remaining > 0 ? remaining : 0;
  }, [state.sessionExpiry]);

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

  // Monitor de mudanças no localStorage (sync entre abas)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'auth_token' && !event.newValue) {
        // Token removido em outra aba - faz logout
        console.log('🔄 Token removido em outra aba - fazendo logout');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Valor do contexto
  const contextValue = {
    // Estado
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    lastLoginTime: state.lastLoginTime,
    sessionExpiry: state.sessionExpiry,

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

    // Dados computados para compatibilidade
    userName: state.user?.nome_usuario || state.user?.cd_usuario || null,
    userCode: state.user?.cd_usuario || null,
    userCompany: state.user?.cd_multi_empresa || null,
    userRole: state.user?.perfil || null,
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

export default AuthContext;