/**
 * Serviço de Autenticação - COMPATÍVEL COM SEU CÓDIGO
 * Caminho: frontend/src/services/authService.js
 */

import http from './httpService';

const authService = {
    /**
     * Login - EXATAMENTE como seu código TypeScript
     * @param {string} usuario - Código do usuário
     * @param {string} senha - Senha em texto plano
     * @param {number} empresa - Código da empresa
     * @returns {Promise<any>} - Resposta da API ou erro
     */
    login: async (usuario, senha, empresa) => {
        try {
            const vDadosLogin = {
                cdUsuario: `${usuario}`,
                password: `${senha}`,
                cdMultiEmpresa: empresa,
            };

            console.log(vDadosLogin);
            const response = await http.post("/auth/login", vDadosLogin);
            console.log("data", response.data);
            
            // Se login bem-sucedido, salvar dados
            if (response.data.success) {
                const { token, user } = response.data.data;
                
                // Salvar no localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                
                console.log('✅ Login bem-sucedido, dados salvos:', user);
            }
            
            return response.data;
        } catch (error) {
            console.log("error", error);
            
            // Retornar erro em formato padronizado
            if (error.response && error.response.data) {
                return {
                    success: false,
                    message: error.response.data.message || 'Erro na autenticação',
                    error_code: error.response.data.error_code
                };
            }
            
            return {
                success: false,
                message: error.message || 'Erro de conexão',
                error_code: 'NETWORK_ERROR'
            };
        }
    },

    /**
     * Logout do usuário
     * @returns {Promise<boolean>}
     */
    logout: async () => {
        try {
            // Tentar notificar o servidor
            await http.post("/auth/logout", {});
        } catch (error) {
            console.warn('⚠️ Erro ao notificar logout no servidor:', error);
        } finally {
            // Limpar dados locais sempre
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('👋 Logout realizado');
            return true;
        }
    },

    /**
     * Verifica se o usuário está autenticado
     * @returns {boolean}
     */
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    },

    /**
     * Obtém dados do usuário atual
     * @returns {object|null}
     */
    getCurrentUser: () => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Erro ao parsear dados do usuário:', error);
            return null;
        }
    },

    /**
     * Obtém o token atual
     * @returns {string|null}
     */
    getToken: () => {
        return localStorage.getItem('token');
    },

    /**
     * Verifica se o token é válido (chama API)
     * @returns {Promise<boolean>}
     */
    verifyToken: async () => {
        try {
            const response = await http.post("/auth/verify", {});
            
            if (response.data.success) {
                // Atualizar dados do usuário se necessário
                const { user } = response.data.data;
                localStorage.setItem('user', JSON.stringify(user));
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('❌ Token inválido:', error);
            // Limpar dados se token for inválido
            authService.logout();
            return false;
        }
    },

    /**
     * Renova o token JWT
     * @returns {Promise<boolean>}
     */
    refreshToken: async () => {
        try {
            const response = await http.post("/auth/refresh", {});
            
            if (response.data.success) {
                const { token } = response.data.data;
                localStorage.setItem('token', token);
                console.log('✅ Token renovado com sucesso');
                return true;
            }
            
            return false;
        } catch (error) {
            console.warn('❌ Erro ao renovar token:', error);
            return false;
        }
    },

    /**
     * Interceptor para requisições autenticadas
     * Adiciona token automaticamente e tenta renovar se expirado
     * @param {string} endpoint - Endpoint da API
     * @param {object} data - Dados para enviar
     * @param {string} method - Método HTTP (GET, POST, etc.)
     * @returns {Promise<any>}
     */
    authenticatedRequest: async (endpoint, data = null, method = 'GET') => {
        try {
            let response;
            
            switch (method.toUpperCase()) {
                case 'POST':
                    response = await http.post(endpoint, data);
                    break;
                case 'GET':
                    response = await http.get(endpoint);
                    break;
                case 'PUT':
                    response = await http.put(endpoint, data);
                    break;
                case 'DELETE':
                    response = await http.delete(endpoint);
                    break;
                default:
                    throw new Error(`Método ${method} não suportado`);
            }
            
            return response;
            
        } catch (error) {
            // Se token expirou (401), tentar renovar
            if (error.response && error.response.status === 401) {
                console.log('🔄 Token expirado, tentando renovar...');
                
                const renewed = await authService.refreshToken();
                if (renewed) {
                    // Tentar novamente com token renovado
                    console.log('🔄 Tentando requisição novamente...');
                    return await authService.authenticatedRequest(endpoint, data, method);
                } else {
                    // Não conseguiu renovar, fazer logout
                    console.log('❌ Não foi possível renovar token, redirecionando para login...');
                    await authService.logout();
                    // Redirecionar para login se necessário
                    window.location.href = '/login';
                }
            }
            
            throw error;
        }
    },

    /**
     * Utilitário para validar dados de login
     * @param {string} usuario - Código do usuário
     * @param {string} senha - Senha
     * @param {number} empresa - Código da empresa
     * @returns {string|null} - Mensagem de erro ou null se válido
     */
    validateLoginData: (usuario, senha, empresa) => {
        if (!usuario || !usuario.trim()) {
            return 'Código do usuário é obrigatório';
        }
        
        if (!senha || !senha.trim()) {
            return 'Senha é obrigatória';
        }
        
        if (!empresa || empresa <= 0) {
            return 'Código da empresa é obrigatório';
        }
        
        return null; // Dados válidos
    }
};

export default authService;

// Export nomeado para compatibilidade
export { authService };