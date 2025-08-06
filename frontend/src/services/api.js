/**
 * Configuração da API (Axios)
 * Caminho: frontend/src/services/api.js
 */

import axios from 'axios';

// ✅ URL base do backend Flask
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ✅ Interceptor de Request - Adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    // Log da requisição (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }

    // Adiciona token se existir
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor de Response - Trata respostas e erros
api.interceptors.response.use(
  (response) => {
    // Log da resposta (apenas em desenvolvimento)
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    // Log do erro
    if (error.response) {
      // Erro HTTP (400, 401, 500, etc.)
      console.error(`❌ ${error.response.status} ${error.response.config.url}:`, {
        message: error.response.data?.message,
        data: error.response.data
      });

      // ✅ Auto logout em caso de token inválido
      if (error.response.status === 401) {
        const currentPath = window.location.pathname;
        
        // Só faz logout automático se não estiver na página de login
        if (currentPath !== '/login') {
          console.log('🔄 Token inválido - redirecionando para login');
          
          // Remove dados de autenticação
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          
          // Redireciona para login
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Erro de rede (sem resposta do servidor)
      console.error('🌐 Erro de rede:', error.message);
    } else {
      // Erro na configuração da requisição
      console.error('⚙️ Erro de configuração:', error.message);
    }

    return Promise.reject(error);
  }
);

// ✅ Função helper para fazer requests com tratamento de erro padronizado
export const apiRequest = async (requestFn) => {
  try {
    const response = await requestFn();
    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
    console.error('API Request Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// ✅ Helpers específicos para diferentes tipos de request
export const apiHelpers = {
  // GET com tratamento de erro
  get: async (url, config = {}) => {
    return apiRequest(() => api.get(url, config));
  },

  // POST com tratamento de erro
  post: async (url, data = {}, config = {}) => {
    return apiRequest(() => api.post(url, data, config));
  },

  // PUT com tratamento de erro
  put: async (url, data = {}, config = {}) => {
    return apiRequest(() => api.put(url, data, config));
  },

  // DELETE com tratamento de erro
  delete: async (url, config = {}) => {
    return apiRequest(() => api.delete(url, config));
  }
};

// ✅ Função para testar conectividade com o backend
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com backend...');
    
    const response = await api.get('/test', { timeout: 5000 });
    
    if (response.data.status === 'ok') {
      console.log('✅ Backend conectado:', response.data.message);
      return { connected: true, data: response.data };
    } else {
      console.warn('⚠️ Backend respondeu mas com status não OK');
      return { connected: false, error: 'Status não OK' };
    }
  } catch (error) {
    console.error('❌ Falha na conexão com backend:', error.message);
    return { 
      connected: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// ✅ Função para verificar health do backend
export const checkHealth = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return { healthy: true, data: response.data };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.response?.data || error.message 
    };
  }
};

export default api;