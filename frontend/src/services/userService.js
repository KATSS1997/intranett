/**
 * Serviço de Usuários - Frontend
 * Caminho: frontend/src/services/userService.js
 */

import { apiMethods } from './api';
import { API_ENDPOINTS } from '../utils/constants';
import { cacheStorage } from '../utils/storage';

class UserService {
  /**
   * Obtém perfil do usuário atual
   * @param {boolean} useCache - Se deve usar cache
   * @returns {Promise<Object>} Dados do perfil
   */
  async getProfile(useCache = true) {
    try {
      const cacheKey = 'user_profile';
      
      // Verifica cache primeiro
      if (useCache) {
        const cachedProfile = cacheStorage.get(cacheKey);
        if (cachedProfile) {
          console.log('📄 Perfil obtido do cache');
          return {
            success: true,
            data: cachedProfile,
            cached: true,
          };
        }
      }
      
      console.log('👤 Buscando perfil do usuário...');
      
      const response = await apiMethods.get(API_ENDPOINTS.USERS.PROFILE);
      
      if (response.success) {
        // Armazena no cache por 5 minutos
        cacheStorage.set(cacheKey, response.data, 300000);
        
        console.log('✅ Perfil obtido com sucesso:', response.data);
        
        return {
          success: true,
          data: response.data,
          cached: false,
        };
      } else {
        throw new Error(response.message || 'Erro ao obter perfil');
      }
    } catch (error) {
      console.error('❌ Erro ao obter perfil:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao obter perfil do usuário',
        code: error.code || 'PROFILE_ERROR',
      };
    }
  }
  
  /**
   * Atualiza perfil do usuário
   * @param {Object} profileData - Dados do perfil a atualizar
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateProfile(profileData) {
    try {
      console.log('✏️ Atualizando perfil do usuário...');
      
      const response = await apiMethods.put(API_ENDPOINTS.USERS.UPDATE, profileData);
      
      if (response.success) {
        // Limpa cache do perfil
        cacheStorage.remove('user_profile');
        
        console.log('✅ Perfil atualizado com sucesso');
        
        return {
          success: true,
          data: response.data,
          message: response.message,
        };
      } else {
        throw new Error(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao atualizar perfil',
        code: error.code || 'UPDATE_PROFILE_ERROR',
      };
    }
  }
  
  /**
   * Lista todos os usuários (apenas admins)
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Lista de usuários
   */
  async listUsers(filters = {}) {
    try {
      console.log('👥 Buscando lista de usuários...');
      
      const queryParams = new URLSearchParams();
      
      // Adiciona filtros à query string
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const endpoint = `${API_ENDPOINTS.USERS.LIST}?${queryParams.toString()}`;
      const response = await apiMethods.get(endpoint);
      
      if (response.success) {
        console.log(`✅ ${response.data.total} usuários encontrados`);
        
        return {
          success: true,
          data: response.data,
          filters,
        };
      } else {
        throw new Error(response.message || 'Erro ao listar usuários');
      }
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao listar usuários',
        code: error.code || 'LIST_USERS_ERROR',
      };
    }
  }
  
  /**
   * Obtém dados da empresa do usuário
   * @param {boolean} useCache - Se deve usar cache
   * @returns {Promise<Object>} Dados da empresa
   */
  async getCompanyData(useCache = true) {
    try {
      const cacheKey = 'company_data';
      
      // Verifica cache primeiro
      if (useCache) {
        const cachedData = cacheStorage.get(cacheKey);
        if (cachedData) {
          console.log('🏢 Dados da empresa obtidos do cache');
          return {
            success: true,
            data: cachedData,
            cached: true,
          };
        }
      }
      
      console.log('🏢 Buscando dados da empresa...');
      
      const response = await apiMethods.get(API_ENDPOINTS.COMPANY.INFO);
      
      if (response.success) {
        // Armazena no cache por 10 minutos
        cacheStorage.set(cacheKey, response.data, 600000);
        
        console.log('✅ Dados da empresa obtidos com sucesso');
        
        return {
          success: true,
          data: response.data,
          cached: false,
        };
      } else {
        throw new Error(response.message || 'Erro ao obter dados da empresa');
      }
    } catch (error) {
      console.error('❌ Erro ao obter dados da empresa:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao obter dados da empresa',
        code: error.code || 'COMPANY_DATA_ERROR',
      };
    }
  }
  
  /**
   * Busca usuários da mesma empresa
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} Lista de usuários da empresa
   */
  async getCompanyUsers(filters = {}) {
    try {
      console.log('👥 Buscando usuários da empresa...');
      
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const endpoint = `/users/my-company-users?${queryParams.toString()}`;
      const response = await apiMethods.get(endpoint);
      
      if (response.success) {
        console.log(`✅ ${response.data.users.length} usuários da empresa encontrados`);
        
        return {
          success: true,
          data: response.data,
          filters,
        };
      } else {
        throw new Error(response.message || 'Erro ao buscar usuários da empresa');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários da empresa:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao buscar usuários da empresa',
        code: error.code || 'COMPANY_USERS_ERROR',
      };
    }
  }
  
  /**
   * Deleta usuário (apenas admins)
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteUser(userId) {
    try {
      console.log(`🗑️ Deletando usuário: ${userId}`);
      
      const response = await apiMethods.delete(`${API_ENDPOINTS.USERS.DELETE}/${userId}`);
      
      if (response.success) {
        console.log('✅ Usuário deletado com sucesso');
        
        return {
          success: true,
          message: response.message,
        };
      } else {
        throw new Error(response.message || 'Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao deletar usuário',
        code: error.code || 'DELETE_USER_ERROR',
      };
    }
  }
  
  /**
   * Verifica permissões do usuário
   * @param {string} permission - Permissão a verificar
   * @returns {Promise<Object>} Status da permissão
   */
  async checkPermission(permission) {
    try {
      const cacheKey = `permission_${permission}`;
      
      // Verifica cache primeiro (cache curto para permissões)
      const cachedResult = cacheStorage.get(cacheKey);
      if (cachedResult !== null) {
        return {
          success: true,
          hasPermission: cachedResult,
          cached: true,
        };
      }
      
      console.log(`🔐 Verificando permissão: ${permission}`);
      
      const response = await apiMethods.get(`/users/permissions/${permission}`);
      
      if (response.success) {
        const hasPermission = response.data.hasPermission;
        
        // Cache por 2 minutos
        cacheStorage.set(cacheKey, hasPermission, 120000);
        
        return {
          success: true,
          hasPermission,
          cached: false,
        };
      } else {
        throw new Error(response.message || 'Erro ao verificar permissão');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      
      // Em caso de erro, assume sem permissão
      return {
        success: false,
        hasPermission: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Limpa todos os caches relacionados ao usuário
   */
  clearCache() {
    cacheStorage.remove('user_profile');
    cacheStorage.remove('company_data');
    
    // Remove caches de permissões
    const keys = cacheStorage.storage.keys();
    keys.forEach(key => {
      if (key.startsWith('cache_permission_')) {
        cacheStorage.storage.remove(key);
      }
    });
    
    console.log('🧹 Cache de usuário limpo');
  }
  
  /**
   * Força atualização de dados (bypass cache)
   * @returns {Promise<Object>} Dados atualizados
   */
  async forceRefresh() {
    try {
      console.log('🔄 Forçando atualização de dados...');
      
      this.clearCache();
      
      const [profile, companyData] = await Promise.all([
        this.getProfile(false),
        this.getCompanyData(false),
      ]);
      
      return {
        success: true,
        data: {
          profile: profile.data,
          company: companyData.data,
        },
      };
    } catch (error) {
      console.error('❌ Erro na atualização forçada:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao atualizar dados',
      };
    }
  }
}

// Instância única do serviço
const userService = new UserService();

export default userService;
export { UserService };