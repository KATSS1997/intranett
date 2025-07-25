/**
 * Serviço de Autenticação - Frontend
 * Caminho: frontend/src/services/authService.js
 */

import { apiMethods, setAuthToken, clearAuth } from './api';
import { storage } from '../utils/storage';
import { STORAGE_KEYS, API_ENDPOINTS } from '../utils/constants';

class AuthService {
  /**
   * Faz login do usuário
   * @param {string} cdUsuario - Código do usuário
   * @param {string} password - Senha do usuário
   * @param {number} cdMultiEmpresa - Código da empresa
   * @returns {Promise<Object>} Dados do usuário e token
   */
  async login(cdUsuario, password, cdMultiEmpresa) {
    try {
      console.log('🔐 Tentando fazer login:', { cdUsuario, cdMultiEmpresa });
      
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.LOGIN, {
        cdUsuario,
        password,
        cdMultiEmpresa,
      });
      
      if (response.success) {
        const { token, user } = response.data;
        
        // Armazena token e dados do usuário
        storage.set(STORAGE_KEYS.TOKEN, token);
        storage.set(STORAGE_KEYS.USER, user);
        
        // Configura header Authorization para próximas requisições
        setAuthToken(token);
        
        console.log('✅ Login realizado com sucesso:', user);
        
        return {
          success: true,
          user,
          token,
          message: response.message,
        };
      } else {
        throw new Error(response.message || 'Erro no login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao fazer login',
        code: error.code || 'LOGIN_ERROR',
      };
    }
  }
  
  /**
   * Faz logout do usuário
   * @returns {Promise<Object>} Resultado do logout
   */
  async logout() {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Chama endpoint de logout (opcional, para logs)
      try {
        await apiMethods.post(API_ENDPOINTS.AUTH.LOGOUT);
      } catch (error) {
        // Ignora erro do logout no servidor
        console.warn('⚠️ Erro no logout do servidor (ignorado):', error.message);
      }
      
      // Remove dados locais
      this.clearUserData();
      
      console.log('✅ Logout realizado');
      
      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      
      // Mesmo com erro, limpa dados locais
      this.clearUserData();
      
      return {
        success: true, // Sempre retorna sucesso no logout
        message: 'Logout realizado',
      };
    }
  }
  
  /**
   * Verifica se token é válido
   * @returns {Promise<Object>} Status da verificação
   */
  async verifyToken() {
    try {
      const token = this.getToken();
      
      if (!token) {
        return {
          valid: false,
          error: 'Token não encontrado',
        };
      }
      
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.VERIFY);
      
      if (response.success && response.data.valid) {
        // Atualiza dados do usuário se necessário
        storage.set(STORAGE_KEYS.USER, response.data.user);
        
        return {
          valid: true,
          user: response.data.user,
        };
      } else {
        // Token inválido - limpa dados
        this.clearUserData();
        
        return {
          valid: false,
          error: response.message || 'Token inválido',
        };
      }
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error);
      
      // Em caso de erro, assume que token é inválido
      this.clearUserData();
      
      return {
        valid: false,
        error: error.message || 'Erro na verificação do token',
      };
    }
  }
  
  /**
   * Verifica se usuário está autenticado
   * @returns {boolean} True se autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    
    return !!(token && user);
  }
  
  /**
   * Obtém token do localStorage
   * @returns {string|null} Token JWT
   */
  getToken() {
    return storage.get(STORAGE_KEYS.TOKEN);
  }
  
  /**
   * Obtém dados do usuário do localStorage
   * @returns {Object|null} Dados do usuário
   */
  getUser() {
    return storage.get(STORAGE_KEYS.USER);
  }
  
  /**
   * Obtém código do usuário
   * @returns {string|null} Código do usuário
   */
  getUserCode() {
    const user = this.getUser();
    return user?.cdUsuario || null;
  }
  
  /**
   * Obtém nome do usuário
   * @returns {string|null} Nome do usuário
   */
  getUserName() {
    const user = this.getUser();
    return user?.nomeUsuario || null;
  }
  
  /**
   * Obtém empresa do usuário
   * @returns {number|null} Código da empresa
   */
  getUserCompany() {
    const user = this.getUser();
    return user?.cdMultiEmpresa || null;
  }
  
  /**
   * Obtém perfil do usuário
   * @returns {string|null} Perfil do usuário
   */
  getUserRole() {
    const user = this.getUser();
    return user?.perfil || null;
  }
  
  /**
   * Verifica se usuário tem perfil específico
   * @param {string|string[]} roles - Perfil(s) para verificar
   * @returns {boolean} True se tem o perfil
   */
  hasRole(roles) {
    const userRole = this.getUserRole();
    
    if (!userRole) {
      return false;
    }
    
    const rolesToCheck = Array.isArray(roles) ? roles : [roles];
    return rolesToCheck.some(role => 
      userRole.toLowerCase() === role.toLowerCase()
    );
  }
  
  /**
   * Verifica se usuário é admin
   * @returns {boolean} True se é admin
   */
  isAdmin() {
    return this.hasRole(['admin', 'administrador']);
  }
  
  /**
   * Verifica se usuário é manager ou superior
   * @returns {boolean} True se é manager+
   */
  isManager() {
    return this.hasRole(['admin', 'administrador', 'manager', 'gerente']);
  }
  
  /**
   * Limpa todos os dados do usuário
   */
  clearUserData() {
    clearAuth();
    console.log('🧹 Dados do usuário limpos');
  }
  
  /**
   * Renova token automaticamente (se implementado no backend)
   * @returns {Promise<Object>} Novo token
   */
  async refreshToken() {
    try {
      // Esta funcionalidade precisa ser implementada no backend
      const response = await apiMethods.post(API_ENDPOINTS.AUTH.REFRESH);
      
      if (response.success) {
        const { token } = response.data;
        
        // Atualiza token
        storage.set(STORAGE_KEYS.TOKEN, token);
        setAuthToken(token);
        
        console.log('🔄 Token renovado com sucesso');
        
        return {
          success: true,
          token,
        };
      }
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      
      // Se não conseguir renovar, faz logout
      this.clearUserData();
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Instância única do serviço
const authService = new AuthService();

export default authService;
export { AuthService };