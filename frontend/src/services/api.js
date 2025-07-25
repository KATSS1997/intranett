/**
 * Configuração da API com Axios
 * Caminho: frontend/src/services/api.js
 */

import axios from 'axios';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

// Base URL da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST - Adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    // Pega token do localStorage
    const token = storage.get(STORAGE_KEYS.TOKEN);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da requisição (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE - Trata erros globalmente
api.interceptors.response.use(
  (response) => {
    // Log da resposta (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    const { response, request, message } = error;
    
    // Log do erro
    console.error('❌ API Error:', {
      status: response?.status,
      statusText: response?.statusText,
      data: response?.data,
      url: request?.responseURL || 'Unknown URL',
    });
    
    // Tratamento específico por código de erro
    if (response) {
      switch (response.status) {
        case 401:
          // Token inválido ou expirado - redireciona para login
          handleUnauthorized();
          break;
          
        case 403:
          // Sem permissão
          console.warn('🚫 Acesso negado:', response.data?.message);
          break;
          
        case 404:
          console.warn('🔍 Endpoint não encontrado:', request?.responseURL);
          break;
          
        case 500:
          console.error('💥 Erro interno do servidor');
          break;
          
        default:
          console.error(`⚠️ Erro HTTP ${response.status}:`, response.data?.message);
      }
    } else if (request) {
      // Erro de rede/conexão
      console.error('🌐 Erro de conexão - Servidor não responde');
    } else {
      // Erro na configuração da requisição
      console.error('⚙️ Erro de configuração:', message);
    }
    
    return Promise.reject(error);
  }
);

// Função para lidar com token expirado/inválido
const handleUnauthorized = () => {
  // Remove dados do usuário do localStorage
  storage.remove(STORAGE_KEYS.TOKEN);
  storage.remove(STORAGE_KEYS.USER);
  
  // Redireciona para login (se não estiver já na página de login)
  if (window.location.pathname !== '/login') {
    console.log('🔒 Token inválido - Redirecionando para login');
    window.location.href = '/login';
  }
};

// Métodos auxiliares para requisições
export const apiMethods = {
  // GET
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },
  
  // POST
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },
  
  // PUT
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },
  
  // DELETE
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },
  
  // PATCH
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw formatError(error);
    }
  },
};

// Formatar erro para o frontend
const formatError = (error) => {
  if (error.response) {
    // Erro com resposta do servidor
    const { data, status, statusText } = error.response;
    
    return {
      message: data?.message || statusText || 'Erro no servidor',
      code: data?.error_code || `HTTP_${status}`,
      status,
      details: data,
    };
  } else if (error.request) {
    // Erro de rede
    return {
      message: 'Erro de conexão com o servidor',
      code: 'NETWORK_ERROR',
      status: 0,
      details: null,
    };
  } else {
    // Erro de configuração
    return {
      message: error.message || 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
      status: 0,
      details: null,
    };
  }
};

// Função para verificar se API está online
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/auth/health');
    return {
      online: true,
      status: response.data.status,
      database: response.data.database,
    };
  } catch (error) {
    return {
      online: false,
      error: formatError(error),
    };
  }
};

// Função para configurar token manualmente (se necessário)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    storage.set(STORAGE_KEYS.TOKEN, token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    storage.remove(STORAGE_KEYS.TOKEN);
  }
};

// Função para limpar autenticação
export const clearAuth = () => {
  delete api.defaults.headers.common['Authorization'];
  storage.remove(STORAGE_KEYS.TOKEN);
  storage.remove(STORAGE_KEYS.USER);
};

// Export da instância configurada
export default api;
export { api, apiMethods };