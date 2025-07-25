/**
 * Constantes da aplicação
 * Caminho: frontend/src/utils/constants.js
 */

// Endpoints da API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY: '/auth/verify',
    REFRESH: '/auth/refresh', // Para implementação futura
  },
  USERS: {
    PROFILE: '/users/profile',
    LIST: '/users/admin/users',
    UPDATE: '/users/profile',
    DELETE: '/users',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    DATA: '/dashboard/data',
  },
  COMPANY: {
    INFO: '/users/company-data',
    SETTINGS: '/users/admin/company',
  },
};

// Chaves do localStorage
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  SETTINGS: 'app_settings',
  THEME: 'app_theme',
};

// Status de requisições
export const REQUEST_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Perfis de usuário
export const USER_ROLES = {
  ADMIN: 'admin',
  ADMINISTRADOR: 'administrador',
  MANAGER: 'manager',
  GERENTE: 'gerente',
  USER: 'user',
  USUARIO: 'usuario',
};

// Códigos de erro da API
export const ERROR_CODES = {
  // Autenticação
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Autorização
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
  EMPRESA_NOT_ALLOWED: 'EMPRESA_NOT_ALLOWED',
  
  // Validação
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_DATA: 'MISSING_DATA',
  
  // Servidor
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

// Mensagens de erro amigáveis
export const ERROR_MESSAGES = {
  [ERROR_CODES.MISSING_TOKEN]: 'Você precisa estar logado para acessar esta área',
  [ERROR_CODES.INVALID_TOKEN]: 'Sua sessão expirou. Faça login novamente',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Sua sessão expirou. Faça login novamente',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Usuário, senha ou empresa incorretos',
  [ERROR_CODES.INSUFFICIENT_ROLE]: 'Você não tem permissão para acessar esta área',
  [ERROR_CODES.EMPRESA_NOT_ALLOWED]: 'Sua empresa não tem acesso a esta funcionalidade',
  [ERROR_CODES.VALIDATION_ERROR]: 'Dados inválidos. Verifique os campos',
  [ERROR_CODES.MISSING_DATA]: 'Preencha todos os campos obrigatórios',
  [ERROR_CODES.SERVER_ERROR]: 'Erro interno do servidor. Tente novamente',
  [ERROR_CODES.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet',
  [ERROR_CODES.DATABASE_ERROR]: 'Erro no banco de dados. Contate o suporte',
};

// Rotas da aplicação
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  USERS: '/users',
  ADMIN: '/admin',
  NOT_FOUND: '/404',
};

// Temas disponíveis
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_VISIBLE_PAGES: 5,
};

// Configurações de timeout
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 segundos
  AUTO_LOGOUT: 3600000, // 1 hora em ms
  TOKEN_REFRESH: 300000, // 5 minutos em ms
};

// Regex patterns para validação
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}-?[0-9]{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  USER_CODE: /^[a-zA-Z0-9._-]+$/,
};

// Configurações de log
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// Status de conexão
export const CONNECTION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CHECKING: 'checking',
};

// Configurações da aplicação
export const APP_CONFIG = {
  NAME: 'Intranet Fullstack',
  VERSION: '1.0.0',
  DESCRIPTION: 'Sistema interno da empresa',
  AUTHOR: 'Equipe de Desenvolvimento',
};

// Configurações de notificação
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Duração das notificações (em ms)
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0, // Não remove automaticamente
};

export default {
  API_ENDPOINTS,
  STORAGE_KEYS,
  REQUEST_STATUS,
  USER_ROLES,
  ERROR_CODES,
  ERROR_MESSAGES,
  ROUTES,
  THEMES,
  PAGINATION,
  TIMEOUTS,
  VALIDATION_PATTERNS,
  LOG_LEVELS,
  CONNECTION_STATUS,
  APP_CONFIG,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION,
};