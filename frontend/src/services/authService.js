/**
 * Serviço de Autenticação Frontend - VERSÃO CORRIGIDA
 * Caminho: frontend/src/services/authService.js
 */

import api from './api';

// Constantes
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data'
};

class AuthService {
  
  /**
   * Realiza login no backend
   * @param {string} cdUsuario - Código do usuário
   * @param {string} password - Senha
   * @param {number} cdMultiEmpresa - Código da empresa
   * @returns {Promise<Object>} Resultado do login
   */
  async login(cdUsuario, password, cdMultiEmpresa) {
    try {
      console.log('🔐 AuthService: Iniciando login...', { cdUsuario, cdMultiEmpresa });

      // ✅ CORREÇÃO: Campos com nomes corretos (camelCase)
      const response = await api.post('/auth/login', {
        cdUsuario: cdUsuario,           // ✅ CORRETO - sem underscore
        password: password,             // ✅ CORRETO
        cdMultiEmpresa: cdMultiEmpresa  // ✅ CORRETO - sem underscore
      });

      console.log('📨 Resposta do backend:', response.data);

      if (response.data.success) {
        const { user, token } = response.data.data;

        // ✅ Salva no localStorage
        this.setToken(token);
        this.setUser(user);

        console.log('✅ Login bem-sucedido:', user.nome_usuario || user.cd_usuario);

        return {
          success: true,
          user: user,
          token: token
        };
      } else {
        console.warn('❌ Login falhou:', response.data.message);
        return {
          success: false,
          error: response.data.message || 'Credenciais inválidas'
        };
      }

    } catch (error) {
      console.error('❌ Erro no login:', error);

      let errorMessage = 'Erro de conexão com o servidor';

      // Tratamento específico de erros
      if (error.response) {
        // Erro HTTP (400, 401, 500, etc.)
        const status = error.response.status;
        const data = error.response.data;

        console.log('🔍 Status do erro:', status, 'Data:', data);

        switch (status) {
          case 400:
            errorMessage = data.message || 'Dados inválidos';
            break;
          case 401:
            errorMessage = data.message || 'Usuário, senha ou empresa incorretos';
            break;
          case 403:
            errorMessage = 'Acesso negado';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          default:
            errorMessage = data.message || `Erro ${status}`;
        }
      } else if (error.request) {
        // Erro de rede
        errorMessage = 'Erro de conexão. Verifique se o servidor está online.';
        console.log('🌐 Erro de rede:', error.request);
      } else {
        // Erro na configuração da requisição
        errorMessage = error.message || 'Erro na configuração da requisição';
        console.log('⚙️ Erro de configuração:', error.message);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Realiza logout
   * @returns {Promise<Object>} Resultado do logout
   */
  async logout() {
    try {
      console.log('🚪 AuthService: Fazendo logout...');

      // ✅ Chama o endpoint de logout (opcional)
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('⚠️ Erro ao notificar logout no backend:', error.message);
        // Continua o logout local mesmo com erro no backend
      }

      // ✅ Remove dados locais
      this.clearAuth();

      console.log('✅ Logout realizado com sucesso');

      return { success: true };

    } catch (error) {
      console.error('❌ Erro no logout:', error);

      // Force logout local mesmo com erro
      this.clearAuth();

      return {
        success: false,
        error: 'Erro durante logout, mas dados locais foram removidos'
      };
    }
  }

  /**
   * Verifica se o token ainda é válido
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyToken() {
    try {
      const token = this.getToken();

      if (!token) {
        return { valid: false, error: 'Token não encontrado' };
      }

      console.log('🔍 Verificando token...');

      // ✅ Chama o endpoint de verificação
      const response = await api.post('/auth/verify');

      if (response.data.success) {
        const { user } = response.data.data;

        // Atualiza dados do usuário
        this.setUser(user);

        console.log('✅ Token válido:', user.nome_usuario || user.cd_usuario);

        return {
          valid: true,
          user: user
        };
      } else {
        console.warn('❌ Token inválido:', response.data.message);
        this.clearAuth();

        return {
          valid: false,
          error: response.data.message || 'Token inválido'
        };
      }

    } catch (error) {
      console.error('❌ Erro na verificação do token:', error);
      this.clearAuth();

      return {
        valid: false,
        error: 'Erro ao verificar token'
      };
    }
  }

  /**
   * Salva o token no localStorage
   * @param {string} token - Token JWT
   */
  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    
    // ✅ Configura token no header da API
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Obtém o token do localStorage
   * @returns {string|null} Token ou null
   */
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Salva dados do usuário no localStorage
   * @param {Object} user - Dados do usuário
   */
  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Obtém dados do usuário do localStorage
   * @returns {Object|null} Usuário ou null
   */
  getUser() {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  }

  /**
   * Remove todos os dados de autenticação
   */
  clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    
    // ✅ Remove token do header da API
    delete api.defaults.headers.common['Authorization'];
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} True se autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    
    return !!(token && user);
  }

  /**
   * Inicializa o serviço (configura token se existir)
   */
  initialize() {
    const token = this.getToken();
    
    if (token) {
      // ✅ Configura token no header da API
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔧 Token configurado no header da API');
    }
  }

  /**
   * Atualiza dados do perfil do usuário
   * @param {Object} profileData - Novos dados do perfil
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateProfile(profileData) {
    try {
      console.log('📝 Atualizando perfil...');

      const response = await api.put('/users/profile', profileData);

      if (response.data.success) {
        const { user } = response.data.data;
        
        // Atualiza dados locais
        this.setUser(user);

        console.log('✅ Perfil atualizado com sucesso');

        return {
          success: true,
          user: user
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Erro ao atualizar perfil'
        };
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);

      return {
        success: false,
        error: error.response?.data?.message || 'Erro ao atualizar perfil'
      };
    }
  }
}

// ✅ Cria instância única e inicializa
const authService = new AuthService();
authService.initialize();

export default authService;