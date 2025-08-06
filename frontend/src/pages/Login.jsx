/**
 * Página de Login CORRIGIDA - Sem reload
 * Caminho: C:\intranet\frontend\src\pages\Login.jsx
 */

import React, { useState } from 'react';
// Ajustar import conforme sua estrutura
import authService from '../services/authService';
// ou pode ser:
// import authService from '../services/auth';

const Login = () => {
    const [formData, setFormData] = useState({
        usuario: '',           // Campo vazio
        senha: '',
        empresa: 1
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        console.log(`📝 Campo alterado: ${name} = ${value}`);
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'empresa' ? parseInt(value) || 1 : value
        }));
        
        // Limpar erro ao digitar
        if (error) setError('');
    };

    const handleLoginSubmit = async (e) => {
        // 🚨 CRÍTICO: Prevenir reload da página
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔐 === INICIANDO LOGIN ===');
        console.log('📋 Dados do formulário:', {
            usuario: formData.usuario,
            empresa: formData.empresa,
            senhaLength: formData.senha?.length || 0
        });

        // Validação básica
        const validation = authService.validateLoginData?.(
            formData.usuario, 
            formData.senha, 
            formData.empresa
        );
        
        if (validation) {
            console.log('❌ Validação falhou:', validation);
            setError(validation);
            return;
        }

        // Validação manual se authService.validateLoginData não existir
        if (!formData.usuario?.trim()) {
            setError('Usuário é obrigatório');
            return;
        }
        
        if (!formData.senha?.trim()) {
            setError('Senha é obrigatória');
            return;
        }

        if (!formData.empresa || formData.empresa <= 0) {
            setError('Empresa deve ser um número válido');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('📡 Chamando authService.login...');
            
            // Usar EXATAMENTE como seu código original:
            const result = await authService.login(
                formData.usuario,    // usuario: string
                formData.senha,      // senha: string  
                formData.empresa     // empresa: number
            );

            console.log('📋 Resultado completo do login:', result);

            // Verificar se login foi bem-sucedido
            if (result && result.success === true) {
                console.log('✅ LOGIN BEM-SUCEDIDO!');
                console.log('🎫 Token recebido:', result.data?.token?.substring(0, 20) + '...');
                console.log('👤 Dados do usuário:', result.data?.user);
                
                // Salvar no localStorage (se authService não fizer automaticamente)
                if (result.data?.token) {
                    localStorage.setItem('token', result.data.token);
                }
                if (result.data?.user) {
                    localStorage.setItem('user', JSON.stringify(result.data.user));
                }
                
                // Redirecionar para dashboard
                console.log('🔄 Redirecionando para dashboard...');
                
                // Opção 1: Redirect direto
                window.location.href = '/dashboard';
                
                // Opção 2: Se usar React Router, descomente:
                // navigate('/dashboard');
                
            } else {
                // Login falhou
                const errorMsg = result?.message || 'Credenciais inválidas';
                console.warn('❌ Login falhou:', errorMsg);
                console.warn('🔍 Detalhes do erro:', result);
                setError(errorMsg);
            }

        } catch (error) {
            console.error('❌ ERRO INESPERADO no login:', error);
            console.error('🔍 Stack trace:', error.stack);
            
            // Verificar se é erro de rede
            if (error.message?.includes('fetch')) {
                setError('Erro de conexão. Verifique se o servidor backend está rodando na porta 5000.');
            } else {
                setError(`Erro inesperado: ${error.message}`);
            }
        } finally {
            setLoading(false);
            console.log('🏁 Processo de login finalizado');
        }
    };

    const testServerConnection = async () => {
        console.log('🧪 Testando conexão com servidor...');
        
        try {
            const response = await fetch('http://localhost:5000/api/test');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Servidor respondeu:', data);
            alert(`Servidor OK: ${data.message || data.status}`);
            
        } catch (error) {
            console.error('❌ Servidor não responde:', error);
            alert(`Erro: ${error.message}\n\nVerifique se o backend Flask está rodando em http://localhost:5000`);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2>🏢 Login - Intranet</h2>
                </div>

                {/* FORM com onSubmit - IMPORTANTE! */}
                <form onSubmit={handleLoginSubmit} style={styles.form}>
                    
                    {/* Campo Usuário */}
                    <div style={styles.field}>
                        <label>Usuário:</label>
                        <input
                            type="text"
                            name="usuario"
                            value={formData.usuario}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Digite o código do usuário"
                            style={styles.input}
                            autoComplete="username"
                        />
                    </div>

                    {/* Campo Senha */}
                    <div style={styles.field}>
                        <label>Senha:</label>
                        <input
                            type="password"
                            name="senha"
                            value={formData.senha}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Digite sua senha"
                            style={styles.input}
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Campo Empresa */}
                    <div style={styles.field}>
                        <label>Empresa:</label>
                        <input
                            type="number"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleInputChange}
                            disabled={loading}
                            min="1"
                            style={styles.input}
                        />
                    </div>

                    {/* Mensagem de Erro */}
                    {error && (
                        <div style={styles.error}>
                            ❌ {error}
                        </div>
                    )}

                    {/* Botão de Login */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '⏳ Entrando...' : '🔓 Entrar'}
                    </button>

                    {/* Botão de Teste (para debug) */}
                    <button
                        type="button"
                        onClick={testServerConnection}
                        style={styles.testButton}
                        disabled={loading}
                    >
                        🧪 Testar Conexão Backend
                    </button>

                </form>

                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={styles.debug}>
                        <small>
                            🔧 Debug: Usuario="{formData.usuario}" | Empresa={formData.empresa} | SenhaLen={formData.senha?.length || 0}
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

// Estilos inline
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        padding: '20px'
    },
    card: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '400px',
        maxWidth: '100%'
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem',
        color: '#333'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    input: {
        padding: '12px',
        border: '2px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
        transition: 'border-color 0.3s'
    },
    button: {
        padding: '14px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 'bold',
        marginTop: '10px',
        transition: 'background-color 0.3s'
    },
    testButton: {
        padding: '10px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        marginTop: '10px'
    },
    error: {
        padding: '12px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        fontSize: '14px'
    },
    debug: {
        marginTop: '1rem',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
    }
};

export default Login;