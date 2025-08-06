/**
 * Serviço HTTP compatível com seu frontend existente
 * Caminho: frontend/src/services/httpService.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class HttpService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Adiciona token de autorização aos headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = { ...this.defaultHeaders };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Método POST - compatível com seu código
     * @param {string} endpoint - Endpoint da API (ex: "/auth/login")
     * @param {object} data - Dados para enviar
     * @param {object} options - Opções adicionais
     * @returns {Promise<{data: any}>}
     */
    async post(endpoint, data, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            console.log(`📡 POST ${url}`, data);
            
            const config = {
                method: 'POST',
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                },
                body: JSON.stringify(data)
            };

            const response = await fetch(url, config);
            
            // Tentar parsear resposta
            let responseData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                const text = await response.text();
                console.error('❌ Resposta não é JSON:', text);
                throw new Error('Servidor retornou resposta inválida');
            }

            console.log(`📡 Response ${response.status}:`, responseData);

            // Se a resposta é OK, retornar no formato esperado
            if (response.ok) {
                return { data: responseData };
            } else {
                // Lançar erro com dados da resposta
                const error = new Error(responseData.message || 'Erro na requisição');
                error.response = { 
                    status: response.status,
                    data: responseData 
                };
                throw error;
            }

        } catch (error) {
            console.error('❌ Erro HTTP POST:', error);
            
            // Se é erro de rede
            if (!error.response) {
                const networkError = new Error('Erro de conexão com o servidor');
                networkError.response = {
                    status: 0,
                    data: { message: 'Verifique sua conexão com a internet' }
                };
                throw networkError;
            }
            
            throw error;
        }
    }

    /**
     * Método GET
     * @param {string} endpoint - Endpoint da API
     * @param {object} options - Opções adicionais
     * @returns {Promise<{data: any}>}
     */
    async get(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            console.log(`📡 GET ${url}`);
            
            const config = {
                method: 'GET',
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            };

            const response = await fetch(url, config);
            const responseData = await response.json();

            console.log(`📡 Response ${response.status}:`, responseData);

            if (response.ok) {
                return { data: responseData };
            } else {
                const error = new Error(responseData.message || 'Erro na requisição');
                error.response = { 
                    status: response.status,
                    data: responseData 
                };
                throw error;
            }

        } catch (error) {
            console.error('❌ Erro HTTP GET:', error);
            throw error;
        }
    }

    /**
     * Método PUT
     * @param {string} endpoint - Endpoint da API
     * @param {object} data - Dados para enviar
     * @param {object} options - Opções adicionais
     * @returns {Promise<{data: any}>}
     */
    async put(endpoint, data, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            console.log(`📡 PUT ${url}`, data);
            
            const config = {
                method: 'PUT',
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                },
                body: JSON.stringify(data)
            };

            const response = await fetch(url, config);
            const responseData = await response.json();

            console.log(`📡 Response ${response.status}:`, responseData);

            if (response.ok) {
                return { data: responseData };
            } else {
                const error = new Error(responseData.message || 'Erro na requisição');
                error.response = { 
                    status: response.status,
                    data: responseData 
                };
                throw error;
            }

        } catch (error) {
            console.error('❌ Erro HTTP PUT:', error);
            throw error;
        }
    }

    /**
     * Método DELETE
     * @param {string} endpoint - Endpoint da API
     * @param {object} options - Opções adicionais
     * @returns {Promise<{data: any}>}
     */
    async delete(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            console.log(`📡 DELETE ${url}`);
            
            const config = {
                method: 'DELETE',
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            };

            const response = await fetch(url, config);
            const responseData = await response.json();

            console.log(`📡 Response ${response.status}:`, responseData);

            if (response.ok) {
                return { data: responseData };
            } else {
                const error = new Error(responseData.message || 'Erro na requisição');
                error.response = { 
                    status: response.status,
                    data: responseData 
                };
                throw error;
            }

        } catch (error) {
            console.error('❌ Erro HTTP DELETE:', error);
            throw error;
        }
    }
}

// Instância única do serviço
const http = new HttpService();

export default http;

// Export nomeado para compatibilidade
export { http };