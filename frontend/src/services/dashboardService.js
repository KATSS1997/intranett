/**
 * Serviço do Dashboard Frontend
 * Caminho: frontend/src/services/dashboardService.js
 */

import api from './api';

class DashboardService {
  
  /**
   * Busca estatísticas do dashboard
   * @returns {Promise<Object>} Estatísticas do sistema
   */
  async getStats() {
    try {
      console.log('📊 DashboardService: Buscando estatísticas...');

      const response = await api.get('/dashboard/stats');

      if (response.data.success) {
        console.log('✅ Estatísticas obtidas:', response.data.data);
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.warn('❌ Erro nas estatísticas:', response.data.message);
        return {
          success: false,
          error: response.data.message
        };
      }

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);

      // Se falhar, retorna dados mockados
      return {
        success: true,
        data: {
          usuarios: {
            total: 0,
            ativos: 0,
            inativos: 0
          },
          empresas: {
            total: 1
          },
          sistema: {
            uptime_dias: 0,
            status: 'offline'
          }
        },
        fallback: true
      };
    }
  }

  /**
   * Busca atividades recentes
   * @returns {Promise<Object>} Lista de atividades
   */
  async getRecentActivities() {
    try {
      console.log('📋 DashboardService: Buscando atividades recentes...');

      const response = await api.get('/dashboard/recent-activities');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }

    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);

      // Fallback com atividades mockadas
      return {
        success: true,
        data: [
          {
            id: 1,
            type: 'login',
            user: 'Usuário',
            description: 'Login realizado com sucesso',
            time: 'agora',
            icon: '🔐'
          },
          {
            id: 2,
            type: 'system',
            user: 'Sistema',
            description: 'Sistema carregado',
            time: '5min atrás',
            icon: '⚡'
          }
        ],
        fallback: true
      };
    }
  }

  /**
   * Busca status dos serviços do sistema
   * @returns {Promise<Object>} Status dos serviços
   */
  async getSystemStatus() {
    try {
      console.log('🖥️ DashboardService: Verificando status do sistema...');

      const response = await api.get('/dashboard/system-status');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.message
        };
      }

    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);

      // Fallback
      return {
        success: true,
        data: {
          overall_status: 'unknown',
          services: {
            api_backend: {
              status: 'unknown',
              description: 'API Backend: Status desconhecido'
            },
            oracle_database: {
              status: 'unknown', 
              description: 'Oracle Database: Status desconhecido'
            }
          }
        },
        fallback: true
      };
    }
  }

  /**
   * Busca todos os dados do dashboard de uma vez
   * @returns {Promise<Object>} Todos os dados do dashboard
   */
  async getAllDashboardData() {
    try {
      console.log('🔄 DashboardService: Carregando dados completos do dashboard...');

      // Executa todas as chamadas em paralelo
      const [statsResult, activitiesResult, statusResult] = await Promise.allSettled([
        this.getStats(),
        this.getRecentActivities(),
        this.getSystemStatus()
      ]);

      return {
        success: true,
        data: {
          stats: statsResult.status === 'fulfilled' ? statsResult.value : { success: false },
          activities: activitiesResult.status === 'fulfilled' ? activitiesResult.value : { success: false },
          systemStatus: statusResult.status === 'fulfilled' ? statusResult.value : { success: false }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ✅ Cria instância única
const dashboardService = new DashboardService();

export default dashboardService;