/**
 * Context Global da Aplicação
 * Caminho: frontend/src/contexts/AppContext.jsx
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { checkApiHealth } from '../services/api';
import { settingsStorage } from '../utils/storage';
import { THEMES, CONNECTION_STATUS, NOTIFICATION_TYPES } from '../utils/constants';

// Ações do contexto da aplicação
const APP_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_LOADING: 'SET_LOADING',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  UPDATE_API_STATUS: 'UPDATE_API_STATUS',
  SET_PAGE_TITLE: 'SET_PAGE_TITLE',
  TOGGLE_MOBILE_MENU: 'TOGGLE_MOBILE_MENU',
};

// Estado inicial da aplicação
const initialState = {
  // Tema
  theme: settingsStorage.get('theme', THEMES.LIGHT),
  
  // Layout
  sidebarCollapsed: settingsStorage.get('sidebarCollapsed', false),
  mobileMenuOpen: false,
  
  // Conexão
  connectionStatus: CONNECTION_STATUS.CHECKING,
  apiStatus: {
    online: false,
    lastCheck: null,
    error: null,
  },
  
  // UI Estado
  isLoading: false,
  pageTitle: 'Intranet',
  
  // Notificações
  notifications: [],
  notificationCounter: 0,
};

// Reducer da aplicação
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case APP_ACTIONS.SET_CONNECTION_STATUS:
      return {
        ...state,
        connectionStatus: action.payload,
      };

    case APP_ACTIONS.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        sidebarCollapsed: action.payload,
      };

    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case APP_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
        notificationCounter: state.notificationCounter + 1,
      };

    case APP_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case APP_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case APP_ACTIONS.UPDATE_API_STATUS:
      return {
        ...state,
        apiStatus: {
          ...action.payload,
          lastCheck: new Date().toISOString(),
        },
        connectionStatus: action.payload.online ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE,
      };

    case APP_ACTIONS.SET_PAGE_TITLE:
      return {
        ...state,
        pageTitle: action.payload,
      };

    case APP_ACTIONS.TOGGLE_MOBILE_MENU:
      return {
        ...state,
        mobileMenuOpen: !state.mobileMenuOpen,
      };

    default:
      return state;
  }
};

// Contexto da aplicação
const AppContext = createContext(undefined);

// Provider do contexto da aplicação
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Aplicar tema no documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.body.className = `theme-${state.theme}`;
  }, [state.theme]);

  // Atualizar título da página
  useEffect(() => {
    document.title = state.pageTitle;
  }, [state.pageTitle]);

  // Verificar status da API periodicamente
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const healthStatus = await checkApiHealth();
        
        dispatch({
          type: APP_ACTIONS.UPDATE_API_STATUS,
          payload: {
            online: healthStatus.online,
            status: healthStatus.status,
            database: healthStatus.database,
            error: healthStatus.error,
          },
        });
      } catch (error) {
        dispatch({
          type: APP_ACTIONS.UPDATE_API_STATUS,
          payload: {
            online: false,
            error: error.message,
          },
        });
      }
    };

    // Verifica imediatamente
    checkAPI();

    // Verifica a cada 2 minutos
    const interval = setInterval(checkAPI, 120000);

    return () => clearInterval(interval);
  }, []);

  // Detectar status de conexão com a internet
  useEffect(() => {
    const updateOnlineStatus = () => {
      const status = navigator.onLine ? CONNECTION_STATUS.ONLINE : CONNECTION_STATUS.OFFLINE;
      dispatch({
        type: APP_ACTIONS.SET_CONNECTION_STATUS,
        payload: status,
      });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Status inicial
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Funções do contexto
  const setTheme = useCallback((theme) => {
    dispatch({ type: APP_ACTIONS.SET_THEME, payload: theme });
    settingsStorage.set('theme', theme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = state.theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
  }, [state.theme, setTheme]);

  const setSidebarCollapsed = useCallback((collapsed) => {
    dispatch({ type: APP_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: collapsed });
    settingsStorage.set('sidebarCollapsed', collapsed);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!state.sidebarCollapsed);
  }, [state.sidebarCollapsed, setSidebarCollapsed]);

  const toggleMobileMenu = useCallback(() => {
    dispatch({ type: APP_ACTIONS.TOGGLE_MOBILE_MENU });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setPageTitle = useCallback((title) => {
    const fullTitle = title ? `${title} - Intranet` : 'Intranet';
    dispatch({ type: APP_ACTIONS.SET_PAGE_TITLE, payload: fullTitle });
  }, []);

  const addNotification = useCallback((notification) => {
    const id = `notification_${state.notificationCounter}_${Date.now()}`;
    
    const newNotification = {
      id,
      type: notification.type || NOTIFICATION_TYPES.INFO,
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000,
      persistent: notification.persistent || false,
      timestamp: new Date().toISOString(),
      ...notification,
    };

    dispatch({
      type: APP_ACTIONS.ADD_NOTIFICATION,
      payload: newNotification,
    });

    // Auto-remove notificação se não for persistente
    if (!newNotification.persistent && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [state.notificationCounter]);

  const removeNotification = useCallback((id) => {
    dispatch({
      type: APP_ACTIONS.REMOVE_NOTIFICATION,
      payload: id,
    });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_NOTIFICATIONS });
  }, []);

  // Helpers para diferentes tipos de notificação
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title: options.title || 'Sucesso',
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: options.title || 'Erro',
      message,
      duration: options.duration || 8000, // Erros ficam mais tempo
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title: options.title || 'Atenção',
      message,
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title: options.title || 'Informação',
      message,
      ...options,
    });
  }, [addNotification]);

  // Função para detectar dispositivo móvel
  const isMobile = useCallback(() => {
    return window.innerWidth <= 768;
  }, []);

  // Função para detectar se está em modo escuro
  const isDarkMode = useCallback(() => {
    return state.theme === THEMES.DARK;
  }, [state.theme]);

  // Função para obter configurações do usuário
  const getUserSettings = useCallback(() => {
    return {
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      // Adicione outras configurações conforme necessário
    };
  }, [state.theme, state.sidebarCollapsed]);

  // Função para resetar configurações
  const resetSettings = useCallback(() => {
    setTheme(THEMES.LIGHT);
    setSidebarCollapsed(false);
    clearNotifications();
    settingsStorage.clear();
  }, [setTheme, setSidebarCollapsed, clearNotifications]);

  // Valor do contexto
  const contextValue = {
    // Estado
    ...state,

    // Ações básicas
    setTheme,
    toggleTheme,
    setSidebarCollapsed,
    toggleSidebar,
    toggleMobileMenu,
    setLoading,
    setPageTitle,

    // Notificações
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Configurações
    getUserSettings,
    resetSettings,

    // Helpers
    isMobile: isMobile(),
    isDarkMode: isDarkMode(),
    isOnline: state.connectionStatus === CONNECTION_STATUS.ONLINE,
    isApiOnline: state.apiStatus.online,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook para usar o contexto da aplicação
export const useApp = () => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }

  return context;
};

// Hook específico para notificações
export const useNotifications = () => {
  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useApp();

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hasNotifications: notifications.length > 0,
    notificationCount: notifications.length,
  };
};

// Hook específico para tema
export const useTheme = () => {
  const { theme, setTheme, toggleTheme, isDarkMode } = useApp();

  return {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode,
    isLightMode: !isDarkMode,
  };
};

// Hook específico para layout
export const useLayout = () => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    isMobile,
  } = useApp();

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    isMobile,
  };
};

// Hook específico para conexão
export const useConnection = () => {
  const { connectionStatus, apiStatus, isOnline, isApiOnline } = useApp();

  return {
    connectionStatus,
    apiStatus,
    isOnline,
    isApiOnline,
    isOffline: !isOnline,
    isApiOffline: !isApiOnline,
    lastApiCheck: apiStatus.lastCheck,
  };
};

export default AppContext;